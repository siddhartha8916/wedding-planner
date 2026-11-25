from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

CeremonyTag = Literal[
    "general",
    "engagement",
    "haldi",
    "mehendi",
    "sangeet",
    "wedding",
    "reception",
]
PaymentMethod = Literal["upi", "bank_transfer", "cash", "card", "cheque"]
ContributorSide = Literal["joint", "bride", "groom"]
ExpenseStatus = Literal["unpaid", "partial", "paid", "overdue"]

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


def _normalize_optional_str(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class PaymentRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    expense_id: str = Field(serialization_alias="expenseId")
    amount: int
    paid_date: str = Field(serialization_alias="paidDate")
    label: str
    method: PaymentMethod
    paid_by: ContributorSide = Field(serialization_alias="paidBy")
    note: str | None = None


class Expense(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    wedding_id: str = Field(serialization_alias="weddingId")
    category_id: str = Field(serialization_alias="categoryId")
    title: str
    description: str | None = None
    estimated_amount: int = Field(serialization_alias="estimatedAmount")
    due_date: str | None = Field(default=None, serialization_alias="dueDate")
    ceremony: CeremonyTag | None = None
    vendor_name: str | None = Field(default=None, serialization_alias="vendorName")
    vendor_phone: str | None = Field(default=None, serialization_alias="vendorPhone")
    payments: list[PaymentRecord] = Field(default_factory=list)
    created_at: str = Field(serialization_alias="createdAt")
    updated_at: str = Field(serialization_alias="updatedAt")


class CreatePaymentPayload(BaseModel):
    amount: int = Field(ge=1)
    paidDate: NonEmptyStr
    label: str = ""
    method: PaymentMethod
    paidBy: ContributorSide
    note: str | None = None

    @field_validator("label")
    @classmethod
    def strip_label(cls, value: str) -> str:
        return value.strip()

    @field_validator("note")
    @classmethod
    def clean_note(cls, value: str | None) -> str | None:
        return _normalize_optional_str(value)


class CreateExpensePayload(BaseModel):
    categoryId: NonEmptyStr
    title: NonEmptyStr
    description: str | None = None
    estimatedAmount: int = Field(ge=0)
    dueDate: str | None = None
    ceremony: CeremonyTag | None = None
    vendorName: str | None = None
    vendorPhone: str | None = None
    advancePayment: CreatePaymentPayload | None = None

    @field_validator("description", "dueDate", "vendorName", "vendorPhone")
    @classmethod
    def clean_optional_fields(cls, value: str | None) -> str | None:
        return _normalize_optional_str(value)


class UpdateExpensePayload(BaseModel):
    categoryId: NonEmptyStr | None = None
    title: NonEmptyStr | None = None
    description: str | None = None
    estimatedAmount: int | None = Field(default=None, ge=0)
    dueDate: str | None = None
    ceremony: CeremonyTag | None = None
    vendorName: str | None = None
    vendorPhone: str | None = None

    @field_validator("description", "dueDate", "vendorName", "vendorPhone")
    @classmethod
    def clean_optional_fields(cls, value: str | None) -> str | None:
        return _normalize_optional_str(value)
