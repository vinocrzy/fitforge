// ═══════════════════════════════════════════════════════════════════
// FitForge — CouchDB Provisioning Hook (Phase 8 — Clerk)
//
// Automatically provisions CouchDB databases after Clerk sign-in.
// Called once from AppLayout — checks if sync config exists,
// and if not, calls the provisioning API route.
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSyncConfigStore } from '@/store/useSyncConfigStore';

export function useProvisionCouch(): { isProvisioning: boolean } {
  const { isSignedIn, user } = useUser();
  const syncConfig = useSyncConfigStore((s) => s.syncConfig);
  const setSyncConfig = useSyncConfigStore((s) => s.setSyncConfig);
  const provisioningRef = useRef(false);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    // Already provisioned for this user
    if (syncConfig?.clerkUserId === user.id) return;
    // Already attempting
    if (provisioningRef.current || attemptedRef.current) return;

    provisioningRef.current = true;
    attemptedRef.current = true;

    (async () => {
      try {
        const res = await fetch('/api/auth/provision-couch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          setSyncConfig({
            clerkUserId: data.clerkUserId,
            provisionedAt: data.provisionedAt,
          });
        } else {
          console.error('[provision-couch] Failed:', res.status, await res.text());
        }
      } catch (err) {
        console.error('[provision-couch] Network error:', err);
      } finally {
        provisioningRef.current = false;
      }
    })();
  }, [isSignedIn, user, syncConfig, setSyncConfig]);

  return { isProvisioning: provisioningRef.current };
}
