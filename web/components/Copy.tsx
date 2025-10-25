'use client';
import { useState } from 'react';

export default function Copy({ value, className='' }: { value: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className={`text-xs px-2 py-1 border rounded ${className}`}
      onClick={async () => { await navigator.clipboard.writeText(value); setOk(true); setTimeout(()=>setOk(false), 1200); }}
      title="Copy"
    >
      {ok ? 'Copied' : 'Copy'}
    </button>
  );
}
