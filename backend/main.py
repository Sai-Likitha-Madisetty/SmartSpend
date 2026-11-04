from services.categorizer import categorize_transaction

from auth import create_access_token, verify_access_token

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from database import engine, Base, get_db
from schemas import ExpenseCreate, UserCreate, ExpenseResponse

from pwdlib import PasswordHash

import models
import csv

from datetime import date
from io import StringIO


password_hash = PasswordHash.recommended()

Base.metadata.create_all(bind=engine)


app = FastAPI(title="SmartSpend API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Database Error Handler
# -------------------------

@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Database operation failed",
            "detail": "An unexpected database error occurred."
        }
    )


# -------------------------
# Authentication
# -------------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    user_id = verify_access_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    return user_id


# -------------------------
# Root
# -------------------------

@app.get("/")
def root():
    return {
        "message": "SmartSpend API is running"
    }


# -------------------------
# Database Test
# -------------------------

@app.get("/db-test")
def db_test():
    try:
        with engine.connect():
            return {
                "message": "PostgreSQL connection successful"
            }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )


# -------------------------
# User Registration
# -------------------------

@app.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = password_hash.hash(user.password)

    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return {
        "message": "User registered successfully",
        "user_id": new_user.id
    }
# -------------------------
# Current User
# -------------------------

@app.get("/me")
def get_me(
    user_id: int = Depends(get_current_user)
):
    return {
        "message": "Authenticated successfully",
        "user_id": user_id
    }


# -------------------------
# Login
# -------------------------

@app.post("/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.email == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not password_hash.verify(
        form_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# -------------------------
# Create Expense
# -------------------------

@app.post("/expenses")
def create_expense(
    expense: ExpenseCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if expense.category:
        category = expense.category
        confidence = 1.0
        method = "user"

    else:
        category, confidence, method = categorize_transaction(
            expense.description
        )

    new_expense = models.Expense(
        user_id=user_id,
        amount=expense.amount,
        description=expense.description,
        transaction_date=expense.transaction_date,
        category=category,
        category_confidence=confidence,
        categorization_method=method
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return {
        "message": "Expense created successfully",
        "expense_id": new_expense.id,
        "category": category,
        "category_confidence": confidence,
        "categorization_method": method
    }


# -------------------------
# Get All User Expenses
# -------------------------

@app.get(
    "/expenses",
    response_model=list[ExpenseResponse]
)
def get_expenses(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expenses = db.query(models.Expense).filter(
        models.Expense.user_id == user_id
    ).all()

    return expenses


# -------------------------
# Get Single Expense
# -------------------------

@app.get(
    "/expenses/{expense_id}",
    response_model=ExpenseResponse
)
def get_expense(
    expense_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == user_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return expense


# -------------------------
# Update Expense
# -------------------------

@app.put(
    "/expenses/{expense_id}",
    response_model=ExpenseResponse
)
def update_expense(
    expense_id: int,
    expense: ExpenseCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == user_id
    ).first()

    if not existing_expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    existing_expense.amount = expense.amount
    existing_expense.description = expense.description
    existing_expense.transaction_date = expense.transaction_date

    if expense.category:
        existing_expense.category = expense.category
        existing_expense.category_confidence = 1.0
        existing_expense.categorization_method = "user"

    else:
        category, confidence, method = categorize_transaction(
            expense.description
        )

        existing_expense.category = category
        existing_expense.category_confidence = confidence
        existing_expense.categorization_method = method

    db.commit()
    db.refresh(existing_expense)

    return existing_expense


# -------------------------
# Delete Expense
# -------------------------

@app.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == user_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    db.delete(expense)
    db.commit()

    return {
        "message": "Expense deleted successfully",
        "expense_id": expense_id
    }


# -------------------------
# CSV Import
# -------------------------

@app.post("/expenses/import")
def import_expenses(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported"
        )

    try:
        contents = file.file.read().decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="CSV file must be UTF-8 encoded."
        )

    reader = csv.DictReader(
        StringIO(contents)
    )

    required_columns = {
        "amount",
        "description",
        "transaction_date"
    }

    if not required_columns.issubset(
        set(reader.fieldnames or [])
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "CSV must contain amount, description, "
                "and transaction_date columns"
            )
        )

    imported = 0
    rejected = 0

    for row in reader:
        try:
            amount = float(row["amount"])

            if amount <= 0:
                rejected += 1
                continue

            transaction_date = date.fromisoformat(
                row["transaction_date"].strip()
            )

            description = row["description"].strip()

            if not description:
                rejected += 1
                continue

            category = (
                row.get("category") or ""
            ).strip()

            if not category:
                category, confidence, method = (
                    categorize_transaction(description)
                )
            else:
                confidence = 1.0
                method = "user"

            existing_expense = db.query(
                models.Expense
            ).filter(
                models.Expense.user_id == user_id,
                models.Expense.transaction_date == transaction_date,
                models.Expense.amount == amount,
                models.Expense.description == description
            ).first()

            if existing_expense:
                rejected += 1
                continue

            new_expense = models.Expense(
                user_id=user_id,
                amount=amount,
                description=description,
                transaction_date=transaction_date,
                category=category,
                category_confidence=confidence,
                categorization_method=method
            )

            db.add(new_expense)
            imported += 1

        except (ValueError, TypeError):
            rejected += 1

    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="CSV import failed while saving transactions."
        )

    return {
        "message": "CSV import completed",
        "imported": imported,
        "rejected": rejected
    }