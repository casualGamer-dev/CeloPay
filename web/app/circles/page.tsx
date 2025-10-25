'use client';
import abi from '../../lib/nyaaya.abi.json';
import { useAccount, useChainId, useWriteContract } from 'wagmi';
import { useState } from 'react';

const addr = process.env.NEXT_PUBLIC_NYAAYA_ADDRESS as `0x${string}` | undefined;

export default function CirclesPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract, isPending } = useWriteContract();
  const [name, setName] = useState('My College Circle');
  const [description, setDescription] = useState('Friends trust circle');
  const [joinId, setJoinId] = useState('');

  const account = address as `0x${string}` | undefined;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-6 space-y-3">
        <h3 className="text-lg font-semibold">Create Circle (on-chain)</h3>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <button
          disabled={!addr || !isConnected || isPending}
          className="btn btn-primary"
          onClick={() => {
            if (!addr || !account) return alert('Set NEXT_PUBLIC_NYAAYA_ADDRESS and connect wallet');
            writeContract({
              abi,
              address: addr,
              functionName: 'createCircle',
              args: [name, description],
              account,
              chainId,
            });
          }}
        >
          {isPending ? 'Submitting…' : 'Create'}
        </button>
        {!addr && <p className="text-gray-500 text-sm">Set NEXT_PUBLIC_NYAAYA_ADDRESS in .env</p>}
      </div>

      <div className="card p-6 space-y-3">
        <h3 className="text-lg font-semibold">Join Circle (on-chain)</h3>
        <input
          className="input"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          placeholder="Circle bytes32 id (0x…)"
        />
        <button
          disabled={!addr || !isConnected || isPending}
          className="btn"
          onClick={() => {
            if (!addr || !account) return alert('Set NEXT_PUBLIC_NYAAYA_ADDRESS and connect wallet');
            writeContract({
              abi,
              address: addr,
              functionName: 'joinCircle',
              args: [joinId as `0x${string}`], // bytes32
              account,
              chainId,
            });
          }}
        >
          {isPending ? 'Submitting…' : 'Join'}
        </button>
      </div>
    </div>
  );
}
