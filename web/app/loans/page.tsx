'use client';
import abi from '../../lib/celo.abi.json';
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { useState } from 'react';
import { isBytes32, toWeiFromCUSD } from '../../lib/utils';
import TokenApprove from '../../components/TokenApprove';
import LoanManager from '../../components/LoanManager';
import toast from 'react-hot-toast';

const addr = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;

export default function LoansPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [circleId, setCircleId] = useState('');
  const [amountCUSD, setAmountCUSD] = useState('100');
  const [installments, setInstallments] = useState('3');
  const [result, setResult] = useState<string>();

  const requestOnchain = async () => {
    if (!addr) return toast.error('Contract not set (NEXT_PUBLIC_CELO_ADDRESS)');
    if (!isConnected || !address) return toast.error('Connect wallet');
    if (!isBytes32(circleId)) return toast.error('CircleId must be bytes32 (0x + 64 hex)');
    const amtWei = toWeiFromCUSD(amountCUSD);
    const ins = Math.max(1, Math.min(12, Number(installments) || 3));
    try {
      await toast.promise(
        writeContractAsync({
          abi, address: addr, functionName: 'requestLoan',
          args: [circleId as `0x${string}`, amtWei, ins],
          account: address as `0x${string}`, chain: celoAlfajores,
        }),
        { loading: 'Requesting loan…', success: 'Loan request submitted', error: 'Request failed' }
      );
    } catch (e: any) {
      setResult(e?.message ?? String(e));
    }
  };

  // JSON demo still available if you use /api (optional)
  async function submitJson() {
    const res = await fetch('/api/loans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ circleId: 'demo', amountCUSD, installments: Number(installments), borrower: address || '0x0' })
    }).then(r=>r.json());
    if (res.ok) setResult(`Mock loan id: ${res.data.id}`); else setResult('Failed');
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-6 space-y-3">
        <h3 className="text-lg font-semibold">Request Loan (on-chain)</h3>
        <input className="input" value={circleId} onChange={e=>setCircleId(e.target.value)} placeholder="Circle ID (bytes32 0x…)" />
        <input className="input" value={amountCUSD} onChange={e=>setAmountCUSD(e.target.value)} placeholder="Amount (cUSD)" />
        <input className="input" value={installments} onChange={e=>setInstallments(e.target.value)} placeholder="Installments (1–12)" />
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={requestOnchain} disabled={isPending || !addr || !isConnected}>
            {isPending ? 'Submitting…' : 'Request Loan'}
          </button>
          <button className="btn" onClick={submitJson}>Mock (JSON)</button>
        </div>
        {result && <p className="text-sm text-gray-600">{result}</p>}
      </div>

      <div className="space-y-6">
        {addr && <LoanManager contract={addr} />}
        {addr && <TokenApprove spender={addr} />}
        {!addr && <div className="card p-6 text-sm text-gray-600">Set <code>NEXT_PUBLIC_CELO_ADDRESS</code> to enable on-chain actions.</div>}
      </div>
    </div>
  );
}
