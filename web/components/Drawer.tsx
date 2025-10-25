'use client';
import { useEffect } from 'react';

export default function Drawer({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; }) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button className="text-sm underline" onClick={onClose}>Close</button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
