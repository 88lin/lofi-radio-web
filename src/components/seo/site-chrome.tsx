import Link from "next/link";

import { pagePaths, serializeJsonLd, siteConfig } from "@/lib/seo";

/**
 * 内容型子页（/stations、/faq、/about）共用的页头页脚。
 *
 * 刻意做成服务端组件：不引状态、不引动画，正文在首屏 HTML 里就是完整的，
 * 不依赖 JS 渲染。AI 抓取器多数不执行 JS，纯文本快照必须能读到全部内容。
 */

const navLinks = [
  { href: pagePaths.home, label: "首页收听" },
  { href: pagePaths.stations, label: "电台列表" },
  { href: pagePaths.faq, label: "常见问题" },
  { href: pagePaths.about, label: "关于" },
];

export function ContentHeader({ current }: { current: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl dark:border-white/[0.08] dark:bg-zinc-950/80">
      {/* 小屏（≤640px）：logo 一行、导航独占一行并两端铺开，避免挤在一行溢出。
          大屏：恢复成 logo 在左、导航在右的单行布局。 */}
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6">
        <Link
          href={pagePaths.home}
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight text-zinc-900 dark:text-white"
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #D946EF, #EC4899)",
            }}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M9 18V6l10-2v12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="6.5" cy="18" r="2.5" />
              <circle cx="16.5" cy="16" r="2.5" />
            </svg>
          </span>
          Lofi Radio
        </Link>

        <nav aria-label="站内导航" className="w-full sm:ml-auto sm:w-auto">
          <ul className="flex flex-wrap items-center justify-between gap-1 text-sm sm:justify-end">
            {navLinks.map((link) => {
              const active = link.href === current;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "rounded-full bg-violet-500/10 px-3 py-1.5 font-medium text-violet-700 dark:text-violet-300"
                        : "rounded-full px-3 py-1.5 text-zinc-500 transition-colors hover:bg-black/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function ContentFooter() {
  return (
    <footer className="mt-16 border-t border-black/[0.06] py-8 dark:border-white/[0.08]">
      {/* 与首页 footer 保持一致的居中排版：两套页脚不该长成两种样子 */}
      <div className="mx-auto max-w-4xl px-4 text-center text-sm text-zinc-500 sm:px-6 dark:text-zinc-400">
        <nav aria-label="页脚导航">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <li>
              <Link href={pagePaths.stations} className="underline-offset-4 hover:underline">
                电台列表
              </Link>
            </li>
            <li>
              <Link href={pagePaths.faq} className="underline-offset-4 hover:underline">
                常见问题
              </Link>
            </li>
            <li>
              <Link href={pagePaths.about} className="underline-offset-4 hover:underline">
                关于
              </Link>
            </li>
            <li>
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href={siteConfig.creatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                {siteConfig.author}
              </a>
            </li>
          </ul>
        </nav>
        <p className="mt-4">
          Made with ❤️ by{" "}
          <a
            href={siteConfig.creatorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
          >
            {siteConfig.author}
          </a>{" "}
          · 内容最后更新：
          <time dateTime={siteConfig.lastUpdated}>{siteConfig.lastUpdated}</time>
        </p>
      </div>
    </footer>
  );
}

/** 内容页外壳：统一 max-width、语义结构与排版节奏。 */
export function ContentShell({
  current,
  title,
  lead,
  updated,
  children,
}: {
  current: string;
  title: string;
  lead: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 dark:bg-[#0a0a0c] dark:text-zinc-100">
      <ContentHeader current={current} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <article>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 text-base leading-8 text-zinc-600 sm:text-lg dark:text-zinc-300">
            {lead}
          </p>
          {updated ? (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              最后更新：
              <time dateTime={updated}>{updated}</time>
            </p>
          ) : null}
          {/* ol 必须和 ul 一样显式补 list-style 与左内边距：
              Tailwind preflight 会把 ol/ul 的 list-style 与 padding 全部清零，
              只写 list-decimal 不给 pl-6，序号会渲染到内容框左侧外面被切掉。 */}
          <div className="mt-10 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight sm:[&_h2]:text-2xl [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-base [&_h3]:font-semibold sm:[&_h3]:text-lg [&_p]:mt-4 [&_p]:leading-8 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-2 [&_li]:leading-8">
            {children}
          </div>
        </article>
      </main>
      <ContentFooter />
    </div>
  );
}

/**
 * JSON-LD 注入。放在 body 里而不是 head：App Router 下同样会被完整序列化进
 * 首屏 HTML，且不会因为流式渲染被拆到文档片段之外。
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

/** 可访问的卡片容器，用于目录页与 FAQ 页。 */
export function ContentCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-6 dark:border-white/[0.08] dark:bg-zinc-900/40">
      {children}
    </div>
  );
}
