
'use client';
import { useEffect, useState } from 'react';
type Loan = { id:string; borrower:string; circleId:string; amountCUSD:string; installments:number; approvals:string[]; status:string; createdAt:number; };

export default function Dashboard() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ fetch('/api/loans').then(r=>r.json()).then(res=>{ if(res.ok) setLoans(res.data);}).finally(()=>setLoading(false));},[]);
  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-3">Loan Requests (JSON backend)</h2>
      {loading ? <p>Loading…</p> : (
        <table className="table">
          <thead><tr><th>ID</th><th>Borrower</th><th>Circle</th><th>Amount (cUSD)</th><th>Installments</th><th>Status</th></tr></thead>
          <tbody>
            {loans.map(l=>(
              <tr key={l.id}>
                <td>{l.id.slice(0,8)}…</td>
                <td>{l.borrower}</td>
                <td>{l.circleId}</td>
                <td>{l.amountCUSD}</td>
                <td>{l.installments}</td>
                <td>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
