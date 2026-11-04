from services.categorizer import categorize_transaction


def test_food_transaction():
    category, confidence, method = categorize_transaction("Swiggy dinner")

    assert category == "Food"
    assert confidence == 0.95
    assert method == "rule"


def test_transport_transaction():
    category, confidence, method = categorize_transaction("Uber ride")

    assert category == "Transport"
    assert confidence == 0.95
    assert method == "rule"


def test_shopping_transaction():
    category, confidence, method = categorize_transaction("Amazon headphones")

    assert category == "Shopping"
    assert confidence == 0.95
    assert method == "rule"


def test_unknown_transaction():
    category, confidence, method = categorize_transaction("Random payment")

    assert category == "Other"
    assert confidence == 0.50
    assert method == "default"