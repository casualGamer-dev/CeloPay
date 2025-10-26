'use client';

import Link from 'next/link';
import * as React from 'react';
import useSWR from 'swr';
import { useAccount } from 'wagmi';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Stack,
  Button,
  Typography,
  Chip,
} from '@mui/material';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function Navbar({ right }: { right?: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const meKey = isConnected && address ? `/api/me?address=${address}` : null;
  const { data: me } = useSWR(meKey, fetcher);

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
              <Button component={Link} href="/pool" color="inherit">Pool</Button>
              <Button component={Link} href="/loans" color="inherit">loans</Button>
              <Button component={Link} href="/chat" color="inherit">Chat</Button>
              <Button component={Link} href="/my" color="inherit">My Activity</Button>
            </Stack>
          </Box>

          {/* Right side */}
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ ml: 2 }}>
            {me?.approved ? (
              <Chip size="small" color="success" variant="outlined" label="✅ Human Verified" />
            ) : (
              <Chip size="small" variant="outlined" label="Verify" />
            )}
            {right}
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
