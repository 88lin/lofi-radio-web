import { getSceneList, getStationsByScene, stations } from "./stations";

const stationCount = stations.length;
const sceneList = getSceneList();

/**
 * 站点内容最近一次实质性更新的日期（YYYY-MM-DD）。
 *
 * 这个日期同时出现在三处：页面可见的「最后更新」文案、JSON-LD 的 dateModified、
 * 以及 llms.txt / llms-full.txt 的头部。改内容时请一并改这里——
 * AI 搜索引擎普遍按新鲜度加权，写死的旧日期比不写更糟。
 */
export const siteLastUpdated = "2026-09-19";

/** 首页与 /about 共用的定义块。控制在 60 词以内，方便被整段摘录。 */
export const lofiDefinition = {
  term: "什么是 Lofi 音乐？",
  short:
    "Lofi（Low Fidelity，低保真）是一类刻意保留录音瑕疵的慢节奏 hip-hop / chill 音乐：节奏普遍偏慢（常见区间约 60–90 BPM），旋律简单循环，极少人声，常叠加雨声、黑胶噼啪声等环境底噪。它不靠情绪高潮抓注意力，因此常被当作学习、编程和写作时的背景音。",
  mechanism: [
    "人声少：没有完整歌词，不容易触发大脑的语言加工，与阅读、写作、编程这类语言任务抢资源的概率更低。",
    "变化少：规律的节奏与循环结构让听感可预测，长时间播放不易产生「被打断」的感觉。",
    "存在感低：音色柔和、情绪克制，能填补过安静的环境，又不强制你把注意力交给它。",
  ],
  caveat:
    "需要说明的是：音乐对专注的影响个体差异很大，现有研究结论并不一致。以上是该风格被广泛用于专注场景的常见解释，不是实验室结论。建议按任务类型、个人感受和音量自行调整。",
};

/** 场景选型对比表。表格比散文更容易被 AI 摘录，也是 Google AI Overview 偏好的形态。 */
export const sceneComparison = {
  caption: `Lofi Radio ${stationCount} 个电台按场景的选型对照`,
  columns: ["使用场景", "推荐风格", "站内电台", "为什么这么选"],
  rows: [
    {
      scene: "学习",
      styles: "Lofi、Chill、Study",
      picks: "Lofi Studying、Lofi Girl、Lofi Box",
      reason: "人声占比低，适合需要记忆、做题、读教材的长时间任务。",
    },
    {
      scene: "编程",
      styles: "Ambient、Lofi、Coding",
      picks: "Groove Salad、Code Radio",
      reason: "结构平缓、重复度高，连续播放数小时也不容易产生听觉疲劳。",
    },
    {
      scene: "阅读",
      styles: "Jazz、日系 Lofi、Chill",
      picks: "Jazz Box、Lofi Japanese、Chill Sky、B3cks Radio",
      reason: "旋律存在感弱，不会在翻页与停顿之间制造节奏落差。",
    },
    {
      scene: "写作",
      styles: "Jazz Groove",
      picks: "Jazz Groove",
      reason: "有乐器质感但不抢戏，适合需要组织语言又要保持节奏的工作。",
    },
    {
      scene: "办公",
      styles: "Smooth Jazz、Mellow",
      picks: "Jazz Smooth",
      reason: "旋律克制、节奏稳定，适合需要持续输出又不能被打断的办公时段。",
    },
    {
      scene: "专注",
      styles: "Classical、Symphony",
      picks: "Swiss Classic",
      reason: "结构完整但不喧闹，适合需要长时间保持注意力的深度任务。",
    },
    {
      scene: "放松",
      styles: "Chillwave、Alt",
      picks: "Chill Wave、Lofi Chilling、Paradise",
      reason: "情绪明亮但不激烈，作为切换状态的背景声更合适。",
    },
    {
      scene: "助眠",
      styles: "Ambient、白噪音",
      picks: "Rain Sounds、Drone Zone、ASP、Lofi Sleeping",
      reason: "几乎无旋律起伏，接近持续音墙，配合睡眠定时可自动停止。",
    },
    {
      scene: "运动",
      styles: "Hip-Hop Beats",
      picks: "Rap Beats",
      reason: "节拍更明确，需要外部驱动感时比纯氛围音更有效。",
    },
    {
      scene: "娱乐",
      styles: "Gaming Lofi",
      picks: "Lofi Gaming",
      reason: "节奏清楚但不喧宾夺主，适合游戏或轻松娱乐时当背景层。",
    },
  ],
};

/** 收录电台的第三方音源。可验证的一手来源，用于建立引用可信度。 */
export const stationSources = [
  { name: "Lofi Girl", url: "https://www.youtube.com/c/LofiGirl", note: "7×24 小时 Lofi 直播（B站同步转播）" },
  { name: "Lofi Cafe", url: "https://loficafe.net/", note: "Studying / Japanese / Sleeping / Gaming 等多个子频道" },
  { name: "SomaFM", url: "https://somafm.com/", note: "Groove Salad、Drone Zone 等互联网电台" },
  { name: "freeCodeCamp Code Radio", url: "https://coderadio.freecodecamp.org/", note: "面向编程场景的社区电台" },
  { name: "Radio Paradise", url: "https://radioparadise.com/", note: "Mellow 混合风格流" },
  { name: "SRF Swiss Classic", url: "https://www.srf.ch/", note: "瑞士德语区古典音乐流" },
  { name: "The Jazz Groove", url: "https://thejazzgroove.com/", note: "Groove / Smooth 爵士流" },
  { name: "Stereoscenic", url: "https://stereoscenic.com/", note: "ASP 极简氛围流" },
];

/** 电台筛选方法（E-E-A-T 中的「方法论透明度」）。 */
export const curationMethodology = [
  "音源可用性：候选流需在连续多日的抽样中保持可连接，偶发中断即降级观察。",
  "风格匹配度：优先选择少人声、少突兀起伏的流，避免把「好听」放到「不打扰」前面。",
  "场景可解释性：每个电台都要能说清适合什么任务，说不清的不收录。",
  "来源合规：只收录公开可访问的流媒体地址，本站不转存、不二次分发音频。",
];

export const siteFacts = {
  stationCount,
  sceneCount: sceneList.length,
  sourceCount: stationSources.length,
  freeTier: "完全免费，无需注册、无需下载、无广告位",
};

export const homepageFaqs = [
  {
    question: "Lofi Radio 是什么？",
    answer:
      `Lofi Radio 是一个免注册的在线专注音乐电台网站，聚合了 ${stationCount} 个适合学习、工作、编程、阅读、放松和助眠的音乐电台。网页直接播放，支持移动端播放器、睡眠定时和专注时间记录，打开浏览器即可使用。`,
  },
  {
    question: "什么是 Lofi 音乐？",
    answer: lofiDefinition.short,
  },
  {
    question: "Lofi 音乐为什么适合学习和工作？",
    answer:
      "常见解释有三点：一是 Lofi 通常没有完整人声，不容易触发语言加工，与阅读、写作、编程这类语言任务争夺认知资源的概率更低；二是节奏平稳、旋律循环，听感可预测，长时间播放不容易被打断；三是音色柔和、情绪克制，能填补过安静的环境。需要强调的是，音乐对专注的影响个体差异很大、研究结论并不一致，建议按任务类型与自身感受调整。",
  },
  {
    question: "Lofi Radio 收费吗？需要注册吗？",
    answer:
      "完全免费，也不设账号体系。打开网页即可播放，不需要注册、登录、下载客户端或填写任何信息。项目以 MIT 协议开源，你也可以自行部署一份。",
  },
  {
    question: "一共有多少个电台？覆盖哪些风格？",
    answer:
      `站内目前收录 ${stationCount} 个电台，按使用场景分为 ${sceneList.length} 类，覆盖 Lofi、Chill、Jazz、Classical、Ambient、Hip-Hop Beats 与白噪音等风格。完整清单与音源地址见「电台列表」页。`,
  },
  {
    question: "学习、编程、助眠分别该选哪个电台？",
    answer:
      "简单对应：学习选 Lofi Studying 或 Lofi Girl；编程选 Groove Salad、Code Radio；阅读选 Jazz Box、Lofi Japanese、Chill Sky、B3cks Radio；写作选 Jazz Groove；办公选 Jazz Smooth；专注选 Swiss Classic；助眠选 Rain Sounds、Drone Zone、ASP 或 Lofi Sleeping。更细的场景对照见首页「不同场景该选哪种音乐」。",
  },
  {
    question: "手机上也能播放吗？",
    answer:
      "可以。移动端同样支持直接播放、展开播放器、拖动灵动岛、切换电台以及设置睡眠定时。页面是响应式设计，核心功能在手机上不缺失，只是交互更贴近触屏操作。此外站点支持 PWA，可添加到主屏幕以独立窗口打开。",
  },
  {
    question: "睡眠定时怎么用？最长能设多久？",
    answer:
      "在播放器里打开睡眠定时，可选 15 / 30 / 45 / 60 / 90 / 120 分钟的快速档，也可以自定义 1–480 分钟。倒计时结束时播放器会自动暂停，不需要手动关闭。定时状态保存在浏览器本地，刷新页面不会丢失。",
  },
  {
    question: "为什么有的电台无法播放？",
    answer:
      "本站不托管音频，所有电台都直连第三方公开流媒体。部分音源来自海外平台，可能因地区限制、网络波动、DNS 污染或上游维护而暂时不可用。遇到这种情况，先切换到同场景的其他电台，或换个网络环境重试。",
  },
  {
    question: "项目是开源的吗？可以自己部署吗？",
    answer:
      "是。项目以 MIT 协议开源在 GitHub（88lin/lofi-radio-web），基于 Next.js 16 构建。因为包含服务端 API，部署时需要支持 Node.js 服务端运行时的平台，而不是纯静态托管。",
  },
];

/** 「如何开始使用」的步骤块，供 /faq 页生成 HowTo 结构与可见步骤。 */
export const howToStart = {
  name: "如何用 Lofi Radio 开始一次专注",
  description:
    "从打开网页到配好睡眠定时，四步即可开始一段不被打扰的专注时间。",
  steps: [
    { name: "打开网页", text: "在浏览器访问 https://lofi.88lin.eu.org/ ，无需注册或下载。" },
    { name: "选一个电台", text: "按场景挑选：学习用 Lofi Studying，编程用 Code Radio，助眠用 Rain Sounds。" },
    { name: "点开始播放", text: "点击「开始播放」，可在浮动播放器里调节音量；空格键也能播放 / 暂停。" },
    { name: "设定结束条件", text: "需要休息就设睡眠定时（15–120 分钟快捷档，或自定义 1–480 分钟），到点自动暂停。" },
  ],
};

/** 场景 → 电台的快捷索引，用于目录页与 llms-full.txt。 */
export function buildSceneIndex() {
  return sceneList.map(({ scene, slug, count }) => ({
    scene,
    slug,
    count,
    stations: getStationsByScene(scene).map((s) => ({
      id: s.id,
      name: s.name,
      styles: `${s.style1} / ${s.style2}`,
      type: s.type,
    })),
  }));
}
