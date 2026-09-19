import type { Metadata } from "next";

import { ContentCard, ContentShell, JsonLd } from "@/components/seo/site-chrome";
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
          <p>{howToStart.description}</p>
          <ContentCard>
            <ol className="!mt-0 list-decimal !pl-6">
              {howToStart.steps.map((step, index) => (
                <li key={step.name}>
                  <strong>{step.name}</strong>
                  <span className="text-zinc-600 dark:text-zinc-300"> — {step.text}</span>
                  <span className="sr-only">（第 {index + 1} 步，共 {howToStart.steps.length} 步）</span>
                </li>
              ))}
            </ol>
          </ContentCard>
        </section>

        <section aria-labelledby="faq-list">
          <h2 id="faq-list">问题与解答</h2>
          <div className="mt-6 space-y-3">
            {homepageFaqs.map((faq, index) => (
              <details
                key={faq.question}
                open
                id={`faq-${index + 1}`}
                className="group rounded-2xl border border-black/[0.06] bg-white px-4 py-3 sm:px-6 sm:py-4 dark:border-white/[0.08] dark:bg-zinc-900/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="mr-2 text-violet-600 dark:text-violet-400">Q{index + 1}.</span>
                    {faq.question}
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-90 dark:text-zinc-500">›</span>
                </summary>
                <p className="mt-3 leading-8 text-zinc-600 dark:text-zinc-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="still-stuck">
          <h2 id="still-stuck">问题还没解决？</h2>
          <p>
            如果是某个电台长期无法播放，多半是上游音源或网络环境的问题，先切换到同场景的其他电台；
            如果是播放器本身的异常，可以到{" "}
            <a
              href="https://github.com/88lin/lofi-radio-web/issues/new/choose"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
            >
              GitHub Issues
            </a>{" "}
            按模板反馈，或在{" "}
            <a
              href="https://github.com/88lin/lofi-radio-web/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
            >
              Discussions
            </a>{" "}
            提问。
          </p>
        </section>
      </ContentShell>
    </>
  );
}
