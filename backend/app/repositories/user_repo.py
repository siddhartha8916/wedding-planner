from pymongo.asynchronous.database import AsyncDatabase


async def get_user_by_username(db: AsyncDatabase, username: str) -> dict | None:
    return await db["users"].find_one({"username": username})


async def get_user_by_id(db: AsyncDatabase, user_id: str) -> dict | None:
    return await db["users"].find_one({"_id": user_id})
