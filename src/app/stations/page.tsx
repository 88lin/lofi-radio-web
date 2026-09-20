import type { Metadata } from "next";
import Link from "next/link";

import { ContentShell, JsonLd, SourceList } from "@/components/seo/site-chrome";
import { SceneTag, StationChip, StationPlayButton } from "@/components/lofi/station-controls";
import { buildPageMetadata, buildStationsPageSchema, pagePaths } from "@/lib/seo";
import { sceneComparison, siteLastUpdated, stationSources } from "@/lib/seo-content";
import { getSceneColor, getSceneList, getSceneSlug, getStationsByScene, stations } from "@/lib/stations";
import { shadeBorder, shadeSurface, tintBorder, tintSurface } from "@/lib/palette";

const sceneList = getSceneList();

export const metadata: Metadata = buildPageMetadata({
  title: `Lofi Radio 电台列表 - ${stations.length} 个在线电台（风格 / 场景 / 音源）`,
  description: `Lofi Radio 全部 ${stations.length} 个在线电台的完整清单：包含 Lofi、Chill、Jazz、Classical、Ambient、Hip-Hop Beats 与白噪音等风格，标注每个电台的适用场景、音源类型与来源站点，点击即可直接收听。`,
  path: pagePaths.stations,
  keywords: [
    "lofi 电台列表",
    "在线电台大全",
    "学习电台",
    "编程电台",
    "助眠电台",
    "jazz radio",
    "ambient radio",
    "white noise radio",
  ],
});

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const typeLabel: Record<string, string> = {
  mp3: "MP3 直连流",
  m3u8: "HLS / M3U8",
  bilibili: "Bilibili 直播流",
};

/**
 * 场景面板的数据：把手写的选型建议（风格 / 理由）和真实的电台归属拼起来。
 *
 * 电台名单取自 stations.ts 而不是对照表里手写的 picks 字符串——加电台时不会漏，
 * 而且拼出来的是可以直接点播的实体，不只是一串文字。
 *
 * slug 用作面板的 ASCII 锚点，llms.txt 的场景目录直接深链到这里。
 */
const scenePanels = sceneComparison.rows
  .map((row) => ({
    scene: row.scene,
    slug: getSceneSlug(row.scene),
    styles: row.styles,
    reason: row.reason,
    color: getSceneColor(row.scene),
    stations: getStationsByScene(row.scene),
  }))
  .filter((panel) => panel.stations.length > 0);

export default function StationsPage() {
  const schema = buildStationsPageSchema();

  return (
    <>
      <JsonLd data={schema} />
      <ContentShell
        current={pagePaths.stations}
        title={`Lofi Radio 电台列表（共 ${stations.length} 个）`}
        lead={`Lofi Radio 收录 ${stations.length} 个可直接播放的在线音乐电台，覆盖 Lofi、Chill、Jazz、Classical、Ambient、Hip-Hop Beats 与白噪音等风格，按 ${sceneList.length} 类使用场景组织。点击任意电台即可开始收听，免注册、免下载。`}
        updated={siteLastUpdated}
      >
        <section aria-labelledby="scene-picker">
          <h2 id="scene-picker">不同场景该选哪种音乐</h2>
          <div className="mt-4 leading-8 text-zinc-600 dark:text-zinc-300">
            同一个电台在不同任务下的效果差别很大。下面按场景给出推荐风格、这么选的理由，
            以及站内对应的电台——直接点电台名就能听。
          </div>

          {/* 原来这里是「按场景速查」和一张四列对照表两块内容，讲的是同一件事。
              合成一组场景面板：场景色来自该场景第一个电台，和下面清单里的色块同源。 */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {scenePanels.map((panel) => (
              <div
                key={panel.scene}
                id={panel.slug}
                className="scroll-mt-24 rounded-2xl border bg-[var(--sf)] border-[var(--bd)] p-5 dark:bg-[var(--sf-d)] dark:border-[var(--bd-d)]"
                style={{
                  "--sf": tintSurface(panel.color),
                  "--bd": tintBorder(panel.color),
                  "--sf-d": shadeSurface(panel.color),
                  "--bd-d": shadeBorder(panel.color),
                } as React.CSSProperties}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="!mt-0 flex items-center gap-2 text-base font-bold tracking-tight">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: panel.color }}
                      aria-hidden="true"
                    />
                    {panel.scene}
                  </h3>
                  <span className="shrink-0 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                    {panel.stations.length} 个电台
                  </span>
                </div>

                <div className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {panel.styles}
                  </span>
                  <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                  {panel.reason}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {panel.stations.map((station) => (
                    <StationChip key={station.id} station={station} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="all-stations">
          <h2 id="all-stations">全部电台一览</h2>
          <div className="mt-4 leading-8 text-zinc-600 dark:text-zinc-300">
            每个电台的风格标签、适用场景、音源类型与来源域名。本站不托管音频文件，
            所有电台均直连第三方公开流媒体，稳定性取决于上游服务与你的网络环境。
          </div>

          {/* 桌面端保留 table：这是五个并列属性的表格型数据，也是 AI 摘录偏好的结构。
              移动端换成分隔列表——640px 的表在 338px 容器里要横向拖动才看得全。 */}
          <div className="mt-6 hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-base">
              <caption className="sr-only">
                Lofi Radio 全部 {stations.length} 个在线电台清单，点击电台名可直接收听
              </caption>
              <thead>
                <tr className="border-b border-black/[0.08] dark:border-white/[0.12]">
                  <th scope="col" className="py-2.5 pr-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    电台
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    风格
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    场景
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    音源类型
                  </th>
                  <th scope="col" className="py-2.5 pl-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    来源域名
                  </th>
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => (
                  <tr
                    key={station.id}
                    id={station.id}
                    className="border-b border-black/[0.05] transition-colors last:border-0 hover:bg-[#FFF0F7] dark:border-white/[0.06] dark:hover:bg-[#241019]"
                  >
                    <th scope="row" className="py-2 pr-3 font-medium">
                      <StationPlayButton station={station} layout="row" />
                    </th>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                      {station.style1} / {station.style2}
                    </td>
                    <td className="px-3 py-2">
                      <SceneTag scene={station.scene} />
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                      {typeLabel[station.type] ?? station.type}
                    </td>
                    <td className="max-w-[15rem] break-all py-2 pl-3 font-mono text-sm text-zinc-500 dark:text-zinc-400">
                      {hostOf(station.url)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 移动端：单一表面 + 发丝分隔线，比 21 张浮起来的卡片安静得多。
              not-prose 让它整体退出 ContentShell 的正文列表规则（list-disc / pl-6 / li 间距）。 */}
          <ul
            className="not-prose mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-[#FFFAFC] md:hidden dark:border-white/[0.08] dark:bg-white/[0.03]"
          >
            {stations.map((station) => (
              <li
                key={station.id}
                id={`m-${station.id}`}
                className="border-b border-black/[0.05] px-4 py-3 last:border-0 dark:border-white/[0.06]"
              >
                <StationPlayButton station={station} layout="card" />
                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 pl-12 text-sm text-zinc-500 dark:text-zinc-400">
                  <SceneTag scene={station.scene} />
                  <span>{typeLabel[station.type] ?? station.type}</span>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <span className="break-all font-mono">{hostOf(station.url)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="sources">
          <h2 id="sources">音源提供方</h2>
          <div className="mt-4 leading-8 text-zinc-600 dark:text-zinc-300">
            以下是一手音源站点，版权归各自权利人所有。本站只做公开流媒体地址的聚合与场景分类。
          </div>
          <SourceList sources={stationSources} />
        </section>

        <section aria-labelledby="play">
          <h2 id="play">收听与快捷键</h2>
          <div className="mt-4 leading-8 text-zinc-600 dark:text-zinc-300">
            上面任意一个电台名都能直接点开播放，播放器会停在屏幕角落，切换页面也不会中断。
            全站都可以用键盘控制（焦点不在输入框或按钮上时）：
          </div>

          {/* 快捷键是一张图例，不是正文，所以给它独立表面并居中——
              散在正文流里排成一行长短不齐的文字最难看。 */}
          <div className="mt-6 rounded-2xl border border-black/[0.06] bg-[#FFFAFC] px-5 py-5 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-7 sm:gap-y-4">
              {[
                { key: "空格", label: "播放 / 暂停" },
                { key: "←", label: "上一个电台" },
                { key: "→", label: "下一个电台" },
                { key: "M", label: "静音" },
                { key: "T", label: "切换主题" },
              ].map((item) => (
                <span key={item.key} className="inline-flex items-center gap-2">
                  <kbd className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md border border-[#FBC7E0] border-b-[#F2A3C8] bg-[#FFE3F1] px-2 font-mono text-sm font-medium text-[#BE185D] dark:border-[#5C2447] dark:border-b-[#7A2E5C] dark:bg-[#33132A] dark:text-[#FBCFE8]">
                    {item.key}
                  </kbd>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{item.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 leading-8 text-zinc-600 dark:text-zinc-300">
            某个电台放不出声音时，先切同场景的其他电台，排查办法见{" "}
            <Link
              href={pagePaths.faq}
              className="font-medium text-[#BE185D] underline-offset-4 hover:underline dark:text-[#FBCFE8]"
            >
              常见问题
            </Link>
            。
          </div>
        </section>
      </ContentShell>
    </>
  );
}
