# 贡献指南

感谢你愿意为 `lofi-radio-web` 做贡献。这个项目目前主要由维护者个人维护，因此最重要的不是“多提”，而是“提得清楚、改得聚焦、信息完整”。

## 先选对入口

- 使用问题、开放讨论、不确定是否是 Bug：优先发到 [Discussions](https://github.com/88lin/lofi-radio-web/discussions)
- 明确可复现的问题：使用 `Bug 反馈`
- 新功能或交互优化建议：使用 `功能建议`
- 安装、构建、部署、环境变量问题：使用 `部署 / 环境问题`
- 电台源补充、失效源修复、README / 文案更新：使用 `电台源补充 / 内容维护`

仓库已禁用空白 Issue。请按模板提交，模板中的必填项就是排查和评估所需的最小信息集。

## 提 Issue 之前

- 先搜索现有 Issue 和 Discussions，避免重复
- 先阅读 [README](./README.md)，特别是部署说明和已知结构
- 如果问题与线上部署有关，请尽量附：
  - 公开可访问的部署地址
  - 平台信息（Vercel / Netlify / Docker / 自托管等）
  - Node.js 版本
  - 关键日志或报错截图
- 如果问题与播放器或取流有关，请尽量附：
  - 哪个电台或流地址有问题
  - 实际行为与预期行为
  - 浏览器、系统、复现步骤

## 提 PR 之前

建议先看是否已有相关 Issue；如果是较大的功能改动，先在 Issue 或 Discussions 中对齐方向，再开始实现。

### 基本要求

- 一次 PR 只解决一个明确问题
- 不要顺手夹带无关重构、批量格式化或风格改动
- UI 变更请附截图或录屏
- 行为变化、配置变化、文档变化要同步写清楚
- 如果你的 PR 依赖某个上下文，请在 PR 描述里直接贴关联 Issue / Discussion

### 建议流程

1. Fork 仓库
2. 新建分支，例如：
   - `fix/player-buffering`
   - `feat/sleep-timer-shortcuts`
   - `docs/contributing-guide`
3. 完成修改并自测
4. 推送分支并发起 Pull Request

### Commit 命名建议

仓库当前倾向使用简洁的 Conventional Commits 风格，例如：

- `fix(player): handle stale manifest response`
- `feat(ui): add compact control bar`
- `docs(readme): clarify deployment notes`
- `chore(github): add issue forms and stale cleanup`

不强制完全一致，但请让提交信息可读、可搜索、能表达变更意图。

## 本地开发与自检

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

### 提交前最少检查

```bash
npm run lint
npm run build
```

如果你的改动会影响以下内容，请额外做针对性验证：

- 播放器 / 取流：至少验证实际播放、切台、错误回退是否正常
- 部署相关：至少在本地构建一次，并确认依赖的环境变量说明完整
- 电台源维护：确认链接可访问、可持续、可公开引用
- README / 文案：确认相关数字、链接和描述没有同步遗漏

播放器的暂停、切台和加载取消另有浏览器回归脚本。安装 Python Playwright 和 Chromium 后，在一个终端运行 `npm run build`、`npm run start -- -p 3100`，另一个终端运行：

```bash
python tests/browser/playback-lifecycle.py http://127.0.0.1:3100
```

脚本使用隔离的浏览器上下文及模拟音源，不依赖 B 站或 CDN 可用性；真实直播播放和回退仍需另外验证。

## 电台源与内容维护

如果你的改动涉及电台资源，请优先保证这些信息明确：

- 来源公开且稳定
- 流地址可以实际播放
- 变更理由清楚，例如新增、替换、下线、修复失效
- 如影响 README 中的电台数量或列表，请同步更新

仓库当前采用“基础源 + 人工精选扩展”的维护方式，因此内容贡献不只看“能不能用”，也会看来源质量、长期稳定性和整体一致性。

## Review 与自动维护

- 新 Issue 可能会收到自动回复，用于提醒补充信息
- 长时间没有活动的 Issue / PR 会被自动标记为 `stale`
- 如果一个 `stale` 线程仍然有效，只需要回复最新状态，它就不应该被静默遗忘

## 什么样的 PR 更容易被合并

- 改动范围小而明确
- 描述清楚为什么改，不只是改了什么
- 自测信息完整
- 没有引入无关改动
- 能照顾现有部署和陌生贡献者的理解成本
