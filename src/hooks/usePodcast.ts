import { useState, useCallback } from 'react';
import type { PodcastSession } from '../types/podcast';
import {
  innovatech,
  companyNews,
  companyInsights,
  previousMeetings as allPreviousMeetings,
} from '../data/mockData';
import type { Meeting } from '../data/mockData';

const ENDPOINT = '/api/podcast/generate';

export function usePodcast() {
  const [session, setSession] = useState<PodcastSession | null>(null);

  const generate = useCallback(
    async (meeting: Meeting) => {
      // Revoke previous object URL to prevent memory leaks
      if (session?.audioUrl) {
        URL.revokeObjectURL(session.audioUrl);
      }

      setSession({
        meetingId: meeting.id,
        status: 'loading',
        audioUrl: null,
        errorMessage: null,
        generatedAt: null,
      });

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
            // Send all previous meetings (up to 5) for context
            previousMeetings: allPreviousMeetings.slice(0, 5).map((m) => ({
              title: m.title,
              date: m.date,
              typeLabel: m.typeLabel,
              owner: m.owner,
              description: m.description,
            })),
            news: companyNews.map((n) => ({
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

        // Buffer the streamed MP3 then create a browser-playable object URL
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);

        setSession({
          meetingId: meeting.id,
          status: 'ready',
          audioUrl,
          errorMessage: null,
          generatedAt: new Date(),
        });
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
    },
    [session?.audioUrl]
  );

  const dismiss = useCallback(() => {
    if (session?.audioUrl) {
      URL.revokeObjectURL(session.audioUrl);
    }
    setSession(null);
  }, [session?.audioUrl]);

  return { session, generate, dismiss };
}
