'use client';
import abi from '../lib/celo.abi.json';
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { useState } from 'react';

const addr = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;

export default function OnchainPanel() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [message, setMessage] = useState<string | undefined>();
  const account = address as `0x${string}` | undefined;

  if (!addr) return (
    <div className="text-gray-500">
      On-chain is disabled — set <code>NEXT_PUBLIC_CELO_ADDRESS</code> in <code>.env</code>.
    </div>
  );
  if (!isConnected || !account) return <div className="text-gray-500">Connect wallet to use on-chain actions.</div>;

  return (
    <div className="card p-4 space-y-2">
      <h3 className="text-lg font-semibold">On-chain quick actions</h3>
      <div className="flex flex-wrap gap-2">
        <button
          className="btn btn-primary"
          onClick={() => {
            const name = prompt('Circle Name?') || 'My Circle';
            const desc = prompt('Description?') || '';
            writeContract(
              {
                abi,
                address: addr,
                functionName: 'createCircle',
                args: [name, desc],     // (string, string)
                account,
                chain: celoAlfajores,   // ✅ wagmi v2 expects chain, not chainId
              },
              {
                onSuccess: () => setMessage('Submitted createCircle'),
                onError: (e: any) => setMessage(e.message),
              }
            );
          }}
        >
          {isPending ? 'Submitting…' : 'Create Circle'}
        </button>

        <button
          className="btn"
          onClick={() => {
            const id = prompt('CircleId (bytes32 hex) to join?') as `0x${string}` | null;
            if (!id) return;
            writeContract(
              {
                abi,
                address: addr,
                functionName: 'joinCircle',
                args: [id],             // bytes32 → `0x${string}`
                account,
                chain: celoAlfajores,
              },
              {
                onSuccess: () => setMessage('Submitted joinCircle'),
                onError: (e: any) => setMessage(e.message),
              }
            );
          }}
        >
          Join Circle
        </button>
      </div>
      {message && <div className="text-sm text-gray-600">{message}</div>}
    </div>
  );
}
