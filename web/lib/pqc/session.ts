// web/lib/pqc/session.ts
import { encap, decap } from './kem';
import { hkdf256, b64 } from './crypto';
import { getLocalKeypair } from './keyStore';

const INFO = new TextEncoder().encode('NyaayaPay-PQC-Chat-v1'); // context binding

export async function deriveEncryptKeyWithPeer(peerPkB64: string) {
  const peerPk = b64.dec(peerPkB64);
  const { ct, ss } = await encap(peerPk);
  // Sender produces ct + derives AES key
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const { key } = await hkdf256(ss, salt, INFO, 32);
  return { aesKey: key, kemCiphertextB64: b64.enc(ct), saltB64: b64.enc(salt) };
}

export async function deriveDecryptKeyFromKem(kemCiphertextB64: string, saltB64: string) {
  const pair = getLocalKeypair();
  if (!pair) throw new Error('No local PQC keypair');
  const ct = b64.dec(kemCiphertextB64);
  const salt = b64.dec(saltB64);
  const { ss } = await decap(ct, pair.sk);
  const { key } = await hkdf256(ss, salt, INFO, 32);
  return key;
}
