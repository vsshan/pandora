import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import {
  innovatech,
  recentActivity,
  companyNews,
  companyInsights,
  upcomingMeetings,
  previousMeetings,
} from '../data/mockData';

type MainTab = 'overview' | 'coverage' | 'contacts';
type CoverageTab = 'meetings' | 'news' | 'insights' | 'products';
type MeetingFilter = 'upcoming' | 'previous';

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ onCoverageClick }: { onCoverageClick: () => void }) {
  return (
    <main className="flex-1 space-y-4 p-4">
      {/* Company Summary */}
      <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0">
              <Icon name="corporate_fare" className="text-4xl text-primary dark:text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary truncate">
                {innovatech.name}
              </h3>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {innovatech.sector}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Executive Summary
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
              {innovatech.executiveSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Key Information */}
      <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
        <h3 className="px-4 pb-2 pt-4 text-base font-bold leading-tight tracking-tight text-text-light-primary dark:text-text-dark-primary">
          Key Information
        </h3>
        <div className="grid grid-cols-2 px-4 pb-2">
          {[
            { label: 'CEO', value: innovatech.ceo },
            { label: 'Website', value: innovatech.website },
            { label: 'HQ Location', value: innovatech.hq },
            { label: 'Stock Ticker', value: innovatech.ticker },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1 border-t border-solid border-border-light dark:border-border-dark py-4 pr-2"
            >
              <p className="text-sm font-normal text-text-light-secondary dark:text-text-dark-secondary">
                {item.label}
              </p>
              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Financials Snapshot */}
      <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
        <h3 className="px-4 pb-2 pt-4 text-base font-bold leading-tight tracking-tight text-text-light-primary dark:text-text-dark-primary">
          Financials Snapshot
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-4 p-4">
          <div className="flex flex-col gap-1 rounded-lg bg-background-light dark:bg-background-dark p-3">
            <p className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
              Market Cap
            </p>
            <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
              {innovatech.marketCap}
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-background-light dark:bg-background-dark p-3">
            <p className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
              Stock ({innovatech.ticker})
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                {innovatech.stockPrice}
              </p>
              <div className="flex items-center gap-0.5 rounded-full bg-positive-bg dark:bg-dark-positive-bg px-1.5 py-0.5">
                <Icon name="arrow_upward" className="text-sm text-positive dark:text-dark-positive" />
                <p className="text-xs font-semibold text-positive dark:text-dark-positive">
                  {innovatech.stockChange}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-background-light dark:bg-background-dark p-3">
            <p className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
              Revenue (TTM)
            </p>
            <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
              {innovatech.revenue}
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-background-light dark:bg-background-dark p-3">
            <p className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
              P/E Ratio
            </p>
            <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
              {innovatech.peRatio}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <h3 className="text-base font-bold leading-tight tracking-tight text-text-light-primary dark:text-text-dark-primary">
            Recent Activity
          </h3>
          <button
            onClick={onCoverageClick}
            className="text-sm font-semibold text-primary dark:text-accent"
          >
            View All
          </button>
        </div>
        <ul className="flex flex-col">
          {recentActivity.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-4 border-t border-solid border-border-light dark:border-border-dark px-4 py-3"
            >
              <div
                className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.iconBg} ${item.iconColor}`}
              >
                <Icon name={item.icon} className="text-base" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary line-clamp-2">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  {item.loggedBy} · {item.timeAgo}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* News */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-text-light-primary dark:text-text-dark-primary">
            News
          </h3>
          <a href="#" className="text-sm font-semibold text-primary dark:text-accent">
            See All
          </a>
        </div>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
          {companyNews.map((item) => (
            <div
              key={item.id}
              className="w-72 flex-none rounded-xl bg-card-light dark:bg-card-dark p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase text-accent">{item.source}</p>
              <h4 className="mt-1 font-bold text-text-light-primary dark:text-text-dark-primary line-clamp-2">
                {item.headline}
              </h4>
              <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {item.preview}
              </p>
              <p className="mt-3 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {item.date}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-text-light-primary dark:text-text-dark-primary">
            Insights
          </h3>
          <a href="#" className="text-sm font-semibold text-primary dark:text-accent">
            See All
          </a>
        </div>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
          {companyInsights.map((insight) => (
            <div
              key={insight.id}
              className="flex w-72 flex-none flex-col rounded-xl bg-card-light dark:bg-card-dark p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                {insight.authorAvatar && (
                  <img
                    src={insight.authorAvatar}
                    alt={insight.author}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                )}
                <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {insight.author}
                </p>
              </div>
              <p className="mt-2 flex-grow text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {insight.content}
              </p>
              <p className="mt-3 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {insight.date}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
        {[
          { icon: 'monitoring', label: 'Product Usage' },
          { icon: 'trending_up', label: 'Investors' },
        ].map((link, idx) => (
          <a
            key={link.label}
            href="#"
            className={`flex items-center justify-between p-4 hover:bg-background-light dark:hover:bg-background-dark transition-colors ${
              idx > 0 ? 'border-t border-border-light dark:border-border-dark' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent">
                <Icon name={link.icon} />
              </div>
              <span className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
                {link.label}
              </span>
            </div>
            <Icon
              name="chevron_right"
              className="text-text-light-secondary dark:text-text-dark-secondary"
            />
          </a>
        ))}
      </div>
    </main>
  );
}

// ─── Meetings Tab ──────────────────────────────────────────────────────────────

function MeetingsTab() {
  const [filter, setFilter] = useState<MeetingFilter>('upcoming');
  const [search, setSearch] = useState('');

  const meetings = filter === 'upcoming' ? upcomingMeetings : previousMeetings;

  const filtered = meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.owner.toLowerCase().includes(search.toLowerCase())
  );

  const meetingTypeColors: Record<string, string> = {
    internal: 'bg-primary/10 text-primary dark:bg-primary/20',
    'client-call': 'bg-accent/10 text-accent dark:bg-accent/20',
    'client-meeting': 'bg-secondary/10 text-secondary dark:bg-secondary/20',
    'no-visibility': 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  };

  return (
    <main className="flex-1 pb-24">
      {/* Search */}
      <div className="p-4">
        <div className="relative flex items-center">
          <Icon
            name="search"
            className="absolute left-3 text-text-light-secondary dark:text-text-dark-secondary"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings..."
            className="w-full rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark py-2.5 pl-10 pr-10 text-sm text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm"
          />
          <button className="absolute right-3 text-text-light-secondary dark:text-text-dark-secondary">
            <Icon name="tune" />
          </button>
        </div>
      </div>

      {/* Upcoming / Previous Toggle */}
      <div className="px-4">
        <div className="flex rounded-lg bg-background-light dark:bg-background-dark/50 p-1 gap-1">
          {[
            { id: 'upcoming' as MeetingFilter, label: 'Upcoming' },
            { id: 'previous' as MeetingFilter, label: 'Previous' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-card-light dark:bg-card-dark text-primary dark:text-text-dark-primary shadow-sm'
                  : 'text-text-light-secondary dark:text-text-dark-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Meeting List */}
      <div className="mt-4 space-y-3 px-4">
        {filtered.map((meeting) => (
          <div
            key={meeting.id}
            className="overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm"
          >
            <div className="p-4">
              <p className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-2">
                {meeting.date}
              </p>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <h4 className="text-base font-bold text-text-light-primary dark:text-text-dark-primary">
                    {meeting.title}
                  </h4>
                  <div
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${meetingTypeColors[meeting.type]}`}
                  >
                    <Icon name={meeting.typeIcon} filled className="text-sm" />
                    <span>{meeting.typeLabel}</span>
                  </div>
                </div>
                {meeting.hasAlert && (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500" />
                )}
              </div>
              <div className="mt-3 border-t border-border-light dark:border-border-dark pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                  Owner
                </p>
                <p className="mt-0.5 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {meeting.owner},{' '}
                  <span className="font-medium">{meeting.ownerTitle}</span>
                </p>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card-light dark:bg-card-dark p-8 text-center shadow-sm">
            <Icon name="event_busy" className="text-5xl text-text-light-secondary dark:text-text-dark-secondary" />
            <p className="mt-2 text-base font-bold text-text-light-primary dark:text-text-dark-primary">
              No meetings found
            </p>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Try adjusting your search or filter.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card-light dark:bg-card-dark p-8 text-center shadow-sm">
            <Icon name="event_busy" className="text-5xl text-text-light-secondary dark:text-text-dark-secondary" />
            <p className="mt-2 text-base font-bold text-text-light-primary dark:text-text-dark-primary">
              No more meetings
            </p>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              You've reached the end of the list.
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-primary dark:bg-accent px-4 py-3 text-sm font-bold text-white dark:text-primary shadow-lg">
        <Icon name="add" />
        Add meeting
      </button>
    </main>
  );
}

// ─── Contacts Tab ──────────────────────────────────────────────────────────────

function ContactsTab() {
  return (
    <main className="flex-1 p-4">
      <div className="flex flex-col items-center justify-center rounded-xl bg-card-light dark:bg-card-dark p-12 text-center shadow-sm">
        <Icon name="contacts" className="text-5xl text-text-light-secondary dark:text-text-dark-secondary" />
        <p className="mt-4 text-base font-bold text-text-light-primary dark:text-text-dark-primary">
          Contacts
        </p>
        <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Key contacts for Innovatech Solutions will appear here.
        </p>
      </div>
    </main>
  );
}

// ─── Coverage sub-tabs: News, Insights, Products ───────────────────────────────

function CoverageNewsTab() {
  return (
    <main className="flex-1 p-4 space-y-4">
      {companyNews.map((item) => (
        <div key={item.id} className="rounded-xl bg-card-light dark:bg-card-dark p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-accent">{item.source}</p>
          <h4 className="mt-1 font-bold text-text-light-primary dark:text-text-dark-primary">
            {item.headline}
          </h4>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {item.preview}
          </p>
          <p className="mt-3 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            {item.date}
          </p>
        </div>
      ))}
    </main>
  );
}

function CoverageInsightsTab() {
  return (
    <main className="flex-1 p-4 space-y-4">
      {companyInsights.map((insight) => (
        <div key={insight.id} className="rounded-xl bg-card-light dark:bg-card-dark p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            {insight.authorAvatar && (
              <img
                src={insight.authorAvatar}
                alt={insight.author}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              {insight.author}
            </p>
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {insight.content}
          </p>
          <p className="mt-3 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            {insight.date}
          </p>
        </div>
      ))}
    </main>
  );
}

function CoverageProductsTab() {
  return (
    <main className="flex-1 p-4">
      <div className="flex flex-col items-center justify-center rounded-xl bg-card-light dark:bg-card-dark p-12 text-center shadow-sm">
        <Icon name="inventory_2" className="text-5xl text-text-light-secondary dark:text-text-dark-secondary" />
        <p className="mt-4 text-base font-bold text-text-light-primary dark:text-text-dark-primary">
          Products
        </p>
        <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Product relationships will appear here.
        </p>
      </div>
    </main>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompanyProfile() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [coverageTab, setCoverageTab] = useState<CoverageTab>('meetings');

  const isCoverage = mainTab === 'coverage';

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden font-display">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 flex flex-col bg-card-light dark:bg-card-dark shadow-sm">
        {/* Top Bar */}
        <div className="flex h-16 w-full items-center px-4 gap-2">
          <button
            onClick={() => {
              if (isCoverage) {
                setMainTab('overview');
              } else {
                navigate(-1);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-light-primary dark:text-text-dark-primary hover:bg-background-light dark:hover:bg-background-dark transition-colors shrink-0"
          >
            <Icon name="arrow_back" className="text-2xl" />
          </button>
          <div className="ml-2 flex flex-1 flex-col min-w-0">
            <h2 className="text-lg font-bold leading-tight tracking-tight text-text-light-primary dark:text-text-dark-primary truncate">
              {innovatech.name}
            </h2>
            <p className="text-sm font-medium leading-tight text-text-light-secondary dark:text-text-dark-secondary">
              {innovatech.sector}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-light-primary dark:text-text-dark-primary hover:bg-background-light dark:hover:bg-background-dark transition-colors shrink-0"
          >
            <Icon name="close" className="text-2xl" />
          </button>
        </div>

        {/* Tab Bar */}
        {!isCoverage ? (
          /* Overview / Coverage / Contacts */
          <div className="w-full border-b border-border-light dark:border-border-dark px-4">
            <div className="flex justify-between">
              {(
                [
                  { id: 'overview' as MainTab, label: 'Overview' },
                  { id: 'coverage' as MainTab, label: 'Coverage' },
                  { id: 'contacts' as MainTab, label: 'Contacts' },
                ] as { id: MainTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id)}
                  className={`flex flex-1 flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors ${
                    mainTab === tab.id
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-text-light-secondary dark:text-text-dark-secondary'
                  }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-wide">{tab.label}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Meetings / News / Insights / Products */
          <div className="w-full border-b border-border-light dark:border-border-dark px-4">
            <div className="flex justify-between">
              {(
                [
                  { id: 'meetings' as CoverageTab, label: 'Meetings' },
                  { id: 'news' as CoverageTab, label: 'News' },
                  { id: 'insights' as CoverageTab, label: 'Insights' },
                  { id: 'products' as CoverageTab, label: 'Products' },
                ] as { id: CoverageTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCoverageTab(tab.id)}
                  className={`relative flex flex-1 flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors ${
                    coverageTab === tab.id
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-text-light-secondary dark:text-text-dark-secondary'
                  }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-wide">{tab.label}</p>
                  {tab.id === 'meetings' && (
                    <span className="absolute right-2 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      2
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {!isCoverage && mainTab === 'overview' && (
        <OverviewTab onCoverageClick={() => setMainTab('coverage')} />
      )}
      {!isCoverage && mainTab === 'contacts' && <ContactsTab />}
      {isCoverage && coverageTab === 'meetings' && <MeetingsTab />}
      {isCoverage && coverageTab === 'news' && <CoverageNewsTab />}
      {isCoverage && coverageTab === 'insights' && <CoverageInsightsTab />}
      {isCoverage && coverageTab === 'products' && <CoverageProductsTab />}
    </div>
  );
}
