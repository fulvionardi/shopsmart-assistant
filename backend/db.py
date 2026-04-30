import os
import libsql_client
from dotenv import load_dotenv

load_dotenv(".env.local")

# (id, name, category, price, unit, quantity, package_size)
# package_size = net content of one unit; None for variable-weight items sold by lb/bunch/each
_SEED_PRODUCTS = [
    # Fruits
    (1,  "Organic Bananas",          "Fruits",     1.29,  "bunch",   10,  None),
    (8,  "Avocados",                 "Fruits",     1.99,  "each",    10,  None),
    (16, "Strawberries",             "Fruits",     3.99,  "punnet",  10,  "400 g"),
    (17, "Apples (Gala)",            "Fruits",     0.89,  "each",    10,  None),
    (18, "Lemons",                   "Fruits",     0.59,  "each",    10,  None),
    (19, "Oranges",                  "Fruits",     0.99,  "each",    10,  None),
    # Dairy
    (2,  "Whole Milk (1 gal)",       "Dairy",      3.99,  "gal",     10,  "3785 ml"),
    (4,  "Free-Range Eggs (12)",     "Dairy",      5.99,  "dozen",   10,  "12 count"),
    (9,  "Greek Yogurt",             "Dairy",      4.29,  "tub",     10,  "500 g"),
    (13, "Cheddar Cheese",           "Dairy",      5.49,  "block",   10,  "200 g"),
    (20, "Unsalted Butter",          "Dairy",      4.49,  "pack",    10,  "250 g"),
    (21, "Heavy Cream",              "Dairy",      2.99,  "carton",  10,  "250 ml"),
    (22, "Mozzarella Cheese",        "Dairy",      3.99,  "ball",    10,  "125 g"),
    (23, "Parmesan Cheese",          "Dairy",      5.99,  "wedge",   10,  "150 g"),
    # Bakery
    (3,  "Sourdough Bread",          "Bakery",     4.49,  "loaf",    10,  "680 g"),
    (24, "Whole Wheat Bread",        "Bakery",     3.49,  "loaf",    10,  "680 g"),
    (25, "Croissants (4 pack)",      "Bakery",     4.99,  "pack",    10,  "4 count"),
    # Meat
    (5,  "Chicken Breast",           "Meat",       8.99,  "lb",      10,  None),
    (26, "Ground Beef",              "Meat",       6.99,  "lb",      10,  None),
    (27, "Bacon",                    "Meat",       7.49,  "pack",    10,  "200 g"),
    (28, "Pork Chops",               "Meat",       7.99,  "lb",      10,  None),
    # Seafood
    (6,  "Atlantic Salmon",          "Seafood",   12.99,  "lb",       0,  None),
    (29, "Shrimp",                   "Seafood",    9.99,  "lb",      10,  None),
    # Vegetables
    (7,  "Baby Spinach",             "Vegetables", 3.49,  "bag",     10,  "142 g"),
    (12, "Roma Tomatoes",            "Vegetables", 2.49,  "lb",      10,  None),
    (30, "Broccoli",                 "Vegetables", 2.49,  "head",    10,  None),
    (31, "Bell Peppers",             "Vegetables", 1.49,  "each",    10,  None),
    (32, "Garlic",                   "Vegetables", 0.99,  "bulb",    10,  None),
    (33, "Yellow Onions",            "Vegetables", 1.29,  "each",    10,  None),
    (34, "Potatoes",                 "Vegetables", 4.99,  "bag",     10,  "2 kg"),
    (35, "Carrots",                  "Vegetables", 1.99,  "bag",     10,  "500 g"),
    (36, "Zucchini",                 "Vegetables", 1.29,  "each",    10,  None),
    (37, "Cherry Tomatoes",          "Vegetables", 3.49,  "punnet",  10,  "250 g"),
    # Pantry
    (10, "Pasta (Penne)",            "Pantry",     1.79,  "box",     10,  "500 g"),
    (11, "Olive Oil (Extra Virgin)", "Pantry",     7.99,  "bottle",  10,  "750 ml"),
    (38, "All-Purpose Flour",        "Pantry",     2.99,  "bag",     10,  "1 kg"),
    (39, "White Sugar",              "Pantry",     2.49,  "bag",     10,  "1 kg"),
    (40, "Basmati Rice",             "Pantry",     4.99,  "bag",     10,  "1 kg"),
    (41, "Canned Tomatoes",          "Pantry",     1.49,  "can",     10,  "400 g"),
    (42, "Chicken Broth",            "Pantry",     2.99,  "carton",  10,  "1 L"),
    (43, "Honey",                    "Pantry",     5.99,  "jar",     10,  "500 g"),
    (44, "Soy Sauce",                "Pantry",     3.49,  "bottle",  10,  "250 ml"),
    (45, "Baking Powder",            "Pantry",     2.29,  "tin",     10,  "100 g"),
    (46, "Vanilla Extract",          "Pantry",     4.99,  "bottle",  10,  "50 ml"),
    # Beverages
    (14, "Orange Juice",             "Beverages",  4.99,  "carton",  10,  "1890 ml"),
    (15, "Ground Coffee",            "Beverages",  9.99,  "bag",      0,  "340 g"),
    (47, "Sparkling Water",          "Beverages",  1.29,  "bottle",  10,  "750 ml"),
    (48, "Green Tea (20 bags)",      "Beverages",  3.99,  "box",     10,  "20 count"),
    (49, "Almond Milk",              "Beverages",  3.49,  "carton",  10,  "1 L"),
    # Snacks
    (50, "Granola Bars (6 pack)",    "Snacks",     4.49,  "pack",    10,  "6 count"),
    (51, "Mixed Nuts",               "Snacks",     7.99,  "bag",     10,  "200 g"),
    (52, "Dark Chocolate",           "Snacks",     3.49,  "bar",     10,  "100 g"),
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
                id           INTEGER PRIMARY KEY,
                name         TEXT    NOT NULL,
                category     TEXT    NOT NULL,
                price        REAL    NOT NULL,
                unit         TEXT    NOT NULL,
                quantity     INTEGER NOT NULL DEFAULT 0,
                package_size TEXT
            )
        """)

        # Migration: add quantity column if upgrading from old schema that had in_stock
        try:
            conn.execute("ALTER TABLE products ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0")
            conn.execute("UPDATE products SET quantity = 10 WHERE in_stock = 1 AND quantity = 0")
        except Exception:
            pass

        # Migration: add package_size column
        try:
            conn.execute("ALTER TABLE products ADD COLUMN package_size TEXT")
            conn.batch([
                libsql_client.Statement(
                    "UPDATE products SET package_size = ? WHERE id = ?", [row[6], row[0]]
                )
                for row in _SEED_PRODUCTS if row[6] is not None
            ])
        except Exception:
            pass

        # INSERT OR IGNORE — skips existing rows, adds new ones on every startup
        conn.batch([
            libsql_client.Statement(
                "INSERT OR IGNORE INTO products (id, name, category, price, unit, quantity, package_size) VALUES (?, ?, ?, ?, ?, ?, ?)",
                list(row)
            )
            for row in _SEED_PRODUCTS
        ])


def get_all_products() -> list[dict]:
    with _connect() as conn:
        result = conn.execute("SELECT id, name, category, price, unit, quantity, package_size FROM products")
        return [_row_to_dict(result.columns, row) for row in result.rows]


def search_products(query: str) -> list[dict]:
    like = f"%{query}%"
    with _connect() as conn:
        result = conn.execute(
            "SELECT id, name, category, price, unit, quantity, package_size FROM products WHERE name LIKE ? OR category LIKE ?",
            [like, like],
        )
        return [_row_to_dict(result.columns, row) for row in result.rows]


def search_by_name(name: str) -> list[dict]:
    like = f"%{name}%"
    with _connect() as conn:
        result = conn.execute(
            "SELECT id, name, category, price, unit, quantity, package_size FROM products WHERE name LIKE ?",
            [like],
        )
        return [_row_to_dict(result.columns, row) for row in result.rows]


def search_by_category(category: str) -> list[dict]:
    like = f"%{category}%"
    with _connect() as conn:
        result = conn.execute(
            "SELECT id, name, category, price, unit, quantity, package_size FROM products WHERE category LIKE ?",
            [like],
        )
        return [_row_to_dict(result.columns, row) for row in result.rows]


def resolve_product_id(product_id: int, name: str | None) -> tuple[int, int] | None:
    """Return (real_id, quantity) or None if not found. Falls back to name search."""
    with _connect() as conn:
        result = conn.execute("SELECT id, quantity FROM products WHERE id = ?", [product_id])
        if result.rows:
            return result.rows[0][0], result.rows[0][1]
        if name:
            result = conn.execute(
                "SELECT id, quantity FROM products WHERE name LIKE ?", [f"%{name}%"]
            )
            if result.rows:
                return result.rows[0][0], result.rows[0][1]
    return None


def find_by_name(name: str) -> tuple[int, int] | None:
    """Return (id, quantity) for the first product whose name matches, or None."""
    with _connect() as conn:
        result = conn.execute(
            "SELECT id, quantity FROM products WHERE name LIKE ?", [f"%{name}%"]
        )
        if result.rows:
            return result.rows[0][0], result.rows[0][1]
    return None


def decrement_quantity(product_id: int, amount: int) -> bool:
    """Reduce stock by amount. Returns False if insufficient quantity."""
    with _connect() as conn:
        result = conn.execute("SELECT quantity FROM products WHERE id = ?", [product_id])
        if not result.rows:
            return False
        current = result.rows[0][0]
        if current < amount:
            return False
        conn.execute(
            "UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?",
            [amount, product_id, amount],
        )
        return True


def update_quantity(product_id: int, quantity: int) -> None:
    """Set the quantity of a product to an explicit value."""
    with _connect() as conn:
        conn.execute("UPDATE products SET quantity = ? WHERE id = ?", [quantity, product_id])


def reset_db() -> None:
    """Reset all product quantities back to the original seed values."""
    with _connect() as conn:
        conn.batch([
            libsql_client.Statement(
                "UPDATE products SET quantity = ? WHERE id = ?", [row[5], row[0]]
            )
            for row in _SEED_PRODUCTS
        ])
        print(f"Reset {len(_SEED_PRODUCTS)} products to seed quantities.")


def _row_to_dict(columns: list[str], row) -> dict:
    d = dict(zip(columns, row))
    d["inStock"] = d["quantity"] > 0
    d["packageSize"] = d.pop("package_size", None)
    return d


if __name__ == "__main__":
    # Decrease Organic Bananas (id=1) quantity by 1
    target_id = 1
    with _connect() as conn:
        result = conn.execute("SELECT name, quantity FROM products WHERE id = ?", [target_id])
        name, current = result.rows[0]
    new_qty = max(0, current - 1)
    update_quantity(target_id, new_qty)
    print(f"Updated '{name}': {current} → {new_qty}")
