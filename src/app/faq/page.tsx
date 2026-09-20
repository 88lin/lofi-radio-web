import type { Metadata } from "next";
import { ChevronRight, ExternalLink } from "lucide-react";

import { ContentShell, JsonLd } from "@/components/seo/site-chrome";
import { accentAt } from "@/lib/palette";
import { buildFaqPageSchema, buildPageMetadata, pagePaths } from "@/lib/seo";
import { homepageFaqs, howToStart, siteLastUpdated } from "@/lib/seo-content";

export const metadata: Metadata = buildPageMetadata({
  title: `Lofi Radio 常见问题 - ${homepageFaqs.length} 个使用问题解答`,
  description: `Lofi Radio 的 ${homepageFaqs.length} 个常见问题：是否收费与注册、电台数量与风格、学习编程助眠该选哪个电台、播放失败的排查办法、睡眠定时用法，以及开源与自部署方式。`,
  path: pagePaths.faq,
  keywords: [
    "lofi radio 常见问题",
    "lofi 音乐 学习",
    "电台无法播放",
    "睡眠定时",
    "在线电台 免费",
  ],
});

export default function FaqPage() {
  const schema = buildFaqPageSchema();

  return (
    <>
      <JsonLd data={schema} />
      <ContentShell
        current={pagePaths.faq}
        title="Lofi Radio 常见问题"
        lead={`这里汇总了使用 Lofi Radio 时最常被问到的 ${homepageFaqs.length} 个问题：收费与注册、电台数量与风格、不同场景该选哪个电台、播放失败的排查办法、睡眠定时用法，以及开源自部署。所有答案都在本页直接展开，无需点击。`}
        updated={siteLastUpdated}
      >
        <section aria-labelledby="how-to-start">
          <h2 id="how-to-start">{howToStart.name}</h2>
          <div className="mt-4 leading-8 text-zinc-600 dark:text-zinc-300">
            {howToStart.description}
          </div>
          {/* 这里的编号是真序列（四步有先后），所以序号本身携带信息，保留。
              连接线把四步串成一条动线，比四个并排的方框更像「流程」。 */}
          <ol
            className="not-prose mt-6 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {howToStart.steps.map((step, index) => {
              const accent = accentAt(index);
              return (
                <li
                  key={step.name}
                  className="rounded-2xl border bg-[var(--sf)] border-[var(--bd)] dark:bg-[var(--sf-d)] dark:border-[var(--bd-d)] p-5"
                  style={{
                    "--sf": accent.surface,
                    "--bd": accent.border,
                    "--sf-d": accent.surfaceDark,
                    "--bd-d": accent.borderDark,
                  } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--sd)] font-mono text-xs font-bold tabular-nums text-white"
                      style={{ "--sd": accent.solid } as React.CSSProperties}
                    >
                      {index + 1}
                    </span>
                    <span className="text-base font-semibold text-[var(--tx)] dark:text-[var(--tx-d)]" style={{ "--tx": accent.text, "--tx-d": accent.textDark } as React.CSSProperties}>
                      {step.name}
                    </span>
                  </div>
                  <span className="mt-2 block text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                    {step.text}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="faq-list">
          <h2 id="faq-list">问题与解答</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-[#FFFAFC] dark:border-white/[0.08] dark:bg-white/[0.03]">
            {homepageFaqs.map((faq, index) => (
              <details
                key={faq.question}
                open
                id={`faq-${index + 1}`}
                className="group border-b border-black/[0.05] last:border-0 open:bg-[#FFE3F1] dark:border-white/[0.06] dark:open:bg-[#33132A]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-base font-semibold marker:hidden sm:px-6 sm:text-base">
                  <span>{faq.question}</span>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-90 dark:text-zinc-500"
                  />
                </summary>
                <div className="px-4 pb-4 text-base leading-8 text-zinc-600 sm:px-6 sm:pb-5 dark:text-zinc-300">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="still-stuck">
          <h2 id="still-stuck">问题还没解决？</h2>
          {/* 收尾是一个行动点，不是又一段正文——给它独立表面和两个真按钮。 */}
          <div className="mt-6 rounded-2xl border border-black/[0.06] bg-[#FFFAFC] p-6 sm:p-7 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <div className="text-base leading-8 text-zinc-600 dark:text-zinc-300">
              某个电台长期放不出声，多半是上游音源或网络环境的问题，先切换到同场景的其他电台试试；
              如果是播放器本身出了问题，欢迎带上你的浏览器和系统版本反馈给我。
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="https://github.com/88lin/lofi-radio-web/issues/new/choose"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#EC4899] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-[#BE185D] sm:w-auto sm:py-2.5 sm:text-sm"
              >
                提交 Issue
                <ExternalLink className="size-3.5 opacity-70" aria-hidden="true" />
              </a>
              <a
                href="https://github.com/88lin/lofi-radio-web/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/[0.1] px-5 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-black/[0.03] sm:w-auto sm:py-2.5 sm:text-sm dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
              >
                去 Discussions 提问
                <ExternalLink className="size-3.5 opacity-70" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </ContentShell>
    </>
  );
}
