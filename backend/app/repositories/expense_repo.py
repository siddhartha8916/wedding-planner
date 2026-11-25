import re

from pymongo import DESCENDING, ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase

from app.db import make_id, utc_now_iso
from app.repositories.wedding_repo import get_or_bootstrap_wedding
from app.schemas.expense import (
    ContributorSide,
    CreateExpensePayload,
    CreatePaymentPayload,
    Expense,
    ExpenseStatus,
    PaymentRecord,
    UpdateExpensePayload,
)
from app.services.calculations import compute_expense_status


def doc_to_expense(doc: dict) -> Expense:
    payments = [
        PaymentRecord(
            id=p["id"],
            expense_id=p["expenseId"],
            amount=p["amount"],
            paid_date=p["paidDate"],
            label=p["label"],
            method=p["method"],
            paid_by=p["paidBy"],
            note=p.get("note"),
        )
        for p in doc.get("payments", [])
    ]
    return Expense(
        id=doc["_id"],
        wedding_id=doc["weddingId"],
        category_id=doc["categoryId"],
        title=doc["title"],
        description=doc.get("description"),
        estimated_amount=doc["estimatedAmount"],
        due_date=doc.get("dueDate"),
        ceremony=doc.get("ceremony"),
        vendor_name=doc.get("vendorName"),
        vendor_phone=doc.get("vendorPhone"),
        payments=payments,
        created_at=doc["createdAt"],
        updated_at=doc["updatedAt"],
    )


async def list_expenses(
    db: AsyncDatabase,
    user_id: str,
    category_id: str | None = None,
    status_filter: ExpenseStatus | None = None,
    ceremony: str | None = None,
    paid_by: ContributorSide | None = None,
    search: str | None = None,
) -> list[dict]:
    query: dict = {"userId": user_id}
    if category_id:
        query["categoryId"] = category_id
    if ceremony and ceremony != "all":
        if ceremony == "general":
            query["$or"] = [
                {"ceremony": "general"},
                {"ceremony": None},
                {"ceremony": {"$exists": False}},
            ]
        else:
            query["ceremony"] = ceremony
    if paid_by:
        query["payments.paidBy"] = paid_by
    if search and search.strip():
        pattern = re.escape(search.strip())
        regex = {"$regex": pattern, "$options": "i"}
        search_clause = [
            {"title": regex},
            {"description": regex},
            {"vendorName": regex},
        ]
        if "$or" in query:
            query["$and"] = [{"$or": query.pop("$or")}, {"$or": search_clause}]
        else:
            query["$or"] = search_clause

    docs = await db["expenses"].find(query).sort("createdAt", DESCENDING).to_list(length=None)
    if status_filter:
        docs = [doc for doc in docs if compute_expense_status(doc) == status_filter]
    return docs


async def get_expense(db: AsyncDatabase, user_id: str, expense_id: str) -> dict | None:
    return await db["expenses"].find_one({"_id": expense_id, "userId": user_id})


async def create_expense(
    db: AsyncDatabase,
    user_id: str,
    payload: CreateExpensePayload,
) -> dict:
    wedding = await get_or_bootstrap_wedding(db, user_id)
    now = utc_now_iso()
    expense_id = make_id("exp")

    payments: list[dict] = []
    if payload.advancePayment is not None and payload.advancePayment.amount > 0:
        adv = payload.advancePayment
        payments.append(
            {
                "id": make_id("pay"),
                "expenseId": expense_id,
                "amount": int(adv.amount),
                "paidDate": adv.paidDate,
                "label": adv.label or "Advance Deposit",
                "method": adv.method,
                "paidBy": adv.paidBy,
                "note": adv.note,
            }
        )

    doc = {
        "_id": expense_id,
        "userId": user_id,
        "weddingId": wedding["_id"],
        "categoryId": payload.categoryId,
        "title": payload.title,
        "description": payload.description,
        "estimatedAmount": max(0, int(payload.estimatedAmount)),
        "dueDate": payload.dueDate,
        "ceremony": payload.ceremony or "general",
        "vendorName": payload.vendorName,
        "vendorPhone": payload.vendorPhone,
        "payments": payments,
        "createdAt": now,
        "updatedAt": now,
    }
    await db["expenses"].insert_one(doc)
    return doc


async def update_expense(
    db: AsyncDatabase,
    user_id: str,
    expense_id: str,
    payload: UpdateExpensePayload,
) -> dict | None:
    updates: dict = {}
    if "categoryId" in payload.model_fields_set and payload.categoryId is not None:
        updates["categoryId"] = payload.categoryId
    if "title" in payload.model_fields_set and payload.title is not None:
        updates["title"] = payload.title
    if "description" in payload.model_fields_set:
        updates["description"] = payload.description
    if "estimatedAmount" in payload.model_fields_set and payload.estimatedAmount is not None:
        updates["estimatedAmount"] = max(0, int(payload.estimatedAmount))
    if "dueDate" in payload.model_fields_set:
        updates["dueDate"] = payload.dueDate
    if "ceremony" in payload.model_fields_set and payload.ceremony is not None:
        updates["ceremony"] = payload.ceremony
    if "vendorName" in payload.model_fields_set:
        updates["vendorName"] = payload.vendorName
    if "vendorPhone" in payload.model_fields_set:
        updates["vendorPhone"] = payload.vendorPhone

    if not updates:
        return await get_expense(db, user_id, expense_id)

    updates["updatedAt"] = utc_now_iso()
    return await db["expenses"].find_one_and_update(
        {"_id": expense_id, "userId": user_id},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )


async def delete_expense(db: AsyncDatabase, user_id: str, expense_id: str) -> bool:
    result = await db["expenses"].delete_one({"_id": expense_id, "userId": user_id})
    return result.deleted_count > 0


async def add_payment(
    db: AsyncDatabase,
    user_id: str,
    expense_id: str,
    payload: CreatePaymentPayload,
) -> dict | None:
    record = {
        "id": make_id("pay"),
        "expenseId": expense_id,
        "amount": max(1, int(payload.amount)),
        "paidDate": payload.paidDate,
        "label": payload.label or "Installment",
        "method": payload.method,
        "paidBy": payload.paidBy,
        "note": payload.note,
    }
    return await db["expenses"].find_one_and_update(
        {"_id": expense_id, "userId": user_id},
        {"$push": {"payments": record}, "$set": {"updatedAt": utc_now_iso()}},
        return_document=ReturnDocument.AFTER,
    )


async def remove_payment(
    db: AsyncDatabase,
    user_id: str,
    expense_id: str,
    payment_id: str,
) -> tuple[str, dict | None]:
    current = await get_expense(db, user_id, expense_id)
    if current is None:
        return ("expense_not_found", None)
    if not any(p.get("id") == payment_id for p in current.get("payments", [])):
        return ("payment_not_found", None)

    updated = await db["expenses"].find_one_and_update(
        {"_id": expense_id, "userId": user_id},
        {"$pull": {"payments": {"id": payment_id}}, "$set": {"updatedAt": utc_now_iso()}},
        return_document=ReturnDocument.AFTER,
    )
    return ("ok", updated)
