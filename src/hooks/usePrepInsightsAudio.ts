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

  const play = useCallback(async (data: PrepInsightsData) => {
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
  }, [cleanup]);

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
