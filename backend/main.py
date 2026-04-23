import asyncio
import json
import uuid

from dotenv import load_dotenv

load_dotenv(".env.local")  # must load before agent.py reads API_KEY

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any

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

        result = await shop_agent.run(user_message)
        response = result.output  # AgentResponse

        # Stream the message text character by character
        yield sse({"type": "text-start", "id": text_part_id})
        for char in response.message:
            yield sse({"type": "text-delta", "id": text_part_id, "delta": char})
            await asyncio.sleep(0.008)
        yield sse({"type": "text-end", "id": text_part_id})

        # Send the cart action as a data chunk
        yield sse({"type": "data-agent", "data": {"type": "action", **response.cart_action.model_dump()}})

        yield sse({"type": "finish-step"})
        yield sse({"type": "finish", "finishReason": "stop"})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"x-vercel-ai-ui-message-stream": "v1"},
    )
