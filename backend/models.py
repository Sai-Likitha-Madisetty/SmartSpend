from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    transaction_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)

    category_confidence = Column(Float, nullable=True)
    categorization_method = Column(String(50), nullable=True)