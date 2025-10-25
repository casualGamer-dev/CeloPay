import abi from './celo.abi.json';
import { createPublicClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';

const rpc = process.env.NEXT_PUBLIC_CELO_RPC || 'https://alfajores-forno.celo-testnet.org';

export const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(rpc),
});

// topic hashes (optional: viem can filter by event name directly via abi)
export async function fetchRecentEvents(contract: `0x${string}`, fromBlock?: bigint) {
  const toBlock = await publicClient.getBlockNumber();
  const start = fromBlock ?? (toBlock - 5_000n > 0n ? toBlock - 5_000n : 0n);

  const logs = await publicClient.getLogs({
    address: contract,
    events: [
      { abi, eventName: 'CircleCreated' },
      { abi, eventName: 'MemberJoined' },
      { abi, eventName: 'LoanRequested' },
      { abi, eventName: 'LoanApproved' },
      { abi, eventName: 'LoanFinalized' },
      { abi, eventName: 'LoanRepaid' },
    ],
    fromBlock: start,
    toBlock,
  });

  return logs.map(l => ({
    blockNumber: l.blockNumber,
    txHash: l.transactionHash,
    eventName: l.eventName,
    args: l.args,
  }));
}
