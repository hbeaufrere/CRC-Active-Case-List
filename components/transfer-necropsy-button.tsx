'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TransferNecropsyButton({ caseId }: { caseId: number }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [dateDied, setDateDied] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  async function handleTransfer() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/transfer-necropsy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateDied }),
      });

      if (res.ok) {
        router.push('/dashboard?tab=necropsies');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to transfer');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateDied}
          onChange={e => setDateDied(e.target.value)}
          className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
        />
        <button
          onClick={handleTransfer}
          disabled={loading}
          className="px-3 py-1.5 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Transferring...' : 'Confirm'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
    >
      Transfer to Necropsy
    </button>
  );
}
