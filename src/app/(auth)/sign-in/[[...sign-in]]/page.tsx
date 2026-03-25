'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] px-4">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
