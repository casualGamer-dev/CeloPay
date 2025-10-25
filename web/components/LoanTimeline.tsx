'use client';

import { useEffect, useState } from 'react';
import ExplorerLink from './ExplorerLink';

type Item = {
  name: string;
  args: Record<string, any>;
  txHash: `0x${string}`;
  blockNumber: bigint;
  timestamp?: number;
};

export default function LoanTimeline({
  requestId,
  open,
  onClose,
}: {
  requestId: `0x${string}`;
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const r = await fetch(`/api/loan/${requestId}`);
        const j = await r.json();
        if (!active) return;
        setItems(j.ok ? j.data : []);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (open) load();
    return () => { active = false; };
  }, [open, requestId]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      {/* backdrop */}
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      {/* panel */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg">Loan Timeline</h3>
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-56px)]">
          <div className="text-xs text-gray-500 break-all">requestId: {requestId}</div>
          {loading && <div className="text-sm">Loading events…</div>}
          {!loading && (!items || items.length === 0) && <div className="text-sm text-gray-600">No events yet.</div>}
          {!loading && items && items.map((it, i) => {
            const ts = it.timestamp ? new Date(it.timestamp * 1000).toLocaleString() : '—';
            return (
              <div key={i} className="border rounded p-3">
                <div className="text-sm font-medium">{it.name}</div>
                <div className="text-xs text-gray-600">{ts}</div>
                <div className="mt-2 text-xs space-y-1">
                  {Object.entries(it.args).map(([k,v]) => (
                    <div key={k}><span className="text-gray-500">{k}:</span> <span className="break-all">{String(v)}</span></div>
                  ))}
                </div>
                <div className="mt-2"><ExplorerLink tx={it.txHash} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
