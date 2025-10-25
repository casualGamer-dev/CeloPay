// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { fetchRecentEvents, publicClient } from '../../../lib/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // ensure viem can run

export async function GET() {
  const addr = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;
  if (!addr) return NextResponse.json({ ok: false, error: 'Missing contract' }, { status: 400 });

  const events = await fetchRecentEvents(addr);

  // reconstruct
  const circles = new Map<string, { name: string; createdBy: string; members: Set<string> }>();
  const loans = new Map<string, {
    circleId: string; borrower: string; amount: bigint;
    approvals: Set<string>; approved: boolean; repaid: boolean; firstBlock?: bigint;
  }>();

  for (const e of events) {
    if (e.eventName === 'CircleCreated') {
      circles.set(e.args.circleId, {
        name: e.args.name, createdBy: e.args.createdBy, members: new Set([e.args.createdBy]),
      });
    } else if (e.eventName === 'MemberJoined') {
      if (!circles.has(e.args.circleId)) circles.set(e.args.circleId, { name: 'Unknown', createdBy: '0x0', members: new Set() });
      circles.get(e.args.circleId)!.members.add(e.args.member);
    } else if (e.eventName === 'LoanRequested') {
      loans.set(e.args.requestId, {
        circleId: e.args.circleId, borrower: e.args.borrower, amount: BigInt(e.args.amount),
        approvals: new Set(), approved: false, repaid: false, firstBlock: e.blockNumber,
      });
    } else if (e.eventName === 'LoanApproved') {
      const l = loans.get(e.args.requestId); if (l) l.approvals.add(e.args.approver);
    } else if (e.eventName === 'LoanFinalized') {
      const l = loans.get(e.args.requestId); if (l) l.approved = true;
    } else if (e.eventName === 'LoanRepaid') {
      const l = loans.get(e.args.requestId); if (l) l.repaid = true;
    }
  }

  // timestamps
  const needBlocks = new Set<string>();
  for (const [, l] of loans) if (l.firstBlock) needBlocks.add(l.firstBlock.toString());
  const blockTimeMap = new Map<string, number>();
  await Promise.all([...needBlocks].map(async (bnStr) => {
    const b = await publicClient.getBlock({ blockNumber: BigInt(bnStr) });
    blockTimeMap.set(bnStr, Number(b.timestamp));
  }));

  const circleRows = [...circles.entries()].map(([id, c]) => ({
    id, name: c.name, createdBy: c.createdBy, members: [...c.members],
  }));

  const loanRows = [...loans.entries()].map(([rid, l]) => ({
    rid, circleId: l.circleId, borrower: l.borrower,
    amountWei: l.amount.toString(), approvals: [...l.approvals],
    approved: l.approved, repaid: l.repaid,
    timestamp: l.firstBlock ? blockTimeMap.get(l.firstBlock.toString()) : undefined,
  }));

  return NextResponse.json({ ok: true, data: { contract: addr, circleRows, loanRows } });
}
