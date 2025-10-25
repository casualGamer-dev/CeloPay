import './globals.css';
import type { Metadata } from 'next';

import { Providers } from '../lib/wagmi';
import Connect from '../components/Connect';
import NetworkBanner from '../components/NetworkBanner';

import ClientThemeProvider from '../components/ClientThemeProvider';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'CeloPay (Web)',
  description: 'Community BNPL — Web-only',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Keep Providers (wagmi) if it's client-only; it can wrap the client theme, or vice versa */}
        <Providers>
          <ClientThemeProvider>
            <Navbar right={<Connect />} />
            <NetworkBanner />
            <main>
              {/* Use MUI Container inside client land if you like, or keep Tailwind here */}
              <div className="container py-6">{children}</div>
            </main>
          </ClientThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
