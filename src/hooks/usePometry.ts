import { useState, useEffect, useCallback } from 'react';
import type {
  NetworkOverview,
  ContactAnalytics,
  InteractionEvent,
  MonthlyTrend,
} from '../types/pometry';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface PometryState {
  status: Status;
  overview: NetworkOverview | null;
  contacts: ContactAnalytics[];
  timeline: InteractionEvent[];
  trends: MonthlyTrend[];
  error: string | null;
}

// In dev, VITE_POMETRY_URL is unset so calls go through the Express proxy at /api/pometry.
// In production (Render), set VITE_POMETRY_URL to the Python service's public URL.
const BASE = import.meta.env.VITE_POMETRY_URL
  ? `${import.meta.env.VITE_POMETRY_URL}`
  : '/api/pometry';

export function usePometry(companyId?: string) {
  const [state, setState] = useState<PometryState>({
    status: 'idle',
    overview: null,
    contacts: [],
    timeline: [],
    trends: [],
    error: null,
  });

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const qs = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';

      const [overviewRes, contactsRes, timelineRes, trendsRes] = await Promise.all([
        fetch(`${BASE}/network-overview`),
        fetch(`${BASE}/contacts${qs}`),
        fetch(`${BASE}/timeline?limit=15`),
        fetch(`${BASE}/trends`),
      ]);

      if (!overviewRes.ok || !contactsRes.ok) {
        throw new Error(`Graph service error (${overviewRes.status})`);
      }

      const [overviewData, contactsData, timelineData, trendsData] = await Promise.all([
        overviewRes.json(),
        contactsRes.json(),
        timelineRes.json(),
        trendsRes.json(),
      ]);

      setState({
        status: 'ready',
        overview: overviewData as NetworkOverview,
        contacts: (contactsData.contacts ?? []) as ContactAnalytics[],
        timeline: (timelineData.interactions ?? []) as InteractionEvent[],
        trends: (trendsData.monthly ?? []) as MonthlyTrend[],
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
