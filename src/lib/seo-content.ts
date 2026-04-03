import { stations } from "./stations";

const stationCount = stations.length;

export const homepageFaqs = [
  {
    question: "Lofi 音乐为什么适合学习和工作？",
    answer:
      "Lofi 音乐通常节奏更平稳、旋律重复度更高，人声和情绪起伏也相对克制。对于学习、写作和长时间工作来说，这种持续但不过度打扰的背景氛围，更容易帮助人把注意力留在手头的事情上。",
  },
  {
    question: "这个 Lofi 电台网站需要下载 App 才能使用吗？",
    answer:
      "不需要。这个网站本身就是网页版播放器，打开浏览器就能直接收听。无论是电脑、平板还是手机，都可以快速进入播放状态，不需要额外安装 App，也不用注册账号。",
  },
  {
    question: "网站里有哪些音乐风格和收听场景？",
    answer:
      `站内目前整理了 ${stationCount} 个精选电台，覆盖 Lofi、Chill、Jazz、Ambient、Classical 和白噪音等类型。无论你是在学习、编程、阅读、放松，还是睡前想找一段更安静的背景声音，都能比较快地找到适合自己的频道。`,
  },
  {
    question: "手机上也能播放 Lofi 电台吗？",
    answer:
      "可以。移动端同样支持直接播放、展开播放器、切换电台以及设置睡眠定时。页面本身就是响应式设计，所以在手机上使用时也不会丢掉核心功能，只是交互方式更贴近触屏操作。",
  },
];
