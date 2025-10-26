'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import useSWR from 'swr';
import { useAccount } from 'wagmi';

import OnchainPanel from '../components/OnchainPanel';
import HumanPassportButton from '../components/HumanPassportButton';
import Connect from '../components/Connect';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function Home() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // Pass address to /api/me so it can include Human Passport score checks
  const meKey = isConnected && address ? `/api/me?address=${address}` : '/api/me';
  const { data, mutate } = useSWR(meKey, fetcher);
  const verified = !!data?.verified;

  React.useEffect(() => {
    const h = () => mutate();
    window.addEventListener('verified:update', h);
    return () => window.removeEventListener('verified:update', h);
  }, [mutate]);

  const goTo = (path: string) => {
    if (!isConnected || !verified) router.push('/verify');
    else router.push(path);
  };

  const actionsDisabled = !isConnected || !verified;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Card>
          <CardContent>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Community BNPL for India — on Celo
            </Typography>

            <Typography variant="body1" color="text.secondary">
              Form trust circles, request micro-credit, approve peers, disburse and repay using cUSD.
              To keep the network fair and Sybil-resistant, please verify once with <b>Human Passport</b>.
            </Typography>

            {/* Status + Quick Onboarding */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              sx={{ mt: 2.5 }}
            >
              <Stack direction="row" spacing={1}>
                <Chip
                  size="small"
                  variant="outlined"
                  color={isConnected ? 'success' : 'default'}
                  label={isConnected ? 'Wallet: Connected' : 'Wallet: Not connected'}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  color={verified ? 'success' : 'default'}
                  label={verified ? 'Human Passport: Verified' : 'Human Passport: Not verified'}
                />
              </Stack>

              <Stack direction="row" spacing={1}>
                {!isConnected ? (
                  <Connect />
                ) : verified ? (
                  <Chip size="small" color="success" variant="outlined" label="Ready to go" />
                ) : (
                  <HumanPassportButton size="small" />
                )}
              </Stack>
            </Stack>

            {/* Primary CTAs */}
            <Stack direction="row" spacing={2} mt={3}>
              <Tooltip
                title={
                  actionsDisabled
                    ? !isConnected
                      ? 'Connect your wallet to continue'
                      : 'Verify with Human Passport to continue'
                    : ''
                }
              >
                <span>
                  <Button
                    variant="contained"
                    onClick={() => goTo('/loans')}
                    disabled={actionsDisabled}
                  >
                    Request Loan
                  </Button>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  actionsDisabled
                    ? !isConnected
                      ? 'Connect your wallet to continue'
                      : 'Verify with Human Passport to continue'
                    : ''
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    onClick={() => goTo('/dashboard')}
                    disabled={actionsDisabled}
                  >
                    Open Dashboard
                  </Button>
                </span>
              </Tooltip>

              {/* Optional: always-visible link to onboarding */}
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Button component={Link} href="/verify" color="inherit">
                  Verify / Connect
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Show on-chain quick actions only when fully ready */}
        {isConnected && verified && <OnchainPanel />}
      </Stack>
    </Container>
  );
}
