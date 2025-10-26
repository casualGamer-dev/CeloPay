'use client';

import * as React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { useAccount } from 'wagmi';

export default function HumanPassportButton({ size = 'small' }: { size?: 'small'|'medium'|'large' }) {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = React.useState(false);
  const [score, setScore] = React.useState<number | null>(null);
  const [passing, setPassing] = React.useState<boolean | null>(null);

  const openPassport = () => {
    window.open('https://app.passport.xyz/', '_blank', 'noopener,noreferrer');
  };

  const refresh = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/human/score?address=${address}`, { cache: 'no-store' });
      const j = await r.json();
      setScore(j?.score ?? null);
      setPassing(!!j?.passing);
      // Notify app to re-fetch /api/me (enables features everywhere)
      window.dispatchEvent(new Event('verified:update'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={0.75} alignItems="flex-start">
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" size={size} onClick={openPassport} disabled={!isConnected}>
          Open Human Passport
        </Button>
        <Button variant="contained" size={size} onClick={refresh} disabled={!isConnected || loading}>
          {loading ? 'Checking…' : 'Check my score'}
        </Button>
      </Stack>
      {score !== null && (
        <Typography variant="caption" color={passing ? 'success.main' : 'warning.main'}>
          Score: {score} {passing ? '— passes' : '— add a few more stamps to pass'}
        </Typography>
      )}
    </Stack>
  );
}
