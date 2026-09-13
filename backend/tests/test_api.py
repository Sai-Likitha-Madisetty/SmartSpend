from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_root():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "SmartSpend API is running"


def test_database_connection():
    response = client.get("/db-test")

    assert response.status_code == 200
    assert response.json()["message"] == "PostgreSQL connection successful"


def test_unauthorized_expenses():
    response = client.get("/expenses")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_invalid_csv_file_type():
    response = client.post(
        "/expenses/import",
        files={
            "file": (
                "transactions.txt",
                b"amount,description,transaction_date",
                "text/plain"
            )
        }
    )

    assert response.status_code == 401


def test_unauthorized_expense_by_id():
    response = client.get("/expenses/999999")

    assert response.status_code == 401
    
def test_register_user():
    response = client.post(
        "/register",
        json={
            "name": "Test User",
            "email": "test_user_smartspend@example.com",
            "password": "TestPassword123"
        }
    )

    assert response.status_code in [200, 400]

    if response.status_code == 200:
        assert response.json()["message"] == "User registered successfully"


def test_login_user():
    client.post(
        "/register",
        json={
            "name": "Login Test User",
            "email": "login_test_smartspend@example.com",
            "password": "TestPassword123"
        }
    )

    response = client.post(
        "/login",
        data={
            "username": "login_test_smartspend@example.com",
            "password": "TestPassword123"
        }
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"
    
def test_create_expense():
    register_response = client.post(
        "/register",
        json={
            "name": "Expense Test User",
            "email": "expense_test_smartspend@example.com",
            "password": "TestPassword123"
        }
    )

    if register_response.status_code == 400:
        # User may already exist from a previous test run.
        pass

    login_response = client.post(
        "/login",
        data={
            "username": "expense_test_smartspend@example.com",
            "password": "TestPassword123"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.post(
        "/expenses",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "amount": 250.50,
            "description": "Swiggy dinner",
            "transaction_date": "2026-09-13"
        }
    )

    assert response.status_code == 200
    assert response.json()["category"] == "Food"
    assert response.json()["categorization_method"] == "rule"