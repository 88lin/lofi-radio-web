import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
];

const nextConfig: NextConfig = {
  // React 19 double-invokes effects in development only. Enabling this surfaces
  // missing cleanup in the audio pipeline instead of hiding it.
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
      {
        // The service worker must never be served stale, otherwise clients can
        // pin an old cache manifest indefinitely.
        source: '/sw.js',
        headers: [
          ...SECURITY_HEADERS,
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
