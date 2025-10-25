// app/dashboard/page.tsx
import { fetchRecentEvents, publicClient } from '../../lib/events';
import {
  Container,
  Card,
  CardContent,
  Typography,
} from '@mui/material';

const addr = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  if (!addr) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Set <code>NEXT_PUBLIC_CELO_ADDRESS</code> to enable the on-chain dashboard.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // 1) Fetch recent on-chain events
  const events = await fetchRecentEvents(addr);

  // 2) Reconstruct state from events
  const circles = new Map<
    string,
    { name: string; createdBy: string; members: Set<string> }
  >();
  const loans = new Map<
    string,
    {
      circleId: string;
      borrower: string;
      amount: bigint;
      approvals: Set<string>;
      approved: boolean;
      repaid: boolean;
      firstBlock?: bigint;
    }
  >();

  for (const e of events) {
    if (e.eventName === 'CircleCreated') {
      circles.set(e.args.circleId, {
        name: e.args.name,
        createdBy: e.args.createdBy,
        members: new Set([e.args.createdBy]),
      });
    }
    if (e.eventName === 'MemberJoined') {
      if (!circles.has(e.args.circleId)) {
        circles.set(e.args.circleId, {
          name: 'Unknown',
          createdBy: '0x0000000000000000000000000000000000000000',
          members: new Set(),
        });
      }
      circles.get(e.args.circleId)!.members.add(e.args.member);
    }
    if (e.eventName === 'LoanRequested') {
      loans.set(e.args.requestId, {
        circleId: e.args.circleId,
        borrower: e.args.borrower,
        amount: BigInt(e.args.amount),
        approvals: new Set(),
        approved: false,
        repaid: false,
        firstBlock: e.blockNumber,
      });
    }
    if (e.eventName === 'LoanApproved') {
      const l = loans.get(e.args.requestId);
      if (l) l.approvals.add(e.args.approver);
    }
    if (e.eventName === 'LoanFinalized') {
      const l = loans.get(e.args.requestId);
      if (l) l.approved = true;
    }
    if (e.eventName === 'LoanRepaid') {
      const l = loans.get(e.args.requestId);
      if (l) l.repaid = true;
    }
  }

  const circleRows = [...circles.entries()].map(([id, c]) => ({
    id: id as `0x${string}`,
    name: c.name,
    createdBy: c.createdBy as `0x${string}`,
    members: [...c.members] as `0x${string}`[],
  }));

  // 3) Collect timestamps for display
  const needBlocks = new Set<string>();
  for (const [, l] of loans) if (l.firstBlock) needBlocks.add(l.firstBlock.toString());

  const blockTimeMap = new Map<string, number>();
  await Promise.all(
    [...needBlocks].map(async (bnStr) => {
      const bn = BigInt(bnStr);
      const b = await publicClient.getBlock({ blockNumber: bn });
      blockTimeMap.set(bnStr, Number(b.timestamp));
    }),
  );

  const loanRows = [...loans.entries()].map(([rid, l]) => ({
    rid: rid as `0x${string}`,
    circleId: l.circleId as `0x${string}`,
    borrower: l.borrower as `0x${string}`,
    amountWei: l.amount.toString(),
    approvals: [...l.approvals] as `0x${string}`[],
    approved: l.approved,
    repaid: l.repaid,
    timestamp: l.firstBlock ? blockTimeMap.get(l.firstBlock.toString()) : undefined,
  }));

  // 4) Render via client component (wallet-aware filtering & actions)
  const DashboardClient = (await import('../../components/DashboardClient')).default;
  return <DashboardClient data={{ contract: addr, circleRows, loanRows }} />;
}
