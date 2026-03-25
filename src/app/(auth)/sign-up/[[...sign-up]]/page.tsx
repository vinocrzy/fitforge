'use client';

import { useRouter } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { useGuestStore } from '@/store/useGuestStore';

export default function SignUpPage(): React.ReactElement {
  const router = useRouter();
  const enableGuestMode = useGuestStore((s) => s.enableGuestMode);

  const handleSkip = (): void => {
    enableGuestMode();
    router.replace('/');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0B] px-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />

      <button
        onClick={handleSkip}
        className="mt-6 text-[15px] font-medium tracking-tight"
        style={{ color: 'rgba(245,245,245,0.50)' }}
      >
        Skip &mdash;{' '}
        <span style={{ color: '#C5F74F' }}>Continue as Guest</span>
      </button>
    </div>
  );
}
