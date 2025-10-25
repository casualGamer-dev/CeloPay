import { fetchRecentEvents } from '../../lib/events';
import Copy from '../../components/Copy';
import { short, fromWeiToCUSD } from '../../lib/utils';

// MUI
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Divider,
} from '@mui/material';

const addr = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  if (!addr) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Set <code>NEXT_PUBLIC_CELO_ADDRESS</code> to enable on-chain views.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const events = await fetchRecentEvents(addr);

  // basic reconstructions
  const circles = new Map<string, { name: string; createdBy: string }>();
  const members = new Map<string, Set<string>>();
  const loans = new Map<
    string,
    {
      circleId: string;
      borrower: string;
      amount: bigint;
      approvals: Set<string>;
      approved: boolean;
      repaid: boolean;
    }
  >();

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
    id,
    ...c,
    members: [...(members.get(id) || new Set())],
  }));

  const loanRows = [...loans.entries()].map(([rid, l]) => ({
    rid,
    ...l,
    approvals: [...l.approvals],
  }));

  const StatusChip = ({ repaid, approved }: { repaid: boolean; approved: boolean }) => (
    <Chip
      size="small"
      variant="outlined"
      color={repaid ? 'success' : approved ? 'info' : 'default'}
      label={repaid ? 'Repaid' : approved ? 'Approved' : 'Pending'}
    />
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Circles */}
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">My Circles (from chain)</Typography>
            </Stack>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>circleId</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Creator</TableCell>
                    <TableCell>Members</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {circleRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ wordBreak: 'break-all' }}>
                        <Typography variant="caption" component="span">
                          {row.id}
                        </Typography>{' '}
                        <Copy value={row.id} />
                      </TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        <Typography variant="caption">{short(row.createdBy)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {row.members.map(short).join(', ')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Loans */}
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">My Loans (from chain)</Typography>
            </Stack>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>requestId</TableCell>
                    <TableCell>circleId</TableCell>
                    <TableCell>Borrower</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Approvals</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loanRows.map((row) => (
                    <TableRow key={row.rid} hover>
                      <TableCell sx={{ wordBreak: 'break-all' }}>
                        <Typography variant="caption" component="span">
                          {row.rid}
                        </Typography>{' '}
                        <Copy value={row.rid} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{short(row.circleId)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{short(row.borrower)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body2">
                            {fromWeiToCUSD(row.amount)} cUSD
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {row.approvals.map(short).join(', ') || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip repaid={row.repaid} approved={row.approved} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="caption" color="text.secondary">
              Note: “My” scope is inferred from chain events; filtering to wallet can be added next if
              you want.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
