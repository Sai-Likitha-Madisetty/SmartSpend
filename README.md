# SmartSpend

**SmartSpend** is a full-stack personal expense management application designed to provide secure, reliable, and intelligent transaction management through a modern web interface.

The application enables users to manage expenses, import transactions from CSV files, automatically categorize transactions, and maintain their financial records through authenticated REST APIs backed by PostgreSQL.

---

## Overview

Managing personal transactions often involves repetitive manual entry and inconsistent categorization.

SmartSpend addresses this by combining:

- Secure user authentication
- RESTful backend APIs
- PostgreSQL persistence
- Automated transaction categorization
- CSV-based bulk import
- Validation and duplicate detection
- User-specific authorization
- Automated backend testing

The project focuses on applying practical **full-stack software engineering principles** to a real-world application.

---

## Key Features

### Authentication & Authorization

- User registration and login
- JWT-based authentication
- Secure password hashing using Argon2
- Protected API endpoints
- User-specific expense access
- Authorization checks for individual transactions

### Expense Management

- Create expenses
- View personal expenses
- Edit existing expenses
- Delete expenses
- Search transactions
- Filter transactions by category
- Manually assign or override categories

### Smart Categorization

SmartSpend automatically categorizes transactions using a rule-based categorization engine.

| Transaction Description | Category |
|------------------------|----------|
| Swiggy dinner | Food |
| Uber ride | Transport |
| Amazon purchase | Shopping |
| Netflix subscription | Entertainment |

The system also stores:

- Categorization method
- Categorization confidence

This provides a foundation for extending the categorization engine with more advanced approaches in future versions.

---

### CSV Import Pipeline

Users can import multiple transactions through a CSV file.

```text
CSV Upload
     ↓
File Validation
     ↓
Column Validation
     ↓
Record Validation
     ↓
Duplicate Detection
     ↓
Transaction Categorization
     ↓
Database Persistence
     ↓
Import Summary
```

The system supports partial imports by separating valid and rejected records instead of failing the entire file because of individual invalid transactions.

---

## System Architecture

```text
┌──────────────────────────────┐
│        React Frontend        │
│          Vite + JS           │
└──────────────┬───────────────┘
               │
               │ HTTP / REST
               ▼
┌──────────────────────────────┐
│       FastAPI Backend        │
│                              │
│  Authentication              │
│  Expense APIs                │
│  CSV Import                  │
│  Validation                  │
│  Authorization               │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────────┐
│ Categorizer  │  │   PostgreSQL     │
│   Service    │  │    Database      │
└──────────────┘  └──────────────────┘
```

---

## Technology Stack

| Layer | Technologies |
|--------|-------------|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| Authentication | JWT |
| Password Security | Argon2 |
| Database | PostgreSQL |
| Testing | Pytest, FastAPI TestClient |
| API Testing | Postman |
| Version Control | Git, GitHub |

---

## Backend Design

The backend follows a modular structure separating API handling, authentication, database access, data models, schemas, and business logic.

```text
backend/
│
├── services/
│   └── categorizer.py
│
├── tests/
│   ├── test_api.py
│   └── test_categorizer.py
│
├── auth.py
├── database.py
├── main.py
├── models.py
└── schemas.py
```

### Responsibilities

#### `main.py`
Handles API routes, request processing, authentication dependencies, CSV imports, and application configuration.

#### `auth.py`
Handles JWT token creation and verification.

#### `database.py`
Configures SQLAlchemy and PostgreSQL database connectivity.

#### `models.py`
Defines database entities and relationships.

#### `schemas.py`
Defines Pydantic request and response validation models.

#### `services/categorizer.py`
Contains the transaction categorization logic.

#### `tests/`
Contains automated tests for API behavior and categorization functionality.

---

## Database

SmartSpend uses **PostgreSQL** for persistent storage.

### User

Stores account information including:

- User ID
- Name
- Email
- Hashed Password

### Expense

Stores transaction information including:

- Expense ID
- User ID
- Amount
- Description
- Transaction Date
- Category
- Categorization Confidence
- Categorization Method

Each expense is associated with its authenticated owner through a foreign-key relationship.

---

## API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | API health check |
| GET | `/db-test` | Database connectivity check |
| POST | `/register` | Register a user |
| POST | `/login` | Authenticate a user |
| GET | `/me` | Retrieve authenticated user |
| POST | `/expenses` | Create an expense |
| GET | `/expenses` | Retrieve user's expenses |
| GET | `/expenses/{id}` | Retrieve a specific expense |
| PUT | `/expenses/{id}` | Update an expense |
| DELETE | `/expenses/{id}` | Delete an expense |
| POST | `/expenses/import` | Import transactions from CSV |

FastAPI automatically provides interactive API documentation through Swagger UI:

```text
http://127.0.0.1:8000/docs
```

---

## Validation & Error Handling

SmartSpend validates user input at multiple levels.

### Validation Includes

- Required field validation
- Email validation
- Password length validation
- Positive transaction amounts
- Transaction date validation
- CSV file type validation
- CSV column validation
- Invalid record handling
- Duplicate transaction detection
- Database error handling

### Example Import Summary

```json
{
  "message": "CSV import completed",
  "imported": 97,
  "rejected": 3
}
```

---

## Security

Security measures implemented include:

- JWT-based authentication
- Argon2 password hashing
- Protected expense endpoints
- User-level authorization
- Pydantic request validation
- PostgreSQL foreign-key constraints
- Environment-based secret configuration
- `.env` excluded from version control
- Generic database error responses

Sensitive credentials are never intended to be committed to the repository.

---

## Testing

SmartSpend includes automated backend tests using **Pytest** and FastAPI's `TestClient`.

### Test Coverage

- API health checks
- Database connectivity
- Authentication
- Authorization
- Expense creation
- CSV validation
- Transaction categorization

Run tests:

```bash
cd backend
pytest
```

---

## Project Structure

```text
SmartSpend/
│
├── backend/
│   ├── services/
│   │   └── categorizer.py
│   │
│   ├── tests/
│   │   ├── test_api.py
│   │   └── test_categorizer.py
│   │
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   └── schemas.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── data/
│   └── sample_transactions.csv
│
├── README.md
└── .gitignore
```

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Sai-Likitha-Madisetty/SmartSpend.git
cd SmartSpend
```

### 2. Configure PostgreSQL

Create a PostgreSQL database named:

```text
smartspend
```

### 3. Configure the Backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment (Windows):

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install fastapi uvicorn sqlalchemy psycopg[binary] pwdlib[argon2] email-validator python-jose[cryptography] python-dotenv python-multipart pytest httpx
```

### 4. Configure Environment Variables

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql+psycopg://<username>:<password>@localhost:5432/smartspend
SECRET_KEY=<your-secret-key>
```

> Do not commit `.env` to Git.

### 5. Start the Backend

```bash
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

### 6. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Example CSV Format

```csv
amount,description,transaction_date
450,Swiggy dinner,2026-09-10
250,Uber ride,2026-09-11
1200,Amazon purchase,2026-09-12
```

The importer validates each record before saving it to the database.

---

## Future Improvements

- Machine-learning fallback for low-confidence transactions
- Refresh-token authentication
- Password reset functionality
- Pagination for large transaction datasets
- Background CSV processing
- API rate limiting
- Alembic database migrations
- Docker containerization
- CI/CD pipeline
- Cloud deployment
- Production monitoring and logging

---

## Engineering Focus

SmartSpend demonstrates practical software engineering concepts including:

- Full-stack application development
- REST API design
- Authentication and authorization
- Relational database design
- ORM-based persistence
- Input validation
- File-processing pipelines
- Business logic separation
- Error handling
- Automated testing
- Secure configuration management
- Git-based version control

The project is designed as a practical example of building and structuring a production-oriented full-stack application rather than a simple CRUD demonstration.

---

## License

This project is licensed under the **MIT License**.
