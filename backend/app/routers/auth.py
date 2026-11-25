import hmac
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase

from app.config import Settings
from app.db import get_db, get_settings
from app.repositories.user_repo import get_user_by_username
from app.schemas.auth import LoginRequest, TokenResponse, UserPublic
from app.security import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    db: Annotated[AsyncDatabase, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> TokenResponse:
    username = body.username.strip()
    user_doc = await get_user_by_username(db, username)
    if user_doc is None or not hmac.compare_digest(user_doc["password"], body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    user = UserPublic(id=user_doc["_id"], username=user_doc["username"])
    token = create_access_token(user.id, user.username, settings)
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserPublic)
async def me(current_user: Annotated[UserPublic, Depends(get_current_user)]) -> UserPublic:
    return current_user
