from collections.abc import AsyncGenerator

import httpx
import pytest_asyncio
from pymongo.asynchronous.database import AsyncDatabase

from app.config import Settings
from app.main import create_app


@pytest_asyncio.fixture
async def test_settings() -> Settings:
    return Settings(
        mongodb_uri="mongodb://127.0.0.1:27017/?serverSelectionTimeoutMS=3000",
        mongodb_db_name="wedding_planner_test",
        jwt_secret="test-secret-key-with-at-least-32-bytes",
    )


@pytest_asyncio.fixture
async def client(test_settings: Settings) -> AsyncGenerator[httpx.AsyncClient]:
    app = create_app(settings_override=test_settings)
    async with app.router.lifespan_context(app):
        db: AsyncDatabase = app.state.db
        await db["users"].delete_many({})
        await db["weddings"].delete_many({})
        await db["categories"].delete_many({})
        await db["expenses"].delete_many({})
        # Re-run seed so each test starts with a clean seeded user
        from app.db import seed_default_user

        await seed_default_user(db, test_settings)
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as async_client:
            yield async_client


@pytest_asyncio.fixture
async def test_db(client: httpx.AsyncClient) -> AsyncDatabase:
    transport = client._transport
    assert isinstance(transport, httpx.ASGITransport)
    return transport.app.state.db
