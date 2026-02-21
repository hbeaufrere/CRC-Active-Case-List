'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Urgency } from '@/types';
import { URGENCY_CONFIG } from '@/lib/constants';

export default function SearchFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams('search', search);
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cases..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </form>
      <select
        value={searchParams.get('urgency') || ''}
        onChange={e => updateParams('urgency', e.target.value)}
        className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
      >
        <option value="">All Urgencies</option>
        {(Object.entries(URGENCY_CONFIG) as [Urgency, typeof URGENCY_CONFIG[Urgency]][]).map(([key, val]) => (
          <option key={key} value={key}>{val.label}</option>
        ))}
      </select>
      {(searchParams.get('search') || searchParams.get('urgency')) && (
        <button
          onClick={() => {
            setSearch('');
            const params = new URLSearchParams(searchParams.toString());
            params.delete('search');
            params.delete('urgency');
            router.push(`/dashboard?${params.toString()}`);
          }}
          className="text-sm text-slate-500 hover:text-slate-700 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
