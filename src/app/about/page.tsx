import type { Metadata } from "next";
import Link from "next/link";

import { ContentShell, JsonLd, LinkRows, SourceList } from "@/components/seo/site-chrome";
import { accentAt, accents } from "@/lib/palette";
import { buildAboutPageSchema, buildPageMetadata, pagePaths, siteConfig } from "@/lib/seo";
import {
  curationMethodology,
  lofiDefinition,
  siteFacts,
  siteLastUpdated,
  stationSources,
} from "@/lib/seo-content";

export const metadata: Metadata = buildPageMetadata({
  title: "关于 Lofi Radio - 项目背景、电台筛选方法与音源说明",
  description: `关于 Lofi Radio：项目定位与维护者${siteConfig.author}、Lofi 音乐的定义与专注机制解释、${siteFacts.stationCount} 个电台的筛选方法、${siteFacts.sourceCount} 家第三方音源与版权说明、隐私政策与开源信息。`,
  path: pagePaths.about,
  keywords: ["关于 lofi radio", "lofi 音乐 定义", "电台筛选", "开源 电台", "茉灵智库"],
});

const factRows: { label: string; value: string }[] = [
  { label: "站点名称", value: siteConfig.fullName },
  { label: "维护者", value: siteConfig.author },
  { label: "收录电台", value: `${siteFacts.stationCount} 个（覆盖 ${siteFacts.sceneCount} 类场景）` },
  { label: "音源提供方", value: `${siteFacts.sourceCount} 家第三方公开流媒体` },
  { label: "使用成本", value: siteFacts.freeTier },
  { label: "技术栈", value: "Next.js 16 · React 19 · TypeScript · Tailwind CSS v4" },
  { label: "开源协议", value: "MIT" },
  { label: "内容最后更新", value: siteLastUpdated },
];

export default function AboutPage() {
  const schema = buildAboutPageSchema();

  return (
    <>
      <JsonLd data={schema} />
      <ContentShell
        current={pagePaths.about}
        title="关于 Lofi Radio"
        lead={`Lofi Radio 是一个免费、免注册的在线专注音乐电台，由${siteConfig.author}维护。它把 ${siteFacts.stationCount} 个第三方公开流媒体按使用场景重新组织，让你在学习、编程、阅读或睡前能直接打开一个不打扰人的背景声，而不必在几十个电台里试错。项目以 MIT 协议开源。`}
        updated={siteLastUpdated}
      >
        <section aria-labelledby="at-a-glance">
          <h2 id="at-a-glance">站点速览</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#FBC7E0] bg-[#FFE3F1] p-5 sm:p-6 dark:border-[#5C2447] dark:bg-[#33132A]">
            <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {factRows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-0.5 border-b border-[#BE185D]/20 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:[&:nth-last-child(2)]:border-0 dark:border-white/10"
                >
                  <dt className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">{row.label}</dt>
                  <dd className="!mt-0 text-base font-medium leading-7 sm:text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="what-is-lofi">
          <h2 id="what-is-lofi">{lofiDefinition.term}</h2>
          <p>{lofiDefinition.short}</p>

          {/* 量值标注。等宽字用在这里是因为它们确实是量值，不是拿 mono 扮「技术感」。 */}
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-black/[0.06] py-4 dark:border-white/[0.08]">
            {lofiDefinition.traits.map((trait) => (
              <div key={trait.label}>
                <dt className="text-sm text-zinc-400 dark:text-zinc-500">
                  {trait.label}
                </dt>
                <dd className="!mt-1 font-mono text-base font-semibold text-[#BE185D] dark:text-[#FBCFE8]">{trait.value}</dd>
              </div>
            ))}
          </dl>

          <h3>为什么它常被用在专注场景</h3>
          {/* 色标按 accentCycle 顺序取，首页「什么是 Lofi 音乐」用的是同一条规则，
              同一段内容在两页上的配色必须一致。 */}
          <dl className="!mt-4">
            {lofiDefinition.mechanism.map((item, index) => (
              <div
                key={item.title}
                className="border-b border-black/[0.05] py-3.5 last:border-0 dark:border-white/[0.06]"
              >
                <dt className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: accentAt(index).solid }}
                  />
                  <span className="font-semibold">{item.title}</span>
                </dt>
                <dd className="!mt-1.5 pl-[1.3rem] text-base leading-7 text-zinc-600 dark:text-zinc-300">
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>

          {/* 这段免责声明是本页最该被读到的一句，给它一个和正文不同的表面。
              用 accents.note 的实色浅底而不是 amber 半透明叠加——半透明压在带光晕的
              背景上会发灰，和正文的对比也立不住。琥珀是「注意」的语义色，不是装饰。 */}
          <div
            className="mt-6 rounded-2xl border border-[var(--bd)] bg-[var(--sf)] p-5 text-base leading-7 text-[var(--tx)] dark:border-[var(--bd-d)] dark:bg-[var(--sf-d)] dark:text-[var(--tx-d)]"
            style={{
              "--sf": accents.note.surface,
              "--bd": accents.note.border,
              "--tx": accents.note.text,
              "--sf-d": accents.note.surfaceDark,
              "--bd-d": accents.note.borderDark,
              "--tx-d": accents.note.textDark,
            } as React.CSSProperties}
          >
            {lofiDefinition.caveat}
          </div>
        </section>

        <section aria-labelledby="how-we-pick">
          <h2 id="how-we-pick">电台是怎么挑出来的</h2>
          <div className="mt-4 leading-8 text-zinc-600 dark:text-zinc-300">
            电台列表不是照抄某个现成清单，而是按下面四条人工评估后收录或移除：
          </div>
          {/* 四条是并列的筛选标准，不是有先后的步骤，所以不编号。
              排成 2×2 而不是竖着四行：一长条竖排列表是这一页最容易读不下去的地方。 */}
          <ul
            className="not-prose mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {curationMethodology.map((item, index) => {
              const at = item.indexOf("：");
              const title = at > 0 ? item.slice(0, at) : null;
              const body = at > 0 ? item.slice(at + 1) : item;
              const accent = accentAt(index);
              return (
                <li
                  key={item}
                  className="rounded-2xl border bg-[var(--sf)] border-[var(--bd)] dark:bg-[var(--sf-d)] dark:border-[var(--bd-d)] p-5"
                  style={{
                    "--sf": accent.surface,
                    "--bd": accent.border,
                    "--sf-d": accent.surfaceDark,
                    "--bd-d": accent.borderDark,
                  } as React.CSSProperties}
                >
                  {title ? (
                    <span className="block text-base font-semibold text-[var(--tx)] dark:text-[var(--tx-d)]" style={{ "--tx": accent.text, "--tx-d": accent.textDark } as React.CSSProperties}>
                      {title}
                    </span>
                  ) : null}
                  <span className="mt-1.5 block text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                    {body}
                  </span>
                </li>
              );
            })}
          </ul>

          <p>
            失效或长期不稳定的电台会被替换或下架。如果你发现某个电台长期不可用，欢迎到{" "}
            <a
              href="https://github.com/88lin/lofi-radio-web/issues/new/choose"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#BE185D] underline-offset-4 hover:underline dark:text-[#FBCFE8]"
            >
              GitHub Issues
            </a>{" "}
            反馈。
          </p>
        </section>

        <section aria-labelledby="rights">
          <h2 id="rights">音源、版权与免责</h2>
          <p>
            本站不托管、不转存、不二次分发任何音频文件，只聚合公开可访问的流媒体地址，
            音乐版权归各自权利人所有。以下是一手音源站点：
          </p>
          <SourceList sources={stationSources} />
          <p>
            第三方流媒体可能因上游维护、地区限制或网络环境暂时不可用；遇到播放失败时，
            建议先切换到同场景的其他电台。
          </p>
        </section>

        <section aria-labelledby="privacy">
          <h2 id="privacy">隐私说明</h2>
          <p>
            本站不设账号体系，收听记录、每日专注时长与睡眠定时都保存在你自己浏览器的
            localStorage 中，不会上传到服务器。页面加载了第三方统计脚本（域名 spst2.com）
            用于访问量统计，除此之外没有收集个人收听行为的埋点。
          </p>
        </section>

        <section aria-labelledby="open-source">
          <h2 id="open-source">开源与自部署</h2>
          <p>
            项目源码与技术细节见{" "}
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#BE185D] underline-offset-4 hover:underline dark:text-[#FBCFE8]"
            >
              88lin/lofi-radio-web
            </a>
            ，采用 MIT 协议。因为包含服务端 API（Bilibili 直播流解析），部署时需要支持
            Node.js 服务端运行时的平台，纯静态托管无法完整运行。
          </p>
        </section>

        <section aria-labelledby="contact">
          <h2 id="contact">联系与反馈</h2>
          <LinkRows
            rows={[
              { label: "维护者", text: siteConfig.author, href: siteConfig.creatorUrl, external: true },
              { label: "问题反馈", text: "GitHub Issues", href: `${siteConfig.githubUrl}/issues/new/choose`, external: true },
              { label: "开放讨论", text: "GitHub Discussions", href: `${siteConfig.githubUrl}/discussions`, external: true },
              { label: "电台列表", text: "查看全部电台", href: pagePaths.stations },
            ]}
          />
        </section>
      </ContentShell>
    </>
  );
}
