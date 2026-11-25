from datetime import UTC, datetime
import uuid

from fastapi import Request
from pymongo import ASCENDING, DESCENDING, AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from app.config import Settings


def make_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def utc_now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


async def ensure_indexes(db: AsyncDatabase) -> None:
    await db["users"].create_index([("username", ASCENDING)], unique=True)
    await db["weddings"].create_index([("userId", ASCENDING)], unique=True)
    await db["categories"].create_index([("userId", ASCENDING), ("sortOrder", ASCENDING)])
    await db["expenses"].create_index([("userId", ASCENDING), ("categoryId", ASCENDING)])
    await db["expenses"].create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])


async def seed_default_user(db: AsyncDatabase, settings: Settings) -> None:
    existing = await db["users"].find_one({"username": settings.seed_username})
    if existing is not None:
        return

    now = utc_now_iso()
    await db["users"].insert_one(
        {
            "_id": make_id("usr"),
            "username": settings.seed_username,
            "password": settings.seed_password,
            "createdAt": now,
            "updatedAt": now,
        }
    )


def create_mongo_client(settings: Settings) -> AsyncMongoClient:
    return AsyncMongoClient(settings.mongodb_uri)


def get_db(request: Request) -> AsyncDatabase:
    return request.app.state.db


def get_settings(request: Request) -> Settings:
    return request.app.state.settings
