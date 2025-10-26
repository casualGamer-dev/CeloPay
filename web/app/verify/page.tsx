'use client';

import * as React from 'react';
import useSWR from 'swr';
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import {
  formatUnits,
  parseUnits,
  maxUint256,
  type Address,
} from 'viem';
import {
  readContract,
  waitForTransactionReceipt,
} from 'wagmi/actions';

import { config } from '../../lib/wagmi';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import poolAbi from '../../lib/pool.abi.json';
import erc20Abi from '../../lib/erc20.abi.json';
import { POOL_ADDRESS, getPoolStats } from '../../lib/pool';

const CUSD_ADDRESS = process.env.NEXT_PUBLIC_CUSD as Address;

const fetcher = (u: string) => fetch(u).then((r) => r.json());

function fmt(bi?: bigint, d = 18) {
  if (bi === undefined || bi === null) return '—';
  return Number(formatUnits(bi, d)).toLocaleString();
}

// Convert an annualized 1e18 rate to percentage number
function rateToPct(rateAnnual1e18: bigint) {
  return Number(rateAnnual1e18) / 1e16;
}

export default function PoolPage() {
  const { address, isConnected } = useAccount();

  // ------- Read pool stats -------
  const [stats, setStats] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const refreshStats = React.useCallback(() => {
    if (!POOL_ADDRESS) return;
    getPoolStats().then(setStats).catch(() => {});
  }, []);
  
  React.useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // ------- My balances (LP + Debt) -------
  const { data: lpBal } = useReadContract({
    address: POOL_ADDRESS!,
    abi: poolAbi as any,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!POOL_ADDRESS },
  });

  const { data: debt } = useReadContract({
    address: POOL_ADDRESS!,
    abi: poolAbi as any,
    functionName: 'borrowBalanceCurrent',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!POOL_ADDRESS },
  });

  // ------- Human Passport score (from /api/me) -------
  const meKey = address ? `/api/me?address=${address}` : null;
  const { data: me } = useSWR(meKey, fetcher);

  const hpScore = Number(me?.score ?? 0);
  const maxBorrowNum = Math.min(50 + 5 * hpScore, 300);
  const MAX_BORROW = BigInt(maxBorrowNum) * 10n ** 18n;

  // ------- Health Meter (Debt vs Max) -------
  const currentDebt = (debt as bigint) || 0n;
  const healthPct =
    MAX_BORROW > 0n ? Math.min(Number((currentDebt * 10000n) / MAX_BORROW) / 100, 100) : 0;

  // ------- Amount input + actions -------
  const [amount, setAmount] = React.useState('');
  const parsed = amount ? parseUnits(amount, 18) : 0n;

  const { writeContractAsync } = useWriteContract();
  const disabled = !isConnected || !POOL_ADDRESS;

  // ------- Derived safety/metrics -------
  const tvl = stats ? stats.totalCash + stats.totalBorrows - stats.totalReserves : 0n;
  const reserveRatio =
    stats && tvl > 0n ? Number((stats.totalReserves * 10000n) / tvl) / 100 : 0;

  const borrowAPRpct = stats ? rateToPct(stats.borrowAPR as bigint) : undefined;
  const supplyAPYpct = stats ? rateToPct(stats.supplyAPY as bigint) : undefined;

  // ====== Allowance helper with config ======
  const ensureAllowance = React.useCallback(
    async (owner: Address, spender: Address, required: bigint) => {
      try {
        console.log('Checking allowance...', { owner, spender, required: required.toString() });
        
        // Read current allowance
        const current = (await readContract(config, {
          address: CUSD_ADDRESS,
          abi: erc20Abi as any,
          functionName: 'allowance',
          args: [owner, spender],
        })) as bigint;

        console.log('Current allowance:', current.toString());

        if (current >= required) {
          console.log('Allowance sufficient');
          return;
        }

        console.log('Requesting approval...');
        // Approve MaxUint for better UX
        const hash = await writeContractAsync({
          address: CUSD_ADDRESS,
          abi: erc20Abi as any,
          functionName: 'approve',
          args: [spender, maxUint256],
        });

        console.log('Approval tx submitted:', hash);
        await waitForTransactionReceipt(config, { hash });
        console.log('Approval confirmed');
      } catch (e: any) {
        console.error('Allowance error:', e);
        throw new Error(`Approval failed: ${e?.shortMessage || e?.message || 'Unknown error'}`);
      }
    },
    [writeContractAsync]
  );

  // ====== Action wrappers ======
  const onDeposit = async () => {
    if (!address || !parsed) return;
    setErr(null);
    setBusy(true);
    try {
      console.log('Starting deposit...', parsed.toString());
      await ensureAllowance(address, POOL_ADDRESS as Address, parsed);

      console.log('Calling deposit...');
      const hash = await writeContractAsync({
        address: POOL_ADDRESS!,
        abi: poolAbi as any,
        functionName: 'deposit',
        args: [parsed],
      });

      console.log('Deposit tx submitted:', hash);
      await waitForTransactionReceipt(config, { hash });
      console.log('Deposit confirmed');
      refreshStats();
      setAmount('');
    } catch (e: any) {
      console.error('Deposit error:', e);
      setErr(e?.shortMessage || e?.message || 'Deposit failed');
    } finally {
      setBusy(false);
    }
  };

  const onWithdraw = async () => {
    if (!parsed) return;
    setErr(null);
    setBusy(true);
    try {
      const hash = await writeContractAsync({
        address: POOL_ADDRESS!,
        abi: poolAbi as any,
        functionName: 'withdraw',
        args: [parsed],
      });
      await waitForTransactionReceipt(config, { hash });
      refreshStats();
      setAmount('');
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || 'Withdraw failed');
    } finally {
      setBusy(false);
    }
  };

  const onBorrow = async () => {
    if (!parsed || parsed > MAX_BORROW) return;
    setErr(null);
    setBusy(true);
    try {
      const hash = await writeContractAsync({
        address: POOL_ADDRESS!,
        abi: poolAbi as any,
        functionName: 'borrow',
        args: [parsed],
      });
      await waitForTransactionReceipt(config, { hash });
      refreshStats();
      setAmount('');
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || 'Borrow failed');
    } finally {
      setBusy(false);
    }
  };

  const onRepay = async () => {
    if (!address || !parsed) return;
    setErr(null);
    setBusy(true);
    try {
      console.log('Starting repay...', parsed.toString());
      await ensureAllowance(address, POOL_ADDRESS as Address, parsed);

      console.log('Calling repay...');
      const hash = await writeContractAsync({
        address: POOL_ADDRESS!,
        abi: poolAbi as any,
        functionName: 'repay',
        args: [parsed],
      });

      console.log('Repay tx submitted:', hash);
      await waitForTransactionReceipt(config, { hash });
      console.log('Repay confirmed');
      refreshStats();
      setAmount('');
    } catch (e: any) {
      console.error('Repay error:', e);
      setErr(e?.shortMessage || e?.message || 'Repay failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" fontWeight={700}>Liquidity Pool</Typography>
          <Chip size="small" variant="outlined" label={`Safety Reserve: ${reserveRatio.toFixed(2)}%`} />
        </Stack>

        {/* Top metrics */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">TVL</Typography>
                <Typography variant="h5">{stats ? fmt(tvl) : '—'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Utilization</Typography>
                <Typography variant="h5">
                  {stats ? (Number(stats.util) / 1e16).toFixed(2) + '%' : '—'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Borrow APR (approx)</Typography>
                <Typography variant="h5">
                  {borrowAPRpct !== undefined ? borrowAPRpct.toFixed(2) + '%' : '—'}
                </Typography>
                {borrowAPRpct !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    ~ Monthly: {(borrowAPRpct / 12).toFixed(2)}%
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Supply APY (approx)</Typography>
                <Typography variant="h5">
                  {supplyAPYpct !== undefined ? supplyAPYpct.toFixed(2) + '%' : '—'}
                </Typography>
                {supplyAPYpct !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    ~ Monthly: {(supplyAPYpct / 12).toFixed(2)}%
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* My positions + Health */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>My Positions</Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip label={`LP: ${fmt(lpBal as bigint)}`} />
                  <Chip label={`Debt: ${fmt(currentDebt)}`} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Borrow Health</Typography>
                <Typography variant="caption" color="text.secondary">
                  {Number(formatUnits(currentDebt, 18)).toFixed(2)} / {maxBorrowNum.toFixed(0)} cUSD
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <LinearProgress variant="determinate" value={healthPct} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Actions</Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <TextField
                  label="Amount (cUSD)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  size="small"
                  disabled={busy}
                />
                <Button size="small" onClick={() => setAmount(String(maxBorrowNum))} disabled={busy}>
                  Max Borrow
                </Button>
                <Button size="small" onClick={() => setAmount('0')} disabled={busy}>Clear</Button>
              </Stack>

              <Tooltip title={!isConnected ? 'Connect wallet first' : ''}>
                <span>
                  <Button
                    variant="contained"
                    disabled={disabled || !amount || busy}
                    onClick={onDeposit}
                  >
                    {busy ? 'Processing…' : 'Deposit'}
                  </Button>
                </span>
              </Tooltip>

              <Tooltip title={!isConnected ? 'Connect wallet first' : ''}>
                <span>
                  <Button
                    variant="outlined"
                    disabled={disabled || !amount || busy}
                    onClick={onWithdraw}
                  >
                    {busy ? 'Processing…' : 'Withdraw'}
                  </Button>
                </span>
              </Tooltip>

              <Tooltip title={!isConnected ? 'Connect + be approved (Human Passport)' : 'Borrow is allowed after Human Passport approval'}>
                <span>
                  <Button
                    variant="contained"
                    color="secondary"
                    disabled={disabled || !amount || parsed > MAX_BORROW || busy}
                    onClick={onBorrow}
                  >
                    {busy ? 'Processing…' : 'Borrow'}
                  </Button>
                </span>
              </Tooltip>

              <Tooltip title={!isConnected ? 'Connect wallet first' : ''}>
                <span>
                  <Button
                    variant="outlined"
                    color="secondary"
                    disabled={disabled || !amount || busy}
                    onClick={onRepay}
                  >
                    {busy ? 'Processing…' : 'Repay'}
                  </Button>
                </span>
              </Tooltip>

              <Button onClick={refreshStats} disabled={busy}>Refresh</Button>
            </Stack>

            {err && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {err}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Max borrowable from score: {maxBorrowNum} cUSD. Borrowing is gated by a one-time on-chain approval after Human Passport verification. Interest accrues continuously until you repay.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}