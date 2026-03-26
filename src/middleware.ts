import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
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
      const isEnrollRoute = request.nextUrl.pathname.startsWith('/trainer/enroll');
      if (!isEnrollRoute) {
        // Fast path: role in JWT claims (available after first token refresh)
        let role = (sessionClaims?.metadata as Record<string, unknown> | undefined)?.role as string | undefined;

        // Slow path: JWT may be stale right after enrollment — check Clerk directly.
        // This only runs once per session until the JWT refreshes (~60s).
        if (role !== 'trainer') {
          const client = await clerkClient();
          const user = await client.users.getUser(userId!);
          role = (user.publicMetadata as Record<string, unknown>)?.role as string | undefined;
        }

        if (role !== 'trainer') {
          return NextResponse.redirect(new URL('/', request.url));
        }
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
