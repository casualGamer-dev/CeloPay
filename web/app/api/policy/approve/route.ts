// app/api/policy/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage, createPublicClient, createWalletClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import policyAbi from '../../../../lib/policy.abi.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ----- Env (with sensible fallbacks to your existing .env names) -----
const CELO_RPC_URL =
  process.env.CELO_RPC_URL ||
  process.env.NEXT_PUBLIC_CELO_RPC ||
  'https://alfajores-forno.celo-testnet.org';

const POLICY_ADDRESS =
  (process.env.POLICY_ADDRESS as `0x${string}` | undefined) ||
  (process.env.NEXT_PUBLIC_POLICY_ADDRESS as `0x${string}` | undefined);

const DEPLOYER_KEY = process.env.DEPLOYER_KEY as `0x${string}` | undefined;

// Bypass flags
const DEV_BYPASS = process.env.DEV_BYPASS_VERIFICATION === '1' || process.env.NODE_ENV === 'development';
const UNSAFE_SKIP_VERIFY =
  (process.env.UNSAFE_SKIP_VERIFY === '1') || DEV_BYPASS;

// ----- Helpers -----
function json(status: number, body: any) {
  return new NextResponse(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Re-use a shared public client for reads/receipts
const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(CELO_RPC_URL),
});

export async function POST(req: NextRequest) {
  try {
    // Quick dev-bypass: do not perform writes or signature verification in hackathon dev mode.
    if (DEV_BYPASS) {
      const body = await req.json().catch(() => ({}));
      const address = body?.address || null;
      return json(200, {
        ok: true,
        tx: null,
        blockNumber: null,
        status: 'bypassed',
        skippedVerify: true,
        devBypass: true,
        address,
      });
    }

    // Basic env validation early
    if (!POLICY_ADDRESS) {
      return json(500, {
        ok: false,
        error:
          'POLICY address missing. Set POLICY_ADDRESS or NEXT_PUBLIC_POLICY_ADDRESS in your .env',
        hint: 'Set POLICY_ADDRESS=0x... (the deployed Policy contract address)',
      });
    }
    if (!DEPLOYER_KEY || !DEPLOYER_KEY.startsWith('0x')) {
      return json(500, {
        ok: false,
        error: 'DEPLOYER_KEY missing or malformed. It must start with 0x...',
        hint: 'Use the private key of the contract owner/approver (funded on Alfajores).',
      });
    }

    const body = await req.json().catch(() => ({}));
    const address = body?.address as `0x${string}` | undefined;
    const approve = (body?.approve ?? true) as boolean;
    const signature = body?.signature as string | undefined;
    const message = body?.message as string | undefined;

    if (!address) return json(400, { ok: false, error: 'address missing' });

    // Verify EIP-191 signature unless explicitly skipped
    if (!UNSAFE_SKIP_VERIFY) {
      if (!signature || !message) {
        return json(400, { ok: false, error: 'signature or message missing' });
      }
      try {
        const valid = await verifyMessage({ address, message, signature });
        if (!valid) return json(401, { ok: false, error: 'invalid signature' });
      } catch (e: any) {
        console.error('verifyMessage error:', e);
        return json(401, { ok: false, error: `verify failed: ${e?.message || 'unknown'}` });
      }
    }

    // Wallet must be contract owner/allowed approver
    let account;
    try {
      account = privateKeyToAccount(DEPLOYER_KEY);
    } catch (e: any) {
      console.error('privateKeyToAccount error:', e);
      return json(500, { ok: false, error: 'bad DEPLOYER_KEY (must start with 0x...)' });
    }

    const walletClient = createWalletClient({
      account,
      chain: celoAlfajores,
      transport: http(CELO_RPC_URL),
    });

    // Ensure function exists in ABI
    const hasSetApproved = Array.isArray(policyAbi) && policyAbi.some((f: any) => f?.type === 'function' && f?.name === 'setApproved');
    if (!hasSetApproved) {
      return json(500, {
        ok: false,
        error: 'ABI does not contain setApproved(address,bool)',
        hint: 'Confirm policy.abi.json matches your deployed Policy contract and function name.',
      });
    }

    // Quick read to ensure node connectivity
    try {
      await publicClient.getChainId();
    } catch (e: any) {
      return json(502, { ok: false, error: 'RPC not reachable', details: e?.message });
    }

    // Send tx
    let hash: `0x${string}`;
    try {
      hash = await walletClient.writeContract({
        address: POLICY_ADDRESS,
        abi: policyAbi as any,
        functionName: 'setApproved',
        args: [address, approve],
      });
    } catch (e: any) {
      const msg = (e?.shortMessage || e?.message || '').toLowerCase();
      if (msg.includes('insufficient funds')) {
        return json(402, {
          ok: false,
          error: 'Approver wallet has insufficient CELO for gas on Alfajores.',
          hint: 'Fund the DEPLOYER_KEY address with test CELO from a faucet.',
        });
      }
      return json(500, {
        ok: false,
        error: 'writeContract failed',
        details: e?.shortMessage || e?.message || 'unknown error',
      });
    }

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return json(200, {
      ok: true,
      tx: hash,
      blockNumber: receipt.blockNumber ? receipt.blockNumber.toString() : null,
      status: receipt.status,
      skippedVerify: UNSAFE_SKIP_VERIFY || undefined,
    });
  } catch (e: any) {
    console.error('approve route fatal error:', e);
    return json(500, { ok: false, error: e?.message || 'internal-error' });
  }
}
