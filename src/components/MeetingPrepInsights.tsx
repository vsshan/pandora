import Icon from './Icon';
import type { PrepInsightsData, PrepSentiment } from '../types/prepInsights';

interface Props {
  data: PrepInsightsData;
  onDismiss: () => void;
}

function SentimentBadge({ sentiment }: { sentiment: PrepSentiment }) {
  const styles: Record<PrepSentiment, string> = {
    Positive:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Neutral:
      'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
    Urgent:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[sentiment]}`}
    >
      {sentiment} Sentiment
    </span>
  );
}

export default function MeetingPrepInsights({ data, onDismiss }: Props) {
  return (
    <div className="mt-2 space-y-3 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-4 shadow-inner">

      {/* 1. AI Insight Brief — Client Pulse */}
      <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-widest text-text-light-secondary dark:text-text-dark-secondary">
              AI Insight Brief
            </p>
            <SentimentBadge sentiment={data.sentiment} />
          </div>
          <h3 className="text-base font-bold text-text-light-primary dark:text-text-dark-primary">
            Client Pulse
          </h3>
        </div>
        <div className="px-4 pb-4">
          <p className="text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
            {data.summary}
          </p>
        </div>
      </div>

      {/* 2. Suggested Strategies */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <Icon name="lightbulb" filled className="text-accent text-lg" />
          <h4 className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
            Suggested Strategies
          </h4>
        </div>
        <div className="space-y-2">
          {data.icebreakers.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 overflow-hidden rounded-xl bg-card-light dark:bg-card-dark px-4 py-3 shadow-sm"
            >
              <Icon
                name="bolt"
                filled
                className="text-primary dark:text-accent text-lg shrink-0 mt-0.5"
              />
              <p className="text-sm text-text-light-primary dark:text-text-dark-primary leading-snug">
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Market Context */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <Icon name="newspaper" className="text-accent text-lg" />
          <h4 className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
            Market Context
          </h4>
        </div>
        <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm divide-y divide-border-light dark:divide-border-dark">
          {data.news.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary leading-snug">
                  {item.headline}
                </p>
                <p className="mt-0.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  {item.source}
                </p>
              </div>
              <Icon
                name="trending_up"
                className="text-accent text-base shrink-0 mt-0.5"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Last 3 Touchpoints */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <Icon name="chat_bubble" filled className="text-accent text-lg" />
          <h4 className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
            Last 3 Touchpoints
          </h4>
        </div>
        <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm divide-y divide-border-light dark:divide-border-dark">
          {data.interactions.map((item, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-0.5">
                {item.date}
              </p>
              <p className="text-sm text-text-light-primary dark:text-text-dark-primary leading-snug">
                {item.highlight}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={onDismiss}
        className="w-full rounded-xl border border-border-light dark:border-border-dark py-2.5 text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary hover:bg-card-light dark:hover:bg-card-dark transition-colors"
      >
        Close Insights
      </button>
    </div>
  );
}
