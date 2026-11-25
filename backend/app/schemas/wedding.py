from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class WeddingProfile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    bride_name: str = Field(serialization_alias="brideName")
    groom_name: str = Field(serialization_alias="groomName")
    wedding_date: str = Field(serialization_alias="weddingDate")
    total_budget: int = Field(serialization_alias="totalBudget")
    contingency_percent: int = Field(serialization_alias="contingencyPercent")
    currency: Literal["INR"] = "INR"
    is_onboarded: bool = Field(serialization_alias="isOnboarded")
    created_at: str = Field(serialization_alias="createdAt")
    updated_at: str = Field(serialization_alias="updatedAt")


class SaveWeddingPayload(BaseModel):
    brideName: NonEmptyStr
    groomName: NonEmptyStr
    weddingDate: NonEmptyStr
    totalBudget: int = Field(ge=0)
    contingencyPercent: int = Field(ge=0, le=50)
    isOnboarded: bool | None = None
