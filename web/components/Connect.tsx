'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button, Chip, Stack, Tooltip } from '@mui/material';
import { LoadingButton } from '@mui/lab';

export default function Connect() {
  const { isConnected, address } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    const short =
      address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connected';

    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip size="small" variant="outlined" color="success" label={short} />
        <Button variant="outlined" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </Stack>
    );
  }

  return (
    <Tooltip title="Connect with an injected wallet (e.g., MetaMask)">
      <span>
        <LoadingButton
          variant="contained"
          onClick={() => connect({ connector: injected() })}
          loading={isPending}
        >
          Connect Wallet
        </LoadingButton>
      </span>
    </Tooltip>
  );
}
