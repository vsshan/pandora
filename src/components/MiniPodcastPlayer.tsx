import Icon from './Icon';
import type { PodcastSession } from '../types/podcast';

interface Props {
  session: PodcastSession; // always 'ready' when rendered
  meetingTitle: string;
  onOpen: () => void;
  onDismiss: () => void;
}

export default function MiniPodcastPlayer({ session, meetingTitle, onOpen, onDismiss }: Props) {
  if (session.status !== 'ready') return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 flex items-center gap-3 rounded-2xl bg-primary dark:bg-card-dark border border-primary/20 dark:border-border-dark shadow-xl px-4 py-3">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
        <Icon name="podcast" className="text-lg text-white" />
      </div>

      {/* Text */}
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wide leading-none mb-0.5">
          Podcast ready
        </p>
        <p className="text-sm font-bold text-white truncate">{meetingTitle}</p>
      </button>

      {/* Play button */}
      <button
        onClick={onOpen}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
      >
        <Icon name="play_arrow" filled className="text-xl" />
      </button>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
      >
        <Icon name="close" className="text-base" />
      </button>
    </div>
  );
}
