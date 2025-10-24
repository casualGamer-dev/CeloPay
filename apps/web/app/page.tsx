import Link from 'next/link';
import OnchainPanel from '../components/OnchainPanel';

export default function Home() {
  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold mb-2">Community BNPL for India — on Celo</h1>
        <p className="text-gray-600">
          Create/join trust circles, request micro-BNPL, approvals, disbursement and repayment. JSON backend for demos; on-chain when configured.
        </p>
        <div className="mt-4 flex gap-3">
          <Link className="btn btn-primary" href="/loans">Request Loan</Link>
          <Link className="btn" href="/dashboard">Open Dashboard</Link>
        </div>
      </div>
      <OnchainPanel />
    </div>
  );
}
