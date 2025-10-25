import { fetchRecentEvents } from '../../lib/events';
import Copy from '../../components/Copy';
import { short, fromWeiToCUSD } from '../../lib/utils';

const addr = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  if (!addr) return <div className="card p-6">Set NEXT_PUBLIC_CELO_ADDRESS to enable on-chain views.</div>;

  const events = await fetchRecentEvents(addr);

  // basic reconstructions
  const circles = new Map<string, { name: string; createdBy: string }>();
  const members = new Map<string, Set<string>>();
  const loans = new Map<string, {
    circleId: string; borrower: string; amount: bigint;
    approvals: Set<string>; approved: boolean; repaid: boolean;
  }>();

  for (const e of events) {
    if (e.eventName === 'CircleCreated') {
      circles.set(e.args.circleId, { name: e.args.name, createdBy: e.args.createdBy });
      if (!members.has(e.args.circleId)) members.set(e.args.circleId, new Set());
      members.get(e.args.circleId)!.add(e.args.createdBy);
    }
    if (e.eventName === 'MemberJoined') {
      if (!members.has(e.args.circleId)) members.set(e.args.circleId, new Set());
      members.get(e.args.circleId)!.add(e.args.member);
    }
    if (e.eventName === 'LoanRequested') {
      loans.set(e.args.requestId, {
        circleId: e.args.circleId,
        borrower: e.args.borrower,
        amount: BigInt(e.args.amount),
        approvals: new Set(),
        approved: false,
        repaid: false,
      });
    }
    if (e.eventName === 'LoanApproved') {
      const l = loans.get(e.args.requestId); if (l) l.approvals.add(e.args.approver);
    }
    if (e.eventName === 'LoanFinalized') {
      const l = loans.get(e.args.requestId); if (l) l.approved = true;
    }
    if (e.eventName === 'LoanRepaid') {
      const l = loans.get(e.args.requestId); if (l) l.repaid = true;
    }
  }

  const circleRows = [...circles.entries()].map(([id, c]) => ({
    id, ...c, members: [...(members.get(id)||new Set())]
  }));

  const loanRows = [...loans.entries()].map(([rid, l]) => ({
    rid, ...l, approvals: [...l.approvals]
  }));

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">My Circles (from chain)</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>circleId</th><th>Name</th><th>Creator</th><th>Members</th></tr></thead>
            <tbody>
              {circleRows.map(row => (
                <tr key={row.id}>
                  <td className="text-xs break-all">{row.id} <Copy value={row.id}/></td>
                  <td>{row.name}</td>
                  <td className="text-xs">{short(row.createdBy)}</td>
                  <td className="text-xs">{row.members.map(short).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">My Loans (from chain)</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>requestId</th><th>circleId</th><th>Borrower</th><th>Amount</th><th>Approvals</th><th>Status</th></tr></thead>
            <tbody>
              {loanRows.map(row => (
                <tr key={row.rid}>
                  <td className="text-xs break-all">{row.rid} <Copy value={row.rid}/></td>
                  <td className="text-xs">{short(row.circleId)}</td>
                  <td className="text-xs">{short(row.borrower)}</td>
                  <td>{fromWeiToCUSD(row.amount)} cUSD</td>
                  <td className="text-xs">{row.approvals.map(short).join(', ') || '—'}</td>
                  <td>
                    {row.repaid ? 'Repaid' : row.approved ? 'Approved' : 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Note: “My” scope is inferred from chain events; filtering to wallet will be added next if you want.
        </p>
      </div>
    </div>
  );
}
