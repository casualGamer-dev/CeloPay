'use client';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import {
  publishPublicKey,
  fetchPeerPublicKeyB64,
  ensureLocalKeypair,
} from '../lib/pqc/keyStore';
import { deriveEncryptKeyWithPeer, deriveDecryptKeyFromKem } from '../lib/pqc/session';
import { aesGcmEncrypt, aesGcmDecrypt, b64 } from '../lib/pqc/crypto';
import toast from 'react-hot-toast';

// MUI
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  Divider,
  Tooltip,
  Paper,
} from '@mui/material';

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

  const [peer, setPeer] = useState<string>('');
  const [peerPkB64, setPeerPkB64] = useState<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const lastKemRef = useRef<{ kemCtB64: string; saltB64: string } | null>(null);

  // Ensure keypair exists locally on mount
  useEffect(() => {
    (async () => {
      try {
        await ensureLocalKeypair();
      } catch (e) {
        console.error('ensureLocalKeypair failed', e);
      }
    })();
  }, []);

  // Publish our PQC public key when wallet connects (or address changes)
  useEffect(() => {
    if (!isConnected || !isAddr(myAddr)) return;
    publishPublicKey(myAddr).catch(err => {
      console.error('Failed to publish PQC public key:', err);
    });
  }, [isConnected, myAddr]);

  // If disconnected, clear transient UI state (but keep local keypair)
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
      } catch {}
      timer = setTimeout(tick, 1500);
    }

    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
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
    return () => {
      if (t) clearInterval(t);
    };
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

  // SEND a message (first one attaches bootstrap if needed)
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
      await loadMessages(); // refresh after send
    } catch (e) {
      console.error('Failed sending message:', e);
      toast.error('Failed to send');
    }
  }

  // ESTABLISH CHANNEL
  async function establishChannel() {
    if (!isConnected) return;
    if (!isAddr(myAddr) || !isAddr(peer)) {
      toast.error('Connect wallet and enter a valid peer address (0x…)');
      return;
    }

    try {
      await ensureLocalKeypair();
      await publishPublicKey(myAddr);

      const pk = await fetchPeerPublicKeyB64(peer);
      if (!pk) {
        setPeerPkB64(null);
        toast('Peer key not found yet. We published your key and are waiting for the peer. Ask them to open /chat.');
        return;
      }

      const derived = await deriveEncryptKeyWithPeer(pk);
      const aesKey = derived.aesKey;
      const kemCtB64 = derived.kemCiphertextB64;
      const saltB64 = derived.saltB64;

      const { iv, ct } = await aesGcmEncrypt(aesKey, '');
      const payload = {
        from: myAddr,
        to: peer,
        ciphertextB64: b64.enc(ct),
        ivB64: b64.enc(iv),
        kemCtB64,
        saltB64,
      };

      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setSessionKey(aesKey);
      lastKemRef.current = { kemCtB64, saltB64 };
      await loadMessages();
      toast.success('Channel established — handshake sent.');
    } catch (e) {
      console.error('Failed to establish channel:', e);
      toast.error('Failed to establish channel (see console).');
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  }

  const canChat = isConnected && isAddr(myAddr) && isAddr(peer) && !!peerPkB64;

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                PQC Chat
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Connected wallet (read-only):
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                {isConnected ? myAddr : 'Not connected'}
              </Typography>
            </Box>

            <Chip
              size="small"
              variant="outlined"
              color={isConnected ? 'success' : 'default'}
              label={isConnected ? 'Connected' : 'Disconnected'}
            />
          </Stack>

          {/* Controls */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              label="Peer wallet (0x…)"
              placeholder="0xabc…"
              value={peer}
              onChange={(e) => setPeer(e.target.value)}
              disabled={!isConnected}
              fullWidth
            />

            <Tooltip title="Publish your key and send handshake if peer key exists">
              <span>
                <Button
                  variant="outlined"
                  onClick={establishChannel}
                  disabled={!isConnected || !isAddr(peer)}
                >
                  Connect
                </Button>
              </span>
            </Tooltip>

            <Button variant="outlined" onClick={loadMessages} disabled={!isConnected || !isAddr(peer)}>
              Refresh
            </Button>

            <Chip
              size="small"
              variant="outlined"
              color={peerPkB64 ? 'success' : 'default'}
              label={peerPkB64 ? 'Peer key: loaded' : isConnected ? 'Waiting for peer key…' : '—'}
            />
          </Stack>

          {/* Messages */}
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              p: 1.5,
              height: 320,
              overflowY: 'auto',
              backgroundColor: 'background.default',
            }}
          >
            {isConnected ? (
              messages.map((m) => (
                <MessageBubble key={m.id} me={m.from === myAddr} msg={m} sessionKey={sessionKey} />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Connect your wallet to view chat.
              </Typography>
            )}
          </Paper>

          {/* Composer */}
          <Stack direction="row" spacing={1.25}>
            <TextField
              placeholder={canChat ? 'Type a message…' : 'Connect wallet and load peer key to chat'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={!canChat}
              fullWidth
            />
            <Button variant="contained" onClick={send} disabled={!canChat || !input.trim()}>
              Send
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function MessageBubble({
  me,
  msg,
  sessionKey,
}: {
  me: boolean;
  msg: Msg;
  sessionKey: CryptoKey | null;
}) {
  const [plain, setPlain] = useState<string>('🔒 encrypted');

  useEffect(() => {
    (async () => {
      if (!sessionKey) {
        setPlain('🔒 (waiting for session key)');
        return;
      }
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
    <Box sx={{ maxWidth: '80%', my: 0.75, ml: me ? 'auto' : 0 }}>
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: 2,
          bgcolor: me ? 'primary.dark' : 'background.paper',
          border: me ? 'none' : '1px solid',
          borderColor: me ? 'transparent' : 'divider',
          color: me ? 'primary.contrastText' : 'text.primary',
        }}
      >
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
          {plain || <span style={{ opacity: 0.6 }}>·</span>}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.65, mt: 0.5, display: 'block' }}>
          {new Date(msg.timestamp).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
}
