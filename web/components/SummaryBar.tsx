'use client';

import { Grid, Card, CardContent, Typography } from '@mui/material';

type Props = {
  totalCircles: number;
  totalLoans: number;
  needMyApproval: number;
  needMyDisbursal: number;
  needMyRepay: number;
};

export default function SummaryBar({
  totalCircles,
  totalLoans,
  needMyApproval,
  needMyDisbursal,
  needMyRepay,
}: Props) {
  const StatCard = ({ label, value }: { label: string; value: number }) => (
    <Card>
      <CardContent sx={{ py: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={2.4}>
        <StatCard label="My circles" value={totalCircles} />
      </Grid>
      <Grid item xs={6} md={2.4}>
        <StatCard label="My loans" value={totalLoans} />
      </Grid>
      <Grid item xs={6} md={2.4}>
        <StatCard label="Needs my approval" value={needMyApproval} />
      </Grid>
      <Grid item xs={6} md={2.4}>
        <StatCard label="Needs my disburse" value={needMyDisbursal} />
      </Grid>
      <Grid item xs={12} md={2.4}>
        <StatCard label="Needs my repay" value={needMyRepay} />
      </Grid>
    </Grid>
  );
}
