"use client";
import * as React from "react";
import { Paper, Stack, Typography } from "@mui/material";

export default function KpiCard({
  label, value, sublabel,
}: { label: string; value: string | number; sublabel?: string; }) {
  return (
    <Paper elevation={1} sx={{ p: 2.5 }}>
      <Stack spacing={0.5}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5">{value}</Typography>
        {sublabel ? <Typography variant="caption" color="text.secondary">{sublabel}</Typography> : null}
      </Stack>
    </Paper>
  );
}
