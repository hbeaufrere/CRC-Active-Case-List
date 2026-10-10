'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Test = { id: number; name: string; group: string; frequency: string; note: string };
type Bird = { id: number; caseNumber: string; name: string | null; species: string; location: string | null };
type Rec = { caseId: number; test: string; doneDate: string | null; doneBy: string | null; note: string | null; planned: boolean; status: string; abnormal: boolean };
type Sheet = { caseId: number; planNote: string; prevWeightG: string; weightG: string; bcs: string; findings: string; abnormal: boolean; examDate: string; doneBy: string };
type Grid = { year: string; tests: Test[]; birds: Bird[]; records: Rec[]; sheets: Sheet[]; wnvLot: string; me: string };
type Recent = { key: string; label: string; undo: () => Promise<void> };

const STATUS_LABEL: Record<string, string> = { done: 'Done', failed: 'Tried, failed', deferred: 'Deferred' };
const STATUS_ICON: Record<string, string> = { done: '✓', failed: '✗', deferred: '⏸' };
const STATUS_STYLE: Record<string, string> = {
  done: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  failed: 'bg-amber-50 border-amber-300 text-amber-800',
  deferred: 'bg-slate-100 border-slate-300 text-slate-700',
};

function shiftYear(y: string, by: number) {
  const start = Number(y.slice(0, 4)) + by;
  return `${start}-${String(start + 1).slice(2)}`;
}
function localToday() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function niceDate(d: string | null) {
  if (!d) return '';
  const dt = new Date(d + 'T12:00:00');
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Annual exams of the ambassador birds. The plan comes from the CRC Control Board; here residents and technicians
 *  record each planned item (done / tried, failed / deferred with the reason) and a short exam sheet per bird.
 *  The date, initials (of the person logged in) and WNV lot are set once at the top and used for every entry. */
export default function AnnualExamsTab() {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [error, setError] = useState('');
  const [view, setView] = useState<'checklist' | 'grid'>('checklist');
  const [onlyLeft, setOnlyLeft] = useState(true);
  const [q, setQ] = useState('');
  const [examDate, setExamDate] = useState(() => { try { return sessionStorage.getItem('annual-exam-date') || localToday(); } catch { return localToday(); } });
  const [lot, setLot] = useState('');
  const [recent, setRecent] = useState<Recent[]>([]);
  const [editing, setEditing] = useState<{ bird: Bird; test: string; status: string; date: string; note: string; abnormal: boolean } | null>(null);
  const [sheet, setSheet] = useState<{ bird: Bird; weightG: string; bcs: string; findings: string; abnormal: boolean; examDate: string; prev: string } | null>(null);
  const [adding, setAdding] = useState<Bird | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (y?: string) => {
    setError('');
    const r = await fetch('/api/annual-exams' + (y ? `?year=${encodeURIComponent(y)}` : ''), { cache: 'no-store' });
    if (!r.ok) { setError('Could not load the annual exams — check your connection.'); return; }
    const g: Grid = await r.json();
    setGrid(g); setLot(g.wnvLot || '');
  }, []);
  useEffect(() => { const t = setTimeout(() => { load(); }, 0); return () => clearTimeout(t); }, [load]);

  const rec = useMemo(() => {
    const m = new Map<string, Rec>();
    grid?.records.forEach(r => m.set(`${r.caseId}|${r.test}`, r));
    return m;
  }, [grid]);
  const sheets = useMemo(() => new Map((grid?.sheets || []).map(s => [s.caseId, s])), [grid]);
  const hasPlan = !!grid?.records.some(r => r.planned);

  function itemsFor(b: Bird) {
    return (grid?.tests || []).filter(t => { const r = rec.get(`${b.id}|${t.name}`); return r && (r.planned || r.status); });
  }
  function left(b: Bird) {
    return (grid?.tests || []).filter(t => { const r = rec.get(`${b.id}|${t.name}`); return r?.planned && !r.status; }).length;
  }

  async function putCell(b: Bird, test: string, body: { status: string; doneDate?: string; note?: string; abnormal?: boolean }) {
    const r = await fetch('/api/annual-exams', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: grid!.year, caseId: b.id, test, ...body }) });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Not saved — are you still logged in and online?'); }
  }

  async function quickDone(b: Bird, test: string) {
    const before = rec.get(`${b.id}|${test}`);
    let useLot = lot;
    if (/wnv/i.test(test) && !useLot) {            // asked once per season, then stamped on every booster
      const v = window.prompt('WNV vaccine lot (and expiry) for this exam season:', '');
      if (v === null) return;
      useLot = v.trim();
      if (useLot) await saveLot(useLot);
    }
    const note = /wnv/i.test(test) && useLot ? `Lot ${useLot}` : (before?.note || '');
    try {
      await putCell(b, test, { status: 'done', doneDate: examDate, note });
      setRecent(rs => [{ key: `${b.id}|${test}|${Date.now()}`, label: `${b.name || b.species}: ${test}`,
        undo: () => putCell(b, test, { status: before?.status || '', doneDate: before?.doneDate || '', note: before?.note || '', abnormal: before?.abnormal }) }, ...rs].slice(0, 6));
      load(grid!.year);
    } catch (e) { setError((e as Error).message); }
  }

  async function saveEditing() {
    if (!editing) return;
    if ((editing.status === 'failed' || editing.status === 'deferred') && !editing.note.trim()) { setError('Please give the reason in the note.'); return; }
    setSaving(true);
    try { await putCell(editing.bird, editing.test, { status: editing.status, doneDate: editing.date, note: editing.note, abnormal: editing.abnormal }); setEditing(null); load(grid!.year); }
    catch (e) { setError((e as Error).message); }
    setSaving(false);
  }

  async function saveSheet() {
    if (!sheet) return;
    setSaving(true);
    const r = await fetch('/api/annual-exams/sheet', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: grid!.year, caseId: sheet.bird.id, weightG: sheet.weightG, bcs: sheet.bcs, findings: sheet.findings, abnormal: sheet.abnormal, examDate: sheet.examDate }) });
    setSaving(false);
    if (!r.ok) { setError('Exam sheet not saved — are you still logged in and online?'); return; }
    setSheet(null); load(grid!.year);
  }

  async function saveLot(v: string) {
    setLot(v);
    await fetch('/api/annual-exams/lot', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year: grid!.year, lot: v }) });
  }

  function openItem(b: Bird, test: string) {
    const r = rec.get(`${b.id}|${test}`);
    setEditing({ bird: b, test, status: r?.status || 'done', date: r?.doneDate || examDate, note: r?.note || (/wnv/i.test(test) && lot ? `Lot ${lot}` : ''), abnormal: !!r?.abnormal });
  }
  function openSheet(b: Bird) {
    const s = sheets.get(b.id);
    setSheet({ bird: b, weightG: s?.weightG || '', bcs: s?.bcs || '', findings: s?.findings || '', abnormal: !!s?.abnormal, examDate: s?.examDate || examDate, prev: s?.prevWeightG || '' });
  }

  if (!grid) return <div className="bg-white rounded-lg shadow-sm p-6 text-slate-500 text-sm">{error || 'Loading the annual exams…'}</div>;

  const match = (b: Bird) => !q || `${b.name} ${b.species} ${b.caseNumber} ${b.location}`.toLowerCase().includes(q.toLowerCase());
  const birds = grid.birds.filter(match);
  const planned = grid.records.filter(r => r.planned && grid.birds.some(b => b.id === r.caseId));
  const addressed = planned.filter(r => r.status).length;
  const open = birds.filter(b => !hasPlan || left(b) > 0 || !onlyLeft);
  const complete = hasPlan && onlyLeft ? birds.filter(b => itemsFor(b).length && left(b) === 0) : [];

  const card = (b: Bird) => {
    const s = sheets.get(b.id), items = itemsFor(b), n = left(b);
    return (
      <div key={b.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-800">{b.name || b.species}</div>
            <div className="text-xs text-slate-500">{b.species} · {b.caseNumber}{b.location ? ` · ${b.location}` : ''}</div>
          </div>
          {items.length > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${n ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{n ? `${n} left` : 'complete'}</span>}
        </div>
        {s?.planNote && <div className="text-xs bg-amber-50 text-amber-900 rounded px-2 py-1">Plan: {s.planNote}</div>}
        <button onClick={() => openSheet(b)} className={`w-full text-left text-sm rounded-lg border px-3 py-2 ${s?.abnormal ? 'border-red-300 bg-red-50 text-red-800' : 'border-slate-200 text-slate-600'}`}>
          {s?.weightG ? <><b>{s.weightG} g</b>{s.prevWeightG ? <span className="text-xs text-slate-500"> (before {s.prevWeightG} g)</span> : null}{s.bcs ? ` · BCS ${s.bcs}` : ''}{s.abnormal ? ' · ⚠ abnormal' : ''}{s.findings ? <div className="text-xs mt-0.5">{s.findings}</div> : null}</>
            : <>✎ Weight, body condition, findings{s?.prevWeightG ? <span className="text-xs text-slate-400"> · last {s.prevWeightG} g</span> : null}</>}
        </button>
        <div className="space-y-1.5">
          {items.map(t => {
            const r = rec.get(`${b.id}|${t.name}`)!;
            return r.status ? (
              <button key={t.id} onClick={() => openItem(b, t.name)} className={`w-full flex items-center gap-2 text-left rounded-lg border px-3 py-2.5 text-sm ${STATUS_STYLE[r.status]}`}>
                <span className="text-base w-5 text-center">{STATUS_ICON[r.status]}</span>
                <span className="flex-1">{t.name}{r.abnormal && <span className="ml-1 text-[10px] px-1 rounded bg-red-100 text-red-700 font-semibold">abnormal</span>}{r.note ? <div className="text-xs opacity-80">{r.note}</div> : null}</span>
                <span className="text-xs opacity-80 whitespace-nowrap">{niceDate(r.doneDate)} {r.doneBy}</span>
              </button>
            ) : (
              <div key={t.id} className="flex items-center gap-2">
                <button onClick={() => quickDone(b, t.name)} className="flex-1 flex items-center gap-2 text-left rounded-lg border-2 border-blue-600 px-3 py-2.5 text-sm text-slate-800 active:bg-blue-50">
                  <span className="w-5 h-5 rounded-full border-2 border-blue-600 shrink-0" /> {t.name}
                </button>
                <button onClick={() => openItem(b, t.name)} className="px-3 py-2.5 rounded-lg border border-slate-200 text-slate-500 text-sm" title="Tried, failed / deferred / note">…</button>
              </div>
            );
          })}
          {!items.length && <div className="text-xs text-slate-400">Nothing planned for this bird.</div>}
          <button onClick={() => setAdding(b)} className="text-xs text-blue-700 hover:underline">+ Add an item</button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow-sm p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => load(shiftYear(grid.year, -1))} className="px-2 py-1 rounded hover:bg-slate-100 text-slate-600" title="Previous year">‹</button>
          <div className="font-semibold text-slate-800">Annual exams {grid.year}</div>
          <button onClick={() => load(shiftYear(grid.year, 1))} className="px-2 py-1 rounded hover:bg-slate-100 text-slate-600" title="Next year">›</button>
        </div>
        <div className="text-sm text-slate-500">{addressed} of {planned.length} planned items recorded</div>
        <div className="flex-1 min-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: planned.length ? `${(100 * addressed) / planned.length}%` : '0%' }} /></div>
        <div className="flex rounded-md border border-slate-300 overflow-hidden text-sm">
          {(['checklist', 'grid'] as const).map(v => <button key={v} onClick={() => setView(v)} className={`px-3 py-1 ${view === v ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}>{v === 'checklist' ? 'Checklist' : 'Grid'}</button>)}
        </div>
      </div>

      {/* exam-day header: used for every entry until changed */}
      <div className="sticky top-0 z-20 bg-blue-50 border border-blue-100 rounded-lg p-2 space-y-2 text-sm shadow-sm">
        <div className="grid grid-cols-[1.4fr_0.7fr_1.2fr] gap-2">
          <label className="text-[11px] text-slate-600">Exam date<input type="date" value={examDate} onChange={e => { setExamDate(e.target.value); try { sessionStorage.setItem('annual-exam-date', e.target.value); } catch { /* ignore */ } }} className={`block w-full border rounded px-1.5 py-1 text-sm ${examDate !== localToday() ? 'bg-amber-100 border-amber-400' : 'bg-white'}`} />{examDate !== localToday() && <span className="text-[10px] text-amber-700">not today</span>}</label>
          <div className="text-[11px] text-slate-600">By<span className="block px-1.5 py-1 rounded bg-white border font-semibold text-slate-800 text-sm">{grid.me || '—'}</span></div>
          <label className="text-[11px] text-slate-600">WNV lot<input value={lot} onChange={e => setLot(e.target.value)} onBlur={e => saveLot(e.target.value)} placeholder="lot / exp" className="block w-full border rounded px-1.5 py-1 text-sm bg-white" /></label>
        </div>
        <div className="flex items-center gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a bird…" className="flex-1 min-w-0 border border-slate-300 rounded-md px-2 py-1 text-sm bg-white" />
          <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap"><input type="checkbox" checked={onlyLeft} onChange={e => setOnlyLeft(e.target.checked)} /> Left to do</label>
        </div>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 rounded px-3 py-2">{error} <button onClick={() => setError('')} className="underline ml-2">ok</button></div>}
      {!hasPlan && <div className="text-sm bg-amber-50 text-amber-900 rounded-lg px-3 py-2">No plan yet for {grid.year} — it is prepared in the CRC Control Board. You can still record items with “+ Add an item”.</div>}

      {recent.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-2 text-xs text-slate-600 flex flex-wrap gap-2 items-center">
          <span className="font-medium">Just recorded:</span>
          {recent.map(r => <span key={r.key} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 rounded-full pl-2 pr-1 py-0.5">{r.label}
            <button onClick={async () => { await r.undo(); setRecent(rs => rs.filter(x => x.key !== r.key)); load(grid.year); }} className="ml-1 px-3 py-1 rounded-full bg-white border border-emerald-300 text-emerald-800 font-medium">Undo</button></span>)}
        </div>
      )}

      {view === 'checklist' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{open.map(card)}</div>
          {!open.length && <div className="text-center text-slate-500 text-sm py-6">{onlyLeft && hasPlan ? 'Everything planned is recorded 🎉' : 'No birds match.'}</div>}
          {complete.length > 0 && (
            <details className="bg-white rounded-lg shadow-sm p-3"><summary className="text-sm text-slate-600 cursor-pointer">Complete ({complete.length})</summary>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mt-3">{complete.map(card)}</div></details>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr>
              <th className="text-left px-3 py-2 font-medium sticky left-0 bg-slate-50">Bird</th>
              {grid.tests.map(t => <th key={t.id} className="px-2 py-2 font-medium text-center text-xs" title={t.frequency}>{t.name}</th>)}
            </tr></thead>
            <tbody>
              {birds.map(b => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 sticky left-0 bg-white"><div className="font-medium text-slate-800">{b.name || b.species}</div><div className="text-xs text-slate-500">{b.species} · {b.caseNumber}</div></td>
                  {grid.tests.map(t => {
                    const r = rec.get(`${b.id}|${t.name}`);
                    return (
                      <td key={t.id} className="px-1.5 py-1.5 text-center">
                        <button onClick={() => (r?.planned && !r.status ? quickDone(b, t.name) : openItem(b, t.name))} title={r?.note || ''}
                          className={`min-w-[64px] px-2 py-1 rounded-md border text-xs ${r?.status ? STATUS_STYLE[r.status] + ' font-medium' : r?.planned ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-300'}`}>
                          {r?.status ? <>{STATUS_ICON[r.status]} {niceDate(r.doneDate)} <span className="opacity-70">{r.doneBy}</span></> : r?.planned ? 'to do' : '+'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-500">Tap a blue item when it is done — it takes the exam date and your initials above. “…” or tapping a recorded item lets you mark it tried but failed, or deferred (with the reason), add a result or flag it abnormal.</p>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div><div className="font-semibold text-slate-800">{editing.bird.name || editing.bird.species}</div><div className="text-sm text-slate-500">{editing.test} · {grid.year}</div></div>
            <div className="grid grid-cols-2 gap-2">
              {[...Object.keys(STATUS_LABEL), ''].map(s => (
                <button key={s || 'none'} onClick={() => setEditing({ ...editing, status: s })}
                  className={`py-2 rounded-lg border text-sm ${editing.status === s ? (s ? STATUS_STYLE[s] + ' font-semibold' : 'bg-red-50 border-red-300 text-red-700 font-semibold') : 'border-slate-200 text-slate-600'}`}>
                  {s ? STATUS_LABEL[s] : 'Not done'}</button>
              ))}
            </div>
            {editing.status && <label className="block text-sm">Date<input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} className="mt-1 w-full border rounded-md px-2 py-1.5" /></label>}
            <label className="block text-sm">{editing.status === 'failed' || editing.status === 'deferred' ? 'Reason (required)' : 'Note (optional)'}
              <textarea value={editing.note} onChange={e => setEditing({ ...editing, note: e.target.value })} rows={2} className="mt-1 w-full border rounded-md px-2 py-1.5" placeholder="Result, dose, no sample obtained, bird too stressed…" /></label>
            {editing.status && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.abnormal} onChange={e => setEditing({ ...editing, abnormal: e.target.checked })} /> Abnormal finding</label>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="text-sm px-3 py-1.5 rounded-md border">Cancel</button>
              <button onClick={saveEditing} disabled={saving} className="text-sm px-4 py-1.5 rounded-md bg-blue-700 text-white">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {sheet && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setSheet(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div><div className="font-semibold text-slate-800">{sheet.bird.name || sheet.bird.species}</div><div className="text-sm text-slate-500">Exam sheet · {grid.year}</div></div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">Weight (g)<input inputMode="numeric" value={sheet.weightG} onChange={e => setSheet({ ...sheet, weightG: e.target.value })} className="mt-1 w-full border rounded-md px-2 py-1.5" />
                {sheet.prev && <span className="text-xs text-slate-500">before: {sheet.prev} g{sheet.weightG && Number(sheet.weightG) ? ` (${Number(sheet.weightG) - Number(sheet.prev) >= 0 ? '+' : ''}${Math.round(Number(sheet.weightG) - Number(sheet.prev))} g)` : ''}</span>}</label>
              <label className="block text-sm">Body condition (/9)<input value={sheet.bcs} onChange={e => setSheet({ ...sheet, bcs: e.target.value })} className="mt-1 w-full border rounded-md px-2 py-1.5" /></label>
            </div>
            <label className="block text-sm">Exam date<input type="date" value={sheet.examDate} onChange={e => setSheet({ ...sheet, examDate: e.target.value })} className="mt-1 w-full border rounded-md px-2 py-1.5" /></label>
            <label className="block text-sm">Findings<textarea value={sheet.findings} onChange={e => setSheet({ ...sheet, findings: e.target.value })} rows={3} className="mt-1 w-full border rounded-md px-2 py-1.5" placeholder="Short — e.g. mild bumblefoot R, beak overgrown" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sheet.abnormal} onChange={e => setSheet({ ...sheet, abnormal: e.target.checked })} /> Something abnormal</label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSheet(null)} className="text-sm px-3 py-1.5 rounded-md border">Cancel</button>
              <button onClick={saveSheet} disabled={saving} className="text-sm px-4 py-1.5 rounded-md bg-blue-700 text-white">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setAdding(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4 space-y-2" onClick={e => e.stopPropagation()}>
            <div className="font-semibold text-slate-800">Add an item for {adding.name || adding.species}</div>
            {grid.tests.filter(t => !itemsFor(adding).some(x => x.id === t.id)).map(t => (
              <button key={t.id} onClick={() => { const b = adding; setAdding(null); openItem(b, t.name); }} className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">
                {t.name} <span className="text-xs text-slate-400">{t.group}</span></button>
            ))}
            <button onClick={() => setAdding(null)} className="text-sm text-slate-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
