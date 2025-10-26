'use client';

import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
import { Button } from '@mui/material';

const APP_ID = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID!;
const ACTION = process.env.NEXT_PUBLIC_WORLDCOIN_ACTION_ID!;

export default function WorldVerifyButton({ size = 'small' }: { size?: 'small'|'medium'|'large' }) {
  // IDKit lets you pass a handler that calls your backend to verify the proof.
  const handleVerify = async (result: ISuccessResult) => {
    const r = await fetch('/api/world/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ result, action: ACTION }),
    });
    if (!r.ok) throw new Error('World ID verification failed');
  };

  return (
    <IDKitWidget
      app_id={APP_ID}
      action={ACTION}
      verification_level={VerificationLevel.Orb} // or .Device for phone-based
      handleVerify={handleVerify}
      onSuccess={() => {
        // tell the app to refresh /api/me
        window.dispatchEvent(new Event('verified:update'));
      }}
    >
      {({ open }) => (
        <Button variant="outlined" size={size} onClick={open}>
          Verify (World ID)
        </Button>
      )}
    </IDKitWidget>
  );
}
