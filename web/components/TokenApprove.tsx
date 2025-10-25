'use client';
import erc20 from '../lib/erc20.abi.json';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { toWeiFromCUSD, fromWeiToCUSD } from '../lib/utils';
import toast from 'react-hot-toast';
import { useState } from 'react';

const CUSD = (process.env.NEXT_PUBLIC_CUSD_ADDRESS ||
  '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1') as `0x${string}`;

export default function TokenApprove({ spender }: { spender: `0x${string}` }) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('100'); // cUSD
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: allowance } = useReadContract({
    abi: erc20,
    address: CUSD,
    functionName: 'allowance',
    args: [address as `0x${string}`, spender],
  });

  const doApprove = async () => {
    try {
      await toast.promise(
        writeContractAsync({
          abi: erc20,
          address: CUSD,
          functionName: 'approve',
          args: [spender, toWeiFromCUSD(amount)],
          chain: celoAlfajores,
          account: address as `0x${string}`,
        }),
        { loading: 'Approving cUSD…', success: 'Approval submitted', error: 'Approval failed' }
      );
    } catch {}
  };

  return (
    <div className="card p-4 space-y-2">
      <div className="font-semibold">cUSD Allowance</div>
      <div className="text-sm text-gray-600">
        Current allowance: {allowance ? `${fromWeiToCUSD(allowance as bigint)} cUSD` : '—'}
      </div>
      <div className="flex gap-2">
        <input className="input" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount (cUSD)" />
        <button className="btn btn-primary" onClick={doApprove} disabled={isPending}>
          {isPending ? 'Approving…' : 'Approve'}
        </button>
      </div>
    </div>
  );
}
