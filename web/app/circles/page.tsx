'use client';
import abi from '../../lib/celo.abi.json';
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { useState, useMemo } from 'react';
import { computeCircleId, isBytes32 } from '../../lib/utils';

const addr = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;

export default function CirclesPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [name, setName] = useState('My College Circle');
  const [description, setDescription] = useState('Friends trust circle');
  const [joinId, setJoinId] = useState('');

  const account = address as `0x${string}` | undefined;
  const predictedId = useMemo(
    () => (account ? computeCircleId(account, name) : undefined),
    [account, name]
  );

  const onCreate = async () => {
    if (!addr || !account) return alert('Set NEXT_PUBLIC_CELO_ADDRESS & connect wallet');
    try {
      await writeContractAsync({
        abi,
        address: addr,
        functionName: 'createCircle',
        args: [name, description],
        account,
        chain: celoAlfajores,
      });
      alert('Circle created! You can copy the ID shown below.');
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  };

  const onJoin = async () => {
    if (!addr || !account) return alert('Set NEXT_PUBLIC_CELO_ADDRESS & connect wallet');
    if (!isBytes32(joinId)) return alert('Invalid bytes32 (0x + 64 hex)');
    try {
      await writeContractAsync({
        abi,
        address: addr,
        functionName: 'joinCircle',
        args: [joinId as `0x${string}`],
        account,
        chain: celoAlfajores,
      });
      alert('Join submitted.');
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-6 space-y-3">
        <h3 className="text-lg font-semibold">Create Circle</h3>
        <input className="input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" />
        <input className="input" value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description" />
        <div className="text-xs text-gray-600">
          Predicted circleId (keccak256(address,name)):
          <div className="mt-1 select-all break-all p-2 border rounded">
            {predictedId || '— connect wallet —'}
          </div>
        </div>
        <button
          disabled={!addr || !isConnected || !account || isPending}
          className="btn btn-primary"
          onClick={onCreate}
        >
          {isPending ? 'Creating…' : 'Create Circle'}
        </button>
        {!addr && <p className="text-gray-500 text-sm">Set NEXT_PUBLIC_CELO_ADDRESS in .env</p>}
      </div>

      <div className="card p-6 space-y-3">
        <h3 className="text-lg font-semibold">Join Circle</h3>
        <input className="input" value={joinId} onChange={(e)=>setJoinId(e.target.value)} placeholder="Circle ID (0x… bytes32)" />
        <button
          disabled={!addr || !isConnected || !account || isPending}
          className="btn"
          onClick={onJoin}
        >
          {isPending ? 'Submitting…' : 'Join Circle'}
        </button>
      </div>
    </div>
  );
}
