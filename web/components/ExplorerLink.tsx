'use client';
const BASE = process.env.NEXT_PUBLIC_CELOSCAN_BASE || 'https://alfajores.celoscan.io';

export default function ExplorerLink({ tx, addr }: { tx?: string; addr?: string }) {
  if (!tx && !addr) return null;
  const href = tx ? `${BASE}/tx/${tx}` : `${BASE}/address/${addr}`;
  return (
    <a className="text-xs underline text-blue-600 hover:text-blue-800" href={href} target="_blank">
      View on Celoscan
    </a>
  );
}
