CATEGORY_RULES = {
    "Food": [
        "swiggy",
        "zomato",
        "restaurant",
        "food",
        "lunch",
        "dinner",
        "breakfast",
        "cafe"
    ],
    "Transport": [
        "uber",
        "ola",
        "metro",
        "bus",
        "train",
        "fuel",
        "petrol",
        "diesel"
    ],
    "Shopping": [
        "amazon",
        "flipkart",
        "myntra",
        "shopping",
        "clothes",
        "headphones"
    ],
    "Bills": [
        "electricity",
        "water bill",
        "internet",
        "mobile bill",
        "phone bill",
        "recharge"
    ],
    "Entertainment": [
        "netflix",
        "prime video",
        "spotify",
        "movie",
        "cinema",
        "youtube"
    ]
}


def categorize_transaction(description: str):
    text = description.lower()

    for category, keywords in CATEGORY_RULES.items():
        for keyword in keywords:
            if keyword in text:
                return category, 0.95, "rule"

    return "Other", 0.50, "default"