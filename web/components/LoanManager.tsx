'use client';

import abi from '../lib/celo.abi.json';
import erc20 from '../lib/erc20.abi.json';
import { CUSD, toWeiFromCUSD } from '../lib/utils';
import { publicClient } from '../lib/events';
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import toast from 'react-hot-toast';
import { useRef, useState } from 'react';
import { isBytes32 } from '../lib/utils';

// MUI
import {
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Grid,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

export default function LoanManager({ contract }: { contract: `0x${string}` }) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [requestId, setRequestId] = useState('');
  const [disburseCUSD, setDisburseCUSD] = useState('100');
  const [repayCUSD, setRepayCUSD] = useState('100');
  const [note, setNote] = useState<string>();

  // --- Allowance confirm dialog state ---
  const [allowDlgOpen, setAllowDlgOpen] = useState(false);
  const [allowData, setAllowData] = useState<{ current: bigint; needed: bigint; human: string } | null>(null);
  const allowResolver = useRef<(ok: boolean) => void>();

  const disabled = !isConnected || !address || isPending;

  async function ensureAllowance(requiredCUSD: string) {
    if (!address) throw new Error('Connect wallet');
    const needed = toWeiFromCUSD(requiredCUSD);

    const current = (await publicClient.readContract({
      abi: erc20,
      address: CUSD,
      functionName: 'allowance',
      args: [address as `0x${string}`, contract],
    })) as bigint;

    if (current >= needed) return true;

    // Ask user via MUI dialog
    const ok = await new Promise<boolean>((resolve) => {
      allowResolver.current = resolve;
      setAllowData({ current, needed, human: requiredCUSD });
      setAllowDlgOpen(true);
    });
    if (!ok) return false;

    await toast.promise(
      writeContractAsync({
        abi: erc20,
        address: CUSD,
        functionName: 'approve',
        args: [contract, needed],
        account: address as `0x${string}`,
        chain: celoAlfajores,
      }),
      { loading: 'Approving cUSD…', success: 'Approved', error: 'Approval failed' }
    );

    return true;
  }

  const approveLoan = async () => {
    try {
      if (!contract) return toast.error('Contract not set');
      if (!isBytes32(requestId)) return toast.error('Invalid requestId (bytes32)');
      await toast.promise(
        writeContractAsync({
          abi,
          address: contract,
          functionName: 'approveLoan',
          args: [requestId as `0x${string}`],
          account: address as `0x${string}`,
          chain: celoAlfajores,
        }),
        { loading: 'Approving…', success: 'Approval submitted', error: 'Approval failed' }
      );
      setNote(undefined);
    } catch (e: any) {
      setNote(e?.message ?? String(e));
    }
  };

  const disburse = async () => {
    try {
      if (!contract) return toast.error('Contract not set');
      if (!isBytes32(requestId)) return toast.error('Invalid requestId (bytes32)');
      const ok = await ensureAllowance(disburseCUSD);
      if (!ok) return;
      await toast.promise(
        writeContractAsync({
          abi,
          address: contract,
          functionName: 'disburse',
          args: [requestId as `0x${string}`],
          account: address as `0x${string}`,
          chain: celoAlfajores,
        }),
        { loading: 'Disbursing…', success: 'Disburse submitted', error: 'Disburse failed' }
      );
      setNote(undefined);
    } catch (e: any) {
      setNote(e?.message ?? String(e));
    }
  };

  const repay = async () => {
    try {
      if (!contract) return toast.error('Contract not set');
      if (!isBytes32(requestId)) return toast.error('Invalid requestId (bytes32)');
      const ok = await ensureAllowance(repayCUSD);
      if (!ok) return;
      await toast.promise(
        writeContractAsync({
          abi,
          address: contract,
          functionName: 'repay',
          args: [requestId as `0x${string}`, toWeiFromCUSD(repayCUSD)],
          account: address as `0x${string}`,
          chain: celoAlfajores,
        }),
        { loading: 'Repaying…', success: 'Repay submitted', error: 'Repay failed' }
      );
      setNote(undefined);
    } catch (e: any) {
      setNote(e?.message ?? String(e));
    }
  };

  const requestIdError = requestId.length > 0 && !isBytes32(requestId);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Manage Loan</Typography>

          <TextField
            label="Request ID (bytes32)"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="0x… (bytes32)"
            error={requestIdError}
            helperText={requestIdError ? 'Expected 0x + 64 hex characters' : 'Paste the requestId'}
            fullWidth
          />

          <Stack direction="row" spacing={1.25}>
            <Tooltip title={!isConnected ? 'Connect wallet' : ''}>
              <span>
                <LoadingButton
                  variant="outlined"
                  onClick={approveLoan}
                  loading={isPending}
                  disabled={disabled}
                >
                  Approve
                </LoadingButton>
              </span>
            </Tooltip>
          </Stack>

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Disburse amount (cUSD)"
                value={disburseCUSD}
                onChange={(e) => setDisburseCUSD(e.target.value)}
                placeholder="e.g. 100"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <LoadingButton
                variant="contained"
                onClick={disburse}
                loading={isPending}
                disabled={disabled}
                fullWidth
              >
                Disburse
              </LoadingButton>
            </Grid>
          </Grid>

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Repay amount (cUSD)"
                value={repayCUSD}
                onChange={(e) => setRepayCUSD(e.target.value)}
                placeholder="e.g. 100"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <LoadingButton
                variant="contained"
                onClick={repay}
                loading={isPending}
                disabled={disabled}
                fullWidth
              >
                Repay
              </LoadingButton>
            </Grid>
          </Grid>

          {note && (
            <Alert severity="info" variant="outlined">
              {note}
            </Alert>
          )}
        </Stack>
      </CardContent>

      {/* Allowance Confirmation Dialog */}
      <Dialog
        open={allowDlgOpen}
        onClose={() => {
          setAllowDlgOpen(false);
          allowResolver.current?.(false);
        }}
      >
        <DialogTitle>Increase cUSD allowance?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            Your cUSD allowance to this contract is too low.
            <br />
            <br />
            <strong>Current:</strong> {allowData?.current?.toString()} wei
            <br />
            <strong>Required:</strong> {allowData?.needed?.toString()} wei
            <br />
            <strong>Approve now:</strong> {allowData?.human} cUSD
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAllowDlgOpen(false);
              allowResolver.current?.(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setAllowDlgOpen(false);
              allowResolver.current?.(true);
            }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
