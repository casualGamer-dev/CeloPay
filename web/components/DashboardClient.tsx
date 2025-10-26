'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { useAccount } from 'wagmi';
import { useEffect, useMemo, useRef, useState } from 'react';
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

  // Keep a stable snapshot that we only replace with "good" updates
  const [stableRows, setStableRows] = useState(data);
  const missesRef = useRef(0);

  const {
    data: live,
    isLoading,
    isValidating,
    mutate,
  } = useSWR('/api/dashboard', fetcher, {
    // Poll gently; avoid duplicate revalidations
    refreshInterval: 10_000,
    dedupingInterval: 9_000,
    // Keep previous data visible during background revalidations
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    // Use initial server data as a fallback
    fallbackData: { ok: true, data },
  });

  // Decide when an update is "good" enough to replace the stable snapshot.
  useEffect(() => {
    const next = live?.data;
    if (!next) return;

    const prev = stableRows;
    const nextCircles = Array.isArray(next.circleRows) ? next.circleRows.length : 0;
    const nextLoans   = Array.isArray(next.loanRows) ? next.loanRows.length : 0;

    const prevCircles = Array.isArray(prev?.circleRows) ? prev.circleRows.length : 0;
    const prevLoans   = Array.isArray(prev?.loanRows) ? prev.loanRows.length : 0;

    const clearlyGood =
      nextCircles > 0 || nextLoans > 0 || (prevCircles === 0 && prevLoans === 0);

    if (clearlyGood) {
      missesRef.current = 0;
      setStableRows(next);
      return;
    }

    // If payload is empty while we previously had data, treat as a transient miss.
    // After a few consecutive misses, accept it (prevents permanent staleness).
    if ((prevCircles + prevLoans) > 0 && (nextCircles + nextLoans) === 0) {
      missesRef.current += 1;
      if (missesRef.current >= 3) {
        setStableRows(next);
      }
      return;
    }

    // Otherwise, accept the update (covers other edge cases)
    setStableRows(next);
  }, [live?.data, stableRows]);

  const me = (address || '').toLowerCase();

  const rows = stableRows; // ← render from the stable snapshot

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

  const meL = me;
  const canApprove = (l: LoanRow) =>
    !l.repaid && !l.approved && !!meL && myCircleIds.has(l.circleId.toLowerCase());
  const canDisburse = (l: LoanRow) => !l.repaid && l.approved && !!meL;
  const canRepay    = (l: LoanRow) => !l.repaid && !!meL && l.borrower.toLowerCase() === meL;

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
                label={address ? `You: ${address}` : 'Connect wallet'}
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
              {isValidating && (
                <Chip size="small" variant="outlined" label="Refreshing…" />
              )}
            </Stack>

            <Button
              variant="contained"
              onClick={() => mutate()} // local mutate from useSWR to revalidate
              disabled={isLoading || isValidating}
            >
              {isLoading || isValidating ? 'Refreshing…' : 'Refresh'}
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
          </Stack>

          {/* Only show skeleton on very first load when there is no data at all */}
          {!rows || (!rows.circleRows?.length && isLoading) ? (
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
