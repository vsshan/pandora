# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pandora is an AI-powered investment banking briefing tool. It generates personalized podcast-style audio briefings for client meetings by combining Claude (script generation) and OpenAI TTS (speech synthesis). The app has two briefing modes: a full AI-generated podcast (backend pipeline) and a quick browser-based TTS prep (frontend only).

## Development Commands

```bash
npm run dev          # Vite frontend only (http://localhost:5173)
npm run dev:server   # Express backend only (http://localhost:3001, watch mode)
npm run dev:all      # Both frontend + backend concurrently (normal dev mode)
npm run build        # TypeScript compile + Vite production bundle
npm run preview      # Preview production build
```

No test suite or lint commands are configured. TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) acts as the primary correctness check — run `npm run build` to catch type errors.

## Environment Setup

Copy `.env.example` to `.env` and fill in:
- `ANTHROPIC_API_KEY` — for Claude script generation
- `OPENAI_API_KEY` — for TTS synthesis

## Architecture

### Frontend (`src/`)

React 18 + TypeScript + Tailwind CSS, bundled by Vite. React Router handles two routes:
- `/` → `Home`: company list and favorites
- `/company/:id` → `CompanyProfile`: multi-tab company detail with meeting management

State and side effects are encapsulated in custom hooks:
- `usePodcast` — manages the full AI podcast generation lifecycle (fetch → stream → audio blob → playback)
- `useMeetingPrep` — handles browser-based `SpeechSynthesis` for quick TTS prep

### Backend (`server/`)

Express 5 server with a single meaningful endpoint: `POST /api/podcast/generate`.

The pipeline is two sequential steps in `server/routes/podcast.ts`:
1. `buildScript()` (`server/lib/buildScript.ts`) — sends meeting context to Claude and returns a natural spoken-word script
2. `synthesizeSpeech()` (`server/lib/synthesizeSpeech.ts`) — passes the script to OpenAI TTS (model: `tts-1`, voice: `nova`) and returns an MP3 buffer

The audio buffer streams back to the client as `audio/mpeg`. The frontend receives it, creates a blob URL, and plays it via an HTML5 `<audio>` element.

### Data

`src/data/mockData.ts` contains all company, meeting, news, and insight data. There is no database; the backend receives all context it needs in the POST body.

## Key Conventions

- **Tailwind color tokens** are defined in `tailwind.config.js` (`primary`, `accent`, `secondary`, `dark-*`). Use these tokens rather than arbitrary Tailwind colors. Dark mode uses the `dark:` prefix strategy.
- **TypeScript interfaces** for shared types live in `src/types/`. Add new shared types there.
- Backend runs on `tsx` (TypeScript executor) — no separate compile step needed for server development.
- CORS is configured for `localhost:5173` (dev) and `localhost:4173` (preview) only.
