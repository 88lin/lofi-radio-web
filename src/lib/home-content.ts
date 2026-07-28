import { Moon, Radio, Sparkles, Waves } from 'lucide-react';
import { stations } from '@/lib/stations';

/**
 * Static copy for the marketing sections. Extracted out of page.tsx so the
 * section components stay presentational and the copy stays reviewable in one
 * place (it is also the text search engines index, so it should not be buried
 * inside JSX).
 */

export interface HomeFeature {
  icon: typeof Radio;
  title: string;
  description: string;
  /** Hue used for the icon chip and hover wash. */
  color: string;
}

export const features: HomeFeature[] = [
  {
    icon: Radio,
    title: `${stations.length} 精选电台`,
    description:
      '涵盖 Lo-Fi、Chill、Jazz、Classical 等多种音乐风格，适合学习、工作、阅读、放松等各种场景',
    color: '#8B5CF6',
  },
  {
    icon: Sparkles,
    title: '专注计时',
    description:
      '番茄钟、每日专注时长与近 7 天趋势，帮助你培养高效工作习惯，让音乐陪伴你的专注时光',
    color: '#EC4899',
  },
  {
    icon: Waves,
    title: '在线收听',
    description:
      '无需下载安装，打开网页即可享受高品质音乐；灵动岛支持拖动，移动端双击可快速展开，支持快捷键、⌘K 搜索与 PWA 离线访问',
    color: '#06B6D4',
  },
  {
    icon: Moon,
    title: '睡眠定时',
    description:
      '支持 15~120 分钟快速设置定时、1~480 分钟自定义定时，定时结束后自动淡出暂停，安心入眠无需手动关闭',
    color: '#F59E0B',
  },
];

export interface HomeScene {
  /** Must match a `Station.scene` value so the card can filter the catalogue. */
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

export const scenes: HomeScene[] = [
  { id: '学习', icon: '📚', title: '学习', description: 'Lo-fi 音乐帮助你集中注意力', color: '#8B5CF6' },
  { id: '编程', icon: '💻', title: '编程', description: '氛围音乐激发创作灵感', color: '#06B6D4' },
  { id: '阅读', icon: '📖', title: '阅读', description: '轻柔爵士陪伴你的阅读时光', color: '#10B981' },
  { id: '助眠', icon: '🌙', title: '助眠', description: '自然白噪音帮助你入眠', color: '#F59E0B' },
];

export interface ShortcutHint {
  key: string;
  label: string;
}

/** Hero strip: the seven bindings worth advertising above the fold. */
export const shortcuts: ShortcutHint[] = [
  { key: 'Space', label: '播放 / 暂停' },
  { key: '←', label: '上一首' },
  { key: '→', label: '下一首' },
  { key: 'M', label: '静音' },
  { key: 'F', label: '收藏' },
  { key: '⌘K', label: '搜索电台' },
  { key: '?', label: '全部快捷键' },
];

export interface ShortcutGroup {
  title: string;
  items: ShortcutHint[];
}

/**
 * Complete reference shown by the `?` overlay. Must stay in sync with the
 * bindings in `hooks/useKeyboardShortcuts.ts` — that file is the single source
 * of truth for behaviour, this one only describes it.
 */
export const shortcutGroups: ShortcutGroup[] = [
  {
    title: '播放',
    items: [
      { key: 'Space', label: '播放 / 暂停' },
      { key: '←', label: '上一个电台' },
      { key: '→', label: '下一个电台' },
      { key: '↑', label: '音量 +5%' },
      { key: '↓', label: '音量 -5%' },
      { key: 'M', label: '静音 / 取消静音' },
    ],
  },
  {
    title: '界面',
    items: [
      { key: '⌘K / Ctrl K', label: '搜索电台' },
      { key: 'L', label: '展开 / 收起播放器' },
      { key: 'F', label: '收藏当前电台' },
      { key: 'T', label: '切换亮暗主题' },
    ],
  },
  {
    title: '其他',
    items: [
      { key: '?', label: '显示 / 隐藏本帮助' },
      { key: 'Esc', label: '关闭弹层' },
    ],
  },
];
