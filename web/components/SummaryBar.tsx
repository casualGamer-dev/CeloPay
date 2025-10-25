'use client';

export default function SummaryBar({
  totalCircles,
  totalLoans,
  needMyApproval,
  needMyDisbursal,
  needMyRepay,
}: {
  totalCircles: number;
  totalLoans: number;
  needMyApproval: number;
  needMyDisbursal: number;
  needMyRepay: number;
}) {
  const Card = ({ label, value }: { label: string; value: number }) => (
    <div className="flex-1 rounded-xl border p-3 bg-white shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );

  return (
    <div className="grid gap-3 md:grid-cols-5">
      <Card label="My circles" value={totalCircles} />
      <Card label="My loans" value={totalLoans} />
      <Card label="Needs my approval" value={needMyApproval} />
      <Card label="Needs my disburse" value={needMyDisbursal} />
      <Card label="Needs my repay" value={needMyRepay} />
    </div>
  );
}
