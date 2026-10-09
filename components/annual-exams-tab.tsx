'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Test = { id: number; name: string; frequency: string | null; note: string | null };
type Bird = { id: number; caseNumber: string; name: string | null; species: string; location: string | null };
type Rec = { caseId: number; test: string; doneDate: string | null; doneBy: string | null; note: string | null };
type Grid = { year: string; tests: Test[]; birds: Bird[]; records: Rec[] };

function shiftYear(y: string, by: number) {
  const start = Number(y.slice(0, 4)) + by;
  return `${start}-${String(start + 1).slice(2)}`;
}
function niceDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Annual exams of the ambassador birds: one row per bird, one column per test of the current strategy.
 *  Tap a box to record the date (and a note); the initials of the person logged in are saved with it. */
export default function AnnualExamsTab() {
  const [year, setYear] = useState<string>('');
  const [grid, setGrid] = useState<Grid | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ bird: Bird; test: string; date: string; note: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [planDraft, setPlanDraft] = useState<{ name: string; frequency: string; note: string }[] | null>(null);
  const [q, setQ] = useState('');

  const load = useCallback(async (y?: string) => {
    setError('');
    const r = await fetch('/api/annual-exams' + (y ? `?year=${encodeURIComponent(y)}` : ''), { cache: 'no-store' });
    if (!r.ok) { setError('Could not load the annual exams.'); return; }
    const g: Grid = await r.json();
    setGrid(g); setYear(g.year);
  }, []);
  useEffect(() => { load(); }, [load]);

  const cell = useMemo(() => {
    const m = new Map<string, Rec>();
    grid?.records.forEach(r => m.set(`${r.caseId}|${r.test}`, r));
    return m;
  }, [grid]);

  const birds = (grid?.birds || []).filter(b => !q || `${b.name} ${b.species} ${b.caseNumber} ${b.location}`.toLowerCase().includes(q.toLowerCase()));
  const total = (grid?.birds.length || 0) * (grid?.tests.length || 0);
  const done = grid ? grid.records.filter(r => r.doneDate && grid.birds.some(b => b.id === r.caseId) && grid.tests.some(t => t.name === r.test)).length : 0;

  async function save(clear = false) {
    if (!editing || !grid) return;
    setSaving(true);
    const r = await fetch('/api/annual-exams', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: grid.year, caseId: editing.bird.id, test: editing.test, doneDate: clear ? '' : editing.date, note: clear ? '' : editing.note }) });
    setSaving(false);
    if (!r.ok) { setError('Could not save — are you still logged in?'); return; }
    setEditing(null); load(grid.year);
  }

  async function savePlan() {
    if (!planDraft) return;
    const r = await fetch('/api/annual-exams/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tests: planDraft }) });
    if (r.ok) { setPlanDraft(null); load(year); }
  }

  if (!grid) return <div className="bg-white rounded-lg shadow-sm p-6 text-slate-500 text-sm">{error || 'Loading the annual exams…'}</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => load(shiftYear(year, -1))} className="px-2 py-1 rounded hover:bg-slate-100 text-slate-600" title="Previous year">‹</button>
          <div className="font-semibold text-slate-800">Annual exams {year}</div>
          <button onClick={() => load(shiftYear(year, 1))} className="px-2 py-1 rounded hover:bg-slate-100 text-slate-600" title="Next year">›</button>
        </div>
        <div className="text-sm text-slate-500">{done} of {total} done</div>
        <div className="flex-1 min-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: total ? `${(100 * done) / total}%` : '0%' }} /></div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a bird…" className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-44" />
        <button onClick={() => setShowPlan(s => !s)} className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50">{showPlan ? 'Hide' : 'Show'} the strategy</button>
      </div>

      {showPlan && (
        <div className="bg-white rounded-lg shadow-sm p-4 text-sm">
          <div className="flex items-center justify-between mb-2"><div className="font-semibold text-slate-800">Current strategy (what each annual exam includes)</div>
            {!planDraft ? <button onClick={() => setPlanDraft(grid.tests.map(t => ({ name: t.name, frequency: t.frequency || '', note: t.note || '' })))} className="text-blue-700 hover:underline">Edit</button>
              : <div className="flex gap-2"><button onClick={() => setPlanDraft([...planDraft, { name: '', frequency: '', note: '' }])} className="text-blue-700 hover:underline">+ Add a test</button><button onClick={savePlan} className="px-3 py-1 bg-blue-700 text-white rounded-md">Save</button><button onClick={() => setPlanDraft(null)} className="text-slate-500">Cancel</button></div>}</div>
          {!planDraft ? (
            <ul className="divide-y divide-slate-100">{grid.tests.map(t => <li key={t.id} className="py-1.5"><span className="font-medium">{t.name}</span> — {t.frequency}{t.note && <div className="text-xs text-slate-500">{t.note}</div>}</li>)}</ul>
          ) : (
            <div className="space-y-2">{planDraft.map((t, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_1.6fr_auto] gap-2">
                <input value={t.name} placeholder="Test" onChange={e => setPlanDraft(planDraft.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="border rounded px-2 py-1" />
                <input value={t.frequency} placeholder="How often" onChange={e => setPlanDraft(planDraft.map((x, j) => j === i ? { ...x, frequency: e.target.value } : x))} className="border rounded px-2 py-1" />
                <input value={t.note} placeholder="Note" onChange={e => setPlanDraft(planDraft.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} className="border rounded px-2 py-1" />
                <button onClick={() => setPlanDraft(planDraft.filter((_, j) => j !== i))} className="text-red-600 px-2" title="Remove">✕</button></div>))}
              <p className="text-xs text-slate-500">Removing a test hides its column; what was recorded is kept.</p></div>
          )}
        </div>
      )}

      {error && <div className="text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr>
            <th className="text-left px-3 py-2 font-medium sticky left-0 bg-slate-50">Bird</th>
            {grid.tests.map(t => <th key={t.id} className="px-2 py-2 font-medium text-center text-xs" title={`${t.frequency || ''}${t.note ? ' — ' + t.note : ''}`}>{t.name}</th>)}
          </tr></thead>
          <tbody>
            {birds.map(b => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="px-3 py-2 sticky left-0 bg-white"><div className="font-medium text-slate-800">{b.name || b.species}</div><div className="text-xs text-slate-500">{b.species} · {b.caseNumber}{b.location ? ` · ${b.location}` : ''}</div></td>
                {grid.tests.map(t => {
                  const r = cell.get(`${b.id}|${t.name}`);
                  const isDone = !!r?.doneDate;
                  return (
                    <td key={t.id} className="px-1.5 py-1.5 text-center">
                      <button onClick={() => setEditing({ bird: b, test: t.name, date: r?.doneDate || new Date().toISOString().slice(0, 10), note: r?.note || '' })}
                        title={r?.note || ''}
                        className={`min-w-[72px] px-2 py-1 rounded-md border text-xs ${isDone ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                        {isDone ? <>✓ {niceDate(r!.doneDate!)}{r?.doneBy ? <span className="opacity-70"> {r.doneBy}</span> : null}{r?.note ? ' •' : ''}</> : '—'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            {!birds.length && <tr><td colSpan={grid.tests.length + 1} className="px-3 py-6 text-center text-slate-500">No ambassador birds{q ? ' match' : ' in the list yet (add them on the Ambassadors tab)'}.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Tap a box to record a test: the date and your initials are saved; add a note if useful (results, dose, “no sample”). The columns follow the strategy above.</p>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div><div className="font-semibold text-slate-800">{editing.bird.name || editing.bird.species}</div><div className="text-sm text-slate-500">{editing.test} · {year}</div></div>
            <label className="block text-sm">Date done<input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} className="mt-1 w-full border rounded-md px-2 py-1.5" /></label>
            <label className="block text-sm">Note (optional)<textarea value={editing.note} onChange={e => setEditing({ ...editing, note: e.target.value })} rows={3} className="mt-1 w-full border rounded-md px-2 py-1.5" placeholder="Results, dose, no sample obtained…" /></label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => save(true)} disabled={saving} className="mr-auto text-sm text-red-700 hover:underline">Clear</button>
              <button onClick={() => setEditing(null)} className="text-sm px-3 py-1.5 rounded-md border">Cancel</button>
              <button onClick={() => save(false)} disabled={saving || !editing.date} className="text-sm px-3 py-1.5 rounded-md bg-blue-700 text-white">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
