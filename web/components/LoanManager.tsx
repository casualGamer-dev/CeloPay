'use client';

import abi from '../lib/celo.abi.json';
import erc20 from '../lib/erc20.abi.json';
import { CUSD, toWeiFromCUSD } from '../lib/utils';
import { publicClient } from '../lib/events'; // uses viem client we already have
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { isBytes32 } from '../lib/utils';

export default function LoanManager({ contract }: { contract: `0x${string}` }) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [requestId, setRequestId] = useState('');
  const [disburseCUSD, setDisburseCUSD] = useState('100');
  const [repayCUSD, setRepayCUSD] = useState('100');

  const disabled = !isConnected || !address || isPending;

  async function ensureAllowance(requiredCUSD: string) {
    if (!address) throw new Error('Connect wallet');
    const needed = toWeiFromCUSD(requiredCUSD);

    // read current allowance from chain
    const current = (await publicClient.readContract({
      abi: erc20,
      address: CUSD,
      functionName: 'allowance',
      args: [address as `0x${string}`, contract],
    })) as bigint;

    if (current >= needed) return true;

    // prompt to approve
    const want = confirm(
      `Your cUSD allowance is too low.\n\nCurrent: ${current} wei\nRequired: ${needed} wei\n\nApprove ${requiredCUSD} cUSD to the contract now?`
    );
    if (!want) return false;

    await toast.promise(
      writeContractAsync({
        abi: erc20,
        address: CUSD,
        functionName: 'approve',
        args: [contract, needed],
        account: address as `0x${string}`,
        chain: celoAlfajores,
      }),
      { loading: 'Approving cUSD…', success: 'Approved', error: 'Approval failed' }
    );

    return true;
  }

const approveLoan = async () => {
  if (!contract) return toast.error('Contract not set');
  if (!isBytes32(requestId)) return toast.error('Invalid requestId (bytes32)');
  await toast.promise(
    writeContractAsync({
      abi,
      address: contract,
      functionName: 'approveLoan',
      args: [requestId as `0x${string}`],
      account: address as `0x${string}`,
      chain: celoAlfajores,
    }),
    { loading: 'Approving…', success: 'Approval submitted', error: 'Approval failed' }
  );
};

  const disburse = async () => {
    if (!contract) return toast.error('Contract not set');
    if (!isBytes32(requestId)) return toast.error('Invalid requestId (bytes32)');
    const ok = await ensureAllowance(disburseCUSD);
    if (!ok) return;
    await toast.promise(
      writeContractAsync({
        abi, address: contract, functionName: 'disburse',
        args: [requestId as `0x${string}`],
        account: address as `0x${string}`, chain: celoAlfajores,
      }),
      { loading: 'Disbursing…', success: 'Disburse submitted', error: 'Disburse failed' }
    );
  };

  const repay = async () => {
    if (!contract) return toast.error('Contract not set');
    if (!isBytes32(requestId)) return toast.error('Invalid requestId (bytes32)');
    const ok = await ensureAllowance(repayCUSD);
    if (!ok) return;
    await toast.promise(
      writeContractAsync({
        abi, address: contract, functionName: 'repay',
        args: [requestId as `0x${string}`, toWeiFromCUSD(repayCUSD)],
        account: address as `0x${string}`, chain: celoAlfajores,
      }),
      { loading: 'Repaying…', success: 'Repay submitted', error: 'Repay failed' }
    );
  };

  return (
    <div className="card p-6 space-y-5">
      <h3 className="text-lg font-semibold">Manage Loan</h3>

      <div className="space-y-2">
        <label className="text-sm block">Request ID (bytes32)</label>
        <input
          className="input"
          type="text"
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
          placeholder="0x… (bytes32)"
        />
      </div>

   <div className="flex gap-2">
  <button className="btn" disabled={!isConnected || !address || isPending} onClick={approveLoan}>
    Approve
  </button>
</div>

      <div className="space-y-2">
        <label className="text-sm block">Disburse amount (cUSD)</label>
        <div className="grid gap-2 md:grid-cols-[1fr_auto] items-center">
          <input
            className="input"
            type="text"
            value={disburseCUSD}
            onChange={(e) => setDisburseCUSD(e.target.value)}
            placeholder="e.g. 100"
          />
          <button className="btn" disabled={disabled} onClick={disburse}>
            Disburse
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm block">Repay amount (cUSD)</label>
        <div className="grid gap-2 md:grid-cols-[1fr_auto] items-center">
          <input
            className="input"
            type="text"
            value={repayCUSD}
            onChange={(e) => setRepayCUSD(e.target.value)}
            placeholder="e.g. 100"
          />
          <button className="btn" disabled={disabled} onClick={repay}>
            Repay
          </button>
        </div>
      </div>
    </div>
  );
}
