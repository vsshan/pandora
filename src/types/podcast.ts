export type PodcastStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PodcastSession {
  meetingId: string;
  status: PodcastStatus;
  audioUrl: string | null;
  errorMessage: string | null;
  generatedAt: Date | null;
}
