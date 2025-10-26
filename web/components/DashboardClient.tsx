'use client';

import useSWR, { mutate } from 'swr';
import { useAccount } from 'wagmi';
import { useMemo, useState } from 'react';
import DashboardTable from './DashboardTable';
import Copy from './Copy';
import { short } from '../lib/utils';
import SummaryBar from './SummaryBar';
import Skeleton from './Skeleton';

// MUI
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
} from '@mui/material';

type CircleRow = { id: `0x${string}`; name: string; createdBy: `0x${string}`; members: `0x${string}`[]; };
type LoanRow = {
  rid: `0x${string}`; circleId: `0x${string}`; borrower: `0x${string}`;
  amountWei: string; approvals: `0x${string}`[]; approved: boolean; repaid: boolean; timestamp?: number;
};

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function DashboardClient({
  data,
}: {
  data: { contract: `0x${string}`; circleRows: CircleRow[]; loanRows: LoanRow[] };
}) {
  const { address } = useAccount();
  const [onlyMine, setOnlyMine] = useState(true);

  // live data (poll every 10s)
  const { data: live, isLoading } = useSWR('/api/dashboard', fetcher, {
    refreshInterval: 50_0000,
    fallbackData: { ok: true, data },
  });

  const me = (address || '').toLowerCase();
  const rows = live?.data ?? data;

  const myCircles = useMemo(() => {
    if (!onlyMine || !me) return rows.circleRows;
    return rows.circleRows.filter(c => c.members.some(m => m.toLowerCase() === me));
  }, [rows.circleRows, onlyMine, me]);

  const myCircleIds = useMemo(
    () => new Set(myCircles.map(c => c.id.toLowerCase())),
    [myCircles]
  );

  const myLoans = useMemo(() => {
    if (!onlyMine || !me) return rows.loanRows;
    const circleIds = new Set(myCircles.map(c => c.id.toLowerCase()));
    return rows.loanRows.filter(l =>
      l.borrower.toLowerCase() === me ||
      l.approvals.some(a => a.toLowerCase() === me) ||
      circleIds.has(l.circleId.toLowerCase())
    );
  }, [rows.loanRows, myCircles, onlyMine, me]);

  const meL = (address || '').toLowerCase();
  const canApprove = (l: any) =>
    !l.repaid && !l.approved && meL && myCircleIds.has(l.circleId.toLowerCase());

  const canDisburse = (l: any) => !l.repaid && l.approved && meL;
  const canRepay    = (l: any) => !l.repaid && meL && l.borrower.toLowerCase() === meL;

  const summary = {
    totalCircles: myCircles.length,
    totalLoans: myLoans.length,
    needMyApproval: myLoans.filter(canApprove).length,
    needMyDisbursal: myLoans.filter(canDisburse).length,
    needMyRepay: myLoans.filter(canRepay).length,
  };

  return (
    <Stack spacing={3}>
      {/* Top controls */}
      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                size="small"
                color={address ? 'success' : 'default'}
                variant="outlined"
                label={
                  address ? `You: ${address}` : 'Connect wallet'
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={onlyMine}
                    onChange={e => setOnlyMine(e.target.checked)}
                  />
                }
                label={<Typography variant="body2">Only mine</Typography>}
              />
            </Stack>

            <Button
              variant="contained"
              onClick={() => mutate('/api/dashboard')}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Summary */}
      <SummaryBar {...summary} />

      {/* Circles */}
      <Card>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Typography variant="h6">Circles</Typography>
            {isLoading && (
              <Typography variant="caption" color="text.secondary">
                Refreshing…
              </Typography>
            )}
          </Stack>

          {isLoading ? (
            <Skeleton rows={4} />
          ) : myCircles.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No circles found.
            </Typography>
          ) : (
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
                  {myCircles.map((row) => (
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
          )}
        </CardContent>
      </Card>

      {/* Loans */}
      <Card>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Typography variant="h6">Loans</Typography>
            {isLoading && (
              <Typography variant="caption" color="text.secondary">
                Refreshing…
              </Typography>
            )}
          </Stack>

          <DashboardTable
            contract={rows.contract}
            rows={myLoans}
            me={address as `0x${string}` | undefined}
            myCircleIds={myCircleIds}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}
