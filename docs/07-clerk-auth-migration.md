# Phase 8 — Clerk Authentication Migration

> Decouple the custom authentication system and replace it with **Clerk** for sign-up / sign-in. All non-auth application data remains in CouchDB, synced via PouchDB. After Clerk creates a user account, we retrieve the Clerk `userId` and use it to namespace CouchDB databases.

---

## Overview

### Current State
- Custom auth system with `CloudAccount` stored in localStorage via Zustand (`useAuthStore`)
- Users manually supply CouchDB credentials (username + password) during registration
- Optional PIN-based device locking for multi-account support
- CouchDB databases namespaced by `couchUsername` (e.g., `alice_fitforge_routines`)

### Target State
- **Clerk** handles all authentication (sign-up, sign-in, session management, OAuth, MFA)
- **Clerk `userId`** becomes the stable identity key (replaces `crypto.randomUUID()`)
- **CouchDB provisioning** happens server-side after Clerk auth — an API route creates per-user databases using the Clerk `userId`
- **No more manual credential entry** — CouchDB credentials are derived/provisioned automatically
- **No more PIN system** — Clerk handles session security
- **No more multi-account localStorage management** — Clerk manages sessions natively

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Browser    │────▶│    Clerk     │────▶│  Clerk Backend │
│  (Next.js)   │◀────│  Components  │◀────│  (Session JWT) │
└──────┬───────┘     └──────────────┘     └────────────────┘
       │
       │ POST /api/auth/provision-couch
       ▼
┌──────────────┐     ┌────────────────┐
│  API Route   │────▶│   CouchDB      │
│  (server)    │     │  (create DBs)  │
└──────────────┘     └────────────────┘
       │
       │ Returns { couchDbUrl, couchUsername }
       ▼
┌──────────────┐     ┌────────────────┐
│  PouchDB     │◀───▶│   CouchDB      │
│  (browser)   │     │  (per-user DBs)│
└──────────────┘     └────────────────┘
```

### Data Flow
1. User signs in via Clerk (hosted UI or embedded components)
2. Clerk session JWT is available in browser and API routes
3. On first login, `/api/auth/provision-couch` creates per-user CouchDB databases
4. Client receives CouchDB URL + credentials, starts PouchDB sync
5. All app data flows through PouchDB → CouchDB as before

---

## Implementation Steps

### Step 1: Install Dependencies
```bash
npm install @clerk/nextjs
```

### Step 2: Environment Variables
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # Already in .env
CLERK_SECRET_KEY=sk_test_...                   # Already in .env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
COUCHDB_ADMIN_URL=http://admin:password@localhost:5984  # Server-side only
```

### Step 3: Update Types
- Simplify `CloudAccount` → keep only Clerk-derived fields + CouchDB sync config
- Remove `appPinHash`, `couchUsername`, `couchDbUrl` from manual entry
- Add `clerkUserId` as the primary key

### Step 4: Create Clerk Middleware
- `middleware.ts` at project root
- Protect `/(app)` routes — require authentication
- Allow `/(auth)` routes, `/sign-in`, `/sign-up` as public

### Step 5: Wrap Root Layout with ClerkProvider
- Add `<ClerkProvider>` in `src/app/layout.tsx`

### Step 6: Replace Auth Pages
- Remove: `register/`, `login/`, `user-select/`, `splash/` (Clerk handles these)
- Add: `/sign-in/[[...sign-in]]/page.tsx` — Clerk `<SignIn />` component
- Add: `/sign-up/[[...sign-up]]/page.tsx` — Clerk `<SignUp />` component
- Keep: `onboarding/` — still needed for fitness profile setup

### Step 7: Create CouchDB Provisioning API Route
- `POST /api/auth/provision-couch`
- Authenticated via Clerk (verify JWT)
- Creates per-user CouchDB databases using Clerk `userId` as namespace
- Returns connection config to client

### Step 8: Rewrite useAuthStore
- Remove multi-account management, PIN logic, manual credential storage
- Derive auth state from Clerk's `useUser()` / `useAuth()` hooks
- Store CouchDB sync config (provisioned URL) in a lightweight Zustand store
- Persist only CouchDB config (Clerk handles session persistence)

### Step 9: Update Sync Layer
- `useSyncManager` reads Clerk auth state instead of `useAuthStore`
- `couchSync.ts` uses Clerk `userId` for DB namespacing (replaces `couchUsername`)
- `buildRemoteUrl` uses Clerk userId prefix

### Step 10: Update AppLayout Auth Guard
- Replace custom hydration/redirect logic with Clerk's auth state
- Use `useAuth()` hook for authentication checks
- Redirect to `/sign-in` if unauthenticated (or let middleware handle it)

### Step 11: Clean Up
- Remove `src/lib/auth/pin.ts` (no more PIN system)
- Remove `src/app/(auth)/register/`, `login/`, `user-select/`
- Remove `src/lib/db/testCouchConnection.ts` (provisioning is server-side)
- Remove old `src/app/api/auth/[...nextauth]/` directory
- Update profile page to remove manual sync credential editing

---

## Files Changed

| Action | File | Description |
|--------|------|-------------|
| **Modify** | `package.json` | Add `@clerk/nextjs` |
| **Modify** | `.env` | Add Clerk route vars, CouchDB admin URL |
| **Create** | `middleware.ts` | Clerk auth middleware |
| **Modify** | `src/app/layout.tsx` | Wrap with `<ClerkProvider>` |
| **Create** | `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Clerk sign-in |
| **Create** | `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Clerk sign-up |
| **Create** | `src/app/api/auth/provision-couch/route.ts` | CouchDB provisioning |
| **Modify** | `src/types/index.ts` | Simplify `CloudAccount` |
| **Modify** | `src/store/useAuthStore.ts` | Rewrite for Clerk |
| **Create** | `src/hooks/useClerkCouchSync.ts` | Bridge Clerk auth → CouchDB sync |
| **Modify** | `src/hooks/useSyncManager.ts` | Use Clerk auth state |
| **Modify** | `src/lib/db/couchSync.ts` | Use Clerk userId for namespacing |
| **Modify** | `src/components/layout/AppLayout.tsx` | Clerk auth guard |
| **Delete** | `src/lib/auth/pin.ts` | No longer needed |
| **Delete** | `src/app/(auth)/register/page.tsx` | Replaced by Clerk |
| **Delete** | `src/app/(auth)/login/page.tsx` | Replaced by Clerk |
| **Delete** | `src/app/(auth)/user-select/page.tsx` | Replaced by Clerk |
| **Modify** | `src/app/(app)/profile/page.tsx` | Remove manual sync settings |
| **Modify** | `src/app/(app)/restore/page.tsx` | Use Clerk auth state |

---

## Security Considerations

- Clerk handles password hashing, session tokens, CSRF, rate limiting
- CouchDB admin credentials (`COUCHDB_ADMIN_URL`) are server-side only — never exposed to client
- Per-user CouchDB databases are created with restricted permissions
- Clerk JWT is verified server-side in the provisioning API route
- No credentials stored in localStorage (Clerk manages cookies/tokens)

---

## Migration Path (Existing Users)

For existing users with the old auth system:
1. On first visit after update, they will see the Clerk sign-in page
2. They create a Clerk account (or sign in with OAuth)
3. The provisioning API creates new CouchDB databases using their Clerk userId
4. If they had existing CouchDB data, a one-time migration maps old `couchUsername` → new Clerk `userId`
5. Old localStorage auth data (`fitforge-auth`) is cleared

---

## Testing Checklist

- [ ] Sign up with email/password through Clerk
- [ ] Sign in with existing Clerk account
- [ ] CouchDB databases provisioned on first login
- [ ] PouchDB ↔ CouchDB sync works with Clerk userId namespacing
- [ ] Offline mode works (PouchDB operates independently)
- [ ] Sign out clears Clerk session, stops sync
- [ ] Protected routes redirect to sign-in when not authenticated
- [ ] Onboarding flow still works after sign-up
- [ ] Profile page shows Clerk user info
- [ ] Conflict resolution still works
