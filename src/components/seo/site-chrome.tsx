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
    <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[#FFFAFC]/85 backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#17131B]/80">
      {/* 小屏（≤640px）：logo 一行、导航独占一行并两端铺开，避免挤在一行溢出。
          大屏：恢复成 logo 在左、导航在右的单行布局。 */}
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6">
        <Link
          href={pagePaths.home}
          className="flex shrink-0 items-center gap-2 py-1 font-bold tracking-tight text-zinc-900 dark:text-white"
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
                        ? "rounded-full bg-[#FFE3F1] px-3 py-1.5 font-medium text-[#BE185D] dark:bg-[#33132A] dark:text-[#FBCFE8]"
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
              <Link href={pagePaths.stations} className="inline-block py-1.5 underline-offset-4 hover:underline">
                电台列表
              </Link>
            </li>
            <li>
              <Link href={pagePaths.faq} className="inline-block py-1.5 underline-offset-4 hover:underline">
                常见问题
              </Link>
            </li>
            <li>
              <Link href={pagePaths.about} className="inline-block py-1.5 underline-offset-4 hover:underline">
                关于
              </Link>
            </li>
            <li>
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-1.5 underline-offset-4 hover:underline"
              >
                GitHub
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
            className="font-semibold text-[#BE185D] underline-offset-4 hover:underline dark:text-[#FBCFE8]"
          >
            {siteConfig.author}
          </a>
        </p>
      </div>
    </footer>
  );
}

/**
 * 与首页同源的环境光背景。
 *
 * 首页有一整层径向光晕，内容页原本只有一块纯平底色——
 * 这是三个内容页看起来「像另一个网站」的主要原因，不是缺色块。
 *
 * 色相取自 palette.ts（粉 / 紫 / 蓝）。这是不到 20% 透明度的底噪层，
 * 卡片自己是实色，所以背景只负责氛围，不参与信息层级。
 * 只搬了光晕，没搬首页的噪点与网格——内容页是长文阅读面，底噪越少越好。
 * 纯 CSS + dark: 双层实现，不依赖 JS，服务端组件里可以直接用。
 */
const AMBIENT_LIGHT =
  "radial-gradient(circle at 12% 4%, rgba(236, 72, 153, 0.13) 0%, transparent 46%), radial-gradient(circle at 86% 30%, rgba(139, 92, 246, 0.11) 0%, transparent 46%), radial-gradient(circle at 24% 92%, rgba(59, 130, 246, 0.11) 0%, transparent 46%)";
const AMBIENT_DARK =
  "radial-gradient(circle at 12% 4%, rgba(236, 72, 153, 0.18) 0%, transparent 46%), radial-gradient(circle at 86% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 46%), radial-gradient(circle at 24% 92%, rgba(59, 130, 246, 0.15) 0%, transparent 46%)";

export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[#fafafa] dark:bg-[#0a0a0c]" />
      <div className="absolute inset-0 dark:hidden" style={{ background: AMBIENT_LIGHT }} />
      <div className="absolute inset-0 hidden dark:block" style={{ background: AMBIENT_DARK }} />
    </div>
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
  // 三个内容页都输出了 BreadcrumbList，但页面上一直没有对应的可见面包屑。
  // 补一个，既让结构化数据与页面一致，也省掉「返回上一层」只能靠浏览器后退。
  const crumb = navLinks.find((link) => link.href === current)?.label;

  return (
    <div className="relative min-h-screen text-zinc-900 dark:text-zinc-100">
      <AmbientBackground />
      <ContentHeader current={current} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <article>
          {crumb ? (
            <nav aria-label="面包屑" className="mb-4">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <li>
                  <Link
                    href={pagePaths.home}
                    className="inline-block py-1 transition-colors hover:text-zinc-900 dark:hover:text-white"
                  >
                    首页
                  </Link>
                </li>
                <li aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">
                  /
                </li>
                <li aria-current="page" className="font-medium text-zinc-700 dark:text-zinc-200">
                  {crumb}
                </li>
              </ol>
            </nav>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 text-base leading-8 text-zinc-600 sm:text-lg dark:text-zinc-300">
            {lead}
          </p>
          {updated ? (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              最后更新：
              <time className="ml-1" dateTime={updated}>{updated}</time>
            </p>
          ) : null}
          {/* 正文排版壳。两点：
              1. ol 必须和 ul 一样显式补 list-style 与左内边距——Tailwind preflight 把
                 ol/ul 的 list-style 与 padding 全部清零了，只写 list-decimal 不给 pl-6，
                 序号会渲染到内容框左侧外面被切掉。
              2. 版式型列表（卡片网格、数据行）给它加 `not-prose` 就能整体退出这套规则。
                 早先是靠内联 `style={{ paddingLeft: 0 }}` 去顶，但内联样式同时也盖掉了
                 元素自己的 px-*，结果卡片文字直接贴边。别再用那种写法。 */}
          <div className="mt-10 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight sm:[&_h2]:text-2xl [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-base [&_h3]:font-semibold sm:[&_h3]:text-lg [&_p]:mt-4 [&_p]:leading-8 [&_ul:not(.not-prose)]:mt-4 [&_ul:not(.not-prose)]:list-disc [&_ul:not(.not-prose)]:pl-6 [&_ol:not(.not-prose)]:mt-4 [&_ol:not(.not-prose)]:list-decimal [&_ol:not(.not-prose)]:pl-6 [&_ul:not(.not-prose)>li]:mt-2 [&_ul:not(.not-prose)>li]:leading-8 [&_ol:not(.not-prose)>li]:mt-2 [&_ol:not(.not-prose)>li]:leading-8">
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

/**
 * 一手音源清单。/stations 与 /about 共用——同一份内容在两页长成两个样子，
 * 一边是两列分隔行、一边是光秃秃的项目符号，是最容易积累的那种不一致。
 */
export function SourceList({
  sources,
}: {
  sources: { name: string; url: string; note: string }[];
}) {
  return (
    <ul
      className="not-prose mt-6 grid grid-cols-1 gap-x-8 rounded-2xl border border-[#D5E6FF] bg-[#EBF4FF] px-5 py-2 sm:grid-cols-2 sm:px-6 dark:border-[#1E3A6B] dark:bg-[#12213F]"
    >
      {sources.map((source) => (
        <li
          key={source.url}
          className="border-b border-[#1D4ED8]/12 py-3 last:border-0 sm:[&:nth-last-child(2)]:border-0 dark:border-white/[0.08]"
        >
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/src block"
          >
            <span className="text-base font-medium text-[#BE185D] underline-offset-4 group-hover/src:underline dark:text-[#FBCFE8]">
              {source.name}
            </span>
            <span className="mt-0.5 block text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {source.note}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** 「名称 → 目标」的链接行。比带项目符号的 ul 更像一张联系方式表。 */
export function LinkRows({
  rows,
}: {
  rows: { label: string; text: string; href: string; external?: boolean }[];
}) {
  return (
    <dl className="mt-6">
      {rows.map((row) => (
        <div
          key={row.href + row.label}
          className="flex items-baseline justify-between gap-4 border-b border-black/[0.05] py-3 last:border-0 dark:border-white/[0.06]"
        >
          <dt className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
            {row.label}
          </dt>
          <dd className="!mt-0 min-w-0 text-right">
            {/* 站内链接必须走 Link：普通 <a> 是整页加载，会把 layout 里的播放器
                连同正在放的音乐一起重建。 */}
            {row.external ? (
              <a
                href={row.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block break-all py-1 text-base font-medium text-[#BE185D] underline-offset-4 hover:underline dark:text-[#FBCFE8]"
              >
                {row.text}
              </a>
            ) : (
              <Link
                href={row.href}
                className="inline-block break-all py-1 text-base font-medium text-[#BE185D] underline-offset-4 hover:underline dark:text-[#FBCFE8]"
              >
                {row.text}
              </Link>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

