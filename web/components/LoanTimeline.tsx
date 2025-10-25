'use client';

import { useEffect, useState } from 'react';
import ExplorerLink from './ExplorerLink';

// MUI
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';

type Item = {
  name: string;
  args: Record<string, any>;
  txHash: `0x${string}`;
  blockNumber: bigint;
  timestamp?: number;
};

export default function LoanTimeline({ requestId }: { requestId: `0x${string}` }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const r = await fetch(`/api/loan/${requestId}`);
        const j = await r.json();
        if (!active) return;
        setItems(j.ok ? (j.data as Item[]) : []);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [requestId]);

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Box>
        <Typography variant="caption" color="text.secondary">
          requestId
        </Typography>
        <Box
          sx={{
            mt: 0.5,
            p: 1,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            wordBreak: 'break-all',
          }}
        >
          {requestId}
        </Box>
      </Box>

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading events…</Typography>
        </Box>
      )}

      {/* Empty state */}
      {!loading && (!items || items.length === 0) && (
        <Alert severity="info" variant="outlined">
          No events yet.
        </Alert>
      )}

      {/* Events */}
      {!loading &&
        items &&
        items.map((it, i) => {
          const ts = it.timestamp ? new Date(it.timestamp * 1000).toLocaleString() : '—';
          return (
            <Card key={`${it.txHash}-${i}`}>
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {it.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ts}
                    </Typography>
                  </Box>

                  <Divider />

                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {Object.entries(it.args).map(([k, v]) => (
                      <Box key={k} sx={{ display: 'flex', gap: 0.75, alignItems: 'baseline' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 96 }}>
                          {k}:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            wordBreak: 'break-all',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          }}
                        >
                          {String(v)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Box sx={{ mt: 1 }}>
                    <ExplorerLink tx={it.txHash} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
    </Stack>
  );
}
