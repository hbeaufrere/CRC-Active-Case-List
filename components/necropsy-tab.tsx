'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Necropsy } from '@/types';
import { formatDateTime } from '@/lib/utils';

type NecSortColumn = 'species' | 'dateDied' | 'status';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <svg className={`inline w-3.5 h-3.5 ml-1 ${active ? 'text-blue-700' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {direction === 'asc' || !active ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={active && direction === 'desc' ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'} />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );
}

export default function NecropsyTab() {
  const [necropsies, setNecropsies] = useState<Necropsy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [speciesList, setSpeciesList] = useState<{ id: number; commonName: string }[]>([]);
  const [sortColumn, setSortColumn] = useState<NecSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  function handleSort(column: NecSortColumn) {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  const sortedNecropsies = useMemo(() => {
    if (!sortColumn) return necropsies;
    return [...necropsies].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'species':
          cmp = a.species.localeCompare(b.species);
          break;
        case 'dateDied':
          cmp = a.dateDied.localeCompare(b.dateDied);
          break;
        case 'status':
          cmp = (a.isFinal ? 1 : 0) - (b.isFinal ? 1 : 0);
          break;
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });
  }, [necropsies, sortColumn, sortDirection]);

  const emptyForm = {
    dateDied: new Date().toISOString().split('T')[0],
    vmthId: '',
    wrmdId: '',
    species: '',
    clinicalProblems: '',
    results: '',
    isFinal: false,
    necropsyLink: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchNecropsies();
    fetch('/api/species')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSpeciesList(data); })
      .catch(() => {});
  }, []);

  async function fetchNecropsies() {
    try {
      const res = await fetch('/api/necropsies');
      if (res.ok) {
        const data = await res.json();
        setNecropsies(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function startEdit(n: Necropsy) {
    setForm({
      dateDied: n.dateDied,
      vmthId: n.vmthId,
      wrmdId: n.wrmdId || '',
      species: n.species,
      clinicalProblems: n.clinicalProblems,
      results: n.results || '',
      isFinal: n.isFinal || false,
      necropsyLink: n.necropsyLink || '',
    });
    setEditingId(n.id);
    setShowForm(true);
    setError('');
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const url = editingId ? `/api/necropsies/${editingId}` : '/api/necropsies';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }

      cancelForm();
      fetchNecropsies();
    } catch {
      setError('Network error. Please try again.');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this necropsy record?')) return;

    try {
      const res = await fetch(`/api/necropsies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNecropsies();
      }
    } catch {
      // ignore
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading...</div>;
  }

  return (
    <div>
      {/* Add/Edit Form */}
      {showForm ? (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            {editingId ? 'Edit Necropsy Record' : 'New Necropsy Record'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date Died/Euthanized *</label>
                <input
                  type="date"
                  value={form.dateDied}
                  onChange={e => setForm(p => ({ ...p, dateDied: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">VMACS ID *</label>
                <input
                  type="text"
                  value={form.vmthId}
                  onChange={e => setForm(p => ({ ...p, vmthId: e.target.value }))}
                  required
                  placeholder="VMACS case number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WRMD ID</label>
                <input
                  type="text"
                  value={form.wrmdId}
                  onChange={e => setForm(p => ({ ...p, wrmdId: e.target.value }))}
                  placeholder="WRMD case number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Species *</label>
              <input
                list="necropsy-species-list"
                type="text"
                value={form.species}
                onChange={e => setForm(p => ({ ...p, species: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="Start typing..."
              />
              <datalist id="necropsy-species-list">
                {speciesList.map(s => (
                  <option key={s.id} value={s.commonName} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Problems *</label>
              <textarea
                value={form.clinicalProblems}
                onChange={e => setForm(p => ({ ...p, clinicalProblems: e.target.value }))}
                required
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="Clinical problems..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prelim/Final Results</label>
              <textarea
                value={form.results}
                onChange={e => setForm(p => ({ ...p, results: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="Necropsy results..."
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFinal}
                  onChange={e => setForm(p => ({ ...p, isFinal: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Final results</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Necropsy Link</label>
              <input
                type="url"
                value={form.necropsyLink}
                onChange={e => setForm(p => ({ ...p, necropsyLink: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="https://..."
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
              >
                {editingId ? 'Save Changes' : 'Add Record'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-4">
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Necropsy
          </button>
        </div>
      )}

      {/* Necropsy List */}
      {necropsies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500 text-lg">No necropsy records</p>
          <p className="text-slate-400 text-sm mt-1">Click &quot;New Necropsy&quot; to add one</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-3 text-left font-semibold text-slate-600 cursor-pointer select-none hover:text-blue-700 transition-colors" onClick={() => handleSort('dateDied')}>
                    Date
                    <SortIcon active={sortColumn === 'dateDied'} direction={sortDirection} />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600">VMACS ID</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden sm:table-cell">WRMD ID</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600 cursor-pointer select-none hover:text-blue-700 transition-colors" onClick={() => handleSort('species')}>
                    Species
                    <SortIcon active={sortColumn === 'species'} direction={sortDirection} />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Clinical Problems</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Results</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600 cursor-pointer select-none hover:text-blue-700 transition-colors" onClick={() => handleSort('status')}>
                    Status
                    <SortIcon active={sortColumn === 'status'} direction={sortDirection} />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden sm:table-cell">Updated</th>
                  <th className="px-3 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedNecropsies.map(n => (
                  <tr key={n.id} onClick={() => startEdit(n)} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-3 py-3 whitespace-nowrap">{n.dateDied}</td>
                    <td className="px-3 py-3 font-medium text-blue-700">{n.vmthId}</td>
                    <td className="px-3 py-3 hidden sm:table-cell text-slate-600">{n.wrmdId || '—'}</td>
                    <td className="px-3 py-3">{n.species}</td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="max-w-xs truncate text-slate-600" title={n.clinicalProblems}>
                        {n.clinicalProblems}
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <div className="max-w-xs truncate text-slate-600" title={n.results || ''}>
                        {n.results || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {n.isFinal ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Final</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Prelim</span>
                      )}
                      {n.necropsyLink && (
                        <a href={n.necropsyLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline">
                          Link
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <div className="text-xs text-slate-500">{formatDateTime(n.updatedAt)}</div>
                      <div className="text-xs text-slate-400">by {n.updatedBy}</div>
                    </td>
                    <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => startEdit(n)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
