// web/lib/pqc/crypto.ts

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Base64 helpers that don't rely on spread or ES2015 iteration
export const b64 = {
  enc: (bytes: Uint8Array): string => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return globalThis.btoa(binary);
  },
  dec: (base64: string): Uint8Array => {
    const binary = globalThis.atob(base64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  },
};

// Ensure we pass true ArrayBuffer to WebCrypto, not ArrayBufferLike/SharedArrayBuffer
function asArrayBuffer(bytes: Uint8Array | ArrayBuffer): ArrayBuffer {
  if (bytes instanceof Uint8Array) {
    // Return a sliced ArrayBuffer that exactly spans the view
    const { buffer, byteOffset, byteLength } = bytes;
    return buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer;
  }
  return bytes as ArrayBuffer;
}

export async function hkdf256(
  ikm: Uint8Array | ArrayBuffer,
  salt: Uint8Array | ArrayBuffer,
  info: Uint8Array | ArrayBuffer,
  length = 32 // bytes
) {
  const subtle = globalThis.crypto.subtle;

  const ikmBuf = asArrayBuffer(ikm);
  const saltBuf = asArrayBuffer(salt);
  const infoBuf = asArrayBuffer(info);

  // Import IKM for HKDF (deriveBits)
  const baseKey = await subtle.importKey(
    'raw',
    ikmBuf,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Derive raw keying material (32 bytes)
  const bits = await subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: saltBuf, info: infoBuf },
    baseKey,
    length * 8
  );
  const raw = new Uint8Array(bits as ArrayBuffer);

  // Turn raw bytes into an AES-GCM key (non-extractable)
  const aesKey = await subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return { key: aesKey, raw };
}


export async function aesGcmEncrypt(aesKey: CryptoKey, plaintext: string) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const enc = textEncoder.encode(plaintext);
  // Pass ArrayBuffer to subtle.encrypt
  const ivBuf = asArrayBuffer(iv);
  const ctBuf = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBuf }, aesKey, enc);
  const ct = new Uint8Array(ctBuf as ArrayBuffer);
  return { iv, ct };
}

export async function aesGcmDecrypt(aesKey: CryptoKey, iv: Uint8Array, ciphertext: Uint8Array) {
  // Convert both to ArrayBuffer to satisfy BufferSource
  const ivBuf = asArrayBuffer(iv);
  const ctBuf = asArrayBuffer(ciphertext);
  const ptBuf = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuf }, aesKey, ctBuf);
  return textDecoder.decode(ptBuf as ArrayBuffer);
}
