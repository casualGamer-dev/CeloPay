import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage, createPublicClient, createWalletClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import policyAbi from '../../../../lib/policy.abi.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const RPC = process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org';
const POLICY = process.env.POLICY_ADDRESS as `0x${string}` | undefined;
const DEPLOYER_KEY = process.env.DEPLOYER_KEY as `0x${string}` | undefined;
const UNSAFE_SKIP_VERIFY = process.env.UNSAFE_SKIP_VERIFY === '1';

const publicClient = createPublicClient({ chain: celoAlfajores, transport: http(RPC) });

function json(status: number, data: any) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  try {
    // Validate env
    const missing: string[] = [];
    if (!POLICY) missing.push('POLICY_ADDRESS');
    if (!DEPLOYER_KEY) missing.push('DEPLOYER_KEY');
    if (!RPC) missing.push('CELO_RPC_URL');
    if (missing.length) {
      return json(500, { ok: false, error: `Missing env: ${missing.join(', ')}` });
    }

    const body = await req.json().catch(() => ({}));
    const address = body?.address as string | undefined;
    const signature = body?.signature as string | undefined;
    const message = body?.message as string | undefined;

    if (!address) return json(400, { ok: false, error: 'address missing' });

    // Signature verify (unless explicitly skipped)
    if (!UNSAFE_SKIP_VERIFY) {
      if (!signature || !message) {
        return json(400, { ok: false, error: 'signature or message missing' });
      }
      try {
        const valid = await verifyMessage({ address: address as `0x${string}`, message, signature });
        if (!valid) return json(401, { ok: false, error: 'invalid signature' });
      } catch (e: any) {
        console.error('verifyMessage error:', e);
        return json(401, { ok: false, error: `verify failed: ${e?.message || 'unknown'}` });
      }
    }

    // Prepare wallet (must be the policy owner)
    let account;
    try {
      account = privateKeyToAccount(DEPLOYER_KEY!);
    } catch (e: any) {
      console.error('privateKeyToAccount error:', e);
      return json(500, { ok: false, error: 'bad DEPLOYER_KEY (must start with 0x...)' });
    }

    const walletClient = createWalletClient({ chain: celoAlfajores, transport: http(RPC), account });

    // Write on-chain
    let hash: `0x${string}`;
    try {
      hash = await walletClient.writeContract({
        address: POLICY!,
        abi: policyAbi as any,
        functionName: 'setApproved',
        args: [address as any, true], // cast to avoid parser issues
      });
    } catch (e: any) {
      console.error('writeContract error:', e);
      // Common causes: not policy owner, bad ABI, wrong address, insufficient funds
      return json(500, {
        ok: false,
        error: `writeContract failed: ${e?.shortMessage || e?.message || 'unknown'}`,
      });
    }

    // Wait for confirmation
    let receipt;
    try {
      receipt = await publicClient.waitForTransactionReceipt({ hash });
    } catch (e: any) {
      console.error('waitForTransactionReceipt error:', e);
      return json(500, { ok: false, error: `tx not confirmed: ${e?.message || 'unknown'}`, tx: hash });
    }

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
