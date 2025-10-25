'use client';

import erc20 from '../lib/erc20.abi.json';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { toWeiFromCUSD, fromWeiToCUSD } from '../lib/utils';
import toast from 'react-hot-toast';
import { useState } from 'react';

// MUI
import {
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

const CUSD = (process.env.NEXT_PUBLIC_CUSD_ADDRESS ||
  '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1') as `0x${string}`;

export default function TokenApprove({ spender }: { spender: `0x${string}` }) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('100'); // cUSD
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: allowance } = useReadContract({
    abi: erc20,
    address: CUSD,
    functionName: 'allowance',
    args: [address as `0x${string}`, spender],
  });

  const doApprove = async () => {
    try {
      await toast.promise(
        writeContractAsync({
          abi: erc20,
          address: CUSD,
          functionName: 'approve',
          args: [spender, toWeiFromCUSD(amount)],
          chain: celoAlfajores,
          account: address as `0x${string}`,
        }),
        {
          loading: 'Approving cUSD…',
          success: 'Approval submitted',
          error: 'Approval failed',
        }
      );
    } catch {}
  };

  const allowanceText =
    allowance !== undefined
      ? `${fromWeiToCUSD(allowance as bigint)} cUSD`
      : '—';

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">cUSD Allowance</Typography>

          <Typography variant="body2" color="text.secondary">
            Current allowance: {allowanceText}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            <TextField
              label="Amount (cUSD)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100"
              fullWidth
            />
            <LoadingButton
              variant="contained"
              onClick={doApprove}
              loading={isPending}
            >
              Approve
            </LoadingButton>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
