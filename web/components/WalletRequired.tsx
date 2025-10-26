'use client';

import { useAccount } from 'wagmi';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import Connect from '../components/Connect';

export default function WalletRequired({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  if (!isConnected) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={1.5} alignItems="flex-start">
            <Typography variant="body2" color="text.secondary">
              Connect wallet to continue.
            </Typography>
            <Connect />
          </Stack>
        </CardContent>
      </Card>
    );
  }
  return <>{children}</>;
}
