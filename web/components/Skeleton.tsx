'use client';

import { Skeleton as MUISkeleton, Stack } from '@mui/material';

export default function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Stack spacing={1}>
      {[...Array(rows)].map((_, i) => (
        <MUISkeleton key={i} variant="rounded" height={32} />
      ))}
    </Stack>
  );
}
