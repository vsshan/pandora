# Meeting Prep Podcast — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-tap podcast experience to upcoming meeting cards that reads the banker a structured audio brief (meeting details, action items, past interactions, news/insights) using the browser's Web Speech API.

**Architecture:** A `useMeetingPrep` hook assembles a script from mock data and drives `window.speechSynthesis`. A `MeetingPrepPlayer` component renders the inline duration picker and player controls inside the meeting card. `CompanyProfile.tsx` wires the button and player into the existing `MeetingsTab`.

**Tech Stack:** React 18, TypeScript 5, Tailwind CSS 3, Web Speech API (`window.speechSynthesis`), Vite 5

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/data/mockData.ts` | Modify | Add `actionItems` to `Meeting`, `isoDate` to `NewsItem`/`Insight`, populate mock data |
| `src/hooks/useMeetingPrep.ts` | Create | Script assembly + speech synthesis state machine |
| `src/components/MeetingPrepPlayer.tsx` | Create | Duration picker + player UI (receives state from hook) |
| `src/pages/CompanyProfile.tsx` | Modify | Wire prep button + player into `MeetingsTab` |

---

## Task 1: Extend mock data types and populate fixtures

**Files:**
- Modify: `src/data/mockData.ts`

- [ ] **Step 1: Add `actionItems` to the `Meeting` interface**

In `src/data/mockData.ts`, change the `Meeting` interface from:
```ts
export interface Meeting {
  id: string;
  date: string;
  title: string;
  type: 'internal' | 'client-call' | 'client-meeting' | 'no-visibility';
  typeLabel: string;
  typeIcon: string;
  owner: string;
  ownerTitle: string;
  hasAlert?: boolean;
}
```
To:
```ts
export interface Meeting {
  id: string;
  date: string;
  title: string;
  type: 'internal' | 'client-call' | 'client-meeting' | 'no-visibility';
  typeLabel: string;
  typeIcon: string;
  owner: string;
  ownerTitle: string;
  hasAlert?: boolean;
  actionItems?: string[];
}
```

- [ ] **Step 2: Add `isoDate` to `NewsItem` and `Insight` interfaces**

Change `NewsItem` from:
```ts
export interface NewsItem {
  id: string;
  source: string;
  headline: string;
  preview: string;
  date: string;
  imageUrl?: string;
}
```
To:
```ts
export interface NewsItem {
  id: string;
  source: string;
  headline: string;
  preview: string;
  date: string;
  isoDate: string;
  imageUrl?: string;
}
```

Change `Insight` from:
```ts
export interface Insight {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  date: string;
  source?: string;
}
```
To:
```ts
export interface Insight {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  date: string;
  isoDate: string;
  source?: string;
}
```

- [ ] **Step 3: Add `actionItems` to `previousMeetings` mock data**

Change `previousMeetings` from:
```ts
export const previousMeetings: Meeting[] = [
  {
    id: '4',
    date: 'Oct 26, 2023',
    title: 'Introductory Pitch',
    type: 'client-meeting',
    typeLabel: 'Client Meeting',
    typeIcon: 'business_center',
    owner: 'Michael Chen',
    ownerTitle: 'Associate',
  },
  {
    id: '5',
    date: 'Oct 19, 2023',
    title: 'Follow-up on M&A Proposal',
    type: 'client-call',
    typeLabel: 'Client Call',
    typeIcon: 'phone',
    owner: 'Sarah Jenkins',
    ownerTitle: 'Vice President',
  },
];
```
To:
```ts
export const previousMeetings: Meeting[] = [
  {
    id: '4',
    date: 'Oct 26, 2023',
    title: 'Introductory Pitch',
    type: 'client-meeting',
    typeLabel: 'Client Meeting',
    typeIcon: 'business_center',
    owner: 'Michael Chen',
    ownerTitle: 'Associate',
    actionItems: ['Send updated pitch deck by Nov 1', 'Introduce CFO to Michael Chen'],
  },
  {
    id: '5',
    date: 'Oct 19, 2023',
    title: 'Follow-up on M&A Proposal',
    type: 'client-call',
    typeLabel: 'Client Call',
    typeIcon: 'phone',
    owner: 'Sarah Jenkins',
    ownerTitle: 'Vice President',
    actionItems: ['Share comparable transaction analysis', 'Schedule follow-up with legal team'],
  },
];
```

- [ ] **Step 4: Add `isoDate` to `companyNews` and `companyInsights`**

Change `companyNews` to (use recent dates so the 15-min brief picks them up — set at least 2 within 14 days of 2026-04-09, i.e. on or after 2026-03-26):
```ts
export const companyNews: NewsItem[] = [
  {
    id: '1',
    source: 'TechCrunch',
    headline: 'Innovatech Solutions Secures $200M in Series D Funding',
    preview: 'The new funding round, led by...',
    date: 'Apr 07, 2026',
    isoDate: '2026-04-07',
  },
  {
    id: '2',
    source: 'Bloomberg',
    headline: 'CEO Eleanor Vance on the Future of Enterprise AI',
    preview: 'An in-depth interview on strategy...',
    date: 'Apr 02, 2026',
    isoDate: '2026-04-02',
  },
  {
    id: '3',
    source: 'Reuters',
    headline: 'Innovatech Launches New Predictive Analytics Suite',
    preview: 'The platform aims to revolutionize...',
    date: 'Mar 15, 2026',
    isoDate: '2026-03-15',
  },
];
```

Change `companyInsights` to:
```ts
export const companyInsights: Insight[] = [
  {
    id: '1',
    author: 'Sarah Jenkins',
    authorAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpE1D4t_KnB_qLPjHc6QAulkt3a99GWH9HsFrrixeQXEs4G5P9stUqlreNfGh6GaV7pKfrfUsuWMdQ1kg4SzPTKKAb0GT5he8bDTE1E2kdkFviyW8esRhY3l6krLW-gQTx-EBR8vWjNUBOGwleAwKnnLFUMxh0QOhLmm9isg9kPW8-unyjeHYDx9RVznNfCG339sbUeJmNG4y05ijO8jLjH17VmryrLfY-wajYp6qu97WmFh5YkzBgl3iEMQB2QdbKuv57-OzR5QOV',
    content:
      "Deep dive on Innovatech's latest 10-K filing. Key takeaway: margin expansion is accelerating faster than anticipated.",
    date: 'Apr 05, 2026',
    isoDate: '2026-04-05',
  },
  {
    id: '2',
    author: 'James Harrison',
    authorAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCXPog53vUjhxSAxc8AF_HZ7k0xxQhxgPHfOYet7qTUdGkOjLNyVejHGi6qcdzxlfoc1czpGdzrz7SELio5e04dGtOlxPcktFu7SVPHnlle0RyurddlmFG8rdOccIPgyBbqqzSqbO58rJ3oGdBt03JNyS6NGB7bGV7OjZNdMzCt93vPPTpF3Yv5DrTxFc9uiWr00L6hTvwaoR6-j_QKhG4Ia3gdDKG4neL2FKT3t1iz1Yah5c-58i5DZVFb3sz0bEUw1TpBvQMJqzPS',
    content:
      'Analysis of recent executive commentary suggests a major product announcement is imminent. Potential M&A target?',
    date: 'Mar 28, 2026',
    isoDate: '2026-03-28',
  },
];
```

- [ ] **Step 5: Verify the app still compiles**

Run: `npm run build`

Expected: Build succeeds with no TypeScript errors. (The `homeNews` and `homeInsights` arrays don't have `isoDate` yet — TypeScript will complain. Fix by adding `isoDate: ''` to each entry in `homeNews` and `homeInsights`.)

Add `isoDate: ''` to every item in `homeNews`:
```ts
export const homeNews: NewsItem[] = [
  { id: '1', source: 'Bloomberg', headline: "Oracle's Cloud Division Posts Record Growth", preview: '', date: 'Oct 26, 2023', isoDate: '', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2cpmtQdb4AyauOeUXXIn5Oj1ODi-RlhFClBW6dT9LdaJJDno_xXpIBKRctVEkmNanBPxlQhuOyr_EYyVZe2X6dKPsEEUa2DoM-Au4QX3d7X17f37FACq7QFNcmecWn33QyFL91p0c123xGtDVSnYqgyYuvVS6wV-6_GvYPCT8L-XQmEQ0NuYYiszQNPrjlcaxjVMGXgAtTZ0znYagIM3piJqV9Aeuty6h-b1K7g9oFe5ZFAsDxvwrZ7szqRAqVwnGVTBWzdY5CBTY' },
  { id: '2', source: 'Reuters', headline: 'Salesforce Unveils New AI-Powered CRM Features', preview: '', date: 'Oct 25, 2023', isoDate: '', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZMnnuPAli2YJgsvebzys3Vlq6ro94biPDxudflMKD_cNbDTAtToL1dq5YegrR-UXlFK7EYmNGklCtsp3IYEyjSIiLqjAhn2jpV_osheNfDBarG7a4Gq_ahnxkq3FbZufu9J15rVW7Mca2Evmgs-MAk9jTNEjJgLum-Njg_WxFuk2CGQ7MlVUsl8_Uk3nJYk3Xn1c_EL_xTsEQOj9oP4kYyTt9Vf0Z7A_sukStbp_a7OTIGIKQIoxvVEGFqveL83JShCTN_hUNkeTl' },
  { id: '3', source: 'Wall Street Journal', headline: "Adobe's Acquisition of Figma Faces Regulatory Scrutiny", preview: '', date: 'Oct 24, 2023', isoDate: '', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCW49494qFEVZ-OIVJFHFPT9Vq7Ijyouh3-rKjU6DT5s9c_EkJIlqnP0tS4SImrej3xBivsN4vZ9MIO_mYitAFrBFqZyVwayCFUqTO7nu9c8mmESyVQyuwxnW0yxz-LFACIjiNHdku9xqH75-DdYVDXJZWjI_CLARgP6h3ax_fDGsG82DC6dpDUnOdxxtlk1a-1ewdW5T96nlOIs7G-aTsFRM4AxhP06g-BaV7bk6PszeeITAPw0xsCHtdKC1QdB6kZKztpciA5gVkr' },
];
```

Add `isoDate: ''` to every item in `homeInsights`:
```ts
export const homeInsights: Insight[] = [
  { id: '1', author: 'Internal Analyst', content: "Recent M&A Activity in the Tech Sector", date: '', isoDate: '', source: 'Internal Analyst' },
  { id: '2', author: 'Market Research Team', content: 'Competitive Landscape Analysis: CRM', date: '', isoDate: '', source: 'Market Research Team' },
  { id: '3', author: 'Sector Specialist', content: 'Digital Media Subscription Trends', date: '', isoDate: '', source: 'Sector Specialist' },
];
```

Run: `npm run build` again — should pass with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/data/mockData.ts
git commit -m "feat: extend Meeting, NewsItem, Insight types for meeting prep feature"
```

---

## Task 2: Create `useMeetingPrep` hook

**Files:**
- Create: `src/hooks/useMeetingPrep.ts`

This hook assembles the podcast script from mock data and drives `window.speechSynthesis`. It exposes the player state and control functions.

- [ ] **Step 1: Create the hook file**

Create `src/hooks/useMeetingPrep.ts` with the following content:

```ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { Meeting, companyNews, companyInsights, previousMeetings } from '../data/mockData';

export type PrepDuration = 5 | 10 | 15;

export interface ScriptSection {
  sectionName: string;
  text: string;
}

export interface PrepPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSectionIndex: number;
  currentSectionName: string;
  elapsed: number;       // seconds
  total: number;         // seconds (estimated from duration choice)
  sections: ScriptSection[];
}

const DURATION_TOTALS: Record<PrepDuration, number> = { 5: 300, 10: 600, 15: 900 };

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function buildScript(meeting: Meeting, duration: PrepDuration): ScriptSection[] {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const sections: ScriptSection[] = [];

  // Section 1: Meeting details (always included)
  sections.push({
    sectionName: 'Meeting Details',
    text: `Your next meeting is ${meeting.title}, scheduled for ${meeting.date}. 
           Meeting type: ${meeting.typeLabel}. 
           Led by ${meeting.owner}, ${meeting.ownerTitle}.`,
  });

  // Section 2: Action items (always included)
  const recentPast = previousMeetings.filter((m) => {
    if (!m.actionItems?.length) return false;
    const d = new Date(m.date);
    return d >= threeMonthsAgo;
  });
  const allActionItems = recentPast.flatMap((m) => m.actionItems ?? []);
  if (allActionItems.length > 0) {
    sections.push({
      sectionName: 'Action Items',
      text: `You have ${allActionItems.length} outstanding action item${allActionItems.length > 1 ? 's' : ''} from recent meetings. 
             ${allActionItems.map((a, i) => `Item ${i + 1}: ${a}`).join('. ')}.`,
    });
  } else {
    sections.push({
      sectionName: 'Action Items',
      text: 'There are no outstanding action items from recent meetings.',
    });
  }

  // Section 3: Past interactions summary (10 and 15 min only)
  if (duration >= 10) {
    const pastInteractions = previousMeetings.filter((m) => {
      const d = new Date(m.date);
      return d >= threeMonthsAgo;
    });
    if (pastInteractions.length > 0) {
      const summary = pastInteractions
        .map((m) => `${m.title} on ${m.date} with ${m.owner}`)
        .join('; ');
      sections.push({
        sectionName: 'Past Interactions',
        text: `Over the past 3 months you have had ${pastInteractions.length} interaction${pastInteractions.length > 1 ? 's' : ''} with this client. 
               ${summary}.`,
      });
    } else {
      sections.push({
        sectionName: 'Past Interactions',
        text: 'There are no recorded interactions with this client in the past 3 months.',
      });
    }
  }

  // Section 4: News and insights (15 min only)
  if (duration >= 15) {
    const recentNews = companyNews.filter((n) => {
      if (!n.isoDate) return false;
      return new Date(n.isoDate) >= twoWeeksAgo;
    });
    const recentInsights = companyInsights.filter((ins) => {
      if (!ins.isoDate) return false;
      return new Date(ins.isoDate) >= twoWeeksAgo;
    });

    const newsText = recentNews.length > 0
      ? `Recent news: ${recentNews.map((n) => `${n.source} reports: ${n.headline}`).join('. ')}.`
      : 'No recent news in the past two weeks.';

    const insightsText = recentInsights.length > 0
      ? `Team insights: ${recentInsights.map((ins) => `${ins.author} notes: ${ins.content}`).join('. ')}.`
      : 'No recent team insights in the past two weeks.';

    sections.push({
      sectionName: 'News & Insights',
      text: `${newsText} ${insightsText}`,
    });
  }

  return sections;
}

export function useMeetingPrep(meeting: Meeting | null) {
  const [state, setState] = useState<PrepPlayerState>({
    isPlaying: false,
    isPaused: false,
    currentSectionIndex: 0,
    currentSectionName: '',
    elapsed: 0,
    total: 0,
    sections: [],
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionIndexRef = useRef(0);
  const sectionsRef = useRef<ScriptSection[]>([]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((total: number) => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setState((prev) => {
        const next = prev.elapsed + 1;
        if (next >= total) {
          stopTimer();
          return { ...prev, elapsed: total, isPlaying: false, isPaused: false };
        }
        return { ...prev, elapsed: next };
      });
    }, 1000);
  }, [stopTimer]);

  const speakSection = useCallback((sections: ScriptSection[], index: number, total: number, elapsed: number) => {
    if (index >= sections.length) {
      stopTimer();
      setState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
      return;
    }
    const section = sections[index];
    const utterance = new SpeechSynthesisUtterance(section.text);
    utterance.rate = 0.95;
    utterance.onstart = () => {
      sectionIndexRef.current = index;
      setState((prev) => ({
        ...prev,
        currentSectionIndex: index,
        currentSectionName: section.sectionName,
        isPlaying: true,
        isPaused: false,
      }));
    };
    utterance.onend = () => {
      speakSection(sections, index + 1, total, elapsed);
    };
    window.speechSynthesis.speak(utterance);
  }, [stopTimer]);

  const start = useCallback((duration: PrepDuration) => {
    if (!meeting) return;
    window.speechSynthesis.cancel();
    stopTimer();

    const sections = buildScript(meeting, duration);
    const total = DURATION_TOTALS[duration];
    sectionsRef.current = sections;
    sectionIndexRef.current = 0;

    setState({
      isPlaying: false,
      isPaused: false,
      currentSectionIndex: 0,
      currentSectionName: sections[0]?.sectionName ?? '',
      elapsed: 0,
      total,
      sections,
    });

    startTimer(total);
    speakSection(sections, 0, total, 0);
  }, [meeting, stopTimer, startTimer, speakSection]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    stopTimer();
    setState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
  }, [stopTimer]);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setState((prev) => {
      startTimer(prev.total);
      return { ...prev, isPlaying: true, isPaused: false };
    });
  }, [startTimer]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    stopTimer();
    setState({
      isPlaying: false,
      isPaused: false,
      currentSectionIndex: 0,
      currentSectionName: '',
      elapsed: 0,
      total: 0,
      sections: [],
    });
  }, [stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopTimer();
    };
  }, [stopTimer]);

  return { state, start, pause, resume, stop, formatElapsed };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`

Expected: No TypeScript errors. If you see "Property 'isoDate' does not exist" it means Task 1 was not completed first — complete Task 1 before this task.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useMeetingPrep.ts
git commit -m "feat: add useMeetingPrep hook for script assembly and speech synthesis"
```

---

## Task 3: Create `MeetingPrepPlayer` component

**Files:**
- Create: `src/components/MeetingPrepPlayer.tsx`

This component receives the player state and control callbacks from `useMeetingPrep`. It renders in two phases: duration picker, then the active player.

- [ ] **Step 1: Create the component file**

Create `src/components/MeetingPrepPlayer.tsx`:

```tsx
import { PrepDuration, PrepPlayerState } from '../hooks/useMeetingPrep';

interface MeetingPrepPlayerProps {
  state: PrepPlayerState;
  onStart: (duration: PrepDuration) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  formatElapsed: (seconds: number) => string;
}

const DURATIONS: PrepDuration[] = [5, 10, 15];

export default function MeetingPrepPlayer({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
  formatElapsed,
}: MeetingPrepPlayerProps) {
  const isActive = state.isPlaying || state.isPaused || state.sections.length > 0;
  const progressPercent = state.total > 0 ? (state.elapsed / state.total) * 100 : 0;

  return (
    <div className="mt-3 border-t border-border-light dark:border-border-dark pt-3">
      {/* Header label */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm">🎧</span>
        <p className="text-xs font-bold uppercase tracking-wide text-accent">Meeting Prep</p>
      </div>

      {!isActive ? (
        /* Duration picker */
        <div>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Choose brief duration:
          </p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => onStart(d)}
                className="flex-1 rounded-lg border border-accent py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white dark:hover:text-primary transition-colors"
              >
                {d} min
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Active player */
        <div>
          {/* Section label */}
          <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Now: <span className="text-primary dark:text-accent">{state.currentSectionName}</span>
          </p>

          {/* Progress bar */}
          <div className="relative h-1.5 w-full rounded-full bg-border-light dark:bg-border-dark overflow-hidden mb-1">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-accent transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Time stamps */}
          <div className="flex justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary mb-3">
            <span>{formatElapsed(state.elapsed)}</span>
            <span>{formatElapsed(state.total)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {state.isPlaying ? (
              <button
                onClick={onPause}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 dark:bg-accent/10 py-2 text-sm font-semibold text-primary dark:text-accent"
              >
                <span>⏸</span> Pause
              </button>
            ) : (
              <button
                onClick={onResume}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 dark:bg-accent/10 py-2 text-sm font-semibold text-primary dark:text-accent"
              >
                <span>▶</span> Resume
              </button>
            )}
            <button
              onClick={onStop}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 py-2 text-sm font-semibold text-red-600 dark:text-red-400"
            >
              <span>⏹</span> Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MeetingPrepPlayer.tsx
git commit -m "feat: add MeetingPrepPlayer component with duration picker and player controls"
```

---

## Task 4: Wire Meeting Prep into `MeetingsTab` in `CompanyProfile.tsx`

**Files:**
- Modify: `src/pages/CompanyProfile.tsx`

Add the "🎧 Meeting Prep" button to each upcoming meeting card, and render `MeetingPrepPlayer` when a card is selected.

- [ ] **Step 1: Add imports to `CompanyProfile.tsx`**

At the top of `src/pages/CompanyProfile.tsx`, add to the existing import block:

```tsx
import MeetingPrepPlayer from '../components/MeetingPrepPlayer';
import { useMeetingPrep } from '../hooks/useMeetingPrep';
```

The full import block should look like:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import MeetingPrepPlayer from '../components/MeetingPrepPlayer';
import { useMeetingPrep } from '../hooks/useMeetingPrep';
import {
  innovatech,
  recentActivity,
  companyNews,
  companyInsights,
  upcomingMeetings,
  previousMeetings,
} from '../data/mockData';
```

- [ ] **Step 2: Update `MeetingsTab` to track which card is expanded and use the hook**

Replace the entire `MeetingsTab` function (lines 266–401 in the original file) with:

```tsx
function MeetingsTab() {
  const [filter, setFilter] = useState<MeetingFilter>('upcoming');
  const [search, setSearch] = useState('');
  const [activePrepId, setActivePrepId] = useState<string | null>(null);

  const activeMeeting =
    activePrepId != null
      ? upcomingMeetings.find((m) => m.id === activePrepId) ?? null
      : null;

  const { state: prepState, start, pause, resume, stop, formatElapsed } = useMeetingPrep(activeMeeting);

  const meetings = filter === 'upcoming' ? upcomingMeetings : previousMeetings;

  const filtered = meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.owner.toLowerCase().includes(search.toLowerCase())
  );

  const meetingTypeColors: Record<string, string> = {
    internal: 'bg-primary/10 text-primary dark:bg-primary/20',
    'client-call': 'bg-accent/10 text-accent dark:bg-accent/20',
    'client-meeting': 'bg-secondary/10 text-secondary dark:bg-secondary/20',
    'no-visibility': 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  };

  function handlePrepClick(meetingId: string) {
    if (activePrepId === meetingId) {
      // Collapse if already open and not playing
      if (!prepState.isPlaying && !prepState.isPaused) {
        setActivePrepId(null);
      }
    } else {
      stop();
      setActivePrepId(meetingId);
    }
  }

  function handleStop() {
    stop();
    setActivePrepId(null);
  }

  return (
    <main className="flex-1 pb-24">
      {/* Search */}
      <div className="p-4">
        <div className="relative flex items-center">
          <Icon
            name="search"
            className="absolute left-3 text-text-light-secondary dark:text-text-dark-secondary"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings..."
            className="w-full rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark py-2.5 pl-10 pr-10 text-sm text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm"
          />
          <button className="absolute right-3 text-text-light-secondary dark:text-text-dark-secondary">
            <Icon name="tune" />
          </button>
        </div>
      </div>

      {/* Upcoming / Previous Toggle */}
      <div className="px-4">
        <div className="flex rounded-lg bg-background-light dark:bg-background-dark/50 p-1 gap-1">
          {[
            { id: 'upcoming' as MeetingFilter, label: 'Upcoming' },
            { id: 'previous' as MeetingFilter, label: 'Previous' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-card-light dark:bg-card-dark text-primary dark:text-text-dark-primary shadow-sm'
                  : 'text-text-light-secondary dark:text-text-dark-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Meeting List */}
      <div className="mt-4 space-y-3 px-4">
        {filtered.map((meeting) => (
          <div
            key={meeting.id}
            className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm"
          >
            <div className="p-4">
              <p className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-2">
                {meeting.date}
              </p>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <h4 className="text-base font-bold text-text-light-primary dark:text-text-dark-primary">
                    {meeting.title}
                  </h4>
                  <div
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${meetingTypeColors[meeting.type]}`}
                  >
                    <Icon name={meeting.typeIcon} filled className="text-sm" />
                    <span>{meeting.typeLabel}</span>
                  </div>
                </div>
                {meeting.hasAlert && (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500" />
                )}
              </div>
              <div className="mt-3 border-t border-border-light dark:border-border-dark pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                  Owner
                </p>
                <p className="mt-0.5 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {meeting.owner},{' '}
                  <span className="font-medium">{meeting.ownerTitle}</span>
                </p>
              </div>

              {/* Meeting Prep button — upcoming meetings only */}
              {filter === 'upcoming' && (
                <div className="mt-3">
                  {activePrepId !== meeting.id ? (
                    <button
                      onClick={() => handlePrepClick(meeting.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white dark:hover:text-primary transition-colors"
                    >
                      <span>🎧</span> Meeting Prep
                    </button>
                  ) : (
                    <MeetingPrepPlayer
                      state={prepState}
                      onStart={start}
                      onPause={pause}
                      onResume={resume}
                      onStop={handleStop}
                      formatElapsed={formatElapsed}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card-light dark:bg-card-dark p-8 text-center shadow-sm">
            <Icon name="event_busy" className="text-5xl text-text-light-secondary dark:text-text-dark-secondary" />
            <p className="mt-2 text-base font-bold text-text-light-primary dark:text-text-dark-primary">
              No meetings found
            </p>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Try adjusting your search or filter.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card-light dark:bg-card-dark p-8 text-center shadow-sm">
            <Icon name="event_busy" className="text-5xl text-text-light-secondary dark:text-text-dark-secondary" />
            <p className="mt-2 text-base font-bold text-text-light-primary dark:text-text-dark-primary">
              No more meetings
            </p>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              You've reached the end of the list.
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-primary dark:bg-accent px-4 py-3 text-sm font-bold text-white dark:text-primary shadow-lg">
        <Icon name="add" />
        Add meeting
      </button>
    </main>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles and the app runs**

Run: `npm run build`

Expected: No TypeScript errors.

Run: `npm run dev`

Expected: App starts. Navigate to Company Profile → Coverage → Meetings tab. You should see "🎧 Meeting Prep" buttons on the three upcoming meeting cards.

- [ ] **Step 4: Manual smoke test**

1. Tap "🎧 Meeting Prep" on the first upcoming meeting card — the button is replaced by the duration picker showing "5 min", "10 min", "15 min" chips.
2. Tap "5 min" — the picker is replaced by the player: "Now: Meeting Details", progress bar at 0:00 / 5:00, Pause and Stop buttons. Browser speaks the meeting details.
3. Tap Pause — speech pauses, button changes to Resume.
4. Tap Resume — speech continues.
5. Tap Stop — player disappears, duration picker reappears.
6. Tap "10 min" — player appears. After Meeting Details and Action Items finish, browser speaks Past Interactions.
7. Tap "15 min" — all 4 sections play including News & Insights.
8. While one card is playing, tap "🎧 Meeting Prep" on a different card — first card stops and second card shows duration picker.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CompanyProfile.tsx
git commit -m "feat: wire meeting prep button and player into MeetingsTab"
```

---

## Self-Review

**Spec coverage:**
- ✅ Meeting prep button on each upcoming meeting card (Task 4)
- ✅ Duration picker: 5 / 10 / 15 min chips (Task 3)
- ✅ Inline expanded card player (Task 3 + 4)
- ✅ Section 1 (Meeting details) always included (Task 2, `buildScript`)
- ✅ Section 2 (Action items, last 3 months) always included (Task 2)
- ✅ Section 3 (Past interactions, last 3 months) at 10+ min (Task 2)
- ✅ Section 4 (News + insights, last 2 weeks) at 15 min (Task 2)
- ✅ Play / Pause / Resume / Stop controls (Task 3)
- ✅ Progress bar + elapsed/total timestamps (Task 3)
- ✅ "Now: [section name]" label (Task 3)
- ✅ Only one active prep at a time (Task 4, `handlePrepClick` calls `stop()` before switching)
- ✅ Cleanup on unmount via `useEffect` in hook (Task 2)
- ✅ Web Speech API — `speechSynthesis.cancel()` / `.pause()` / `.resume()` (Task 2)
- ✅ `isoDate` fields on NewsItem and Insight for 2-week filter (Task 1)
- ✅ `actionItems` on Meeting for action item section (Task 1)

**No placeholders, no TBDs, all code provided.**
