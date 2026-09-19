import type { Metadata } from "next";

import { ContentCard, ContentShell, JsonLd } from "@/components/seo/site-chrome";
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
          <ContentCard>
            <dl className="!mt-0 divide-y divide-black/[0.06] dark:divide-white/[0.07]">
              {factRows.map((row) => (
                <div key={row.label} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:gap-6">
                  <dt className="w-40 shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                    {row.label}
                  </dt>
                  <dd className="!mt-0 text-sm leading-7">{row.value}</dd>
                </div>
              ))}
            </dl>
          </ContentCard>
        </section>

        <section aria-labelledby="what-is-lofi">
          <h2 id="what-is-lofi">{lofiDefinition.term}</h2>
          <p>{lofiDefinition.short}</p>
          <h3>为什么它常被用在专注场景</h3>
          <ul>
            {lofiDefinition.mechanism.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm">
            {lofiDefinition.caveat}
          </p>
        </section>

        <section aria-labelledby="how-we-pick">
          <h2 id="how-we-pick">电台是怎么挑出来的</h2>
          <p>
            电台列表不是照抄某个现成清单，而是按下面四条人工评估后收录或移除：
          </p>
          <ol className="list-decimal">
            {curationMethodology.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p>
            失效或长期不稳定的电台会被替换或下架。如果你发现某个电台长期不可用，欢迎到{" "}
            <a
              href="https://github.com/88lin/lofi-radio-web/issues/new/choose"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
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
          <ul>
            {stationSources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
                >
                  {source.name}
                </a>
                <span className="text-zinc-500 dark:text-zinc-400"> — {source.note}</span>
              </li>
            ))}
          </ul>
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
              className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
            >
              {siteConfig.githubUrl}
            </a>
            ，采用 MIT 协议。因为包含服务端 API（Bilibili 直播流解析），部署时需要支持
            Node.js 服务端运行时的平台，纯静态托管无法完整运行。
          </p>
        </section>

        <section aria-labelledby="contact">
          <h2 id="contact">联系与反馈</h2>
          <ul>
            <li>
              维护者：
              <a
                href={siteConfig.creatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
              >
                {siteConfig.author}
              </a>
            </li>
            <li>
              问题反馈：
              <a
                href="https://github.com/88lin/lofi-radio-web/issues/new/choose"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
              >
                GitHub Issues
              </a>
            </li>
            <li>
              开放讨论：
              <a
                href="https://github.com/88lin/lofi-radio-web/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
              >
                GitHub Discussions
              </a>
            </li>
            <li>
              电台列表：
              <a
                href={pagePaths.stations}
                className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
              >
                查看全部电台
              </a>
            </li>
          </ul>
        </section>
      </ContentShell>
    </>
  );
}
