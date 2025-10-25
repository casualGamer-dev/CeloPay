// web/lib/pqc/keyStore.ts
import { generateKeyPair } from './kem';
import { b64 } from './crypto';

const LS_PK = 'pqc_pk_b64';
const LS_SK = 'pqc_sk_b64';

export function hasLocalKeypair() {
  return !!(localStorage.getItem(LS_PK) && localStorage.getItem(LS_SK));
}
export function getLocalKeypair(): { pk: Uint8Array; sk: Uint8Array } | null {
  const pkB64 = localStorage.getItem(LS_PK);
  const skB64 = localStorage.getItem(LS_SK);
  if (!pkB64 || !skB64) return null;
  return { pk: b64.dec(pkB64), sk: b64.dec(skB64) };
}
export async function ensureLocalKeypair() {
  const existing = getLocalKeypair();
  if (existing) return existing;
  const { pk, sk } = await generateKeyPair();
  localStorage.setItem(LS_PK, b64.enc(pk));
  localStorage.setItem(LS_SK, b64.enc(sk));
  return { pk, sk };
}
export async function publishPublicKey(address: string) {
  const pair = await ensureLocalKeypair();
  await fetch('/api/chat/keys', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      address,
      algo: 'MLKEM768',
      publicKeyB64: b64.enc(pair.pk),
    }),
  });
}
export async function fetchPeerPublicKeyB64(address: string): Promise<string | null> {
  const res = await fetch(`/api/chat/keys?address=${address}`);
  const json = await res.json();
  return json?.data?.publicKeyB64 || null;
}
