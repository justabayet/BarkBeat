import nextPwa from 'next-pwa';
import type { NextConfig } from 'next';

const withPWA = nextPwa({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^http?.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    }
  ]
});

const nextConfig: NextConfig = {
  // Your existing Next.js config
};

export default withPWA(nextConfig);