'use client';
import { useNetworkGuard } from '../hooks/useNetworkGuard';
import SwitchToAlfajores from './SwitchToAlfajores';

export default function NetworkBanner() {
  const { onWrongNetwork } = useNetworkGuard();
  if (!onWrongNetwork) return null;
  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="container py-3 flex items-center justify-between">
        <div className="text-sm">
          You’re on the wrong network. Please switch to <b>Celo Alfajores</b> to continue.
        </div>
        <SwitchToAlfajores />
      </div>
    </div>
  );
}
