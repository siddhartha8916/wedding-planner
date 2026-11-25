from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


def _normalize_optional_str(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class Category(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    wedding_id: str = Field(serialization_alias="weddingId")
    name: str
    description: str | None = None
    icon: str
    allocated_budget: int | None = Field(default=None, serialization_alias="allocatedBudget")
    sort_order: int = Field(serialization_alias="sortOrder")
    created_at: str = Field(serialization_alias="createdAt")


class CreateCategoryPayload(BaseModel):
    name: NonEmptyStr
    description: str | None = None
    icon: NonEmptyStr
    allocatedBudget: int | None = None

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str | None) -> str | None:
        return _normalize_optional_str(value)


class UpdateCategoryPayload(BaseModel):
    name: NonEmptyStr | None = None
    description: str | None = None
    icon: NonEmptyStr | None = None
    allocatedBudget: int | None = None

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str | None) -> str | None:
        return _normalize_optional_str(value)
