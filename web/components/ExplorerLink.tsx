'use client';

import { Link, Typography } from '@mui/material';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';

const BASE = process.env.NEXT_PUBLIC_CELOSCAN_BASE || 'https://alfajores.celoscan.io';

export default function ExplorerLink({ tx, addr }: { tx?: string; addr?: string }) {
  if (!tx && !addr) return null;

  const href = tx ? `${BASE}/tx/${tx}` : `${BASE}/address/${addr}`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
    >
      <Typography variant="caption">View on Celoscan</Typography>
      <LaunchRoundedIcon fontSize="inherit" />
    </Link>
  );
}
