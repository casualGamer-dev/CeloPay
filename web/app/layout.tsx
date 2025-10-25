
import './globals.css';
import { Providers } from '../lib/wagmi';
import Connect from '../components/Connect';
import Link from 'next/link';
import NetworkBanner from '../components/NetworkBanner';

export const metadata = { title: 'CeloPay (Web)', description: 'Community BNPL — Web-only' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="border-b">
            <div className="container flex items-center justify-between py-4">
              <div className="flex items-center gap-6">
                <Link href="/" className="font-semibold">CeloPay</Link>
                <nav className="hidden md:flex gap-4 text-sm">
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/circles">Circles</Link>
                  <Link href="/loans">Loans</Link>
                  <Link href="/chat">Chat</Link>
                  <Link href="/activity">Activity</Link>
                    <Link href="/my">My Activity</Link>
                </nav>
              </div>
              <Connect />
            </div>
          </header>
          <NetworkBanner />
          <main className="container py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
