'use client';
import { useEffect, useState } from 'react';
import { celoAlfajores } from 'viem/chains';

export default function SwitchToAlfajores() {
  const [busy, setBusy] = useState(false);

  async function switchOrAdd() {
    const provider = (window as any).ethereum;
    if (!provider) return alert('MetaMask not found');

    setBusy(true);
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xAEF3' }], // 44787
      });
    } catch (e: any) {
      // If not added yet, add then switch
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xAEF3',
            chainName: 'Celo Alfajores Testnet',
            rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
            nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
            blockExplorerUrls: ['https://alfajores.celoscan.io'],
          }],
        });
      } catch (err: any) {
        console.error(err);
        alert(err?.message ?? String(err));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-primary" onClick={switchOrAdd} disabled={busy}>
      {busy ? 'Switching…' : 'Switch to Celo Alfajores'}
    </button>
  );
}
