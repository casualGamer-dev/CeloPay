'use client';

import abi from '../../lib/celo.abi.json';
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { useState, useMemo } from 'react';
import { computeCircleId, isBytes32 } from '../../lib/utils';
import toast from 'react-hot-toast';
import Copy from '../../components/Copy';

// MUI
import {
  Grid,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Tooltip,
  Alert,
  Box,
  Button,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

const addr = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;

export default function CirclesPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [name, setName] = useState('My College Circle');
  const [description, setDescription] = useState('Friends trust circle');
  const [joinId, setJoinId] = useState('');
  const [note, setNote] = useState<string>();

  const account = address as `0x${string}` | undefined;

  const predictedId = useMemo(
    () => (account ? computeCircleId(account, name) : undefined),
    [account, name]
  );

  const disabledGlobal = !addr || !isConnected || !account || isPending;

  const onCreate = async () => {
    if (!addr) return toast.error('Contract not set (NEXT_PUBLIC_CELO_ADDRESS)');
    if (!isConnected || !account) return toast.error('Connect wallet');

    try {
      await toast.promise(
        writeContractAsync({
          abi,
          address: addr,
          functionName: 'createCircle',
          args: [name, description],
          account,
          chain: celoAlfajores,
        }),
        {
          loading: 'Creating circle…',
          success: 'Circle creation submitted',
          error: 'Create failed',
        }
      );
      setNote(undefined);
    } catch (e: any) {
      setNote(e?.message ?? String(e));
    }
  };

  const onJoin = async () => {
    if (!addr) return toast.error('Contract not set (NEXT_PUBLIC_CELO_ADDRESS)');
    if (!isConnected || !account) return toast.error('Connect wallet');
    if (!isBytes32(joinId)) return toast.error('Invalid bytes32 (0x + 64 hex)');

    try {
      await toast.promise(
        writeContractAsync({
          abi,
          address: addr,
          functionName: 'joinCircle',
          args: [joinId as `0x${string}`],
          account,
          chain: celoAlfajores,
        }),
        {
          loading: 'Joining circle…',
          success: 'Join submitted',
          error: 'Join failed',
        }
      );
      setNote(undefined);
    } catch (e: any) {
      setNote(e?.message ?? String(e));
    }
  };

  const joinIdError = joinId.length > 0 && !isBytes32(joinId);

  return (
    <Grid container spacing={3}>
      {/* Create Circle */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Create Credit Circle</Typography>

              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My College Circle"
                fullWidth
              />

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Friends trust circle"
                fullWidth
              />

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Predicted circleId (keccak256(address, name)):
                </Typography>
                <Box
                  sx={{
                    mt: 0.75,
                    p: 1,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    wordBreak: 'break-all',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    {predictedId || '— connect wallet —'}
                  </Box>
                  {predictedId && <Copy value={predictedId} />}
                </Box>
              </Box>

              <Tooltip
                title={
                  !addr
                    ? 'Contract address not set'
                    : !isConnected
                    ? 'Connect wallet'
                    : undefined
                }
              >
                <span>
                  <LoadingButton
                    variant="contained"
                    onClick={onCreate}
                    loading={isPending}
                    disabled={disabledGlobal}
                  >
                    Create Circle
                  </LoadingButton>
                </span>
              </Tooltip>

              {!addr && (
                <Alert severity="info" variant="outlined">
                  Set <code>NEXT_PUBLIC_CELO_ADDRESS</code> in <code>.env</code>
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Join Circle */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Join Credit Circle</Typography>

              <TextField
                label="Circle ID (0x… bytes32)"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="0x + 64 hex characters"
                error={joinIdError}
                helperText={
                  joinIdError ? 'Expected 0x + 64 hex characters' : 'Paste the circleId'
                }
                fullWidth
              />

              <Tooltip
                title={
                  !addr
                    ? 'Contract address not set'
                    : !isConnected
                    ? 'Connect wallet'
                    : undefined
                }
              >
                <span>
                  <LoadingButton
                    variant="outlined"
                    onClick={onJoin}
                    loading={isPending}
                    disabled={disabledGlobal}
                  >
                    Join Circle
                  </LoadingButton>
                </span>
              </Tooltip>

              {note && (
                <Alert severity="info" variant="outlined">
                  {note}
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
