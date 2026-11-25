from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pymongo.asynchronous.database import AsyncDatabase

from app.db import get_db
from app.repositories.category_repo import get_category
from app.repositories.expense_repo import (
    add_payment,
    create_expense,
    delete_expense,
    doc_to_expense,
    get_expense,
    list_expenses,
    remove_payment,
    update_expense,
)
from app.schemas.auth import UserPublic
from app.schemas.expense import (
    CeremonyTag,
    ContributorSide,
    CreateExpensePayload,
    CreatePaymentPayload,
    Expense,
    ExpenseStatus,
    UpdateExpensePayload,
)
from app.security import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=list[Expense])
async def get_expenses(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
    category_id: Annotated[str | None, Query(alias="categoryId")] = None,
    status_filter: Annotated[ExpenseStatus | None, Query(alias="status")] = None,
    ceremony: CeremonyTag | None = None,
    paid_by: Annotated[ContributorSide | None, Query(alias="paidBy")] = None,
    search: str | None = None,
) -> list[Expense]:
    docs = await list_expenses(
        db,
        current_user.id,
        category_id=category_id,
        status_filter=status_filter,
        ceremony=ceremony,
        paid_by=paid_by,
        search=search,
    )
    return [doc_to_expense(doc) for doc in docs]


@router.get("/{expense_id}", response_model=Expense)
async def get_expense_by_id(
    expense_id: str,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> Expense:
    doc = await get_expense(db, current_user.id, expense_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense {expense_id} not found",
        )
    return doc_to_expense(doc)


@router.post("", response_model=Expense, status_code=status.HTTP_201_CREATED)
async def post_expense(
    payload: CreateExpensePayload,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> Expense:
    if await get_category(db, current_user.id, payload.categoryId) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category {payload.categoryId} not found",
        )
    doc = await create_expense(db, current_user.id, payload)
    return doc_to_expense(doc)


@router.patch("/{expense_id}", response_model=Expense)
async def patch_expense(
    expense_id: str,
    payload: UpdateExpensePayload,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> Expense:
    if payload.categoryId is not None:
        if await get_category(db, current_user.id, payload.categoryId) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category {payload.categoryId} not found",
            )
    doc = await update_expense(db, current_user.id, expense_id, payload)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense {expense_id} not found",
        )
    return doc_to_expense(doc)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_expense(
    expense_id: str,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> Response:
    deleted = await delete_expense(db, current_user.id, expense_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense {expense_id} not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{expense_id}/payments", response_model=Expense)
async def post_payment(
    expense_id: str,
    payload: CreatePaymentPayload,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> Expense:
    doc = await add_payment(db, current_user.id, expense_id, payload)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense {expense_id} not found",
        )
    return doc_to_expense(doc)


@router.delete("/{expense_id}/payments/{payment_id}", response_model=Expense)
async def delete_payment(
    expense_id: str,
    payment_id: str,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> Expense:
    outcome, doc = await remove_payment(db, current_user.id, expense_id, payment_id)
    if outcome == "expense_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense {expense_id} not found",
        )
    if outcome == "payment_not_found" or doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment {payment_id} not found",
        )
    return doc_to_expense(doc)
