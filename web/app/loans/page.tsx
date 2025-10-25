'use client';

import abi from '../../lib/celo.abi.json';
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { useState } from 'react';
import { isBytes32, toWeiFromCUSD } from '../../lib/utils';
import TokenApprove from '../../components/TokenApprove';
import LoanManager from '../../components/LoanManager';
import toast from 'react-hot-toast';

// MUI
import {
  Box,
  Grid,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  Tooltip,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

const addr = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;

export default function LoansPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [circleId, setCircleId] = useState('');
  const [amountCUSD, setAmountCUSD] = useState('100');
  const [installments, setInstallments] = useState('3');
  const [result, setResult] = useState<string>();

  const requestOnchain = async () => {
    if (!addr) return toast.error('Contract not set (NEXT_PUBLIC_CELO_ADDRESS)');
    if (!isConnected || !address) return toast.error('Connect wallet');
    if (!isBytes32(circleId)) return toast.error('CircleId must be bytes32 (0x + 64 hex)');

    const amtWei = toWeiFromCUSD(amountCUSD);
    const ins = Math.max(1, Math.min(12, Number(installments) || 3));

    try {
      await toast.promise(
        writeContractAsync({
          abi,
          address: addr,
          functionName: 'requestLoan',
          args: [circleId as `0x${string}`, amtWei, ins],
          account: address as `0x${string}`,
          chain: celoAlfajores,
        }),
        {
          loading: 'Requesting loan…',
          success: 'Loan request submitted',
          error: 'Request failed',
        }
      );
      setResult(undefined);
    } catch (e: any) {
      setResult(e?.message ?? String(e));
    }
  };

  // JSON mock demo
  async function submitJson() {
    const res = await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        circleId: 'demo',
        amountCUSD,
        installments: Number(installments),
        borrower: address || '0x0',
      }),
    }).then((r) => r.json());

    if (res.ok) setResult(`Mock loan id: ${res.data.id}`);
    else setResult('Failed');
  }

  const installmentsHelper =
    Number(installments) >= 1 && Number(installments) <= 12
      ? 'Between 1 and 12'
      : 'Will be clamped to 1–12';

  const circleIdError = circleId.length > 0 && !isBytes32(circleId);

  return (
    <Grid container spacing={3}>
      {/* Left: Request form */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Request Loan (on-chain)</Typography>

              <TextField
                label="Circle ID (bytes32 0x…)"
                value={circleId}
                onChange={(e) => setCircleId(e.target.value)}
                placeholder="0x…64 hex chars"
                error={circleIdError}
                helperText={circleIdError ? 'Expected 0x + 64 hex characters' : 'Paste the circleId'}
                fullWidth
              />

              <TextField
                label="Amount (cUSD)"
                value={amountCUSD}
                onChange={(e) => setAmountCUSD(e.target.value)}
                inputMode="decimal"
                placeholder="100"
                helperText="Token allowance to the contract is required before disburse/repay."
                fullWidth
              />

              <TextField
                label="Installments"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                inputMode="numeric"
                placeholder="3"
                helperText={installmentsHelper}
                fullWidth
              />

              <Stack direction="row" spacing={1}>
                <Tooltip
                  title={!addr ? 'Contract address not set' : !isConnected ? 'Connect wallet' : ''}
                >
                  <span>
                    <LoadingButton
                      variant="contained"
                      onClick={requestOnchain}
                      loading={isPending}
                      disabled={!addr || !isConnected}
                    >
                      Request Loan
                    </LoadingButton>
                  </span>
                </Tooltip>

                <Button variant="outlined" onClick={submitJson}>
                  Mock (JSON)
                </Button>
              </Stack>

              {result && (
                <Alert severity="info" variant="outlined">
                  {result}
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Right: Managers */}
      <Grid item xs={12} md={6}>
        <Stack spacing={3}>
          {addr && <LoanManager contract={addr} />}
          {addr && <TokenApprove spender={addr} />}
          {!addr && (
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Set <code>NEXT_PUBLIC_CELO_ADDRESS</code> to enable on-chain actions.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Grid>
    </Grid>
  );
}
