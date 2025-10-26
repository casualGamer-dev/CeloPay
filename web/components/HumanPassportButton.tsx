'use client';
import * as React from 'react';
import { Button, Stack, Tooltip, Typography } from '@mui/material';
import { useAccount } from 'wagmi';

export default function HumanPassportButton() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = React.useState(false);
  const [score, setScore] = React.useState<number | null>(null);
  const [passing, setPassing] = React.useState<boolean | null>(null);

  const refresh = async () => {
    if (!address) return;
    setLoading(true);
    const r = await fetch(`/api/human/score?address=${address}`, { cache: 'no-store' });
    const j = await r.json();
    setScore(j?.score ?? null);
    setPassing(!!j?.passing);
    setLoading(false);
    window.dispatchEvent(new Event('verified:update')); // refresh SWR in your app
  };

  const openPassport = () => {
    // Send users to complete stamps; they return and click Refresh
    window.open('https://app.passport.xyz/', '_blank', 'noopener,noreferrer');
  };

  return (
    <Stack spacing={1} direction="row" alignItems="center">
      <Tooltip title="Open Human Passport to collect/refresh your stamps">
        <span><Button variant="outlined" onClick={openPassport} disabled={!isConnected}>Open Passport</Button></span>
      </Tooltip>
      <Button variant="contained" onClick={refresh} disabled={!isConnected || loading}>
        {loading ? 'Checking…' : 'Refresh Score'}
      </Button>
      {score !== null && (
        <Typography variant="body2" color={passing ? 'success.main' : 'warning.main'}>
          Score: {score} {passing ? '(passes)' : '(below threshold)'}
        </Typography>
      )}
    </Stack>
  );
}
