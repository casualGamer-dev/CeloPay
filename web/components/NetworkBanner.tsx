'use client';

import { useNetworkGuard } from '../hooks/useNetworkGuard';
import SwitchToAlfajores from './SwitchToAlfajores';

// MUI
import { Alert, Box, Stack, Typography } from '@mui/material';

export default function NetworkBanner() {
  const { onWrongNetwork } = useNetworkGuard();
  if (!onWrongNetwork) return null;

  return (
    <Alert
      severity="warning"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'warning.light',
        mb: 0,
        py: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
      >
        <Typography variant="body2">
          You’re on the wrong network. Please switch to <b>Celo Alfajores</b> to continue.
        </Typography>
        <Box>
          <SwitchToAlfajores />
        </Box>
      </Stack>
    </Alert>
  );
}
