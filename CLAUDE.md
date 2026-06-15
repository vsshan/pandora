# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pandora is an AI-powered investment banking CRM — a mobile-first React SPA that helps bankers prepare for client meetings by generating AI-powered podcast briefings (Claude script → OpenAI TTS audio) and structured meeting prep insights (Claude tool-use → JSON analysis).

## Commands

```bash
# Install dependencies
npm install

# Development (run both together)
npm run dev:all          # Frontend (port 5173) + Express API (port 3001)
npm run dev              # Frontend only
npm run dev:server       # Express server only

# Build & deploy
npm run build            # tsc + vite build → dist/
npm run deploy           # build + wrangler pages deploy dist
```

There are **no tests**. TypeScript compilation (`tsc`) is the only validation step.

## Architecture

### Dual Deployment Model

The project runs differently in dev vs. production:

- **Local dev**: React dev server (Vite) + Express server (`server/`) with a proxy in `vite.config.ts` forwarding `/api/*` to `localhost:3001`
- **Production**: Cloudflare Pages (static React build) + Cloudflare Pages Functions (`functions/`) as serverless handlers

When modifying API logic, changes must be made in **both** `server/routes/` (Express) and `functions/api/` (Cloudflare Workers), as they share the same business logic from `server/lib/` but have different request/response wrappers.

### AI Pipeline

Two core flows, each with a shared lib module:

1. **Podcast**: `POST /api/podcast/generate` → `server/lib/buildScript.ts` (Claude generates briefing script) → `server/lib/synthesizeSpeech.ts` (OpenAI TTS, voice: "nova", model: "tts-1") → MP3 audio stream returned to client
2. **Prep Insights**: `POST /api/prep-insights/generate` → `server/lib/buildPrepInsights.ts` (Claude with tool-use for structured JSON output) → insights JSON returned to client

Both use streaming/async patterns. Claude model and OpenAI TTS model are configured inside the respective lib files.

### Frontend State

Each AI feature has a dedicated React hook managing state lifecycle:
- `src/hooks/usePodcast.ts` — podcast generation, playback state, audio blob URL
- `src/hooks/usePrepInsights.ts` — insights generation, display toggle, session caching

Data is mock-only (`src/data/mockData.ts`). There is no real backend database or CRM integration — all company/meeting/news data is hardcoded.

### Key Types

- `src/types/podcast.ts` — `PodcastSession`, `PodcastStatus`
- `src/types/prepInsights.ts` — `PrepInsightsSession`, `PrepInsightsData` (mirrors Claude tool-use output schema)

## Environment Variables

Required in `.env` (copy from `.env.example`):
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
PORT=3001
```

In production, set these in the Cloudflare Pages dashboard. The Cloudflare Functions runtime reads them from `env` parameter (Workers pattern), not `process.env`.

## Conventions

- **Styling**: Tailwind CSS only — no CSS modules or styled-components. Custom colors/tokens are in `tailwind.config.js`. Dark mode uses the `class` strategy.
- **Icons**: Google Material Symbols via the `Icon` component wrapper (`src/components/Icon.tsx`)
- **TypeScript**: Strict mode with `noUnusedLocals` and `noUnusedParameters` — unused imports/variables are compile errors
- **No linter**: No ESLint or Prettier configured; TypeScript strict mode is the sole code quality gate
- **Routing**: React Router v6, two routes: `/` (Home) and `/company/:id` (CompanyProfile)
