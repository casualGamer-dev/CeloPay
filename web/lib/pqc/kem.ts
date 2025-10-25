// web/lib/pqc/kem.ts
import { MlKem768 /*, MlKem512, MlKem1024*/ } from 'mlkem';

export type KemAlgo = 'MLKEM768';

export async function generateKeyPair() {
  const kem = new MlKem768();
  const [pk, sk] = await kem.generateKeyPair(); // Uint8Array
  return { pk, sk };
}

export async function encap(recipientPk: Uint8Array) {
  const kem = new MlKem768();
  // returns [ciphertext, sharedSecret] as Uint8Array
  const [ct, ss] = await kem.encap(recipientPk);
  return { ct, ss };
}

export async function decap(ciphertext: Uint8Array, sk: Uint8Array) {
  const kem = new MlKem768();
  const ss = await kem.decap(ciphertext, sk);
  return { ss };
}
