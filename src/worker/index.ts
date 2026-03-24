// ═══════════════════════════════════════════════════════════════════
// FitForge — Custom Service Worker Extensions
// Handles Web Push events for coaching notifications, rest-day reminders,
// streak alerts, and deload prompts (Phase 6).
//
// This file is compiled by @ducanh2912/next-pwa (via customWorkerSrc)
// and merged into the generated Workbox service worker. It runs in
// the ServiceWorkerGlobalScope — not the browser window — so the
// standard DOM lib types do not apply. TypeScript checking is
// suppressed to avoid lib.dom.d.ts / lib.webworker.d.ts conflicts.
// ═══════════════════════════════════════════════════════════════════
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck

// ─── Push Event Handler ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let title = 'FitForge';
  let body = "You've got a new update.";
  let tag = 'fitforge-push';
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title ?? title;
      body = payload.body ?? body;
      tag = payload.tag ?? `fitforge-${payload.type ?? 'push'}-${Date.now()}`;
      data = payload.data ?? {};
    } catch {
      body = event.data.text();
    }
  }

  const notificationPromise = self.registration.showNotification(title, {
    body,
    tag,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data,
    requireInteraction: false,
  });

  event.waitUntil(notificationPromise);
});

// ─── Notification Click Handler ─────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const type = event.notification?.data?.type;
  const targetUrl = type === 'rest_day_reminder' ? '/routines' : '/';

  const openPromise = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.navigate(targetUrl).then((c) => c?.focus());
        }
      }
      return self.clients.openWindow(targetUrl);
    });

  event.waitUntil(openPromise);
});

