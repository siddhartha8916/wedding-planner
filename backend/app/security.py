from datetime import UTC, datetime, timedelta
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.asynchronous.database import AsyncDatabase

from app.config import Settings
from app.db import get_db, get_settings
from app.repositories.user_repo import get_user_by_id
from app.schemas.auth import UserPublic

_bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(user_id: str, username: str, settings: Settings) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "username": username,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _unauthorized(detail: str = "Not authenticated") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    db: Annotated[AsyncDatabase, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> UserPublic:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized()

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError as exc:
        raise _unauthorized("Invalid or expired token") from exc

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise _unauthorized("Invalid token subject")

    user_doc = await get_user_by_id(db, user_id)
    if user_doc is None:
        raise _unauthorized("User no longer exists")

    return UserPublic(id=user_doc["_id"], username=user_doc["username"])
