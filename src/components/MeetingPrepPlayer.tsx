import { PrepDuration, PrepPlayerState, formatElapsed } from '../hooks/useMeetingPrep';

interface MeetingPrepPlayerProps {
  state: PrepPlayerState;
  onStart: (duration: PrepDuration) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const DURATIONS: PrepDuration[] = [5, 10, 15];

export default function MeetingPrepPlayer({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
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
            Now:{' '}
            <span className="text-primary dark:text-accent">{state.currentSectionName}</span>
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
            {state.isStarting ? (
              <button
                type="button"
                disabled
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/5 dark:bg-accent/5 py-2 text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary cursor-not-allowed"
              >
                Starting…
              </button>
            ) : state.isPlaying ? (
              <button
                type="button"
                onClick={onPause}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 dark:bg-accent/10 py-2 text-sm font-semibold text-primary dark:text-accent"
              >
                <span aria-hidden="true">⏸</span> Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={onResume}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 dark:bg-accent/10 py-2 text-sm font-semibold text-primary dark:text-accent"
              >
                <span aria-hidden="true">▶</span> Resume
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
