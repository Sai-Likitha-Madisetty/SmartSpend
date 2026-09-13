from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import date


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0, le=100000000)
    description: str = Field(min_length=1, max_length=255)
    transaction_date: date
    category: str | None = Field(default=None, max_length=100)


class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    description: str
    transaction_date: date
    category: str | None
    category_confidence: float | None
    categorization_method: str | None

    model_config = ConfigDict(from_attributes=True)