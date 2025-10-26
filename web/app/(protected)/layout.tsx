import { cookies } from 'next/headers';
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const verified = cookieStore.get('cp_verified')?.value === '1';

  if (!verified) {
    // Send users to a friendly verify page
    redirect('/verify');
  }

  return children;
}
