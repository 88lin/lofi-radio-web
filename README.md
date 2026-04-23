# 🎵 Lofi Radio Web

<div align="center">

![Lofi Radio](https://img.shields.io/badge/Lofi-Radio-8B5CF6?style=for-the-badge&logo=music&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Lofi（Low Fidelity）低保真音乐，是工作与学习等专注场景下公认的高适配背景音，被科学家认为是最适合专注工作学习的音乐。**

macOS 风格灵动岛设计，21 个精选电台，打开即用，无需下载

**[🎧 在线体验](https://lofi.88lin.eu.org/)** · [📖 功能特性](#-功能特性) · [🚀 快速开始](#-快速开始) · [📦 部署指南](#-部署指南) · [💬 Discussions](https://github.com/88lin/lofi-radio-web/discussions)

</div>

---

## 🖼️ 首页预览

<div align="center">

### 亮色模式
![Lofi Radio Hero Light](https://cdn.jsdmirror.com/gh/88lin/picx-images-hosting@master/hero-image.jpg)

### 暗色模式
![Lofi Radio Hero Dark](https://cdn.jsdmirror.com/gh/88lin/picx-images-hosting@master/hero-image-dark.jpg)

</div>

---

## 📖 项目简介

Lofi Radio Web 是 [labilio/lofi-radio](https://github.com/labilio/lofi-radio) 的网页版实现，将原 Electron 桌面应用改造为现代化 Web 应用。

**就像把咖啡店的背景音乐搬进你的书房** —— 不需要本地音源，不需要选歌单，打开网页即可收听。

### 🎯 设计理念

- **专注体验** - 灵动岛设计，小巧玲珑，安静陪伴不打扰
- **跨平台** - 基于 Web 技术，支持桌面、移动端全平台访问
- **即开即用** - 无需注册登录，无需下载安装，打开即用
- **PWA 支持** - 可安装到桌面，像原生应用一样使用

### 🧠 为什么 Lofi 适合专注场景

Lofi（Low Fidelity）低保真音乐常用于学习、编程、写作与办公等高专注任务。其典型特征包括：

- **节奏慢且稳定**（通常 60-90 BPM）
- **旋律简单、循环感强**
- **极少或没有歌词**
- **音色柔和**，常带雨声、黑胶噼啪声、环境底噪
- **情绪克制**，不刻意制造高潮

它之所以被广泛用于背景专注，核心原因是：

1. **不与语言脑区竞争注意力**：带歌词音乐容易占用语言处理资源，Lofi 的弱语义特征更适合长时间专注任务。
2. **规律可预测，帮助进入状态**：稳定节奏与循环结构带来心理上的可预测性，更容易进入 Deep Work / Flow。
3. **提供陪伴感，降低焦虑**：温和的情绪表达在不打断思路的前提下，缓解工作与考试带来的紧张感。

---

## ✨ 功能特性

### 🎵 音乐播放

| 功能 | 描述 |
|------|------|
| **21 精选电台** | 涵盖 Lofi、Chillhop、Jazz、Classical、Hip-Hop、Ambient 等多种风格 |
| **Bilibili 直播源** | 支持 Lofi Girl B站直播流，支持 FLV/HLS 自动兜底 |
| **全球流媒体来源** | 集成 Lofi Cafe、SomaFM、Code Radio、Swiss Classic 等多来源 |
| **智能切换** | 一键切换电台，自动播放无缝衔接 |

### 🎨 界面设计

| 功能 | 描述 |
|------|------|
| **灵动岛播放器** | macOS 风格灵动岛设计，可自由拖动到屏幕任意位置 |
| **玻璃拟态效果** | 高斯模糊 + 透明度，精致美观 |
| **黑胶唱片动画** | 精美的黑胶唱片旋转动画，播放时自动旋转 |
| **暗色/亮色主题** | 支持一键切换，自动跟随系统主题 |
| **响应式设计** | 完美适配桌面端和移动端 |

### ⌨️ 快捷键支持

| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放 / 暂停 |
| `←` | 上一首 |
| `→` | 下一首 |
| `M` | 静音 / 取消静音 |
| `T` | 切换主题（暗色/亮色） |

### 📊 专注计时

- 记录每日专注时长（仅在播放时计时）
- 帮助培养高效工作习惯
- 数据本地存储，每日自动重置

### 🌙 睡眠定时

- 支持 15/30/45/60/90/120 分钟快速设置
- 支持 1~480 分钟自定义时长
- 定时结束后自动暂停播放
- 睡眠定时状态支持本地持久化

---

## 📻 电台列表（共 21 个）

### 学习（3）

| 电台 | 风格标签 | 说明 |
|------|---------|------|
| **Lofi Girl** | Lofi / Chill | B站直播源，国内访问友好 |
| **Lofi Box** | Lofi / Chill | 经典 Lofi 流 |
| **Lofi Studying** | Lofi / Study | 学习向场景电台 |

### 编程（2）

| 电台 | 风格标签 | 说明 |
|------|---------|------|
| **Groove Salad** | Chill / Ambient | 长时间编码友好 |
| **Code Radio** | Lofi / Coding | freeCodeCamp 编程电台 |

### 阅读（4）

| 电台 | 风格标签 | 说明 |
|------|---------|------|
| **Chill Sky** | Chill / Electro | 轻电子氛围 |
| **Lofi Japanese** | Japanese / Lofi | 日系 Lofi 氛围 |
| **Jazz Box** | Jazz / Smooth | 柔和爵士流 |
| **B3cks Radio** | Lofi / Relax | 放松导向 Lofi |

### 放松（3）

| 电台 | 风格标签 | 说明 |
|------|---------|------|
| **Chill Wave** | Chill / Electro | 氛围电子 |
| **Lofi Chilling** | Lofi / Chill | 低压陪伴型背景音 |
| **Paradise** | Chill / Alt | 多元轻松风格 |

### 助眠（4）

| 电台 | 风格标签 | 说明 |
|------|---------|------|
| **Rain Sounds** | Ambient / Nature | 白噪音与自然声 |
| **Lofi Sleeping** | Lofi / Sleep | 睡前低刺激流 |
| **Drone Zone** | Ambient / Deep | 深层氛围音墙 |
| **ASP** | Ambient / Sleep | 极简助眠氛围 |

### 专注（1）

| 电台 | 风格标签 | 说明 |
|------|---------|------|
| **Swiss Classic** | Classical / Symphony | 古典交响专注场景 |

### 其他（4）

| 电台 | 风格标签 | 场景 |
|------|---------|------|
| **Jazz Groove** | Jazz / Groove | 写作 |
| **Jazz Smooth** | Jazz / Mellow | 办公 |
| **Rap Beats** | Hip-Hop / Beats | 运动 |
| **Lofi Gaming** | Lofi / Gaming | 娱乐 |

---

## 🛠️ 技术栈

| 技术 | 描述 |
|------|------|
| [Next.js 16](https://nextjs.org/) | React 全栈框架，App Router |
| [React 19](https://react.dev/) | 用户界面库 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Tailwind CSS v4](https://tailwindcss.com/) | 原子化 CSS |
| [Framer Motion](https://www.framer.com/motion/) | 动画库 |
| [Zustand](https://zustand-demo.pmnd.rs/) | 轻量级状态管理 |
| [HLS.js](https://hlsjs.org/) | HLS 流媒体播放 |
| [flv.js](https://github.com/bilibili/flv.js) | B站 FLV 直播流播放 |
| [Lucide Icons](https://lucide.dev/) | 图标库 |

---

## 🚀 快速开始

### 环境要求

- Node.js 20.9 或更高版本（Next.js 16 要求）
- npm、yarn、pnpm 或 bun

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/88lin/lofi-radio-web.git
cd lofi-radio-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 http://localhost:3000

### 构建生产版本

```bash
# 构建
npm run build

# 启动生产服务器
npm run start
```

---

## 📦 部署指南

> 📌 **首先，Fork 本仓库到你自己的 GitHub 账号下。**
>
> 1. 访问 [lofi-radio-web](https://github.com/88lin/lofi-radio-web) 仓库主页
> 2. 点击右上角的 **Fork** 按钮
> 3. 等待 Fork 完成，你将在自己的 GitHub 账号下看到 `lofi-radio-web` 仓库的副本
>
> 以下所有部署方式都将基于你 Fork 的仓库进行操作。

### 部署到 Vercel（推荐）

[Vercel](https://vercel.com) 是 Next.js 的官方部署平台，部署最简单：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/88lin/lofi-radio-web)

1. 点击上方按钮，或访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 导入你 Fork 的 `lofi-radio-web` 仓库
3. Vercel 会自动检测 Next.js 并配置构建设置
4. 点击 "Deploy" 即可完成部署

### 部署到 Cloudflare Pages（不推荐）

[Cloudflare Pages](https://pages.cloudflare.com) 在本项目的 Bilibili 直播解析场景下稳定性较差，当前更建议直接部署到 Vercel。

> ⚠️ **说明**: 这一方案当前没有继续维护。尤其是 `src/app/api/bilibili-stream` 这类依赖 Node.js 服务端请求上游的接口，在 Cloudflare Pages 上容易出现不稳定或上游拦截。
>
> 如果你一定要继续使用 Cloudflare，更建议把前端静态页面和 Bilibili 解析 API 拆开部署，而不是整站直接沿用当前配置。

### 部署到 Netlify

[Netlify](https://www.netlify.com) 也是优秀的托管平台：

1. 登录 [Netlify](https://app.netlify.com)
2. 点击 "Add new site" > "Import an existing project"
3. 选择 GitHub 并授权
4. 选择你 Fork 的 `lofi-radio-web` 仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. 点击 "Deploy site"

### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
COPY --from=builder /app/next.config.ts ./next.config.ts
CMD ["npm", "run", "start"]
```

```bash
# 构建镜像
docker build -t lofi-radio-web .

# 运行容器
docker run -p 3000:3000 lofi-radio-web
```

---

## 📁 项目结构

```
lofi-radio-web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx             # 首页
│   │   ├── layout.tsx           # 根布局
│   │   ├── globals.css          # 全局样式
│   │   ├── robots.ts            # robots.txt 路由
│   │   ├── sitemap.ts           # sitemap.xml 路由
│   │   └── api/                 # API 路由
│   │       ├── bilibili-stream/ # B站直播流解析
│   │       └── stations/        # 电台同步 API
│   ├── components/              # 组件
│   │   ├── lofi/                # Lofi 相关组件
│   │   │   └── floating-player.tsx  # 浮动播放器
│   │   ├── ui/                  # UI 基础组件
│   │   └── theme-provider.tsx   # 主题提供者
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useAudioPlayer.ts    # 音频播放逻辑
│   │   ├── useFocusTimer.ts     # 专注计时
│   │   ├── useSleepTimer.ts     # 睡眠定时
│   │   └── use-toast.ts         # Toast 提示
│   ├── lib/                     # 工具库
│   │   ├── stations.ts          # 电台配置
│   │   ├── seo.ts               # SEO 配置与 metadata/schema 构建
│   │   ├── seo-content.ts       # FAQ 等 SEO 文案内容
│   │   └── utils.ts             # 工具函数
│   └── store/                   # 状态管理
│       └── audioStore.ts        # 音频状态
├── public/                      # 静态资源
│   ├── logo.svg                 # Logo
│   └── manifest.json            # PWA 配置
├── scripts/                     # 构建辅助脚本
│   └── submit-indexnow.ts       # 手动提交 IndexNow
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── LICENSE
```

---

## 🔄 电台资源维护

本项目电台资源采用「基础源 + 人工精选扩展」策略：

- 基础参考来源： [labilio/lofi-radio](https://github.com/labilio/lofi-radio/blob/main/stations.json)
- 扩展来源：Lofi Cafe、SomaFM、Code Radio 及其他公开流媒体电台

更新方式：

1. 评估新电台源的可用性与稳定性
2. 更新 `src/lib/stations.ts` 中的 `stations` 数组
3. 同步更新 README 的电台列表与总数
4. 提交更改

### SEO 相关文件

- `src/lib/seo.ts`：集中管理 metadata、Open Graph、Twitter、Schema、robots 和 sitemap 配置
- `src/lib/seo-content.ts`：管理首页 FAQ 等 SEO 可见文案内容
- `src/app/robots.ts`：生成 `/robots.txt`
- `src/app/sitemap.ts`：生成 `/sitemap.xml`

---

## 🤝 贡献指南

欢迎所有形式的贡献！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 开源协议 (License)

本项目采用 [MIT License](LICENSE) 开源协议。

- ✅ 你可以自由地使用、复制、修改和分发本项目。
- 📝 请在衍生作品中保留原作者的版权声明。

---

## 🙏 致谢

- [labilio/lofi-radio](https://github.com/labilio/lofi-radio) - 提供了丰富的电台资源和创作灵感
- [Lofi Girl](https://www.youtube.com/c/LofiGirl) - 提供优质的 Lofi 音乐直播
- 所有电台提供商

---

## 📮 联系方式

如有问题或建议，欢迎：

- [💬 Discussions](https://github.com/88lin/lofi-radio-web/discussions) - 参与讨论
- [🐛 提交 Issue](https://github.com/88lin/lofi-radio-web/issues) - 报告问题
- [📝 博客](https://blog.88lin.eu.org/) - 茉灵智库

---
## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=88lin/lofi-radio-web&type=date&legend=top-left)](https://www.star-history.com/#88lin/lofi-radio-web&type=date&legend=top-left)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！**

Made with ❤️ by [茉灵智库](https://blog.88lin.eu.org/) · [GitHub](https://github.com/88lin)

</div>
