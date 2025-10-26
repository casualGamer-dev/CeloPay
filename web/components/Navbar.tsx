'use client';

import Link from 'next/link';
import * as React from 'react';
import useSWR from 'swr';
import WorldVerifyButton from './WorldVerifyButton';

import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Stack,
  Button,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function Navbar({ right }: { right?: React.ReactNode }) {
  const { data, mutate } = useSWR('/api/me', fetcher);

  React.useEffect(() => {
    const h = () => mutate();
    window.addEventListener('verified:update', h);
    return () => window.removeEventListener('verified:update', h);
  }, [mutate]);

  const verified = !!data?.verified;

  return (
    <AppBar
      position="sticky"
      color="transparent"
      sx={{
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(15,20,26,0.6)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Toolbar disableGutters>
        <Container
          maxWidth="lg"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5,
          }}
        >
          {/* Brand + Nav */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, letterSpacing: 0.2 }}
              component={Link}
              href="/"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              CeloPay
            </Typography>

            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Button component={Link} href="/dashboard" color="inherit">Dashboard</Button>
              <Button component={Link} href="/circles" color="inherit">Circles</Button>
              <Button component={Link} href="/loans" color="inherit">Loans</Button>
              <Button component={Link} href="/chat" color="inherit">Chat</Button>
              <Button component={Link} href="/my" color="inherit">My Activity</Button>
            </Stack>
          </Box>

          {/* Right side: Verify + whatever is passed in (e.g., <Connect/>) */}
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ ml: 2 }}>
            {verified ? (
              <Chip size="small" color="success" variant="outlined" label="Verified" />
            ) : (
              <Tooltip title="Private proof-of-personhood via World ID">
                <span>
                  <WorldVerifyButton size="small" />
                </span>
              </Tooltip>
            )}
            {right}
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
