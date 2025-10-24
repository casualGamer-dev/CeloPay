'use client';
import { injected } from 'wagmi/connectors';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function Connect() {
  const { isConnected, address } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 rounded-lg bg-muted border">{address?.slice(0,6)}…{address?.slice(-4)}</span>
        <button className="btn" onClick={()=>disconnect()}>Disconnect</button>
      </div>
    );
  }
  const connector = injected({ target: 'metaMask' });
  return <button className="btn" onClick={()=>connect({ connector })}>{isPending? 'Connecting…':'Connect Wallet'}</button>;
}
