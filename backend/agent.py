import os
from typing import Literal

from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider


class RecipeIngredient(BaseModel):
    name: str            # item as described by user / recipe (e.g. "organic milk", "fresh mozzarella")
    search_term: str     # simplified 1-2 word store search term, no adjectives (e.g. "milk", "mozzarella")
    cooking_amount: str = ""  # recipe quantity with unit ("400 g", "500 ml"); empty for single-item requests
    quantity: int = 1    # units to add for single-item requests; ignored for recipes (backend computes)


class RecipeItem(BaseModel):
    product_id: int    # real DB id, or -1 if not in store
    name: str
    cooking_amount: str = ""
    quantity: int      # packages to add; 0 = out of stock


class CartAction(BaseModel):
    action: Literal["propose", "none"]
    recipe_ingredients: list[RecipeIngredient] = []  # always populated by model
    recipe_items: list[RecipeItem] = []              # populated by backend after DB lookup
    steps: list[str] = []
    is_recipe: bool = False


class AgentResponse(BaseModel):
    message: str
    cart_action: CartAction


_SYSTEM_PROMPT = """
You are FreshMart's shopping assistant. Never call any tools — the backend handles all store lookups.

General rules:
- Pure greetings only (e.g. "hello", "thanks"): set action to "none", leave recipe_ingredients empty.
- ANY question about products, availability, or categories: set action to "propose".
- Product interactions: set action to "propose".

SINGLE ITEM OR CATEGORY REQUEST (e.g. "add milk", "do you have eggs?", "I need 2 cartons of juice", "do you have any fruit?", "what dairy do you carry?"):
- Set is_recipe to false.
- Set recipe_ingredients with ONE entry:
    name: item as the user described it (e.g. "organic milk")
    search_term: simplified 1-2 word store term, no adjectives (e.g. "milk", "orange juice")
    cooking_amount: "" (leave empty)
    quantity: number of units the user wants (default 1; "add 3 eggs" → 3)
- Write a neutral one-line message (e.g. "Here's what I found!" or "Let me check that for you!"). Do NOT say the item is available or in stock — the UI shows the real availability.

RECIPE REQUEST (e.g. "pasta recipe", "how do I make pizza?", "cake ingredients"):
- Set is_recipe to true.
- Set recipe_ingredients — one entry per ingredient:
    name: ingredient as written in the recipe (e.g. "fresh mozzarella cheese")
    search_term: simplified 1-2 word grocery term, no adjectives (e.g. "mozzarella", "olive oil", "eggs")
    cooking_amount: amount needed with unit (e.g. "200 g", "500 ml", "2 count")
- Set steps: 4-6 preparation steps with exact quantities, temperatures, and timing.
- Write a one-line intro in your message only. The ingredient list and steps are shown separately in the UI.
"""

model = OpenAIModel("Qwen/Qwen3-235B-A22B-Instruct-2507-tput",
        provider=OpenAIProvider(
        base_url="https://api.together.ai/v1",
        api_key=os.environ.get("API_KEY"),
    ))

shop_agent = Agent(
    model,
    output_type=AgentResponse,
    system_prompt=_SYSTEM_PROMPT,
)
