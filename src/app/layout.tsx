import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { buildHomepageSchema, buildSiteMetadata } from "@/lib/seo";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0c' },
  ],
};

export const metadata: Metadata = buildSiteMetadata();

const homepageSchema = buildHomepageSchema();

/**
 * Runs before first paint. Resolves the theme in the same order next-themes
 * does (stored preference -> system preference) so system-dark visitors never
 * see a white flash. Previously this only honoured an explicit `dark` value,
 * which meant every system-dark visitor got a light-mode FOUC.
 */
const themeBootstrap = `(function(){try{
var s=localStorage.getItem('theme');
var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
if(d){document.documentElement.classList.add('dark');}
document.documentElement.style.colorScheme=d?'dark':'light';
}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <Script
          id="homepage-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(homepageSchema),
          }}
        />
        <script async src="https://019d56e0-f4e7-79ad-97dc-fb4c5da46550.spst2.com/ustat.js" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
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
