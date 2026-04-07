import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { favoriteCompanies, homeNews, homeInsights } from '../data/mockData';

type ListTab = 'favorites' | 'recent' | 'team';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ListTab>('favorites');
  const navigate = useNavigate();

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden font-display">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 bg-background-light/90 dark:bg-background-dark/90 px-4 py-2 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full bg-cover bg-center bg-no-repeat shrink-0"
            style={{
              backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuC2VU2HvP-EPzr3egWbOPlU6G4WVbbxFiJpB8mp-z8w2DhNiHrKAxfXlqfg0DO3_-S8NHPIBqPsti1t9Zx6Gdt0mSLpFs6Uy-Vb1BF128d5iglEzVwPHHajGta2GDcohN8O6T6A7iH_rOO-emP--pqWrY3r3jq0gtrAhOBaGKCElMOLk5Zo_QRiIhIMC5mOwUvsL7W1NsgM2U1YE8n1PcH7pVx5ZCP_cyMRPCgySkvenrrj3HMVcY9QZgwptyXq0OhLHt-n2y4WYVD3")`,
            }}
          />
          <h1 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Home</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-text-light-primary dark:text-text-dark-primary hover:bg-border-light dark:hover:bg-border-dark transition-colors">
            <Icon name="search" className="text-2xl" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-text-light-primary dark:text-text-dark-primary hover:bg-border-light dark:hover:bg-border-dark transition-colors">
            <Icon name="notifications" className="text-2xl" />
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-6 px-4 pb-8">
        {/* Segmented Control */}
        <div className="flex py-2">
          <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-slate-200/60 dark:bg-card-dark p-1 gap-1">
            {[
              { id: 'favorites' as ListTab, label: 'My Favorites' },
              { id: 'recent' as ListTab, label: 'Recently Viewed' },
              { id: 'team' as ListTab, label: 'Team Activity' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex h-full flex-1 items-center justify-center rounded-md px-2 text-sm font-medium leading-normal transition-all ${
                  activeTab === tab.id
                    ? 'bg-card-light dark:bg-card-dark text-primary dark:text-text-dark-primary shadow-sm'
                    : 'text-text-light-secondary dark:text-text-dark-secondary'
                }`}
              >
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Company List */}
        <section className="flex flex-col gap-2">
          <div className="rounded-xl bg-card-light dark:bg-card-dark shadow-sm overflow-hidden">
            {favoriteCompanies.map((company, idx) => (
              <button
                key={company.id}
                onClick={() => navigate(`/company/${company.id}`)}
                className={`flex w-full cursor-pointer items-center gap-4 px-4 py-3 min-h-[72px] text-left hover:bg-background-light dark:hover:bg-background-dark transition-colors ${
                  idx < favoriteCompanies.length - 1
                    ? 'border-b border-slate-100 dark:border-border-dark'
                    : ''
                }`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${company.logoBg}`}
                  >
                    {company.logoUrl && (
                      <img
                        src={company.logoUrl}
                        alt={`${company.name} logo`}
                        className="h-7 w-7 object-contain"
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <p className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
                      {company.name}
                    </p>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {company.ticker}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p
                    className={`text-base font-medium ${
                      company.positive ? 'text-accent-positive' : 'text-accent-negative'
                    }`}
                  >
                    {company.change}
                  </p>
                  <Icon
                    name="chevron_right"
                    className="text-text-light-secondary dark:text-text-dark-secondary"
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* News Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
              Relevant News
            </h2>
            <a href="#" className="text-sm font-semibold text-primary dark:text-accent">
              See All
            </a>
          </div>
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {homeNews.map((item) => (
              <div key={item.id} className="shrink-0 w-3/4">
                <div className="flex flex-col overflow-hidden rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
                  {item.imageUrl && (
                    <div
                      className="aspect-video w-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${item.imageUrl}")` }}
                    />
                  )}
                  <div className="flex flex-col gap-1 p-3">
                    <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary line-clamp-2">
                      {item.headline}
                    </h3>
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {item.source} · {item.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Insights Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
              Key Insights
            </h2>
            <a href="#" className="text-sm font-semibold text-primary dark:text-accent">
              See All
            </a>
          </div>
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {homeInsights.map((insight) => (
              <div key={insight.id} className="shrink-0 w-[60%]">
                <div className="flex flex-col gap-2 rounded-xl bg-card-light dark:bg-card-dark p-4 shadow-sm h-full">
                  <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary line-clamp-2">
                    {insight.content}
                  </h3>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary line-clamp-3">
                    {insight.id === '1' &&
                      'A review of major acquisitions and their potential impact on market position.'}
                    {insight.id === '2' &&
                      'Salesforce maintains a dominant market share, but new players are emerging.'}
                    {insight.id === '3' &&
                      "Analysis of consumer spending on creative software and platforms like Adobe's Creative Cloud."}
                  </p>
                  <p className="text-xs font-medium text-primary dark:text-accent mt-auto">
                    Source: {insight.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
