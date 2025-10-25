'use client';

import abi from '../lib/celo.abi.json';
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { useState } from 'react';
import { isBytes32 } from '../lib/utils';

// MUI
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

const addr = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;

export default function OnchainPanel() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const account = address as `0x${string}` | undefined;

  const [message, setMessage] = useState<string | undefined>();

  // Dialog state
  const [openCreate, setOpenCreate] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);

  // Form state
  const [circleName, setCircleName] = useState('My Circle');
  const [circleDesc, setCircleDesc] = useState('');
  const [joinId, setJoinId] = useState('');

  if (!addr) {
    return (
      <Alert severity="info" variant="outlined">
        On-chain is disabled — set <code>NEXT_PUBLIC_CELO_ADDRESS</code> in <code>.env</code>.
      </Alert>
    );
  }

  if (!isConnected || !account) {
    return (
      <Alert severity="info" variant="outlined">
        Connect wallet to use on-chain actions.
      </Alert>
    );
  }

  const submitCreate = () => {
    writeContract(
      {
        abi,
        address: addr,
        functionName: 'createCircle',
        args: [circleName || 'My Circle', circleDesc || ''],
        account,
        chain: celoAlfajores,
      },
      {
        onSuccess: () => {
          setMessage('Submitted createCircle');
          setOpenCreate(false);
        },
        onError: (e: any) => setMessage(e?.message),
      }
    );
  };

  const submitJoin = () => {
    if (!isBytes32(joinId)) {
      setMessage('Invalid CircleId: expected 0x + 64 hex characters.');
      return;
    }
    writeContract(
      {
        abi,
        address: addr,
        functionName: 'joinCircle',
        args: [joinId as `0x${string}`],
        account,
        chain: celoAlfajores,
      },
      {
        onSuccess: () => {
          setMessage('Submitted joinCircle');
          setOpenJoin(false);
        },
        onError: (e: any) => setMessage(e?.message),
      }
    );
  };

  const joinIdError = joinId.length > 0 && !isBytes32(joinId);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">On-chain quick actions</Typography>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <LoadingButton
              variant="contained"
              onClick={() => setOpenCreate(true)}
              loading={isPending}
            >
              Create Circle
            </LoadingButton>

            <Button variant="outlined" onClick={() => setOpenJoin(true)}>
              Join Circle
            </Button>
          </Stack>

          {message && (
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          )}
        </Stack>
      </CardContent>

      {/* Create Circle Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Circle</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
              placeholder="My College Circle"
              fullWidth
            />
            <TextField
              label="Description"
              value={circleDesc}
              onChange={(e) => setCircleDesc(e.target.value)}
              placeholder="Friends trust circle"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <LoadingButton variant="contained" onClick={submitCreate} loading={isPending}>
            Submit
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Join Circle Dialog */}
      <Dialog open={openJoin} onClose={() => setOpenJoin(false)} fullWidth maxWidth="sm">
        <DialogTitle>Join Circle</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="CircleId (bytes32)"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="0x + 64 hex"
              error={joinIdError}
              helperText={joinIdError ? 'Expected 0x + 64 hex characters' : 'Paste the circleId'}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenJoin(false)}>Cancel</Button>
          <LoadingButton
            variant="contained"
            onClick={submitJoin}
            loading={isPending}
            disabled={joinId.length === 0}
          >
            Submit
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
