'use client';
import abi from '../lib/celo.abi.json';
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { isBytes32, toWeiFromCUSD } from '../lib/utils';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function LoanManager({ contract }: { contract: `0x${string}` }) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [requestId, setRequestId] = useState('');
  const [repayCUSD, setRepayCUSD] = useState('100');

  const disabled = !isConnected || !address || isPending;

  const approve = async () => {
    if (!isBytes32(requestId)) return toast.error('Invalid requestId (bytes32)');
    try {
      await toast.promise(
        writeContractAsync({
          abi, address: contract, functionName: 'approveLoan',
          args: [requestId as `0x${string}`],
          account: address as `0x${string}`, chain: celoAlfajores,
        }),
        { loading: 'Approving…', success: 'Approval submitted', error: 'Approval failed' }
      );
    } catch {}
  };

  const disburse = async () => {
    if (!isBytes32(requestId)) return toast.error('Invalid requestId (bytes32)');
    try {
      await toast.promise(
        writeContractAsync({
          abi, address: contract, functionName: 'disburse',
          args: [requestId as `0x${string}`],
          account: address as `0x${string}`, chain: celoAlfajores,
        }),
        { loading: 'Disbursing…', success: 'Disburse submitted', error: 'Disburse failed' }
      );
    } catch {}
  };

  const repay = async () => {
    if (!isBytes32(requestId)) return toast.error('Invalid requestId (bytes32)');
    const amount = toWeiFromCUSD(repayCUSD);
    try {
      await toast.promise(
        writeContractAsync({
          abi, address: contract, functionName: 'repay',
          args: [requestId as `0x${string}`, amount],
          account: address as `0x${string}`, chain: celoAlfajores,
        }),
        { loading: 'Repaying…', success: 'Repay submitted', error: 'Repay failed' }
      );
    } catch {}
  };

  return (
    <div className="card p-6 space-y-3">
      <h3 className="text-lg font-semibold">Manage Loan</h3>

      <label className="text-sm">Request ID (bytes32)</label>
      <input className="input" value={requestId} onChange={e=>setRequestId(e.target.value)} placeholder="0x…" />

      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={disabled} onClick={approve}>Approve</button>
        <button className="btn" disabled={disabled} onClick={disburse}>Disburse</button>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <input className="input" value={repayCUSD} onChange={e=>setRepayCUSD(e.target.value)} placeholder="Repay amount (cUSD)" />
        <button className="btn" disabled={disabled} onClick={repay}>Repay</button>
      </div>

      <p className="text-xs text-gray-500">
        Note: Disburse/Repay require cUSD allowance to the contract. Use the Approve box below.
      </p>
    </div>
  );
}
