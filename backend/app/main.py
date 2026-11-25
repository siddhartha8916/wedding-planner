from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import Settings
from app.db import create_mongo_client, ensure_indexes, seed_default_user


def create_app(settings_override: Settings | None = None) -> FastAPI:
    settings = settings_override or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        client = create_mongo_client(settings)
        db = client[settings.mongodb_db_name]
        app.state.mongo_client = client
        app.state.db = db
        app.state.settings = settings
        await ensure_indexes(db)
        await seed_default_user(db, settings)
        try:
            yield
        finally:
            await client.close()

    app = FastAPI(
        title="Bandhan Wedding Planner API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["health"])
    async def health(request: Request) -> JSONResponse:
        try:
            await request.app.state.mongo_client.admin.command("ping")
            return JSONResponse(status_code=200, content={"status": "ok", "database": "ok"})
        except Exception:
            return JSONResponse(
                status_code=503,
                content={"status": "error", "database": "unavailable"},
            )

    return app


app = create_app()
