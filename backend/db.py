import os
import libsql_client

_SEED_PRODUCTS = [
    (1,  "Organic Bananas",          "Fruits",     1.29,  "bunch",   1),
    (2,  "Whole Milk (1 gal)",       "Dairy",      3.99,  "gal",     1),
    (3,  "Sourdough Bread",          "Bakery",     4.49,  "loaf",    1),
    (4,  "Free-Range Eggs (12)",     "Dairy",      5.99,  "dozen",   1),
    (5,  "Chicken Breast",           "Meat",       8.99,  "lb",      1),
    (6,  "Atlantic Salmon",          "Seafood",   12.99,  "lb",      0),
    (7,  "Baby Spinach",             "Vegetables", 3.49,  "bag",     1),
    (8,  "Avocados",                 "Fruits",     1.99,  "each",    1),
    (9,  "Greek Yogurt",             "Dairy",      4.29,  "tub",     1),
    (10, "Pasta (Penne)",            "Pantry",     1.79,  "box",     1),
    (11, "Olive Oil (Extra Virgin)", "Pantry",     7.99,  "bottle",  1),
    (12, "Roma Tomatoes",            "Vegetables", 2.49,  "lb",      1),
    (13, "Cheddar Cheese",           "Dairy",      5.49,  "block",   1),
    (14, "Orange Juice",             "Beverages",  4.99,  "carton",  1),
    (15, "Ground Coffee",            "Beverages",  9.99,  "bag",     0),
]


def _connect() -> libsql_client.Client:
    url = os.environ["TURSO_DATABASE_URL"]
    # Force HTTP transport (instead of WebSocket) for broader compatibility
    url = url.replace("libsql://", "https://")
    token = os.environ.get("TURSO_AUTH_TOKEN", "")
    return libsql_client.create_client_sync(url=url, auth_token=token)


def init_db() -> None:
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id       INTEGER PRIMARY KEY,
                name     TEXT    NOT NULL,
                category TEXT    NOT NULL,
                price    REAL    NOT NULL,
                unit     TEXT    NOT NULL,
                in_stock INTEGER NOT NULL DEFAULT 1
            )
        """)
        result = conn.execute("SELECT COUNT(*) FROM products")
        count = result.rows[0][0]
        if count == 0:
            conn.batch([
                libsql_client.Statement(
                    "INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)", list(row)
                )
                for row in _SEED_PRODUCTS
            ])


def get_all_products() -> list[dict]:
    with _connect() as conn:
        result = conn.execute("SELECT * FROM products")
        return [_row_to_dict(result.columns, row) for row in result.rows]


def search_products(query: str) -> list[dict]:
    like = f"%{query}%"
    with _connect() as conn:
        result = conn.execute(
            "SELECT * FROM products WHERE name LIKE ? OR category LIKE ?",
            [like, like],
        )
        return [_row_to_dict(result.columns, row) for row in result.rows]


def _row_to_dict(columns: list[str], row) -> dict:
    d = dict(zip(columns, row))
    d["inStock"] = bool(d.pop("in_stock"))
    return d
