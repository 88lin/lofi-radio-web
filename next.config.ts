import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: [
    'preview-chat-85450578-c18b-4445-9bbd-3ef36c46f826.space.z.ai',
    '.space.z.ai',
  ],
  async headers() {
    return [
      // 图标 / 站点验证文件 / 清单：内容几乎不变，长缓存能省掉重复请求
      ...[
        '/icon-192.png',
        '/icon-512.png',
        '/apple-touch-icon.png',
        '/logo.svg',
        '/manifest.json',
        '/BingSiteAuth.xml',
      ].map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, immutable' }],
      })),
      // 机器可读文件：CDN 缓存一天，保证更新后最多一天内生效
      ...[
        '/llms.txt',
        '/llms-full.txt',
        '/pricing.md',
        '/robots.txt',
        '/sitemap.xml',
      ].map((source) => ({
        source,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      })),
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
