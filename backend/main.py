import asyncio
import json
import math
import re
import uuid

from dotenv import load_dotenv

load_dotenv(".env.local")  # must load before agent.py reads API_KEY

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any

import db
from agent import shop_agent, RecipeItem


def _parse_numeric(text: str | None) -> float | None:
    if not text:
        return None
    m = re.match(r"([\d.]+)", text.strip())
    return float(m.group(1)) if m else None


def _compute_qty(cooking_amount: str, package_size: str | None) -> int:
    cooking = _parse_numeric(cooking_amount)
    pkg = _parse_numeric(package_size)
    if cooking and pkg:
        return max(1, min(math.ceil(cooking / pkg), 3))
    return 1


def _best_match(results: list[dict], search_term: str) -> dict:
    """Pick the most relevant product from search results."""
    if len(results) == 1:
        return results[0]
    term = search_term.lower()
    hits = [r for r in results if term in r["name"].lower()]
    if hits:
        return min(hits, key=lambda r: len(r["name"]))  # shortest = most specific
    return results[0]

app = FastAPI(title="FreshMart API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    db.init_db()


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

@app.get("/api/products")
def get_products() -> list[dict]:
    return db.get_all_products()


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------

class BatchCartItem(BaseModel):
    product_id: int
    name: str | None = None
    quantity: int


@app.post("/api/cart/add-batch")
def add_batch(items: list[BatchCartItem]) -> dict:
    results = []
    for item in items:
        resolved = db.resolve_product_id(item.product_id, item.name)
        if resolved is None:
            results.append({"product_id": item.product_id, "success": False})
            continue
        resolved_id, _ = resolved
        ok = db.decrement_quantity(resolved_id, item.quantity)
        results.append({"product_id": resolved_id, "quantity": item.quantity, "success": ok})
    return {"results": results}


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

class UIPart(BaseModel):
    type: str
    text: str | None = None


class UIMessage(BaseModel):
    id: str
    role: str
    parts: list[UIPart] = []


class ChatRequest(BaseModel):
    id: str | None = None
    messages: list[UIMessage]
    trigger: str | None = None
    messageId: str | None = None


def sse(chunk: dict) -> str:
    """Serialize a UIMessageChunk as an SSE event line."""
    return f"data: {json.dumps(chunk)}\n\n"


@app.post("/api/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    # Extract the last user message text from parts
    last_msg = request.messages[-1]
    user_message = " ".join(
        part.text for part in last_msg.parts if part.type == "text" and part.text
    )

    response_message_id = str(uuid.uuid4())
    text_part_id = str(uuid.uuid4())

    async def generate():
        yield sse({"type": "start", "messageId": response_message_id})
        yield sse({"type": "start-step"})

        # Tell the frontend the agent is working
        yield sse({"type": "data-agent", "data": {"type": "step", "text": "Searching products..."}})

        try:
            result = await shop_agent.run(user_message)
        except Exception as e:
            yield sse({"type": "text-start", "id": text_part_id})
            for char in f"Sorry, I ran into an error: {e}":
                yield sse({"type": "text-delta", "id": text_part_id, "delta": char})
            yield sse({"type": "text-end", "id": text_part_id})
            yield sse({"type": "finish-step"})
            yield sse({"type": "finish", "finishReason": "stop"})
            return
        response = result.output  # AgentResponse
        cart = response.cart_action

        # ── Unified DB matching pipeline ──────────────────────────────────────
        # The model always outputs recipe_ingredients (never calls tools).
        # Backend queries the DB for each search_term and encodes the result:
        #   product_id >= 0, quantity > 0  → available
        #   product_id >= 0, quantity == 0 → out of stock
        #   product_id == -1               → not in store
        matched: list[RecipeItem] = []
        seen_ids: set[int] = set()
        for ingredient in cart.recipe_ingredients:
            # For single items: try name column first, fall back to category column.
            # For recipes: search both columns at once (broader match for ingredient terms).
            category_fallback = False
            if cart.is_recipe:
                results = db.search_products(ingredient.search_term)
            else:
                results = db.search_by_name(ingredient.search_term)
                if not results:
                    results = db.search_by_category(ingredient.search_term)
                    category_fallback = True
            if not results:
                matched.append(RecipeItem(
                    product_id=-1,
                    name=ingredient.name,
                    cooking_amount=ingredient.cooking_amount,
                    quantity=0,
                ))
                continue

            # Category fallback: include ALL matching products so the user sees the full list.
            # Name match or recipe: pick the single best match.
            candidates = results if category_fallback else [_best_match(results, ingredient.search_term)]

            for product in candidates:
                real_id = product["id"]
                if real_id in seen_ids:
                    continue
                seen_ids.add(real_id)
                if product["quantity"] == 0:
                    matched.append(RecipeItem(
                        product_id=real_id,
                        name=product["name"],
                        cooking_amount=ingredient.cooking_amount,
                        quantity=0,
                    ))
                else:
                    qty = (
                        _compute_qty(ingredient.cooking_amount, product.get("packageSize"))
                        if ingredient.cooking_amount
                        else max(1, min(ingredient.quantity, 10))
                    )
                    matched.append(RecipeItem(
                        product_id=real_id,
                        name=product["name"],
                        cooking_amount=ingredient.cooking_amount,
                        quantity=qty,
                    ))
        cart.recipe_items = matched

        # Stream the message text character by character
        yield sse({"type": "text-start", "id": text_part_id})
        for char in response.message:
            yield sse({"type": "text-delta", "id": text_part_id, "delta": char})
            await asyncio.sleep(0.008)
        yield sse({"type": "text-end", "id": text_part_id})

        # Send the cart action as a data chunk (exclude internal recipe_ingredients)
        yield sse({"type": "data-agent", "data": {"type": "action", **response.cart_action.model_dump(exclude={"recipe_ingredients"})}})

        yield sse({"type": "finish-step"})
        yield sse({"type": "finish", "finishReason": "stop"})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"x-vercel-ai-ui-message-stream": "v1"},
    )
