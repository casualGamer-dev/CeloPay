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
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';

const fetcher = (u: string) => fetch(u).then(r => r.json());

/** Parallax background with 3 gradient layers */
function ParallaxBackground() {
  const layerRefs = React.useRef<HTMLDivElement[]>([]);
  const rafRef = React.useRef<number | null>(null);

  const setLayerRef = (idx: number) => (el: HTMLDivElement | null) => {
    if (el) layerRefs.current[idx] = el;
  };

  React.useEffect(() => {
    const speeds = [0.12, 0.2, 0.35]; // smaller = slower

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        layerRefs.current.forEach((el, i) => {
          if (!el) return;
          el.style.transform = `translate3d(0, ${y * speeds[i]}px, 0)`;
        });
        rafRef.current = null;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: 'linear-gradient(180deg, #0b0f14 0%, #0e141b 100%)',
      }}
    >
      {/* Layer 1: Celo green glow */}
      <Box
        ref={setLayerRef(0)}
        sx={{
          position: 'absolute',
          top: '-10vh',
          left: '-10vw',
          width: '60vw',
          height: '60vh',
          borderRadius: '50%',
          filter: 'blur(60px)',
          opacity: 0.45,
          background: 'radial-gradient(closest-side, #22c55e 25%, rgba(34,197,94,0) 70%)',
          mixBlendMode: 'screen',
          transform: 'translate3d(0,0,0)',
          transition: 'transform 0.05s linear',
        }}
      />

      {/* Layer 2: teal accent */}
      <Box
        ref={setLayerRef(1)}
        sx={{
          position: 'absolute',
          top: '20vh',
          right: '-15vw',
          width: '55vw',
          height: '55vh',
          borderRadius: '50%',
          filter: 'blur(70px)',
          opacity: 0.35,
          background: 'radial-gradient(closest-side, #14b8a6 25%, rgba(20,184,166,0) 70%)',
          mixBlendMode: 'screen',
          transform: 'translate3d(0,0,0)',
          transition: 'transform 0.05s linear',
        }}
      />

      {/* Layer 3: soft blue wash */}
      <Box
        ref={setLayerRef(2)}
        sx={{
          position: 'absolute',
          bottom: '-20vh',
          left: '10vw',
          width: '75vw',
          height: '70vh',
          borderRadius: '50%',
          filter: 'blur(90px)',
          opacity: 0.25,
          background: 'radial-gradient(closest-side, #3b82f6 25%, rgba(59,130,246,0) 70%)',
          mixBlendMode: 'screen',
          transform: 'translate3d(0,0,0)',
          transition: 'transform 0.05s linear',
        }}
      />
    </Box>
  );
}

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
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <ParallaxBackground />

      {/* Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          zIndex: 2,
          background: 'rgba(11,15,20,0.35)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 10, height: 10, borderRadius: '50%',
                backgroundColor: '#22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.6)'
              }}
            />
            <Typography fontWeight={700}>Celo Circles</Typography>
            <Chip size="small" label="Beta" variant="outlined" color="success" />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
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
              label={verified ? 'Human Passport: Verified' : 'Not verified'}
            />
            {!isConnected ? (
              <Connect />
            ) : verified ? (
              <Button size="small" variant="outlined" component={Link} href="/dashboard">
                Dashboard
              </Button>
            ) : (
              <HumanPassportButton size="small" />
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 6, md: 10 } }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                p: { xs: 2.5, md: 4 },
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(13,18,25,0.55)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Typography variant="h3" fontWeight={800} gutterBottom>
                Credit that starts with <em style={{ fontStyle: 'normal', color: '#22c55e' }}>trust</em>.
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Join a circle, build your reputation, and access micro-credit in cUSD.
                Simple, transparent, community-first—on Celo.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={2}>
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
                      size="large"
                      variant="contained"
                      onClick={() => goTo('/loans')}
                      disabled={actionsDisabled}
                    >
                      Request a Loan
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  size="large"
                  variant="outlined"
                  color="inherit"
                  component={Link}
                  href="/verify"
                >
                  {isConnected && !verified ? 'Verify with Human Passport' : 'Connect or Verify'}
                </Button>
              </Stack>

              {/* Trust badges */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mt={2}>
                <Chip size="small" label="Built on Celo" variant="outlined" color="success" />
                <Chip size="small" label="Human Spam resistance" variant="outlined" />
                <Chip size="small" label="Open-source friendly" variant="outlined" />
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            {/* Quick stats card */}
            <Card
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(13,18,25,0.45)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Today on Celo Circles
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={6}>
                  <Stat title="Active Circles" value="42" />
                </Grid>
                <Grid item xs={6}>
                  <Stat title="Loans Approved" value="128" />
                </Grid>
                <Grid item xs={6}>
                  <Stat title="Avg Trust Score" value="86" />
                </Grid>
                <Grid item xs={6}>
                  <Stat title="Total cUSD Flow" value="₹12.4L" />
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" mt={1.5}>
                * Demo figures for preview. Connect to see your personalized view.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Features */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 6, md: 8 } }}>
        <Typography variant="overline" color="text.secondary">Why circles?</Typography>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Fair, familiar, and community-powered
        </Typography>

        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} md={4}>
            <Feature
              title="Trust-first credit"
              desc="Your reputation from friends and community helps unlock responsible limits."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Feature
              title="Transparent rates"
              desc="See live APR/APY and health metrics. No surprises, no hidden fees."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Feature
              title="Built for mobile"
              desc="Fast, light, and friendly on any device—because finance should be accessible."
            />
          </Grid>
        </Grid>
      </Container>

      {/* How it works */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: { xs: 6, md: 8 } }}>
        <Card
          sx={{
            p: { xs: 2, md: 3 },
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(13,18,25,0.45)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Typography variant="h6" fontWeight={700}>How it works</Typography>
            </Grid>
            <Grid item xs={12} md={9}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Step k="1" text="Connect wallet & verify once with Human Passport." />
                <Step k="2" text="Create or join a circle; invite trusted friends." />
                <Step k="3" text="Request, review, and approve micro-loans in cUSD." />
                <Step k="4" text="Repay anytime; your trust grows with good history." />
              </Stack>
            </Grid>
          </Grid>
        </Card>
      </Container>

      {/* Testimonial */}
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, pb: { xs: 6, md: 10 } }}>
        <Card
          sx={{
            p: { xs: 2, md: 3 },
            textAlign: 'center',
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(13,18,25,0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom>
            “Feels like borrowing from family, with web3 transparency.”
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Our mission is simple: make community credit feel warm and familiar—while keeping it safe,
            auditable, and fair for everyone.
          </Typography>
        </Card>

        {/* On-chain quick panel when ready */}
        {isConnected && verified && (
          <Box mt={2}>
            <OnchainPanel />
          </Box>
        )}
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(11,15,20,0.35)',
          backdropFilter: 'blur(8px)',
          py: 3,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Celo Circles — Made with ❤️ for communities in India
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button component={Link} href="/verify" size="small" color="inherit">Verify</Button>
              <Button component={Link} href="/dashboard" size="small" color="inherit">Dashboard</Button>
              <Button component={Link} href="/" size="small" color="inherit">Home</Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

/* --- Small presentational helpers --- */
function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Typography variant="h5" fontWeight={800}>{value}</Typography>
    </Box>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <Card
      sx={{
        height: '100%',
        p: 2,
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(13,18,25,0.45)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{desc}</Typography>
      </CardContent>
    </Card>
  );
}

function Step({ k, text }: { k: string; text: string }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box
        sx={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)',
          border: '1px solid rgba(34,197,94,0.4)',
          display: 'grid', placeItems: 'center',
          fontSize: 12, fontWeight: 700, color: '#22c55e',
        }}
      >
        {k}
      </Box>
      <Typography variant="body2">{text}</Typography>
      <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, borderColor: 'rgba(255,255,255,0.06)' }} />
    </Stack>
  );
}
