export type PrepSentiment = 'Positive' | 'Neutral' | 'Urgent';

export interface PrepInsightsData {
  summary: string;
  sentiment: PrepSentiment;
  news: { id: string; headline: string; source: string }[];
  interactions: { date: string; highlight: string }[];
  icebreakers: string[];
}

export type PrepInsightsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PrepInsightsSession {
  meetingId: string;
  status: PrepInsightsStatus;
  data: PrepInsightsData | null;
  errorMessage: string | null;
}
