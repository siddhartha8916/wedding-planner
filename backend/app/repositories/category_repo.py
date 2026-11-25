from pymongo import ASCENDING, DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.db import make_id, utc_now_iso
from app.repositories.wedding_repo import get_or_bootstrap_wedding
from app.schemas.category import Category, CreateCategoryPayload, UpdateCategoryPayload


def doc_to_category(doc: dict) -> Category:
    return Category(
        id=doc["_id"],
        wedding_id=doc["weddingId"],
        name=doc["name"],
        description=doc.get("description"),
        icon=doc["icon"],
        allocated_budget=doc.get("allocatedBudget"),
        sort_order=doc["sortOrder"],
        created_at=doc["createdAt"],
    )


async def list_categories(db: AsyncDatabase, user_id: str) -> list[dict]:
    cursor = db["categories"].find({"userId": user_id}).sort("sortOrder", ASCENDING)
    return await cursor.to_list(length=None)


async def get_category(db: AsyncDatabase, user_id: str, category_id: str) -> dict | None:
    return await db["categories"].find_one({"_id": category_id, "userId": user_id})


async def create_category(
    db: AsyncDatabase,
    user_id: str,
    payload: CreateCategoryPayload,
) -> dict:
    wedding = await get_or_bootstrap_wedding(db, user_id)
    last_doc = await db["categories"].find_one(
        {"userId": user_id},
        sort=[("sortOrder", DESCENDING)],
    )
    next_order = (last_doc["sortOrder"] + 1) if last_doc is not None else 0

    allocated = (
        int(payload.allocatedBudget)
        if payload.allocatedBudget is not None and payload.allocatedBudget > 0
        else None
    )
    doc = {
        "_id": make_id("cat"),
        "userId": user_id,
        "weddingId": wedding["_id"],
        "name": payload.name,
        "description": payload.description,
        "icon": payload.icon,
        "allocatedBudget": allocated,
        "sortOrder": next_order,
        "createdAt": utc_now_iso(),
    }
    await db["categories"].insert_one(doc)
    return doc


async def update_category(
    db: AsyncDatabase,
    user_id: str,
    category_id: str,
    payload: UpdateCategoryPayload,
) -> dict | None:
    current = await get_category(db, user_id, category_id)
    if current is None:
        return None

    updates: dict = {}
    if "name" in payload.model_fields_set and payload.name is not None:
        updates["name"] = payload.name
    if "description" in payload.model_fields_set:
        updates["description"] = payload.description
    if "icon" in payload.model_fields_set and payload.icon is not None:
        updates["icon"] = payload.icon
    if "allocatedBudget" in payload.model_fields_set:
        updates["allocatedBudget"] = (
            int(payload.allocatedBudget)
            if payload.allocatedBudget is not None and payload.allocatedBudget > 0
            else None
        )

    if updates:
        await db["categories"].update_one(
            {"_id": category_id, "userId": user_id},
            {"$set": updates},
        )
        return {**current, **updates}
    return current


async def delete_category(db: AsyncDatabase, user_id: str, category_id: str) -> bool:
    result = await db["categories"].delete_one({"_id": category_id, "userId": user_id})
    if result.deleted_count == 0:
        return False
    await db["expenses"].delete_many({"categoryId": category_id, "userId": user_id})
    return True
