from pymongo import ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase

from app.db import make_id, utc_now_iso
from app.schemas.wedding import SaveWeddingPayload, WeddingProfile


def _default_wedding_doc(user_id: str) -> dict:
    now = utc_now_iso()
    return {
        "_id": make_id("wed"),
        "userId": user_id,
        "brideName": "",
        "groomName": "",
        "weddingDate": "",
        "totalBudget": 2500000,
        "contingencyPercent": 10,
        "currency": "INR",
        "isOnboarded": False,
        "createdAt": now,
        "updatedAt": now,
    }


def doc_to_wedding(doc: dict) -> WeddingProfile:
    return WeddingProfile(
        id=doc["_id"],
        bride_name=doc["brideName"],
        groom_name=doc["groomName"],
        wedding_date=doc["weddingDate"],
        total_budget=doc["totalBudget"],
        contingency_percent=doc["contingencyPercent"],
        currency="INR",
        is_onboarded=doc["isOnboarded"],
        created_at=doc["createdAt"],
        updated_at=doc["updatedAt"],
    )


async def get_or_bootstrap_wedding(db: AsyncDatabase, user_id: str) -> dict:
    return await db["weddings"].find_one_and_update(
        {"userId": user_id},
        {"$setOnInsert": _default_wedding_doc(user_id)},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )


async def save_wedding(
    db: AsyncDatabase,
    user_id: str,
    payload: SaveWeddingPayload,
) -> dict:
    current = await get_or_bootstrap_wedding(db, user_id)
    now = utc_now_iso()
    is_onboarded = (
        payload.isOnboarded if payload.isOnboarded is not None else current["isOnboarded"]
    )
    updated_fields = {
        "brideName": payload.brideName,
        "groomName": payload.groomName,
        "weddingDate": payload.weddingDate,
        "totalBudget": max(0, int(payload.totalBudget)),
        "contingencyPercent": max(0, min(50, int(payload.contingencyPercent))),
        "isOnboarded": is_onboarded,
        "updatedAt": now,
    }
    await db["weddings"].update_one({"_id": current["_id"]}, {"$set": updated_fields})
    return {**current, **updated_fields}


async def reset_wedding(db: AsyncDatabase, user_id: str) -> dict:
    await db["expenses"].delete_many({"userId": user_id})
    await db["categories"].delete_many({"userId": user_id})
    await db["weddings"].delete_many({"userId": user_id})
    fresh = _default_wedding_doc(user_id)
    await db["weddings"].insert_one(fresh)
    return fresh
