from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo.asynchronous.database import AsyncDatabase

from app.db import get_db
from app.repositories.category_repo import (
    create_category,
    delete_category,
    doc_to_category,
    get_category,
    list_categories,
    update_category,
)
from app.schemas.auth import UserPublic
from app.schemas.category import Category, CreateCategoryPayload, UpdateCategoryPayload
from app.security import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[Category])
async def get_categories(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> list[Category]:
    docs = await list_categories(db, current_user.id)
    return [doc_to_category(doc) for doc in docs]


@router.get("/{category_id}", response_model=Category)
async def get_category_by_id(
    category_id: str,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> Category:
    doc = await get_category(db, current_user.id, category_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category {category_id} not found",
        )
    return doc_to_category(doc)


@router.post("", response_model=Category, status_code=status.HTTP_201_CREATED)
async def post_category(
    payload: CreateCategoryPayload,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> Category:
    doc = await create_category(db, current_user.id, payload)
    return doc_to_category(doc)


@router.patch("/{category_id}", response_model=Category)
async def patch_category(
    category_id: str,
    payload: UpdateCategoryPayload,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> Category:
    doc = await update_category(db, current_user.id, category_id, payload)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category {category_id} not found",
        )
    return doc_to_category(doc)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_category(
    category_id: str,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> Response:
    deleted = await delete_category(db, current_user.id, category_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category {category_id} not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
