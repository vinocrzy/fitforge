'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] px-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
