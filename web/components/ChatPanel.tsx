'use client';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { publishPublicKey, fetchPeerPublicKeyB64, hasLocalKeypair, ensureLocalKeypair } from '../lib/pqc/keyStore';
import { deriveEncryptKeyWithPeer, deriveDecryptKeyFromKem } from '../lib/pqc/session';
import { aesGcmEncrypt, aesGcmDecrypt, b64 } from '../lib/pqc/crypto';

type Msg = {
  id: string;
  from: string;
  to: string;
  ciphertextB64: string;
  ivB64: string;
  timestamp: number;
  kemCtB64?: string;
  saltB64?: string;
};

function isAddr(x?: string | null) {
  return !!x && /^0x[0-9a-f]{40}$/i.test(x);
}

export default function ChatPanel() {
  const { address, isConnected } = useAccount();
  const myAddr = (address || '').toLowerCase();

  // Peer is user-input (the other wallet)
  const [peer, setPeer] = useState<string>('');
  const [peerPkB64, setPeerPkB64] = useState<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const lastKemRef = useRef<{ kemCtB64: string; saltB64: string } | null>(null);

  // --- On mount ensure a local PQC keypair exists (preserved in localStorage per Option A)
  useEffect(() => {
    (async () => {
      try {
        // ensure keypair exists locally (generate once if absent)
        await ensureLocalKeypair();
      } catch (e) {
        console.error('Failed ensuring local PQC keypair:', e);
      }
    })();
  }, []);

  // Publish our PQC public key when wallet connects (or when address changes)
  useEffect(() => {
    if (!isConnected || !isAddr(myAddr)) return;
    // publish current local pubkey associated with wallet address
    publishPublicKey(myAddr).catch(err => {
      console.error('Failed to publish PQC public key:', err);
    });
  }, [isConnected, myAddr]);

  // If wallet disconnects, hide messages and block chat UI but DO NOT remove local keypair
  useEffect(() => {
    if (!isConnected) {
      setMessages([]);
      setPeerPkB64(null);
      setSessionKey(null);
      lastKemRef.current = null;
    }
  }, [isConnected]);

  // Auto-poll peer public key until loaded (only while connected)
  useEffect(() => {
    if (!isConnected || !isAddr(peer)) {
      setPeerPkB64(null);
      return;
    }
    let stopped = false;
    let timer: any = null;

    async function tick() {
      if (stopped) return;
      try {
        const pk = await fetchPeerPublicKeyB64(peer);
        if (pk) {
          setPeerPkB64(pk);
          return; // stop polling after found
        }
      } catch (e) {
        // ignore and retry
      }
      timer = setTimeout(tick, 1500);
    }

    tick();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [peer, isConnected]);

  // Load messages between myAddr and peer (only while connected)
  async function loadMessages() {
    if (!isConnected || !isAddr(myAddr) || !isAddr(peer)) return;
    try {
      const res = await fetch(`/api/chat?a=${myAddr}&b=${peer}`);
      const j = await res.json();
      setMessages(j.data || []);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  }

  // Poll messages every 2s while connected and both addresses valid
  useEffect(() => {
    if (!isConnected || !isAddr(myAddr) || !isAddr(peer)) return;
    let t: any = null;
    loadMessages();
    t = setInterval(loadMessages, 2000);
    return () => { if (t) clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, myAddr, peer]);

  // Derive session key from latest inbound message carrying KEM bootstrap
  useEffect(() => {
    if (!isConnected || !isAddr(myAddr) || !messages.length) return;
    (async () => {
      const inbound = [...messages]
        .reverse()
        .find(m => m.to === myAddr && m.kemCtB64 && m.saltB64);
      if (!inbound) return;
      const marker = `${inbound.kemCtB64}:${inbound.saltB64}`;
      if (lastKemRef.current && `${lastKemRef.current.kemCtB64}:${lastKemRef.current.saltB64}` === marker) return;
      try {
        const key = await deriveDecryptKeyFromKem(inbound.kemCtB64!, inbound.saltB64!);
        setSessionKey(key);
        lastKemRef.current = { kemCtB64: inbound.kemCtB64!, saltB64: inbound.saltB64! };
      } catch (e) {
        console.error('Failed to derive session key from inbound KEM bootstrap:', e);
      }
    })();
  }, [messages, isConnected, myAddr]);

  // Send a message (first one attaches bootstrap if needed)
  async function send() {
    if (!isConnected) return;
    if (!isAddr(myAddr) || !isAddr(peer) || !peerPkB64 || !input.trim()) return;

    let kemCtB64: string | undefined;
    let saltB64: string | undefined;
    let key = sessionKey;

    try {
      if (!key) {
        const derived = await deriveEncryptKeyWithPeer(peerPkB64);
        key = derived.aesKey;
        kemCtB64 = derived.kemCiphertextB64;
        saltB64 = derived.saltB64;
        setSessionKey(key);
        lastKemRef.current = { kemCtB64, saltB64 };
      }

      const { iv, ct } = await aesGcmEncrypt(key!, input.trim());
      const payload = {
        from: myAddr,
        to: peer,
        ciphertextB64: b64.enc(ct),
        ivB64: b64.enc(iv),
        ...(kemCtB64 && saltB64 ? { kemCtB64, saltB64 } : {}),
      };

      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setInput('');
      await loadMessages(); // refresh once after send
    } catch (e) {
      console.error('Failed sending message:', e);
    }
  }

  // handle Enter key for message input
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  }

  const canChat = isConnected && isAddr(myAddr) && isAddr(peer) && !!peerPkB64;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">PQC Chat</h2>
          <div className="text-sm text-gray-500">Connected wallet (read-only):</div>
          <div className="font-mono text-xs">{isConnected ? myAddr : 'Not connected'}</div>
        </div>
        <div className="text-sm text-gray-600">
          {isConnected ? 'Connected' : 'Wallet disconnected — connect to access chat'}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          className="input"
          placeholder="Peer wallet (0x...)"
          value={peer}
          onChange={e => setPeer(e.target.value)}
          disabled={!isConnected}
        />
        <button className="btn" onClick={loadMessages} disabled={!isConnected || !isAddr(peer)}>Refresh</button>
        {peerPkB64
          ? <span className="text-xs px-2 py-1 rounded-lg bg-[var(--muted)] border">Peer key: loaded</span>
          : <span className="text-xs px-2 py-1 rounded-lg border">{isConnected ? 'Waiting for peer key…' : '—'}</span>}
      </div>

      <div className="h-72 overflow-y-auto border rounded-xl p-3 bg-[var(--muted)]">
        {isConnected ? (
          messages.map(m => (
            <MessageBubble key={m.id} me={m.from === myAddr} msg={m} sessionKey={sessionKey} />
          ))
        ) : (
          <div className="text-sm text-gray-500">Connect your wallet to view chat.</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="input"
          placeholder={canChat ? 'Type a message…' : 'Connect wallet and load peer key to chat'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={!canChat}
        />
        <button className="btn btn-primary" onClick={send} disabled={!canChat || !input.trim()}>Send</button>
      </div>
    </div>
  );
}

function MessageBubble({ me, msg, sessionKey }: { me: boolean; msg: Msg; sessionKey: CryptoKey | null }) {
  const [plain, setPlain] = useState<string>('🔒 encrypted');

  useEffect(() => {
    (async () => {
      if (!sessionKey) { setPlain('🔒 (waiting for session key)'); return; }
      try {
        const iv = b64.dec(msg.ivB64);
        const ct = b64.dec(msg.ciphertextB64);
        const p = await aesGcmDecrypt(sessionKey, iv, ct);
        setPlain(p);
      } catch {
        setPlain('🔒 (unable to decrypt)');
      }
    })();
  }, [sessionKey, msg.ivB64, msg.ciphertextB64]);

  return (
    <div className={`max-w-[80%] my-1 ${me ? 'ml-auto' : ''}`}>
      <div className={`px-3 py-2 rounded-xl ${me ? 'bg-gray-900 text-white' : 'bg-white border'}`}>
        <div className="text-sm break-words">{plain}</div>
        <div className="text-[11px] opacity-60 mt-1">{new Date(msg.timestamp).toLocaleString()}</div>
      </div>
    </div>
  );
}
