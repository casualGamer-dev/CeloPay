'use client';

import abi from '../lib/celo.abi.json';
import { fromWeiToCUSD, short, toINRString } from '../lib/utils';
import Copy from './Copy';
import ExplorerLink from './ExplorerLink';
import Drawer from './Drawer';
import LoanTimeline from './LoanTimeline';
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import toast from 'react-hot-toast';
import { useState } from 'react';

// MUI
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Divider,
} from '@mui/material';

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

function StatusChip({
  status,
}: {
  status: 'pending' | 'approved' | 'repaid';
}) {
  const map: Record<typeof status, { label: string; color: 'default' | 'success' | 'info' }> = {
    pending: { label: 'Pending',  color: 'default' },
    approved:{ label: 'Approved', color: 'info'    },
    repaid:  { label: 'Repaid',   color: 'success' },
  };
  const s = map[status];
  return <Chip size="small" variant="outlined" color={s.color} label={s.label} />;
}

function RoleChip({ label }: { label: string }) {
  return <Chip size="small" variant="outlined" color="secondary" label={label} />;
}

function TimeCell({ ts }: { ts?: number }) {
  if (!ts) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const d = new Date(ts * 1000);
  return <Typography variant="caption" color="text.secondary">{d.toLocaleString()}</Typography>;
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

  const disabledGlobal = !isConnected || !address || isPending;
  const meL = (me || '').toLowerCase();

  // UI state
  const [txByReq, setTxByReq] = useState<Record<string, `0x${string}`>>({});
  const [openRid, setOpenRid] = useState<`0x${string}` | null>(null);

  const isBorrower = (row: LoanRow) => meL && row.borrower.toLowerCase() === meL;
  const iAmMember = (row: LoanRow) => myCircleIds.has(row.circleId.toLowerCase());

  // Rules:
  // - Borrower CANNOT approve or disburse
  // - Only borrower can see repay button
  const canApprove = (row: LoanRow) =>
    !row.repaid && !row.approved && iAmMember(row) && !isBorrower(row);

  const canDisburse = (row: LoanRow) =>
    !row.repaid && row.approved && !isBorrower(row);

  const canRepay = (row: LoanRow) => !row.repaid && isBorrower(row);

  const roleTags = (row: LoanRow) => {
    const tags: string[] = [];
    if (isBorrower(row)) tags.push('Borrower');
    if (row.approvals.some((a) => a.toLowerCase() === meL)) tags.push('Approver');
    if (iAmMember(row)) tags.push('Member');
    return tags;
  };

  const approveLoan = async (rid: `0x${string}`) => {
    try {
      const hash = (await toast.promise(
        writeContractAsync({
          abi,
          address: contract,
          functionName: 'approveLoan',
          args: [rid],
          account: address as `0x${string}`,
          chain: celoAlfajores,
        }),
        { loading: 'Approving…', success: 'Approval submitted', error: 'Approval failed' }
      )) as `0x${string}`;
      setTxByReq((p) => ({ ...p, [rid]: hash }));
    } catch {}
  };

  const disburse = async (rid: `0x${string}`) => {
    try {
      const hash = (await toast.promise(
        writeContractAsync({
          abi,
          address: contract,
          functionName: 'disburse',
          args: [rid],
          account: address as `0x${string}`,
          chain: celoAlfajores,
        }),
        { loading: 'Disbursing…', success: 'Disburse submitted', error: 'Disburse failed' }
      )) as `0x${string}`;
      setTxByReq((p) => ({ ...p, [rid]: hash }));
    } catch {}
  };

  const repay = async (rid: `0x${string}`, amountCUSD: string) => {
    const { toWeiFromCUSD } = await import('../lib/utils');
    try {
      const hash = (await toast.promise(
        writeContractAsync({
          abi,
          address: contract,
          functionName: 'repay',
          args: [rid, toWeiFromCUSD(amountCUSD)],
          account: address as `0x${string}`,
          chain: celoAlfajores,
        }),
        { loading: 'Repaying…', success: 'Repay submitted', error: 'Repay failed' }
      )) as `0x${string}`;
      setTxByReq((p) => ({ ...p, [rid]: hash }));
    } catch {}
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
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
                <TableCell>Time</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row) => {
                const cUsd = fromWeiToCUSD(BigInt(row.amountWei));
                const inr = toINRString(cUsd);
                const roles = roleTags(row);
                const lastTx = txByReq[row.rid];

                return (
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
                      <Box>
                        <ExplorerLink addr={row.borrower} />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{cUsd} cUSD</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {inr}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption">
                        {row.approvals.map(short).join(', ') || '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <StatusChip
                        status={
                          row.repaid ? 'repaid' : row.approved ? 'approved' : 'pending'
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <TimeCell ts={row.timestamp} />
                    </TableCell>

                    <TableCell>
                      {roles.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      ) : (
                        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                          {roles.map((r) => (
                            <RoleChip key={r} label={r} />
                          ))}
                        </Stack>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={1}
                        justifyContent="flex-end"
                        alignItems={{ xs: 'stretch', md: 'center' }}
                      >
                        <Tooltip
                          title={isBorrower(row) ? 'Borrower cannot approve own loan' : ''}
                        >
                          <span>
                            <Button
                              size="small"
                              variant={canApprove(row) ? 'contained' : 'outlined'}
                              disabled={disabledGlobal || !canApprove(row)}
                              onClick={() => approveLoan(row.rid)}
                            >
                              Approve
                            </Button>
                          </span>
                        </Tooltip>

                        <Tooltip
                          title={
                            isBorrower(row)
                              ? 'Borrower cannot disburse own loan'
                              : 'Requires cUSD allowance'
                          }
                        >
                          <span>
                            <Button
                              size="small"
                              variant={canDisburse(row) ? 'contained' : 'outlined'}
                              disabled={disabledGlobal || !canDisburse(row)}
                              onClick={() => disburse(row.rid)}
                            >
                              Disburse
                            </Button>
                          </span>
                        </Tooltip>

                        {isBorrower(row) && (
                          <Tooltip title="Requires cUSD allowance">
                            <span>
                              <Button
                                size="small"
                                variant={canRepay(row) ? 'contained' : 'outlined'}
                                disabled={disabledGlobal || !canRepay(row)}
                                onClick={() => repay(row.rid, cUsd)}
                              >
                                Repay
                              </Button>
                            </span>
                          </Tooltip>
                        )}

                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setOpenRid(row.rid)}
                        >
                          Timeline
                        </Button>

                        <Button
                          size="small"
                          component="a"
                          href={`/loans?r=${row.rid}`}
                          variant="outlined"
                        >
                          Open
                        </Button>
                      </Stack>

                      {lastTx && (
                        <Box mt={1}>
                          <ExplorerLink tx={lastTx} />
                        </Box>
                      )}

                      {openRid === row.rid && (
                        <Drawer
                          open
                          onClose={() => setOpenRid(null)}
                          title={`Timeline – ${row.rid.slice(0, 10)}…`}
                        >
                          <LoanTimeline requestId={row.rid} />
                        </Drawer>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="caption" color="text.secondary">
          INR values are approximate for demo. Disburse/Repay require prior cUSD approval to the contract.
        </Typography>
      </CardContent>
    </Card>
  );
}
