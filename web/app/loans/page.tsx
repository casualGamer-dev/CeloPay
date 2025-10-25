'use client';
import abi from '../../lib/nyaaya.abi.json';
import { useAccount, useWriteContract } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { useState } from 'react';

const addr = process.env.NEXT_PUBLIC_NYAAYA_ADDRESS as `0x${string}` | undefined;

export default function LoansPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const [circle, setCircle] = useState('circle-1'); // JSON demo
  const [amount, setAmount] = useState('500');      // JSON demo cUSD units (string for the mock API)
  const [installments, setInstallments] = useState('3');
  const [result, setResult] = useState<string | undefined>();

  const account = address as `0x${string}` | undefined;

  async function submitJson() {
    const res = await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        circleId: circle,
        amountCUSD: amount,
        installments: Number(installments),
        borrower: address || '0x0',
      }),
    }).then((r) => r.json());
    if (res.ok) setResult(`Loan requested (JSON): ${res.data.id}`);
    else setResult('Failed');
  }

  function requestOnchain() {
    if (!addr || !account) return alert('Set NEXT_PUBLIC_NYAAYA_ADDRESS and connect wallet');
    const cid = prompt('CircleId (bytes32 hex)?') as `0x${string}`;
    const amtWei = BigInt(prompt('Amount (wei of cUSD)?') || '0'); // uint256 → bigint
    const ins = Number(prompt('Installments 1-12?') || '3');       // uint8 → number
    writeContract({
      abi,
      address: addr,
      functionName: 'requestLoan',
      args: [cid, amtWei, ins],
      account,
      chain: celoAlfajores,
    });
  }

  function approve() {
    if (!addr || !account) return alert('Set NEXT_PUBLIC_NYAAYA_ADDRESS and connect wallet');
    const rid = prompt('RequestId (bytes32 hex)?') as `0x${string}`;
    writeContract({
      abi,
      address: addr,
      functionName: 'approveLoan',
      args: [rid],
      account,
      chain: celoAlfajores,
    });
  }

  function disburse() {
    if (!addr || !account) return alert('Set NEXT_PUBLIC_NYAAYA_ADDRESS and connect wallet');
    const rid = prompt('RequestId (bytes32 hex)?') as `0x${string}`;
    writeContract({
      abi,
      address: addr,
      functionName: 'disburse',
      args: [rid],
      account,
      chain: celoAlfajores,
    });
  }

  function repay() {
    if (!addr || !account) return alert('Set NEXT_PUBLIC_NYAAYA_ADDRESS and connect wallet');
    const rid = prompt('RequestId (bytes32 hex)?') as `0x${string}`;
    const amt = BigInt(prompt('Amount (wei)?') || '0'); // uint256 → bigint
    writeContract({
      abi,
      address: addr,
      functionName: 'repay',
      args: [rid, amt],
      account,
      chain: celoAlfajores,
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-6 space-y-3">
        <h3 className="text-lg font-semibold">JSON Demo: Request Loan</h3>
        <input className="input" value={circle} onChange={(e) => setCircle(e.target.value)} placeholder="Circle ID (string)" />
        <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (cUSD)" />
        <input className="input" value={installments} onChange={(e) => setInstallments(e.target.value)} placeholder="Installments" />
        <button className="btn btn-primary" onClick={submitJson}>
          Submit (JSON)
        </button>
        {result && <p className="text-sm text-gray-600">{result}</p>}
      </div>

      <div className="card p-6 space-y-3">
        <h3 className="text-lg font-semibold">On-chain: Loan Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button disabled={!isConnected || isPending} className="btn btn-primary" onClick={requestOnchain}>
            Request Loan (on-chain)
          </button>
          <button disabled={!isConnected || isPending} className="btn" onClick={approve}>
            Approve
          </button>
          <button disabled={!isConnected || isPending} className="btn" onClick={disburse}>
            Disburse
          </button>
          <button disabled={!isConnected || isPending} className="btn" onClick={repay}>
            Repay
          </button>
        </div>
        {!addr && <p className="text-gray-500 text-sm">Set NEXT_PUBLIC_NYAAYA_ADDRESS in .env</p>}
      </div>
    </div>
  );
}
