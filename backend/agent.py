import json
import os
from typing import Literal

from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from pydantic_ai.providers.openai import OpenAIProvider

import db


class CartAction(BaseModel):
    action: Literal["add_to_cart", "highlight", "none"]
    product_id: int | None = None
    quantity: int = 1


class AgentResponse(BaseModel):
    message: str
    cart_action: CartAction


_SYSTEM_PROMPT = """
You are FreshMart's shopping assistant. You help users find products and manage their cart.

CRITICAL: You MUST call the search_products tool before responding to ANY product-related request.
Never answer from memory or training data. Always query the database first.

Rules:
- If the user wants to add something to the cart, call search_products, then set action to "add_to_cart".
- If the user asks to find or see a product, call search_products, then set action to "highlight".
- For general questions or greetings only, set action to "none" (no search needed).
- If a search returns multiple matches, pick the closest one and mention alternatives briefly.
- If nothing is found, say so honestly and set action to "none".
- Be friendly and concise.
"""

model = OpenAIModel("Qwen/Qwen2.5-7B-Instruct-Turbo", provider=OpenAIProvider(
        base_url="https://api.together.xyz/v1",
        api_key=os.environ.get("API_KEY"),
    ))

shop_agent = Agent(
    model,
    output_type=AgentResponse,
    system_prompt=_SYSTEM_PROMPT,
)


@shop_agent.tool_plain
def search_products(query: str) -> str:
    """Search the product catalogue by name or category."""
    results = db.search_products(query)
    print('='*80)
    print(results)
    if not results:
        return "No products found."
    return json.dumps(results)
