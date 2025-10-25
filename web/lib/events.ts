import { createPublicClient, http, parseAbiItem } from 'viem';
import { celoAlfajores } from 'viem/chains';

const rpc = process.env.NEXT_PUBLIC_CELO_RPC || 'https://alfajores-forno.celo-testnet.org';

export const publicClient = createPublicClient({ chain: celoAlfajores, transport: http(rpc) });

// Event signatures from CELOPay.sol
export const CircleCreated = parseAbiItem(
  'event CircleCreated(bytes32 indexed circleId, string name, address indexed createdBy)'
);
export const MemberJoined = parseAbiItem(
  'event MemberJoined(bytes32 indexed circleId, address indexed member)'
);
export const LoanRequested = parseAbiItem(
  'event LoanRequested(bytes32 indexed requestId, bytes32 indexed circleId, address indexed borrower, uint256 amount)'
);
export const LoanApproved = parseAbiItem(
  'event LoanApproved(bytes32 indexed requestId, address indexed approver)'
);
export const LoanFinalized = parseAbiItem(
  'event LoanFinalized(bytes32 indexed requestId)'
);
export const LoanRepaid = parseAbiItem(
  'event LoanRepaid(bytes32 indexed requestId, address indexed payer)'
);

export async function fetchRecentEvents(contract: `0x${string}`, fromBlock?: bigint) {
  const toBlock = await publicClient.getBlockNumber();
  const start = fromBlock ?? (toBlock > 10_000n ? toBlock - 10_000n : 0n);

  const logs = await publicClient.getLogs({
    address: contract,
    events: [CircleCreated, MemberJoined, LoanRequested, LoanApproved, LoanFinalized, LoanRepaid],
    fromBlock: start, toBlock
  });

  return logs.map(l => ({
    blockNumber: l.blockNumber,
    txHash: l.transactionHash,
    eventName: l.eventName as string,
    args: l.args as Record<string, any>,
  }));
}
