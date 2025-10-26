'use client';

import * as React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useAccount, useSignMessage } from 'wagmi';

import Connect from '../../components/Connect';
import HumanPassportButton from '../../components/HumanPassportButton';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function VerifyPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Ask /api/me for verification + approval state
  const meKey = isConnected && address ? `/api/me?address=${address}` : '/api/me';
  const { data, mutate, isLoading } = useSWR(meKey, fetcher, { revalidateOnFocus: false });

  React.useEffect(() => {
    const h = () => mutate();
    window.addEventListener('verified:update', h);
    return () => window.removeEventListener('verified:update', h);
  }, [mutate]);

  const devBypass: boolean = !!data?._devBypass; // <-- dev bypass flag from /api/me
  const humanVerified: boolean = devBypass ? true : !!data?.humanVerified;
  const approved: boolean = devBypass ? true : !!data?.approved;
  const verifiedOverall: boolean = devBypass ? true : !!data?.verified; // legacy cookie OR humanVerified
  const score: number | null = devBypass ? 999 : (data?.score ?? null);

  // Progress heuristic for the status bar
  const progress = React.useMemo(() => {
    if (devBypass) return 100;
    if (!isConnected) return 10;
    if (verifiedOverall && approved) return 100;
    if (humanVerified && !approved) return 85;
    if (score !== null) return Math.min(60 + Math.min(score, 20) * 2, 92);
    return 35;
  }, [devBypass, isConnected, verifiedOverall, approved, humanVerified, score]);

  // Auto-approval (skipped in dev bypass)
  React.useEffect(() => {
    const run = async () => {
      if (devBypass) return;
      if (!address || !humanVerified || approved) return;
      try {
        const message = `Approve my wallet for borrowing: ${address}`;
        const signature = await signMessageAsync({ message });
        await fetch('/api/policy/approve', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ address, signature, message }),
        });
        window.dispatchEvent(new Event('verified:update'));
      } catch {
        /* user may cancel; ignore */
      }
    };
    run();
  }, [address, humanVerified, approved, signMessageAsync, devBypass]);

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={2} alignItems="stretch">
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Verify once to unlock everything
        </Typography>

        {devBypass && (
          <Typography
            variant="body2"
            sx={{ p: 1, borderRadius: 1, bgcolor: 'success.main', color: 'white' }}
          >
            Dev bypass active — verification and approval are mocked for local development.
          </Typography>
        )}

        <Typography variant="body1" color="text.secondary">
          To keep circles fair and safe, we use <b>Human Passport</b> (formerly Gitcoin Passport).
          Add a few stamps and refresh your score. Once you pass, we’ll <b>auto-approve</b> your
          wallet for borrowing (you’ll sign a message to prove ownership).
        </Typography>

        <LinearProgress variant="determinate" value={progress} />

        <Card>
          <CardContent>
            <Stack spacing={2}>
              {/* Status row */}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  size="small"
                  variant="outlined"
                  color={isConnected ? 'success' : 'default'}
                  label={isConnected ? 'Wallet: Connected' : 'Wallet: Not connected'}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  color={humanVerified ? 'success' : 'default'}
                  label={humanVerified ? 'Human Passport: Passed' : 'Human Passport: Not passed'}
                />
                {score !== null && (
                  <Chip
                    size="small"
                    variant="outlined"
                    color={humanVerified ? 'success' : 'warning'}
                    label={`Score: ${score}${humanVerified ? ' (passes)' : ''}`}
                  />
                )}
                <Chip
                  size="small"
                  variant="outlined"
                  color={approved ? 'success' : 'default'}
                  label={approved ? 'Borrow Approval: Granted' : 'Borrow Approval: Pending'}
                />
                {devBypass && (
                  <Chip
                    size="small"
                    color="success"
                    variant="filled"
                    label="DEV BYPASS"
                  />
                )}
              </Stack>

              {/* Checklist */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Checklist
                </Typography>
                <Stack spacing={0.5}>
                  <Step done={isConnected} text="Connect your wallet" />
                  <Step
                    done={devBypass ? true : score !== null}
                    text="Open Human Passport and add stamps (GitHub, Google, Phone, etc.)"
                  />
                  <Step
                    done={humanVerified}
                    text="Reach the passing score (default threshold) and refresh your score"
                  />
                  <Step
                    done={approved}
                    text="Sign a one-time message to auto-approve your wallet for borrowing"
                  />
                </Stack>
              </Box>

              {/* Actions */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                {!isConnected ? (
                  <Connect />
                ) : devBypass ? (
                  <Chip
                    size="small"
                    color="success"
                    variant="outlined"
                    label="Dev: Verified & Approved"
                  />
                ) : humanVerified ? (
                  approved ? (
                    <Chip
                      size="small"
                      color="success"
                      variant="outlined"
                      label="All set — you're verified & approved!"
                    />
                  ) : (
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      label="Almost done — sign the message prompt to approve"
                    />
                  )
                ) : (
                  <HumanPassportButton size="medium" />
                )}

                <Box sx={{ flex: 1 }} />

                <Button component={Link} href="/" variant="text" color="inherit">
                  Back to home
                </Button>
              </Stack>

              {/* Help text */}
              {!humanVerified && !devBypass && (
                <Typography variant="body2" color="text.secondary">
                  Tip: Adding 3–5 reputable stamps (e.g., GitHub, Google, Phone, Discord) usually crosses the threshold quickly.
                </Typography>
              )}
              {humanVerified && !approved && !devBypass && (
                <Typography variant="body2" color="text.secondary">
                  After your score passes, we’ll ask you to sign a short message to confirm wallet ownership, then approve your wallet on-chain.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {isLoading && (
          <Typography variant="caption" color="text.secondary" align="center">
            Checking your verification status…
          </Typography>
        )}
      </Stack>
    </Container>
  );
}

function Step({ done, text }: { done: boolean; text: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip
        size="small"
        color={done ? 'success' : 'default'}
        variant={done ? 'filled' : 'outlined'}
        label={done ? 'Done' : 'Pending'}
      />
      <Typography variant="body2">{text}</Typography>
    </Stack>
  );
}
