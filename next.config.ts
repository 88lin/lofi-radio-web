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
      // 图标 / 站点验证文件：文件名即版本，内容几乎不变，长缓存能省掉重复请求
      ...[
        '/icon-192.png',
        '/icon-512.png',
        '/apple-touch-icon.png',
        '/logo.svg',
        '/BingSiteAuth.xml',
      ].map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, immutable' }],
      })),
      // manifest.json 必须单独一条，且绝不能 immutable。
      // 改名、换主题色、加快捷方式全靠它生效；一旦被浏览器缓存 7 天，
      // 已安装 PWA 的用户要一周后才拿得到新版本。
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' }],
      },
      // 机器可读文件：CDN 缓存一天；过期后在后台回源，最多再陈旧一天（SWR 86400）。
      // 也就是一次更新最迟约两天全量生效。robots.txt / sitemap.xml 陈旧 7 天
      // 是不可接受的——抓取器会把过期的站点地图当成现状。
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
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
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
