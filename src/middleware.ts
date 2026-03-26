import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/splash(.*)',
  '/onboarding(.*)',
  '/api/auth(.*)',
  '/api/trainers',           // Public trainer directory listing
]);

const isTrainerRoute = createRouteMatcher([
  '/trainer(.*)',            // Trainer dashboard, enrollment, clients
  '/api/clients(.*)',
  '/api/trainer-notifications(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Allow guest users to access all routes
  const guestCookie = request.cookies.get('fitforge-guest');
  if (guestCookie?.value === 'true') return;

  if (!isPublicRoute(request)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      // Redirect unauthenticated users to splash instead of sign-in
      const splashUrl = new URL('/splash', request.url);
      return NextResponse.redirect(splashUrl);
    }

    // Trainer route guard — require trainer role
    if (isTrainerRoute(request)) {
      const role = (sessionClaims?.metadata as Record<string, unknown> | undefined)?.role;
      // Allow /trainer/enroll for non-trainers (enrollment page)
      const isEnrollRoute = request.nextUrl.pathname.startsWith('/trainer/enroll');
      if (role !== 'trainer' && !isEnrollRoute) {
        return NextResponse.redirect(new URL('/', request.url));
      }
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
