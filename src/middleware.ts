import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/splash(.*)',
  '/onboarding(.*)',
  '/api/auth(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Allow guest users to access all routes
  const guestCookie = request.cookies.get('fitforge-guest');
  if (guestCookie?.value === 'true') return;

  if (!isPublicRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      // Redirect unauthenticated users to splash instead of sign-in
      const splashUrl = new URL('/splash', request.url);
      return NextResponse.redirect(splashUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, PWA assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|sw\\.js|workbox-.*\\.js)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
