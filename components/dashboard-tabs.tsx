'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Category } from '@/types';

export default function DashboardTabs({
  rehabCount,
  ambassadorCount,
}: {
  rehabCount: number;
  ambassadorCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('category') as Category) || 'rehab';

  function switchTab(category: Category) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', category);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
      <button
        onClick={() => switchTab('rehab')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'rehab'
            ? 'bg-white text-amber-800 shadow-sm'
            : 'text-slate-600 hover:text-slate-800'
        }`}
      >
        Rehabilitation
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          activeTab === 'rehab'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-slate-200 text-slate-600'
        }`}>
          {rehabCount}
        </span>
      </button>
      <button
        onClick={() => switchTab('ambassador')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'ambassador'
            ? 'bg-white text-amber-800 shadow-sm'
            : 'text-slate-600 hover:text-slate-800'
        }`}
      >
        Ambassadors
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          activeTab === 'ambassador'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-slate-200 text-slate-600'
        }`}>
          {ambassadorCount}
        </span>
      </button>
    </div>
  );
}
