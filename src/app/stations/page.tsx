import type { Metadata } from "next";

import { ContentCard, ContentShell, JsonLd } from "@/components/seo/site-chrome";
import { buildPageMetadata, buildStationsPageSchema, pagePaths, siteConfig } from "@/lib/seo";
import { siteLastUpdated, stationSources } from "@/lib/seo-content";
import { getSceneList, stations } from "@/lib/stations";

const sceneList = getSceneList();

export const metadata: Metadata = buildPageMetadata({
  title: `Lofi Radio 电台列表 - ${stations.length} 个在线电台（风格 / 场景 / 音源）`,
  description: `Lofi Radio 全部 ${stations.length} 个在线电台的完整清单：包含 Lofi、Chill、Jazz、Classical、Ambient、Hip-Hop Beats 与白噪音等风格，标注每个电台的适用场景、音源类型与来源站点，全部免注册直接收听。`,
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

export default function StationsPage() {
  const schema = buildStationsPageSchema();

  return (
    <>
      <JsonLd data={schema} />
      <ContentShell
        current={pagePaths.stations}
        title={`Lofi Radio 电台列表（共 ${stations.length} 个）`}
        lead={`Lofi Radio 收录 ${stations.length} 个可直接播放的在线音乐电台，覆盖 Lofi、Chill、Jazz、Classical、Ambient、Hip-Hop Beats 与白噪音等风格，按学习、编程、阅读、写作、办公、放松、运动、娱乐、助眠 ${sceneList.length} 类场景组织。全部免注册、免下载，在浏览器中打开 ${siteConfig.url} 即可收听。`}
        updated={siteLastUpdated}
      >
        <section aria-labelledby="scene-index">
          <h2 id="scene-index">按场景速查</h2>
          <ContentCard>
            <dl className="!mt-0 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sceneList.map(({ scene, count }) => (
                <div key={scene}>
                  <dt className="font-semibold">
                    {scene}
                    <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {count} 个电台
                    </span>
                  </dt>
                  <dd className="!mt-1 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                    {stations
                      .filter((s) => s.scene === scene)
                      .map((s) => s.name)
                      .join("、")}
                  </dd>
                </div>
              ))}
            </dl>
          </ContentCard>
        </section>

        <section aria-labelledby="all-stations">
          <h2 id="all-stations">全部电台一览</h2>
          <p>
            下表列出每个电台的名称、风格标签、适用场景、音源类型与来源域名。本站不托管音频文件，
            所有电台均直连第三方公开流媒体，稳定性取决于上游服务与你的网络环境。
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Lofi Radio 全部 {stations.length} 个在线电台清单
              </caption>
              <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">电台</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">风格</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">场景</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">音源类型</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">来源域名</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => (
                  <tr
                    key={station.id}
                    id={station.id}
                    className="border-t border-black/[0.06] dark:border-white/[0.07]"
                  >
                    <th scope="row" className="px-3 py-2.5 font-medium">
                      {station.name}
                    </th>
                    <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-300">
                      {station.style1} / {station.style2}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-300">
                      {station.scene}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-300">
                      {typeLabel[station.type] ?? station.type}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400">
                      {hostOf(station.url)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="sources">
          <h2 id="sources">音源提供方</h2>
          <p>
            以下是一手音源站点，版权归各自权利人所有。本站只做公开流媒体地址的聚合与场景分类。
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
        </section>

        <section aria-labelledby="play">
          <h2 id="play">怎么开始收听</h2>
          <p>
            回到{" "}
            <a
              href={pagePaths.home}
              className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
            >
              首页
            </a>{" "}
            点击「开始播放」即可；也可以用快捷键 <kbd className="rounded border border-black/10 px-1.5 py-0.5 text-xs dark:border-white/15">空格</kbd>{" "}
            播放 / 暂停，<kbd className="rounded border border-black/10 px-1.5 py-0.5 text-xs dark:border-white/15">←</kbd>{" "}
            <kbd className="rounded border border-black/10 px-1.5 py-0.5 text-xs dark:border-white/15">→</kbd>{" "}
            切换电台。播放异常排查见{" "}
            <a
              href={pagePaths.faq}
              className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
            >
              常见问题
            </a>
            。
          </p>
        </section>
      </ContentShell>
    </>
  );
}
