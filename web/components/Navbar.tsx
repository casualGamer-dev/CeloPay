'use client';

import Link from 'next/link';
import {
  AppBar, Toolbar, Container, Box, Stack, Button, Typography,
} from '@mui/material';

export default function Navbar({ right }: { right?: React.ReactNode }) {
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
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}
        >
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
              <Button component={Link} href="/activity" color="inherit">Activity</Button>
              <Button component={Link} href="/my" color="inherit">My Activity</Button>
            </Stack>
          </Box>
          <Box sx={{ ml: 2 }}>{right}</Box>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
