'use client';

import useSWR, { mutate } from 'swr';
import { useAccount } from 'wagmi';
import DashboardTable from './DashboardTable';
import Copy from './Copy';
import { short } from '../lib/utils';
import { useMemo, useState } from 'react';

type CircleRow = { id: `0x${string}`; name: string; createdBy: `0x${string}`; members: `0x${string}`[]; };
type LoanRow = {
  rid: `0x${string}`; circleId: `0x${string}`; borrower: `0x${string}`;
  amountWei: string; approvals: `0x${string}`[]; approved: boolean; repaid: boolean; timestamp?: number;
};

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function DashboardClient({ data }: { data: { contract: `0x${string}`; circleRows: CircleRow[]; loanRows: LoanRow[] } }) {
  const { address } = useAccount();
  const [onlyMine, setOnlyMine] = useState(true);

  // live data (poll every 10s)
  const { data: live, isLoading } = useSWR('/api/dashboard', fetcher, { refreshInterval: 10_000, fallbackData: { ok: true, data } });

  const me = (address || '').toLowerCase();
  const rows = live?.data ?? data;

  const myCircles = useMemo(() => {
    if (!onlyMine || !me) return rows.circleRows;
    return rows.circleRows.filter(c => c.members.some(m => m.toLowerCase() === me));
  }, [rows.circleRows, onlyMine, me]);

  const myLoans = useMemo(() => {
    if (!onlyMine || !me) return rows.loanRows;
    const circleIds = new Set(myCircles.map(c => c.id.toLowerCase()));
    return rows.loanRows.filter(l =>
      l.borrower.toLowerCase() === me ||
      l.approvals.some(a => a.toLowerCase() === me) ||
      circleIds.has(l.circleId.toLowerCase())
    );
  }, [rows.loanRows, myCircles, onlyMine, me]);

  return (
    
    <div className="space-y-8">


   




    <div className="flex items-center gap-3">
    {address ? (
      <span className="text-xs text-gray-600">You are: {address}</span>
    ) : (
      <span className="text-xs text-gray-500">Connect wallet</span>
    )}
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={onlyMine} onChange={e => setOnlyMine(e.target.checked)} />
      Only mine
    </label>
    <button className="btn btn-sm" onClick={() => mutate()} disabled={isLoading}>
      {isLoading ? 'Refreshing…' : 'Refresh'}
    </button>
  </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Circles</h2>
          {isLoading && <span className="text-xs text-gray-500">Refreshing…</span>}
        </div>
        {myCircles.length === 0 ? (
          <div className="text-sm text-gray-600">No circles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>circleId</th><th>Name</th><th>Creator</th><th>Members</th></tr></thead>
              <tbody>
                {myCircles.map((row) => (
                  <tr key={row.id}>
                    <td className="text-xs break-all">{row.id} <Copy value={row.id} /></td>
                    <td>{row.name}</td>
                    <td className="text-xs">{short(row.createdBy)}</td>
                    <td className="text-xs">{row.members.map(short).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Loans</h2>
          {isLoading && <span className="text-xs text-gray-500">Refreshing…</span>}
        </div>
        <DashboardTable contract={rows.contract} rows={myLoans} />
      </div>
    </div>
  );
}
