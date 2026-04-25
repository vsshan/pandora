import Icon from './Icon';
import type { PrepInsightsSession } from '../types/prepInsights';
import type { Meeting } from '../data/mockData';

interface Props {
  meeting: Meeting;
  session: PrepInsightsSession | null;
  isPanelOpen: boolean;
  onGenerate: (meeting: Meeting) => void;
  onToggle: () => void;
}

export default function PrepInsightsButton({
  meeting,
  session,
  isPanelOpen,
  onGenerate,
  onToggle,
}: Props) {
  const isThisMeeting = session?.meetingId === meeting.id;
  const status = isThisMeeting ? session!.status : 'idle';
  const isAnotherLoading = !isThisMeeting && session?.status === 'loading';

  const handleClick = () => {
    if (status === 'ready') {
      onToggle();
    } else if (status === 'idle' || status === 'error') {
      onGenerate(meeting);
    }
  };

  const label = () => {
    if (status === 'loading') return 'Generating insights…';
    if (status === 'ready') return isPanelOpen ? 'Hide Insights' : 'View Insights';
    if (status === 'error') return 'Retry';
    return 'Meeting Prep Insights';
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'loading' || isAnotherLoading}
        className={`flex items-center gap-2 self-start rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
          status === 'loading'
            ? 'bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent cursor-not-allowed'
            : status === 'ready' && isPanelOpen
            ? 'bg-primary dark:bg-accent text-white shadow-sm hover:opacity-90'
            : status === 'ready'
            ? 'bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent hover:bg-primary/20 dark:hover:bg-accent/20'
            : status === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
            : isAnotherLoading
            ? 'bg-background-light dark:bg-background-dark text-text-light-secondary dark:text-text-dark-secondary cursor-not-allowed'
            : 'bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent hover:bg-primary/20 dark:hover:bg-accent/20'
        }`}
      >
        {status === 'loading' && (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
        )}
        {status === 'ready' && isPanelOpen && (
          <Icon name="expand_less" className="text-base shrink-0" />
        )}
        {status === 'ready' && !isPanelOpen && (
          <Icon name="auto_awesome" filled className="text-base shrink-0" />
        )}
        {status === 'error' && <Icon name="refresh" className="text-base shrink-0" />}
        {(status === 'idle' || isAnotherLoading) && (
          <Icon name="auto_awesome" className="text-base shrink-0" />
        )}
        <span>{label()}</span>
      </button>
      {status === 'loading' && (
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary pl-1">
          ~10 seconds — Claude is analysing your brief
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-500 pl-1">{session?.errorMessage}</p>
      )}
    </div>
  );
}
