import Icon from './Icon';
import type { PodcastSession } from '../types/podcast';
import type { Meeting } from '../data/mockData';

interface Props {
  meeting: Meeting;
  session: PodcastSession | null;
  onGenerate: (meeting: Meeting) => void;
  onOpen: () => void;
}

export default function PodcastButton({ meeting, session, onGenerate, onOpen }: Props) {
  const isThisMeeting = session?.meetingId === meeting.id;
  const status = isThisMeeting ? session!.status : 'idle';
  const isAnotherLoading = !isThisMeeting && session?.status === 'loading';

  const handleClick = () => {
    if (status === 'ready') {
      onOpen();
    } else if (status === 'idle' || status === 'error') {
      onGenerate(meeting);
    }
    // status === 'loading': no-op
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={status === 'loading' || isAnotherLoading}
        className={`flex items-center gap-2 self-start rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
          status === 'loading'
            ? 'bg-accent/10 text-accent cursor-not-allowed'
            : status === 'ready'
            ? 'bg-primary dark:bg-accent text-white shadow-sm hover:opacity-90'
            : status === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
            : isAnotherLoading
            ? 'bg-background-light dark:bg-background-dark text-text-light-secondary dark:text-text-dark-secondary cursor-not-allowed'
            : 'bg-accent/10 text-accent hover:bg-accent/20 dark:hover:bg-accent/20'
        }`}
      >
        {status === 'loading' && (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
        )}
        {status === 'ready' && <Icon name="play_circle" filled className="text-base shrink-0" />}
        {status === 'error' && <Icon name="refresh" className="text-base shrink-0" />}
        {(status === 'idle' || isAnotherLoading) && (
          <Icon name="podcast" className="text-base shrink-0" />
        )}
        <span>
          {status === 'loading' && 'Generating briefing…'}
          {status === 'ready' && 'Play Podcast'}
          {status === 'error' && 'Retry'}
          {status === 'idle' && !isAnotherLoading && 'Generate Podcast'}
          {status === 'idle' && isAnotherLoading && 'Generate Podcast'}
        </span>
      </button>
      {status === 'loading' && (
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary pl-1">
          ~15 seconds — Claude is writing your briefing
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-500 pl-1">{session?.errorMessage}</p>
      )}
    </div>
  );
}
