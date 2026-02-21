'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Case, Category, Status, Urgency } from '@/types';
import { URGENCY_CONFIG, STATUS_CONFIG } from '@/lib/constants';

interface CaseFormProps {
  initialData?: Partial<Case>;
  mode: 'create' | 'edit';
  caseId?: number;
}

export default function CaseForm({ initialData, mode, caseId }: CaseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [speciesList, setSpeciesList] = useState<{ id: number; commonName: string; scientificName: string | null }[]>([]);

  const [form, setForm] = useState({
    category: initialData?.category || 'rehab' as Category,
    species: initialData?.species || '',
    commonName: initialData?.commonName || '',
    bandNumber: initialData?.bandNumber || '',
    activeProblems: initialData?.activeProblems || '',
    currentTreatments: initialData?.currentTreatments || '',
    plan: initialData?.plan || '',
    nextFollowUpDate: initialData?.nextFollowUpDate || '',
    followUpNotes: initialData?.followUpNotes || '',
    status: initialData?.status || 'active' as Status,
    urgency: initialData?.urgency || 'moderate' as Urgency,
    intakeDate: initialData?.intakeDate || new Date().toISOString().split('T')[0],
    intakeReason: initialData?.intakeReason || '',
    caseNumber: initialData?.caseNumber || '',
    externalLink: initialData?.externalLink || '',
  });

  useEffect(() => {
    fetch('/api/species')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSpeciesList(data);
      })
      .catch(() => {});
  }, []);

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = mode === 'create' ? '/api/cases' : `/api/cases/${caseId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const body = {
        ...form,
        commonName: form.commonName || null,
        bandNumber: form.bandNumber || null,
        nextFollowUpDate: form.nextFollowUpDate || null,
        followUpNotes: form.followUpNotes || null,
        intakeReason: form.intakeReason || null,
        externalLink: form.externalLink || null,
        caseNumber: form.caseNumber,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save case');
        return;
      }

      const result = await res.json();
      if (mode === 'create') {
        router.push(`/cases/${result.id}`);
      } else {
        router.push(`/cases/${caseId}`);
      }
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category and Case Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <div className="flex gap-4">
            {(['rehab', 'ambassador'] as Category[]).map(cat => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={form.category === cat}
                  onChange={e => updateField('category', e.target.value)}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm capitalize">{cat === 'rehab' ? 'Rehabilitation' : 'Ambassador'}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Case Number *</label>
          <input
            type="text"
            value={form.caseNumber}
            onChange={e => updateField('caseNumber', e.target.value)}
            required
            placeholder="Enter case number from your system"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
            readOnly={mode === 'edit'}
          />
        </div>
      </div>

      {/* Species and Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Species *</label>
          <input
            list="species-list"
            type="text"
            value={form.species}
            onChange={e => updateField('species', e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
            placeholder="Start typing..."
          />
          <datalist id="species-list">
            {speciesList.map(s => (
              <option key={s.id} value={s.commonName} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nickname</label>
          <input
            type="text"
            value={form.commonName}
            onChange={e => updateField('commonName', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
            placeholder='e.g. "Apollo"'
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Band/ID Number</label>
          <input
            type="text"
            value={form.bandNumber}
            onChange={e => updateField('bandNumber', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
          />
        </div>
      </div>

      {/* Medical fields */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Active Problems *</label>
        <textarea
          value={form.activeProblems}
          onChange={e => updateField('activeProblems', e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
          placeholder="Current medical issues..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Current Treatments *</label>
        <textarea
          value={form.currentTreatments}
          onChange={e => updateField('currentTreatments', e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
          placeholder="Medications, therapies..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Plan *</label>
        <textarea
          value={form.plan}
          onChange={e => updateField('plan', e.target.value)}
          required
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
          placeholder="Next steps..."
        />
      </div>

      {/* Follow-up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Next Follow-up Date</label>
          <input
            type="date"
            value={form.nextFollowUpDate}
            onChange={e => updateField('nextFollowUpDate', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Notes</label>
          <input
            type="text"
            value={form.followUpNotes}
            onChange={e => updateField('followUpNotes', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
            placeholder="What to do at follow-up..."
          />
        </div>
      </div>

      {/* Status and Urgency */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
          <select
            value={form.urgency}
            onChange={e => updateField('urgency', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm bg-white"
          >
            {(Object.entries(URGENCY_CONFIG) as [Urgency, typeof URGENCY_CONFIG[Urgency]][]).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={e => updateField('status', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm bg-white"
          >
            {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Intake Date</label>
          <input
            type="date"
            value={form.intakeDate}
            onChange={e => updateField('intakeDate', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Intake Reason</label>
        <input
          type="text"
          value={form.intakeReason}
          onChange={e => updateField('intakeReason', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
          placeholder="Why the bird was admitted..."
        />
      </div>

      {/* External System Link */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">External System Link</label>
        <input
          type="url"
          value={form.externalLink}
          onChange={e => updateField('externalLink', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
          placeholder="Paste link to this case in your system (e.g. https://...)"
        />
      </div>

      {/* Error and submit */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Case' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
