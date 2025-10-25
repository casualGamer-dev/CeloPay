// app/api/loan/[rid]/route.ts
import { NextResponse } from 'next/server';
import { publicClient } from '../../../../lib/events';
import { parseAbiItem } from 'viem';

const LoanRequested = parseAbiItem(
  'event LoanRequested(bytes32 requestId, bytes32 circleId, address borrower, uint256 amount)'
);
const LoanApproved = parseAbiItem(
  'event LoanApproved(bytes32 requestId, address approver)'
);
const LoanFinalized = parseAbiItem(
  'event LoanFinalized(bytes32 requestId)'
);
const LoanRepaid = parseAbiItem(
  'event LoanRepaid(bytes32 requestId, address payer)'
);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { rid: string } }) {
  const contract = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;
  if (!contract) {
    return NextResponse.json({ ok: false, error: 'Missing contract' }, { status: 400 });
  }

  const rid = params.rid;
  if (!/^0x[0-9a-fA-F]{64}$/.test(rid)) {
    return NextResponse.json({ ok: false, error: 'Bad requestId' }, { status: 400 });
  }
  const ridLower = rid.toLowerCase();

  // Look back a reasonable window of blocks. Adjust if your contract is older.
  const toBlock = await publicClient.getBlockNumber();
  const fromBlock = toBlock > 200_000n ? toBlock - 200_000n : 0n;

  // Fetch ALL loan-related events, then filter in JS (works even if requestId isn't indexed)
  const logs = await publicClient.getLogs({
    address: contract,
    events: [LoanRequested, LoanApproved, LoanFinalized, LoanRepaid],
    fromBlock,
    toBlock,
  });

  const matched = logs.filter((l) => {
    const r = (l as any).args?.requestId as `0x${string}` | undefined;
    return r && r.toLowerCase() === ridLower;
  });

  // Attach timestamps (cache per block)
  const blockTs = new Map<string, number>();
  const withTime = await Promise.all(
    matched.map(async (l) => {
      const key = l.blockNumber.toString();
      if (!blockTs.has(key)) {
        const b = await publicClient.getBlock({ blockNumber: l.blockNumber });
        blockTs.set(key, Number(b.timestamp));
      }
      return {
        txHash: l.transactionHash,
        blockNumber: l.blockNumber,
        ts: blockTs.get(key)!,
        eventName: l.eventName,
        args: l.args,
      };
    })
  );

  // Sort oldest → newest
  withTime.sort((a, b) => (a.blockNumber < b.blockNumber ? -1 : 1));

  return NextResponse.json({ ok: true, data: withTime });
}
