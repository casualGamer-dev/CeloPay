// app/api/loan/[rid]/route.ts
import { NextResponse } from 'next/server';
import { publicClient } from '../../../../lib/events';
import { parseAbiItem } from 'viem';

const LoanRequested = parseAbiItem(
  'event LoanRequested(bytes32 requestId, bytes32 indexed circleId, address indexed borrower, uint256 amount)'
);
const LoanApproved = parseAbiItem(
  'event LoanApproved(bytes32 requestId, address indexed approver)'
);
const LoanFinalized = parseAbiItem(
  'event LoanFinalized(bytes32 requestId)'
);
const LoanRepaid = parseAbiItem(
  'event LoanRepaid(bytes32 requestId, address indexed payer)'
);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { rid: string } }) {
  try {
    const contract = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;
    if (!contract) {
      return NextResponse.json({ ok: false, error: 'Missing contract address' }, { status: 400 });
    }

    const rid = params.rid;
    if (!/^0x[0-9a-fA-F]{64}$/.test(rid)) {
      return NextResponse.json({ ok: false, error: 'Bad requestId format' }, { status: 400 });
    }

    // search window (tune if needed)
    const toBlock = await publicClient.getBlockNumber();
    const lookback = 150_000n; // ~a few days on Alfajores; increase if your loans are older
    const fromBlock = toBlock > lookback ? toBlock - lookback : 0n;

    // Pull ALL loan-related events in the window (no args filter!), then filter in JS by requestId
    const logs = await publicClient.getLogs({
      address: contract,
      events: [LoanRequested, LoanApproved, LoanFinalized, LoanRepaid],
      fromBlock,
      toBlock,
    });

    // Hydrate with timestamps and keep only this requestId
    const blockTs = new Map<string, number>();
    const rows = await Promise.all(
      logs
        .filter((l) => {
          const req = (l.args as any)?.requestId as `0x${string}` | undefined;
          return (req?.toLowerCase() === rid.toLowerCase());
        })
        .map(async (l) => {
          const key = l.blockNumber.toString();
          if (!blockTs.has(key)) {
            const b = await publicClient.getBlock({ blockNumber: l.blockNumber });
            blockTs.set(key, Number(b.timestamp));
          }
          return {
            txHash: l.transactionHash as `0x${string}`,
            blockNumber: l.blockNumber,
            ts: blockTs.get(key),
            eventName: l.eventName!,
            args: l.args,
          };
        })
    );

    // Sort ascending by block number
    rows.sort((a, b) => (a.blockNumber < b.blockNumber ? -1 : 1));

    return NextResponse.json({ ok: true, data: rows });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Failed to load loan timeline' },
      { status: 500 }
    );
  }
}
