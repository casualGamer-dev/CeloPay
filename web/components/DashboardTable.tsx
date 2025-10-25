'use client';

import abi from '../lib/celo.abi.json';
import { fromWeiToCUSD, short, toINRString } from '../lib/utils';
import Copy from './Copy';
import ExplorerLink from './ExplorerLink';
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import toast from 'react-hot-toast';
import { useMemo, useState } from 'react';

import LoanTimeline from './LoanTimeline';
import Drawer from './Drawer';


type LoanRow = {
  rid: `0x${string}`;
  circleId: `0x${string}`;
  borrower: `0x${string}`;
  amountWei: string;
  approvals: `0x${string}`[];
  approved: boolean;
  repaid: boolean;
  timestamp?: number; // unix seconds
};

function Badge({ kind, children }: { kind: 'pending'|'approved'|'repaid'|'role'; children: React.ReactNode }) {
  const cls =
    kind === 'repaid'
      ? 'bg-emerald-100 text-emerald-700'
      : kind === 'approved'
      ? 'bg-sky-100 text-sky-700'
      : kind === 'role'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-1 rounded text-xs ${cls}`}>{children}</span>;
}

function TimeCell({ ts }: { ts?: number }) {
  if (!ts) return <span className="text-xs text-gray-500">—</span>;
  const d = new Date(ts * 1000);
  return <span className="text-xs text-gray-600">{d.toLocaleString()}</span>;
}


export default function DashboardTable({
  contract,
  rows,
  me,
  myCircleIds,
}: {
  contract: `0x${string}`;
  rows: LoanRow[];
  me?: `0x${string}`;
  myCircleIds: Set<string>;
}) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const disabled = !isConnected || !address || isPending;

  // keep the last txHash per requestId in local state
  const [txByReq, setTxByReq] = useState<Record<string, `0x${string}`>>({});

  const myLower = (me || '').toLowerCase();

const [openRid, setOpenRid] = useState<`0x${string}` | null>(null);

const roleTags = (row: LoanRow) => {
  const tags: string[] = [];
  const meL = (me || '').toLowerCase();
  if (!meL) return tags;

  const borrowerL = row.borrower.toLowerCase();
  if (borrowerL === meL) tags.push('Borrower');

  // Approver if your address is among approvals
  if (row.approvals.some(a => a.toLowerCase() === meL)) tags.push('Approver');

  // Member if your wallet belongs to the loan's circle (from myCircleIds)
  if (myCircleIds.has(row.circleId.toLowerCase())) tags.push('Member');

  return tags;
};
  const approveLoan = async (rid: `0x${string}`) => {
    try {
      const hash = await toast.promise(
        writeContractAsync({
          abi, address: contract, functionName: 'approveLoan',
          args: [rid], account: address as `0x${string}`, chain: celoAlfajores,
        }),
        { loading: 'Approving…', success: 'Approval submitted', error: 'Approval failed' }
      ) as `0x${string}`;
      setTxByReq(prev => ({ ...prev, [rid]: hash }));
    } catch {}
  };

  const disburse = async (rid: `0x${string}`) => {
    try {
      const hash = await toast.promise(
        writeContractAsync({
          abi, address: contract, functionName: 'disburse',
          args: [rid], account: address as `0x${string}`, chain: celoAlfajores,
        }),
        { loading: 'Disbursing…', success: 'Disburse submitted', error: 'Disburse failed' }
      ) as `0x${string}`;
      setTxByReq(prev => ({ ...prev, [rid]: hash }));
    } catch {}
  };

  const repay = async (rid: `0x${string}`, amountCUSD: string) => {
    const { toWeiFromCUSD } = await import('../lib/utils');
    try {
      const hash = await toast.promise(
        writeContractAsync({
          abi, address: contract, functionName: 'repay',
          args: [rid, toWeiFromCUSD(amountCUSD)], account: address as `0x${string}`, chain: celoAlfajores,
        }),
        { loading: 'Repaying…', success: 'Repay submitted', error: 'Repay failed' }
      ) as `0x${string}`;
      setTxByReq(prev => ({ ...prev, [rid]: hash }));
    } catch {}
  };

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>requestId</th>
            <th>circleId</th>
            <th>Borrower</th>
            <th>Amount</th>
            <th>Approvals</th>
            <th>Status</th>
            <th>Time</th>
            <th>Roles</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const cUsd = fromWeiToCUSD(BigInt(row.amountWei));
            const inr = toINRString(cUsd);
            const canApprove = !row.repaid && !row.approved;
            const canDisburse = row.approved && !row.repaid;
            const canRepay = !row.repaid;
            const roles = roleTags(row);
            const lastTx = txByReq[row.rid];

            return (
              <tr key={row.rid}>
                <td className="text-xs break-all">
                  {row.rid} <Copy value={row.rid} />
                </td>
                <td className="text-xs">{short(row.circleId)}</td>
                <td className="text-xs">
                  {short(row.borrower)}
                  <div><ExplorerLink addr={row.borrower} /></div>
                </td>
                <td>
                  <div>{cUsd} cUSD</div>
                  <div className="text-xs text-gray-500">{inr}</div>
                </td>
                <td className="text-xs">{row.approvals.map(short).join(', ') || '—'}</td>
                <td>
                  {row.repaid ? (
                    <Badge kind="repaid">Repaid</Badge>
                  ) : row.approved ? (
                    <Badge kind="approved">Approved</Badge>
                  ) : (
                    <Badge kind="pending">Pending</Badge>
                  )}
                </td>
                <td><TimeCell ts={row.timestamp} /></td>
                <td className="space-x-1">
                  {roles.length === 0 ? <span className="text-xs text-gray-400">—</span> :
                    roles.map(r => <Badge key={r} kind="role">{r}</Badge>)
                  }
                </td>
                <td>
                  <div className="flex flex-col md:flex-row gap-2 justify-end">
                    <button className="btn" disabled={disabled || !canApprove} onClick={() => approveLoan(row.rid)}>
                      Approve
                    </button>
                    <button className="btn" disabled={disabled || !canDisburse} onClick={() => disburse(row.rid)} title="Requires cUSD allowance">
                      Disburse
                    </button>
                    <button className="btn" disabled={disabled || !canRepay} onClick={() => repay(row.rid, cUsd)} title="Requires cUSD allowance">
                      Repay
                    </button>
                    <button className="btn" onClick={() => setOpenRid(row.rid)}>Timeline</button>
<a className="btn" href={`/loans?r=${row.rid}`}>Open</a>

{openRid === row.rid && (
  <Drawer open onClose={() => setOpenRid(null)} title={`Timeline – ${row.rid.slice(0,10)}…`}>
    <LoanTimeline requestId={row.rid} />
  </Drawer>
)}
              
                  </div>
                  {lastTx && (
                    <div className="mt-1">
                      <ExplorerLink tx={lastTx} />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-xs text-gray-500 mt-2">
        INR values are approximate for demo. Disburse/Repay require prior cUSD approval to the contract.
      </p>
    </div>
  );
}
