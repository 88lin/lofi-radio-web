import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { buildSiteMetadata, buildSiteSchema } from "@/lib/seo";

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 与 public/manifest.json 的 theme_color / background_color 保持一致：
  // 三处（viewport、manifest、运行时动态写入）给出不同颜色会让 PWA 启动时闪一下。
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0c' }
  ]
};

export const metadata: Metadata = buildSiteMetadata();

// 站点级实体（Organization + WebSite），全站共用。
// 页面级节点（WebPage / CollectionPage / FAQPage / ItemList…）由各自页面输出，
// 否则每个子页面都会额外声明一遍「自己是首页」，并重复搬运 21 个电台实体。
const siteSchema = buildSiteSchema();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 用原生 <script> 而不是 next/script：
            next/script 在 App Router 下把内容塞进 RSC 的 __next_s 载荷，
            要等客户端运行时才注入 DOM。AI 抓取器大多不执行 JS，
            结果是首屏 HTML 里根本没有 JSON-LD。这里必须直接输出。 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
        {/* 给 AI 检索/代理的机器可读入口。llms.txt 是站点概览，llms-full.txt 是全量内容。 */}
        <link
          rel="alternate"
          type="text/markdown"
          href="/llms.txt"
          title="Lofi Radio · llms.txt 站点概览"
        />
        <link
          rel="alternate"
          type="text/markdown"
          href="/llms-full.txt"
          title="Lofi Radio · llms-full.txt 全量内容"
        />
        {/* 统计脚本改为 afterInteractive：原来的裸 <script async> 会参与首屏资源竞争，
            直接影响 LCP，而 LCP 是 Core Web Vitals 里权重最高的一项。 */}
        <Script
          src="https://019d56e0-f4e7-79ad-97dc-fb4c5da46550.spst2.com/ustat.js"
          strategy="afterInteractive"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                  // 默认使用亮色主题，只有明确设置为 dark 时才使用暗色
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="antialiased"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster />
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
