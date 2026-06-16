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

_session_service = InMemorySessionService()
APP_NAME = "pandora_crm"

_runner = Runner(
    agent=root_agent,
    app_name=APP_NAME,
    session_service=_session_service,
)


# ── Request / Response models ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    response: str
    ui_spec: Any | None = None
    session_id: str


def _extract_ui_spec(text: str) -> tuple[str, Any]:
    """Try to parse the agent text as a json-render spec. Returns (fallback_text, spec_or_None)."""
    # Strip markdown code fences if present
    stripped = text.strip()
    stripped = re.sub(r'^```(?:json)?\s*', '', stripped)
    stripped = re.sub(r'\s*```$', '', stripped.strip())
    try:
        obj = json.loads(stripped)
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

    raw = final_text.strip()
    fallback_text, ui_spec = _extract_ui_spec(raw)
    return ChatResponse(response=fallback_text, ui_spec=ui_spec, session_id=session_id)
