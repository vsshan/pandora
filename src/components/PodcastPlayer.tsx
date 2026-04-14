import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import type { PodcastSession } from '../types/podcast';

interface Props {
  session: PodcastSession; // always 'ready' when rendered
  meetingTitle: string;
  onClose: () => void;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function PodcastPlayer({ session, meetingTitle, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1); // default 1×

  const speed = SPEEDS[speedIndex];

  // Auto-play when the player mounts
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    audio.play().catch(() => {/* autoplay may be blocked — user can tap play */});

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, [session.audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrentTime(Number(e.target.value));
  };

  const skip = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  };

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = SPEEDS[next];
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="relative z-10 rounded-t-3xl bg-card-light dark:bg-card-dark shadow-2xl pb-10 pt-3 px-6">
        {/* Drag handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border-light dark:bg-border-dark" />

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">
              AI Podcast Briefing
            </p>
            <h3 className="text-base font-bold text-text-light-primary dark:text-text-dark-primary leading-snug line-clamp-2">
              {meetingTitle}
            </h3>
            {session.generatedAt && (
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                Generated {session.generatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background-light dark:bg-background-dark text-text-light-secondary dark:text-text-dark-secondary hover:opacity-80 transition-opacity"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {/* Waveform animation */}
        <div className="flex items-center justify-center gap-0.5 h-14 mb-6 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className={`w-[3px] rounded-full transition-colors ${
                isPlaying ? 'bg-accent' : 'bg-accent/30'
              }`}
              style={{
                height: `${14 + Math.abs(Math.sin(i * 0.55 + 1) * 24 + Math.cos(i * 0.3) * 12)}px`,
                animationName: isPlaying ? 'waveBar' : 'none',
                animationDuration: '1s',
                animationIterationCount: 'infinite',
                animationTimingFunction: 'ease-in-out',
                animationDelay: `${i * 0.04}s`,
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-1 relative">
          <div className="h-1 w-full rounded-full bg-border-light dark:bg-border-dark overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={seek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-1.5"
          />
        </div>
        <div className="flex justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary mb-7">
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Speed */}
          <button
            onClick={cycleSpeed}
            className="w-14 rounded-full bg-background-light dark:bg-background-dark py-1.5 text-xs font-bold text-text-light-primary dark:text-text-dark-primary hover:opacity-80 transition-opacity text-center"
          >
            {speed}×
          </button>

          {/* Rewind 10s */}
          <button
            onClick={() => skip(-10)}
            className="flex h-12 w-12 items-center justify-center text-text-light-primary dark:text-text-dark-primary hover:opacity-70 transition-opacity"
          >
            <Icon name="replay_10" className="text-[2rem]" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary dark:bg-accent text-white shadow-lg hover:opacity-90 transition-opacity active:scale-95"
          >
            <Icon name={isPlaying ? 'pause' : 'play_arrow'} filled className="text-4xl" />
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => skip(10)}
            className="flex h-12 w-12 items-center justify-center text-text-light-primary dark:text-text-dark-primary hover:opacity-70 transition-opacity"
          >
            <Icon name="forward_10" className="text-[2rem]" />
          </button>

          {/* Download */}
          <a
            href={session.audioUrl ?? undefined}
            download={`briefing-${meetingTitle.replace(/\s+/g, '-').toLowerCase()}.mp3`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background-light dark:bg-background-dark text-text-light-secondary dark:text-text-dark-secondary hover:opacity-80 transition-opacity"
          >
            <Icon name="download" className="text-xl" />
          </a>
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={session.audioUrl ?? undefined}
          preload="auto"
        />
      </div>
    </div>
  );
}
