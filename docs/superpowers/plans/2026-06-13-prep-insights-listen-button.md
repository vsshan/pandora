# Prep Insights Listen Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Listen" button to the Meeting Prep Insights panel that narrates all insights (summary, icebreakers, news, touchpoints) via OpenAI TTS using the existing server pipeline.

**Architecture:** A new server route `POST /api/prep-insights/listen` accepts `PrepInsightsData`, assembles a narration script, calls the existing `synthesizeSpeech` helper, and streams MP3 back. A new frontend hook `usePrepInsightsAudio` manages the audio lifecycle (fetch blob → play/pause/stop). The `MeetingPrepInsights` component gains a listen control row at the top.

**Tech Stack:** Express (server route), OpenAI TTS via existing `synthesizeSpeech`, React hooks, native `Audio` Web API, TypeScript.

---

### Task 1: Server — narration script builder

**Files:**
- Create: `server/lib/buildInsightsNarration.ts`

- [ ] **Step 1: Create the narration builder**

```typescript
// server/lib/buildInsightsNarration.ts
import type { PrepInsightsOutput } from './buildPrepInsights.js';

export function buildInsightsNarration(data: PrepInsightsOutput): string {
  const parts: string[] = [];

  parts.push(`Client Pulse. ${data.summary}`);

  if (data.icebreakers.length > 0) {
    parts.push(
      `Suggested strategies. ${data.icebreakers.map((tip, i) => `${i + 1}. ${tip}`).join(' ')}`
    );
  }

  if (data.news.length > 0) {
    const headlines = data.news
      .map((n) => `${n.headline}, from ${n.source}`)
      .join('. ');
    parts.push(`Market context. ${headlines}.`);
  }

  if (data.interactions.length > 0) {
    const touchpoints = data.interactions
      .map((t) => `${t.date}: ${t.highlight}`)
      .join('. ');
    parts.push(`Recent touchpoints. ${touchpoints}.`);
  }

  return parts.join(' ');
}
```

- [ ] **Step 2: Commit**

```bash
git add server/lib/buildInsightsNarration.ts
git commit -m "feat: add prep insights narration script builder"
```

---

### Task 2: Server — listen route

**Files:**
- Create: `server/routes/prepInsightsListen.ts`
- Modify: `server/routes/prepInsights.ts`

- [ ] **Step 1: Create the listen route**

```typescript
// server/routes/prepInsightsListen.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { synthesizeSpeech } from '../lib/synthesizeSpeech.js';
import { buildInsightsNarration } from '../lib/buildInsightsNarration.js';
import type { PrepInsightsOutput } from '../lib/buildPrepInsights.js';

const router = Router();

router.post('/listen', async (req: Request, res: Response) => {
  try {
    const data = req.body as PrepInsightsOutput;

    if (!data?.summary) {
      res.status(400).json({ error: 'Missing insights data' });
      return;
    }

    const script = buildInsightsNarration(data);
    const audioStream = await synthesizeSpeech(script);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    audioStream.pipe(res);

    audioStream.on('error', (err: Error) => {
      console.error('Insights audio stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Audio stream failed' });
      }
    });
  } catch (err) {
    console.error('Prep insights listen error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate insights audio' });
    }
  }
});

export default router;
```

- [ ] **Step 2: Mount the listen route on the existing prepInsights router**

Open `server/routes/prepInsights.ts` and add the following import and mount at the top/bottom:

```typescript
// server/routes/prepInsights.ts  (full file after edit)
import { Router } from 'express';
import type { Request, Response } from 'express';
import { buildPrepInsights } from '../lib/buildPrepInsights.js';
import listenRouter from './prepInsightsListen.js';

const router = Router();

router.use(listenRouter);

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { meeting, previousMeetings, news, insights, company } = req.body as {
      meeting: {
        title: string;
        date: string;
        typeLabel: string;
        owner: string;
        ownerTitle: string;
        attendees?: string[];
        location?: string;
        description?: string;
      };
      previousMeetings: Array<{
        title: string;
        date: string;
        typeLabel: string;
        owner: string;
        description?: string;
      }>;
      news: Array<{ id: string; headline: string; source: string; date: string; preview?: string }>;
      insights: Array<{ author: string; content: string; date: string }>;
      company: { name: string; sector: string; ceo: string };
    };

    if (!meeting || !company) {
      res.status(400).json({ error: 'Missing required fields: meeting, company' });
      return;
    }

    const data = await buildPrepInsights({
      meeting,
      previousMeetings: previousMeetings ?? [],
      news: news ?? [],
      insights: insights ?? [],
      company,
    });

    res.json(data);
  } catch (err) {
    console.error('Prep insights generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate prep insights' });
    }
  }
});

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/prepInsightsListen.ts server/routes/prepInsights.ts
git commit -m "feat: add prep insights listen route streaming TTS audio"
```

---

### Task 3: Frontend hook — `usePrepInsightsAudio`

**Files:**
- Create: `src/hooks/usePrepInsightsAudio.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/usePrepInsightsAudio.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import type { PrepInsightsData } from '../types/prepInsights';

export type InsightsAudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

const ENDPOINT = '/api/prep-insights/listen';

export function usePrepInsightsAudio() {
  const [status, setStatus] = useState<InsightsAudioStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const play = useCallback(
    async (data: PrepInsightsData) => {
      cleanup();
      setStatus('loading');
      setErrorMessage(null);

      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Server error' }));
          throw new Error(err.error ?? `Server error ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => setStatus('idle');
        audio.onerror = () => {
          setStatus('error');
          setErrorMessage('Playback failed');
        };

        await audio.play();
        setStatus('playing');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [cleanup]
  );

  const pause = useCallback(() => {
    if (audioRef.current && status === 'playing') {
      audioRef.current.pause();
      setStatus('paused');
    }
  }, [status]);

  const resume = useCallback(async () => {
    if (audioRef.current && status === 'paused') {
      await audioRef.current.play();
      setStatus('playing');
    }
  }, [status]);

  const stop = useCallback(() => {
    cleanup();
    setStatus('idle');
    setErrorMessage(null);
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { status, errorMessage, play, pause, resume, stop };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePrepInsightsAudio.ts
git commit -m "feat: add usePrepInsightsAudio hook for TTS playback"
```

---

### Task 4: UI — Listen control in `MeetingPrepInsights`

**Files:**
- Modify: `src/components/MeetingPrepInsights.tsx`

The component receives `data: PrepInsightsData` and `onDismiss: () => void`. We add the hook inside the component and render a listen control row at the very top of the panel.

- [ ] **Step 1: Update `MeetingPrepInsights.tsx`**

Replace the full file with:

```tsx
// src/components/MeetingPrepInsights.tsx
import Icon from './Icon';
import type { PrepInsightsData, PrepSentiment } from '../types/prepInsights';
import { usePrepInsightsAudio } from '../hooks/usePrepInsightsAudio';

interface Props {
  data: PrepInsightsData;
  onDismiss: () => void;
}

function SentimentBadge({ sentiment }: { sentiment: PrepSentiment }) {
  const styles: Record<PrepSentiment, string> = {
    Positive: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
    Urgent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[sentiment]}`}>
      {sentiment} Sentiment
    </span>
  );
}

export default function MeetingPrepInsights({ data, onDismiss }: Props) {
  const audio = usePrepInsightsAudio();

  const handleListenClick = () => {
    if (audio.status === 'idle' || audio.status === 'error') {
      audio.play(data);
    } else if (audio.status === 'playing') {
      audio.pause();
    } else if (audio.status === 'paused') {
      audio.resume();
    }
  };

  const listenLabel = () => {
    if (audio.status === 'loading') return 'Preparing audio…';
    if (audio.status === 'playing') return 'Pause';
    if (audio.status === 'paused') return 'Resume';
    if (audio.status === 'error') return 'Retry';
    return 'Listen';
  };

  return (
    <div className="mt-2 space-y-3 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-4 shadow-inner">

      {/* Listen control */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleListenClick}
          disabled={audio.status === 'loading'}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            audio.status === 'loading'
              ? 'bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent cursor-not-allowed'
              : audio.status === 'playing'
              ? 'bg-primary dark:bg-accent text-white shadow-sm hover:opacity-90'
              : audio.status === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
              : 'bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent hover:bg-primary/20 dark:hover:bg-accent/20'
          }`}
        >
          {audio.status === 'loading' && (
            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
          )}
          {audio.status === 'playing' && <Icon name="pause" className="text-base shrink-0" />}
          {audio.status === 'paused' && <Icon name="play_arrow" filled className="text-base shrink-0" />}
          {audio.status === 'error' && <Icon name="refresh" className="text-base shrink-0" />}
          {(audio.status === 'idle') && <Icon name="volume_up" className="text-base shrink-0" />}
          <span>{listenLabel()}</span>
        </button>

        {(audio.status === 'playing' || audio.status === 'paused') && (
          <button
            type="button"
            onClick={audio.stop}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Icon name="stop" className="text-base shrink-0" />
            Stop
          </button>
        )}

        {audio.status === 'error' && audio.errorMessage && (
          <p className="text-xs text-red-500">{audio.errorMessage}</p>
        )}
      </div>

      {/* 1. AI Insight Brief — Client Pulse */}
      <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-widest text-text-light-secondary dark:text-text-dark-secondary">
              AI Insight Brief
            </p>
            <SentimentBadge sentiment={data.sentiment} />
          </div>
          <h3 className="text-base font-bold text-text-light-primary dark:text-text-dark-primary">
            Client Pulse
          </h3>
        </div>
        <div className="px-4 pb-4">
          <p className="text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
            {data.summary}
          </p>
        </div>
      </div>

      {/* 2. Suggested Strategies */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <Icon name="lightbulb" filled className="text-accent text-lg" />
          <h4 className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
            Suggested Strategies
          </h4>
        </div>
        <div className="space-y-2">
          {data.icebreakers.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 overflow-hidden rounded-xl bg-card-light dark:bg-card-dark px-4 py-3 shadow-sm"
            >
              <Icon name="bolt" filled className="text-primary dark:text-accent text-lg shrink-0 mt-0.5" />
              <p className="text-sm text-text-light-primary dark:text-text-dark-primary leading-snug">
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Market Context */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <Icon name="newspaper" className="text-accent text-lg" />
          <h4 className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
            Market Context
          </h4>
        </div>
        <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm divide-y divide-border-light dark:divide-border-dark">
          {data.news.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary leading-snug">
                  {item.headline}
                </p>
                <p className="mt-0.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  {item.source}
                </p>
              </div>
              <Icon name="trending_up" className="text-accent text-base shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Last 3 Touchpoints */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <Icon name="chat_bubble" filled className="text-accent text-lg" />
          <h4 className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
            Last 3 Touchpoints
          </h4>
        </div>
        <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm divide-y divide-border-light dark:divide-border-dark">
          {data.interactions.map((item, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-0.5">
                {item.date}
              </p>
              <p className="text-sm text-text-light-primary dark:text-text-dark-primary leading-snug">
                {item.highlight}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => { audio.stop(); onDismiss(); }}
        className="w-full rounded-xl border border-border-light dark:border-border-dark py-2.5 text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary hover:bg-card-light dark:hover:bg-card-dark transition-colors"
      >
        Close Insights
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MeetingPrepInsights.tsx
git commit -m "feat: add listen button to MeetingPrepInsights panel"
```

---

### Self-Review

**Spec coverage:**
- ✅ Server route `POST /api/prep-insights/listen` — Task 2
- ✅ Narration assembles summary → icebreakers → news → touchpoints — Task 1
- ✅ Uses existing `synthesizeSpeech` (OpenAI TTS, `nova` voice) — Task 2
- ✅ `usePrepInsightsAudio` hook with idle/loading/playing/paused/error states — Task 3
- ✅ Blob URL cleanup on unmount — Task 3
- ✅ Listen button at top of insights panel with play/pause/resume/stop — Task 4
- ✅ Loading spinner + "Preparing audio…" — Task 4
- ✅ Error state with message + retry — Task 4
- ✅ Stop also fires on dismiss — Task 4

**Placeholder scan:** No TBDs, TODOs, or vague steps found.

**Type consistency:**
- `PrepInsightsData` is imported from `../types/prepInsights` in both the hook and component — matches existing type.
- `PrepInsightsOutput` used in the server listen route matches the exported interface in `buildPrepInsights.ts`.
- `InsightsAudioStatus` defined in hook, used only within hook (status is returned as the union type).
- `audio.play(data)` in component matches `play(data: PrepInsightsData)` signature in hook.
- `audio.stop` called in dismiss handler — matches `stop: () => void` returned from hook.
