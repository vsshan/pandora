import { useState, useCallback } from 'react';
import type { PrepInsightsSession, PrepInsightsData } from '../types/prepInsights';
import {
  innovatech,
  companyNews,
  companyInsights,
  previousMeetings as allPreviousMeetings,
} from '../data/mockData';
import type { Meeting } from '../data/mockData';

const ENDPOINT = '/api/prep-insights/generate';

export function usePrepInsights() {
  const [session, setSession] = useState<PrepInsightsSession | null>(null);

  const generate = useCallback(async (meeting: Meeting) => {
    setSession({ meetingId: meeting.id, status: 'loading', data: null, errorMessage: null });

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting: {
            title: meeting.title,
            date: meeting.date,
            typeLabel: meeting.typeLabel,
            owner: meeting.owner,
            ownerTitle: meeting.ownerTitle,
            attendees: meeting.attendees,
            location: meeting.location,
            description: meeting.description,
          },
          previousMeetings: allPreviousMeetings.slice(0, 5).map((m) => ({
            title: m.title,
            date: m.date,
            typeLabel: m.typeLabel,
            owner: m.owner,
            description: m.description,
          })),
          news: companyNews.map((n) => ({
            id: n.id,
            headline: n.headline,
            source: n.source,
            date: n.date,
            preview: n.preview,
          })),
          insights: companyInsights.map((ins) => ({
            author: ins.author,
            content: ins.content,
            date: ins.date,
          })),
          company: {
            name: innovatech.name,
            sector: innovatech.sector,
            ceo: innovatech.ceo,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errorData.error ?? `Server error ${response.status}`);
      }

      const data: PrepInsightsData = await response.json();

      setSession({ meetingId: meeting.id, status: 'ready', data, errorMessage: null });
    } catch (err) {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'error',
              errorMessage: err instanceof Error ? err.message : 'Unknown error',
            }
          : null
      );
    }
  }, []);

  const dismiss = useCallback(() => setSession(null), []);

  return { session, generate, dismiss };
}
