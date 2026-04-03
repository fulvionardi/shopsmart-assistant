import asyncio
import json

from dotenv import load_dotenv

load_dotenv(".env.local")  # must load before agent.py reads API_KEY

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import db
from agent import shop_agent

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
# Chat
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@app.post("/api/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    user_message = request.messages[-1].content

    async def generate():
        # Tell the frontend the agent is working
        step = json.dumps([{"type": "step", "text": "Searching products..."}])
        yield f"2:{step}\n"

        result = await shop_agent.run(user_message)
        response = result.data  # AgentResponse

        # Stream the message text character by character
        for char in response.message:
            yield f"0:{json.dumps(char)}\n"
            await asyncio.sleep(0.008)

        # Send the cart action as a data chunk
        action_payload = {"type": "action", **response.cart_action.model_dump()}
        yield f"2:{json.dumps([action_payload])}\n"

        yield 'd:{"finishReason":"stop"}\n'

    return StreamingResponse(
        generate(),
        media_type="text/plain; charset=utf-8",
        headers={"x-vercel-ai-data-stream": "v1"},
    )
