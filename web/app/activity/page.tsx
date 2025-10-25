import { fetchRecentEvents } from '../../lib/events';

const addr = process.env.NEXT_PUBLIC_CELO_ADDRESS as `0x${string}` | undefined;

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  if (!addr) return <div className="card p-6">Set NEXT_PUBLIC_CELO_ADDRESS to see activity.</div>;
  const events = await fetchRecentEvents(addr);

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
      <table className="table">
        <thead><tr><th>Block</th><th>Event</th><th>Args</th><th>Tx</th></tr></thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={i}>
              <td>{e.blockNumber?.toString()}</td>
              <td>{e.eventName}</td>
              <td className="text-xs break-all">{JSON.stringify(e.args)}</td>
              <td className="text-xs break-all">{e.txHash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
