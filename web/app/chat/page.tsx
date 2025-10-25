// web/app/chat/page.tsx
import Connect from '../../components/Connect';
import ChatPanel from '../../components/ChatPanel';

export default function ChatPage() {
  return (
    <div className="container py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">PQC Chat (E2EE)</h1>
        <Connect />
      </div>
      <p className="text-sm text-gray-600">
        End-to-end encrypted via ML-KEM (Kyber) key exchange + AES-GCM. Only ciphertext is stored server-side.
      </p>
      <ChatPanel />
    </div>
  );
}
