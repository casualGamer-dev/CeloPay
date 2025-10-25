'use client';
import { http, createConfig, WagmiProvider } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors'; // <- only this one

const queryClient = new QueryClient();
const rpc = process.env.NEXT_PUBLIC_CELO_RPC || celoAlfajores.rpcUrls.default.http[0];

export const config = createConfig({
  chains: [{ ...celoAlfajores, rpcUrls: { default: { http: [rpc] } } }],
  transports: { [celoAlfajores.id]: http(rpc) },
  // 👇 prevent wagmi from loading its default (MetaMask SDK / WalletConnect) connectors
  connectors: [injected()],
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
