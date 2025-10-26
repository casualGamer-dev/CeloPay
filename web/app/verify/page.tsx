'use client';

import { Container, Card, CardContent, Stack, Typography } from '@mui/material';
import Connect from '../../components/Connect';
import WorldVerifyButton from '../../components/WorldVerifyButton';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import * as React from 'react';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function VerifyPage() {
  const router = useRouter();
  const { data, mutate } = useSWR('/api/me', fetcher);

  React.useEffect(() => {
    const h = () => { mutate(); };
    window.addEventListener('verified:update', h);
    return () => window.removeEventListener('verified:update', h);
  }, [mutate]);

  const verified = !!data?.verified;

  React.useEffect(() => {
    if (verified) router.replace('/dashboard');
  }, [verified, router]);

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6">Access required</Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Please connect your wallet and complete World ID verification to access CeloPay.
            </Typography>
            <Connect />
            <WorldVerifyButton />
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
