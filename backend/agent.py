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

You have access to a search_products tool to look up items in the database.
Always search before responding to product-related requests.

Rules:
- If the user wants to add something to the cart, search for it and set action to "add_to_cart".
- If the user asks to find or see a product, search for it and set action to "highlight".
- For general questions or greetings, set action to "none".
- If a search returns multiple matches, pick the closest one and mention alternatives briefly.
- If nothing is found, say so honestly and set action to "none".
- Be friendly and concise.
"""

# _together_client = AsyncOpenAI(
#     base_url="https://api.together.xyz/v1",
#     api_key=os.environ["API_KEY"],
# )
model = OpenAIModel("openai/gpt-oss-120b", provider=OpenAIProvider(
        base_url="https://api.together.xyz/v1",
        api_key=os.environ.get("API_KEY"),
    ))


shop_agent = Agent(
    model,
    # result_type=AgentResponse,
    system_prompt=_SYSTEM_PROMPT,
)


@shop_agent.tool_plain
def search_products(query: str) -> str:
    """Search the product catalogue by name or category."""
    results = db.search_products(query)
    if not results:
        return "No products found."
    return json.dumps(results)
