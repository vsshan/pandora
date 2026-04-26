import { useState } from 'react';
import Icon from './Icon';
import { usePometry } from '../hooks/usePometry';
import type { ContactAnalytics, InteractionEvent, NetworkOverview } from '../types/pometry';

// ── Config ─────────────────────────────────────────────────────────────────────

const TREND = {
  growing:  { label: 'Growing',   icon: 'trending_up',   cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  stable:   { label: 'Stable',    icon: 'trending_flat', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  declining:{ label: 'Declining', icon: 'trending_down', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  dormant:  { label: 'Dormant',   icon: 'bedtime',       cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400' },
};

const STATUS_DOT: Record<string, string> = {
  hot:     'bg-red-500',
  warm:    'bg-amber-400',
  cold:    'bg-blue-400',
  dormant: 'bg-gray-300 dark:bg-gray-600',
};

const INTERACTION_ICON: Record<string, string> = {
  meeting:    'groups',
  call:       'phone',
  email:      'mail',
  conference: 'video_call',
  dinner:     'restaurant',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function NetworkStats({ overview }: { overview: NetworkOverview }) {
  const stats = [
    { label: 'Contacts',     value: overview.total_contacts,        icon: 'contacts' },
    { label: 'Interactions', value: overview.total_interactions,    icon: 'forum' },
    { label: 'Active (30d)', value: overview.active_last_30d,       icon: 'local_fire_department' },
    { label: 'Density',      value: `${(overview.graph_density * 100).toFixed(1)}%`, icon: 'hub' },
  ];

  return (
    <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
      <h3 className="px-4 pt-4 pb-2 text-base font-bold leading-tight tracking-tight text-text-light-primary dark:text-text-dark-primary">
        Network Overview
      </h3>
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg bg-background-light dark:bg-background-dark p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon name={s.icon} className="text-sm text-primary dark:text-accent" />
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">{s.label}</p>
            </div>
            <p className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactCard({ contact }: { contact: ContactAnalytics }) {
  const trend = TREND[contact.trend];
  const maxBar = Math.max(contact.recent_count, contact.prior_count, 1);

  return (
    <div className="flex items-start gap-3 border-t border-solid border-border-light dark:border-border-dark px-4 py-3">
      {/* Avatar */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold ${contact.avatar_color}`}
      >
        {contact.avatar_initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary truncate">
            {contact.name}
          </p>
          {/* Status dot */}
          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[contact.status] ?? STATUS_DOT.dormant}`} />
        </div>

        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary truncate">
          {contact.title} · {contact.company}
        </p>

        {/* Trend pill + interaction count */}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${trend.cls}`}>
            <Icon name={trend.icon} className="text-xs" />
            {trend.label}
          </span>
          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            {contact.interaction_count} interactions
          </span>
        </div>

        {/* Recent vs prior bar */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-12 text-right text-xs text-text-light-secondary dark:text-text-dark-secondary">Recent</span>
            <div className="flex-1 h-1.5 rounded-full bg-border-light dark:bg-border-dark">
              <div
                className="h-1.5 rounded-full bg-primary dark:bg-accent transition-all"
                style={{ width: `${(contact.recent_count / maxBar) * 100}%` }}
              />
            </div>
            <span className="w-4 text-xs font-semibold text-text-light-primary dark:text-text-dark-primary">{contact.recent_count}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-right text-xs text-text-light-secondary dark:text-text-dark-secondary">Prior</span>
            <div className="flex-1 h-1.5 rounded-full bg-border-light dark:bg-border-dark">
              <div
                className="h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 transition-all"
                style={{ width: `${(contact.prior_count / maxBar) * 100}%` }}
              />
            </div>
            <span className="w-4 text-xs font-semibold text-text-light-primary dark:text-text-dark-primary">{contact.prior_count}</span>
          </div>
        </div>

        <p className="mt-1.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          Last seen: {timeAgo(contact.last_seen)}
        </p>
      </div>
    </div>
  );
}

function TimelineItem({ event }: { event: InteractionEvent }) {
  const icon = INTERACTION_ICON[event.interaction_type] ?? 'chat_bubble';
  return (
    <div className="flex items-start gap-3 border-t border-solid border-border-light dark:border-border-dark px-4 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent">
        <Icon name={icon} className="text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
          {event.to_name}
        </p>
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary capitalize">
          {event.interaction_type} · {event.banker}
        </p>
        {event.notes && (
          <p className="mt-0.5 text-xs text-text-light-secondary dark:text-text-dark-secondary line-clamp-2">
            {event.notes}
          </p>
        )}
        <p className="mt-0.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          {timeAgo(event.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

type Filter = 'all' | 'hot' | 'cold';

export default function ContactsGraph({ companyId }: { companyId?: string }) {
  const { status, overview, contacts, timeline, error, reload } = usePometry(companyId);
  const [filter, setFilter] = useState<Filter>('all');

  if (status === 'loading' || status === 'idle') {
    return (
      <main className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-xl bg-card-light dark:bg-card-dark animate-pulse shadow-sm" />
        ))}
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="flex-1 p-4">
        <div className="flex flex-col items-center justify-center rounded-xl bg-card-light dark:bg-card-dark p-12 text-center shadow-sm">
          <Icon name="error_outline" className="text-4xl text-text-light-secondary dark:text-text-dark-secondary" />
          <p className="mt-3 text-base font-bold text-text-light-primary dark:text-text-dark-primary">
            Graph service unavailable
          </p>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {error}
          </p>
          <button
            onClick={reload}
            className="mt-4 rounded-full bg-primary/10 dark:bg-accent/10 px-4 py-2 text-sm font-semibold text-primary dark:text-accent"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!overview) return null;

  const filtered = contacts.filter(c => {
    if (filter === 'hot')  return c.status === 'hot' || c.status === 'warm';
    if (filter === 'cold') return c.status === 'cold' || c.status === 'dormant';
    return true;
  });

  return (
    <main className="flex-1 p-4 space-y-4">
      {/* Network Overview */}
      <NetworkStats overview={overview} />

      {/* Contacts list */}
      <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-base font-bold leading-tight tracking-tight text-text-light-primary dark:text-text-dark-primary">
            Contacts
          </h3>
          {/* Filter toggle */}
          <div className="flex rounded-md bg-background-light dark:bg-background-dark p-0.5 gap-0.5 text-xs">
            {(['all', 'hot', 'cold'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  'rounded px-2 py-1 font-semibold capitalize transition-colors',
                  filter === f
                    ? 'bg-card-light dark:bg-card-dark text-primary dark:text-accent shadow-sm'
                    : 'text-text-light-secondary dark:text-text-dark-secondary',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.map(c => <ContactCard key={c.id} contact={c} />)}

        {filtered.length === 0 && (
          <p className="px-4 pb-4 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            No contacts match this filter.
          </p>
        )}
      </div>

      {/* Recent interactions */}
      <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
        <h3 className="px-4 pt-4 pb-2 text-base font-bold leading-tight tracking-tight text-text-light-primary dark:text-text-dark-primary">
          Recent Interactions
        </h3>
        {timeline.map(e => <TimelineItem key={e.interaction_id} event={e} />)}
        {timeline.length === 0 && (
          <p className="px-4 pb-4 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            No interactions to display.
          </p>
        )}
      </div>
    </main>
  );
}
