# Meeting Prep Podcast — Design Spec

**Date:** 2026-04-09  
**Status:** Approved  
**App:** Pandora CRM (React + TypeScript + Tailwind, mobile-first)

---

## Context

Bankers need to walk into client meetings fully briefed. Today the app shows meeting cards and past interactions but offers no way to consume that information quickly on the go. This feature gives the banker a one-tap "podcast" experience — they pick a duration (5, 10, or 15 minutes), and the app reads them a structured audio brief covering the meeting, past interactions, action items, and recent news/insights. Audio is generated entirely in the browser via the Web Speech API — no backend required.

---

## Architecture

Three new pieces, all frontend-only:

### 1. `MeetingPrepPlayer` component
`src/components/MeetingPrepPlayer.tsx`

Renders the inline expanded section of a meeting card. Responsible for:
- Duration picker chips (5 / 10 / 15 min)
- Progress bar, elapsed / total timestamps
- Play / Pause / Stop controls
- "Now: [section name]" label that updates as sections advance
- Receiving script + state from `useMeetingPrep` hook

### 2. `useMeetingPrep` hook
`src/hooks/useMeetingPrep.ts`

The brain of the feature. Responsible for:
- Assembling the podcast script from mock data given a meeting ID and duration
- Driving `window.speechSynthesis` (play, pause, resume, cancel)
- Exposing player state: `{ isPlaying, isPaused, currentSection, progress, elapsed, total }`
- Ensuring only one prep session is active at a time (starting a new one cancels any in-progress)

### 3. Entry point in `CompanyProfile.tsx`
`src/pages/CompanyProfile.tsx`

- Each upcoming meeting card gets a "🎧 Meeting Prep" button
- Tapping it sets `activePrepMeetingId` state (local to the meetings tab)
- The card with the matching ID renders `MeetingPrepPlayer` below its details
- Only one card can be expanded at a time

---

## Content & Script Assembly

Sections included per duration:

| Section | 5 min | 10 min | 15 min |
|---|:---:|:---:|:---:|
| 1. Meeting details (title, date, attendees) | ✅ | ✅ | ✅ |
| 2. Action items from past meetings (last 3 months) | ✅ | ✅ | ✅ |
| 3. Past interactions summary (last 3 months) | ❌ | ✅ | ✅ |
| 4. Recent news & insights (last 2 weeks) | ❌ | ❌ | ✅ |

**Data sources (all from mock data):**
- Meeting details → `Meeting` object (title, date, owner, type)
- Action items → `Meeting.actionItems[]` (new field, see Data Model below)
- Past interactions summary → `previousMeetings` filtered to last 3 months
- News → `companyNews` filtered by `isoDate` within last 14 days
- Insights → `companyInsights` filtered by `isoDate` within last 14 days

---

## Data Model Changes

**`src/data/mockData.ts`**

Extend `Meeting` interface:
```ts
interface Meeting {
  // ...existing fields...
  actionItems?: string[];  // e.g. ["Send updated deck", "Intro to CFO"]
}
```

Extend `NewsItem` and `Insight` interfaces:
```ts
interface NewsItem {
  // ...existing fields...
  isoDate: string;  // e.g. "2026-03-28"
}

interface Insight {
  // ...existing fields...
  isoDate: string;
}
```

Add `actionItems` to existing `previousMeetings` mock entries. Add `isoDate` to `companyNews` and `companyInsights` entries (use dates within the last 2 weeks for at least 1–2 items so the 15-min brief has content).

---

## Player UI States

**State 1 — Default**  
Meeting card unchanged. "🎧 Meeting Prep" button appears at the bottom of upcoming meeting cards only.

**State 2 — Duration Picker**  
Card expands below meeting details to show:
```
[ 5 min ]  [ 10 min ]  [ 15 min ]
```
Tapping a chip immediately starts the brief (no confirmation needed).

**State 3 — Playing / Paused**  
Card shows:
```
Now: Action Items
[=====>          ] 3:28 / 10:00
[ ⏸ Pause ]  [ ⏹ Stop ]
```
Section label updates live as each section begins. Stop resets back to State 2.

---

## Web Speech API Behavior

- Script assembled as an array of `{ sectionName: string, text: string }` objects
- Each section becomes a `SpeechSynthesisUtterance`
- `utterance.onend` advances to the next section and updates progress
- `speechSynthesis.pause()` / `.resume()` for pause/resume
- `speechSynthesis.cancel()` for stop — resets to duration picker
- On unmount, always call `speechSynthesis.cancel()` to prevent orphaned speech

---

## Files Changed

| File | Change |
|---|---|
| `src/components/MeetingPrepPlayer.tsx` | **New** — duration picker + player UI |
| `src/hooks/useMeetingPrep.ts` | **New** — script assembly + speech synthesis |
| `src/data/mockData.ts` | **Modified** — extend interfaces + add mock action items + isoDate |
| `src/pages/CompanyProfile.tsx` | **Modified** — add prep button to meeting cards, wire up player |

No new routes. No new pages. No state management library. No backend.

---

## Verification

1. Run `npm run dev` — app loads without errors
2. Navigate to Company Profile → Coverage → Meetings
3. Tap "🎧 Meeting Prep" on an upcoming meeting card — duration picker appears
4. Select 5 min — card expands, browser speaks the brief (meeting details + action items only)
5. Select 10 min — brief includes past interactions summary in addition
6. Select 15 min — brief includes news & insights in addition
7. Tap Pause — speech pauses; tap Resume — speech continues from same position
8. Tap Stop — speech cancels, card resets to duration picker
9. Start prep on one card, then tap prep on another — first one stops automatically
10. Navigate away from the page mid-playback — speech is cancelled cleanly (no orphaned audio)
