import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  workboxOptions: {
    // Exclude GIFs from SW precache manifest (200MB+ cannot be precached)
    exclude: [/\/data\/gifs\//],
    runtimeCaching: [
      {
        urlPattern: /\/data\/gifs\/\d+\.gif$/,
        handler: "CacheFirst",
        options: {
          cacheName: "exercise-gifs",
          expiration: {
            maxEntries: 150,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            purgeOnQuotaError: true,
          },
          cacheableResponse: {
            statuses: [0, 200, 206],
          },
        },
      },
      {
        urlPattern: /\/data\/previews\/\d+\.webp$/,
        handler: "CacheFirst",
        options: {
          cacheName: "exercise-previews",
          expiration: {
            maxEntries: 250,
            maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
            purgeOnQuotaError: true,
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 3,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Silence Turbopack/webpack conflict from PWA plugin — the PWA plugin
  // injects a webpack config at build-time; an empty turbopack key tells
  // Next.js 16 this is intentional.
  turbopack: {},
  // Keep PouchDB's native dependencies out of the server bundle so that SSR
  // prerendering doesn't crash on missing leveldown binaries.
  serverExternalPackages: ['pouchdb', 'pouchdb-find', 'leveldown', 'levelup'],
};

export default withPWA(nextConfig);
