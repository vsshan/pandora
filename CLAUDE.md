# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pandora is an AI-powered investment banking CRM — a mobile-first React SPA that helps bankers prepare for client meetings by generating AI-powered podcast briefings (Claude script → OpenAI TTS audio), structured meeting prep insights (Claude tool-use → JSON analysis), and a conversational CRM chatbot (Google ADK agent + Raphtory graph).

## Commands

```bash
# Install Node dependencies
npm install

# Development (Node + React together)
npm run dev:all          # Frontend (port 5173) + Express API (port 3001)
npm run dev              # Frontend only
npm run dev:server       # Express server only

# Build & deploy
npm run build            # tsc + vite build → dist/
npm run deploy           # build + wrangler pages deploy dist

# Python ADK agent service (separate process, required for chatbot)
cd agent
pip install -r requirements.txt
python -m agent.graph.ingest          # One-time: generate mock data + build Raphtory graph
uvicorn agent.main:app --port 8000 --reload   # Start agent service on port 8000
```

There are **no tests**. TypeScript compilation (`tsc`) is the only validation step.

## Architecture

### Dual Deployment Model

The project runs differently in dev vs. production:

- **Local dev**: React dev server (Vite) + Express server (`server/`) with a proxy in `vite.config.ts` forwarding `/api/*` to `localhost:3001`
- **Production**: Cloudflare Pages (static React build) + Cloudflare Pages Functions (`functions/`) as serverless handlers

When modifying API logic, changes must be made in **both** `server/routes/` (Express) and `functions/api/` (Cloudflare Workers), as they share the same business logic from `server/lib/` but have different request/response wrappers.

### AI Pipeline

Three core flows:

1. **Podcast**: `POST /api/podcast/generate` → `server/lib/buildScript.ts` (Claude generates briefing script) → `server/lib/synthesizeSpeech.ts` (OpenAI TTS, voice: "nova", model: "tts-1") → MP3 audio stream returned to client
2. **Prep Insights**: `POST /api/prep-insights/generate` → `server/lib/buildPrepInsights.ts` (Claude with tool-use for structured JSON output) → insights JSON returned to client
3. **CRM Chatbot**: `POST /api/chat/message` → Express proxies to Python ADK service (`:8000`) → Google ADK agent (Claude via LiteLLM) queries Raphtory graph → conversational answer returned

### CRM Chatbot Architecture

```
React ChatWidget → /api/chat/message (Express) → FastAPI (port 8000)
                                                       └── Google ADK Agent (Claude Haiku via LiteLLM)
                                                            └── 7 function tools → Raphtory graph (on-disk)
```

The Python agent lives in `agent/`:
- `agent/agent.py` — ADK `root_agent` with 7 graph query tools; graph loaded as singleton at startup
- `agent/main.py` — FastAPI app with `POST /chat` and `GET /health`; uses `InMemorySessionService` for multi-turn sessions
- `agent/graph/schema.py` — Raphtory vertex/edge type constants for 6 domains
- `agent/graph/mock_data.py` — Faker-based generators for 50K contacts, 50K interactions, 500 deals, etc.
- `agent/graph/ingest.py` — Builds and saves `pandora_graph.bin` (run once before starting the service)

The ADK model string is `litellm/anthropic/claude-haiku-4-5-20251001` — change it in `agent/agent.py` to swap models. The `ANTHROPIC_API_KEY` from the root `.env` is reused; copy it to `agent/.env` as well.

### Raphtory Graph Schema

Vertex types: `Contact`, `Banker`, `Deal`, `Campaign`, `Event`, `Nomination`

Key edge types (all timestamped for temporal queries):
- `INTERACTED_WITH`: Banker → Contact (50K edges, one per logged interaction)
- `MANAGING_DEAL`: Banker → Deal; `IN_DEAL`: Contact → Deal
- `IN_CAMPAIGN`: Contact → Campaign
- `ATTENDED_EVENT`: Contact → Event; `HOSTED_EVENT`: Banker → Event
- `NOMINATED_FOR`: Contact → Nomination; `SUBMITTED_NOMINATION`: Banker → Nomination

### Frontend State

Each AI feature has a dedicated React hook managing state lifecycle:
- `src/hooks/usePodcast.ts` — podcast generation, playback state, audio blob URL
- `src/hooks/usePrepInsights.ts` — insights generation, display toggle, session caching
- `src/hooks/useChat.ts` — chat messages array, session_id, loading state

`ChatWidget` is rendered globally in `App.tsx` (outside `<Routes>`) as a fixed floating widget (bottom-right corner).

Data for the podcast/insights features is mock-only (`src/data/mockData.ts`). The chatbot uses the Raphtory graph.

### Key Types

- `src/types/podcast.ts` — `PodcastSession`, `PodcastStatus`
- `src/types/prepInsights.ts` — `PrepInsightsSession`, `PrepInsightsData` (mirrors Claude tool-use output schema)
- `src/types/chat.ts` — `ChatMessage`, `ChatSession`

## Environment Variables

Root `.env` (copy from `.env.example`):
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
PORT=3001
AGENT_SERVICE_URL=http://localhost:8000
```

`agent/.env` (copy from `agent/.env.example`):
```
ANTHROPIC_API_KEY=      # same key as root .env
```

In production, set all variables in the Cloudflare Pages dashboard. The Cloudflare Functions runtime reads them from the `env` parameter (Workers pattern), not `process.env`. The `AGENT_SERVICE_URL` in production should point to a deployed Python service.

## Conventions

- **Styling**: Tailwind CSS only — no CSS modules or styled-components. Custom colors/tokens are in `tailwind.config.js`. Dark mode uses the `class` strategy.
- **Icons**: Google Material Symbols via the `Icon` component wrapper (`src/components/Icon.tsx`)
- **TypeScript**: Strict mode with `noUnusedLocals` and `noUnusedParameters` — unused imports/variables are compile errors
- **No linter**: No ESLint or Prettier configured; TypeScript strict mode is the sole code quality gate
- **Routing**: React Router v6, two routes: `/` (Home) and `/company/:id` (CompanyProfile)
