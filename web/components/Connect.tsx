'use client';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export default function Connect() {
  const { isConnected, address } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 rounded-lg bg-[#f6f6f6] border">
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </span>
        <button className="btn" onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <button className="btn" onClick={() => connect({ connector: injected() })}>
      {isPending ? 'Connecting…' : 'Connect Wallet'}
    </button>
  );
}
