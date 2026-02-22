'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type TabKey = 'rehab' | 'ambassador' | 'recent' | 'necropsies';

export default function DashboardTabs({
  rehabCount,
  ambassadorCount,
  recentCount,
  necropsyCount,
}: {
  rehabCount: number;
  ambassadorCount: number;
  recentCount: number;
  necropsyCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabKey) || (searchParams.get('category') as TabKey) || 'rehab';

  function switchTab(tab: TabKey) {
    const params = new URLSearchParams();
    if (tab === 'rehab' || tab === 'ambassador') {
      params.set('category', tab);
    } else {
      params.set('tab', tab);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'rehab', label: 'Rehabilitation', count: rehabCount },
    { key: 'ambassador', label: 'Ambassadors', count: ambassadorCount },
    { key: 'recent', label: 'Recent Changes', count: recentCount },
    { key: 'necropsies', label: 'Necropsies', count: necropsyCount },
  ];

  return (
    <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => switchTab(tab.key)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? 'bg-white text-blue-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          {tab.label}
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            activeTab === tab.key
              ? 'bg-blue-100 text-blue-800'
              : 'bg-slate-200 text-slate-600'
          }`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
