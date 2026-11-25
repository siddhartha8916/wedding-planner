from typing import Annotated

from fastapi import APIRouter, Depends
from pymongo.asynchronous.database import AsyncDatabase

from app.db import get_db
from app.repositories.wedding_repo import (
    doc_to_wedding,
    get_or_bootstrap_wedding,
    reset_wedding,
    save_wedding,
)
from app.schemas.auth import UserPublic
from app.schemas.wedding import SaveWeddingPayload, WeddingProfile
from app.security import get_current_user

router = APIRouter(prefix="/wedding", tags=["wedding"])


@router.get("", response_model=WeddingProfile)
async def get_wedding(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> WeddingProfile:
    doc = await get_or_bootstrap_wedding(db, current_user.id)
    return doc_to_wedding(doc)


@router.put("", response_model=WeddingProfile)
async def put_wedding(
    payload: SaveWeddingPayload,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> WeddingProfile:
    doc = await save_wedding(db, current_user.id, payload)
    return doc_to_wedding(doc)


@router.post("/reset", response_model=WeddingProfile)
async def post_reset_wedding(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
) -> WeddingProfile:
    doc = await reset_wedding(db, current_user.id)
    return doc_to_wedding(doc)
