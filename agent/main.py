"""
FastAPI service wrapping the Google ADK CRM agent.

Start with:
    uvicorn agent.main:app --port 8000 --reload
or:
    python -m uvicorn agent.main:app --port 8000
"""

import json
import os
import re
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types

from agent.agent import root_agent

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(title="Pandora CRM Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:5173", "http://localhost:4173"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ── ADK session management ────────────────────────────────────────────────────

# Each tool call result can be large (graph queries). Reset the session after
# this many user turns to prevent context window overflow.
_MAX_TURNS_PER_SESSION = 6

_session_service = InMemorySessionService()
APP_NAME = "pandora_crm"

_runner = Runner(
    agent=root_agent,
    app_name=APP_NAME,
    session_service=_session_service,
)

# turn counter per session_id: incremented after each successful agent call
_turn_counts: dict[str, int] = {}


# ── Request / Response models ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    response: str
    ui_spec: Any | None = None
    session_id: str


def _extract_ui_spec(text: str) -> tuple[str, Any]:
    """Try to parse a json-render spec out of the agent response. Returns (fallback_text, spec_or_None).

    Handles three forms:
    1. Bare JSON object
    2. JSON inside a ```json ... ``` code fence
    3. Prose followed by a code fence (agent preamble before the JSON)
    """
    # Try every ```json ... ``` or ``` ... ``` block in the text, pick first valid spec
    fenced = re.findall(r'```(?:json)?\s*([\s\S]*?)```', text)
    for block in fenced:
        try:
            obj = json.loads(block.strip())
            if isinstance(obj, dict) and "root" in obj and "elements" in obj:
                return "", obj
        except (json.JSONDecodeError, ValueError):
            pass

    # Try the whole text as bare JSON
    try:
        obj = json.loads(text.strip())
        if isinstance(obj, dict) and "root" in obj and "elements" in obj:
            return "", obj
    except (json.JSONDecodeError, ValueError):
        pass

    # Last resort: find the first '{' and try to parse from there
    brace = text.find('{')
    if brace != -1:
        try:
            obj = json.loads(text[brace:].strip())
            if isinstance(obj, dict) and "root" in obj and "elements" in obj:
                return "", obj
        except (json.JSONDecodeError, ValueError):
            pass

    return text, None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    user_id = "banker"

    # Roll over to a fresh session if we've hit the turn limit.
    # Graph tool responses are large; accumulated history overflows the 200K context window.
    if _turn_counts.get(session_id, 0) >= _MAX_TURNS_PER_SESSION:
        session_id = str(uuid.uuid4())
        _turn_counts[session_id] = 0

    # Create session if it doesn't exist yet
    existing = await _session_service.get_session(
        app_name=APP_NAME,
        user_id=user_id,
        session_id=session_id,
    )
    if existing is None:
        await _session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
        )

    # Run the agent
    user_message = genai_types.Content(
        role="user",
        parts=[genai_types.Part(text=req.message)],
    )

    final_text = ""
    async for event in _runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=user_message,
    ):
        if event.is_final_response() and event.content and event.content.parts:
            for part in event.content.parts:
                if hasattr(part, "text") and part.text:
                    final_text += part.text

    _turn_counts[session_id] = _turn_counts.get(session_id, 0) + 1

    raw = final_text.strip()
    fallback_text, ui_spec = _extract_ui_spec(raw)
    return ChatResponse(response=fallback_text, ui_spec=ui_spec, session_id=session_id)
