'use client';
export default function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-8 bg-gray-100 rounded" />
      ))}
    </div>
  );
}
