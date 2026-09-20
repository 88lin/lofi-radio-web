/**
 * 内容区块的强调色板。
 *
 * 配色取自站主自己的博客（blog.88lin.eu.org）的标签样式，那是已经验证过的审美基准。
 *
 * 三条硬约束，改之前先读：
 *
 * 1. **实色，不要 alpha 叠加。** 卡片底色必须是 `surface` 这样的实色浅色值。
 *    早先用的是 `${色值}1f` 这类半透明叠加——饱和色压在带光晕的非白背景上会发灰发脏，
 *    这是「颜色难看」的真正来源，不是色相选错。
 * 2. **不要渐变。** 卡片是实色块。渐变留给页面级的环境光，不要下放到卡片。
 * 3. **浅底配同色系深字。** `surface` + `text` 是成对的，别跨色系搭。
 */
export interface Accent {
  key: string;
  /** 亮色模式卡片底：实色浅色 */
  surface: string;
  /** 亮色模式卡片描边 */
  border: string;
  /** 亮色模式文字色，与 surface 的对比度已逐一核到 ≥4.5:1 */
  text: string;
  /** 暗色模式卡片底 */
  surfaceDark: string;
  /** 暗色模式卡片描边 */
  borderDark: string;
  /** 暗色模式文字色 */
  textDark: string;
  /** 实心徽章、色点用的饱和原色 */
  solid: string;
}

export const accents = {
  pink: {
    key: "pink",
    surface: "#FFE3F1", border: "#FBC7E0", text: "#BE185D",
    surfaceDark: "#33132A", borderDark: "#5C2447", textDark: "#FBCFE8",
    solid: "#EC4899",
  },
  violet: {
    key: "violet",
    surface: "#EAE2FF", border: "#DBCEFF", text: "#6D28D9",
    surfaceDark: "#241C42", borderDark: "#3F3272", textDark: "#DDD6FE",
    solid: "#8B5CF6",
  },
  blue: {
    key: "blue",
    surface: "#EBF4FF", border: "#D5E6FF", text: "#1D4ED8",
    surfaceDark: "#12213F", borderDark: "#1E3A6B", textDark: "#BFDBFE",
    solid: "#3B82F6",
  },
  rose: {
    key: "rose",
    surface: "#FFE4E8", border: "#FECDD3", text: "#BE123C",
    surfaceDark: "#351520", borderDark: "#61263A", textDark: "#FECDD3",
    solid: "#F43F5E",
  },
  /** 提示 / 注意类信息专用，不进 accentCycle——它表意，不参与「一组互相区分的颜色」。 */
  note: {
    key: "note",
    surface: "#FFF4DB", border: "#FBE3AE", text: "#92400E",
    surfaceDark: "#2E2210", borderDark: "#5A431C", textDark: "#FDE68A",
    solid: "#F59E0B",
  },
} as const satisfies Record<string, Accent>;

/** 站内主强调色：链接、当前项、主按钮。 */
export const primaryAccent = accents.pink;

/** 需要「一组互相区分的颜色」时按顺序取，例如四条筛选标准、四个步骤。 */
export const accentCycle: Accent[] = [
  accents.pink,
  accents.violet,
  accents.blue,
  accents.rose,
];

export function accentAt(index: number): Accent {
  return accentCycle[index % accentCycle.length];
}

function parse(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return toHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
}

/**
 * 从任意色值算出实色浅底 / 实色深底。
 *
 * 21 个电台色是数据，没法为每个手挑一组浅底深字，所以按同一条规则混出来。
 * 关键仍然是「混成实色」而不是给原色加透明度——理由见文件头第 1 条。
 */
export function tintSurface(hex: string): string {
  return mix(hex, "#FFFFFF", 0.87);
}

export function tintBorder(hex: string): string {
  return mix(hex, "#FFFFFF", 0.7);
}

export function shadeSurface(hex: string): string {
  return mix(hex, "#0A0A0C", 0.84);
}

export function shadeBorder(hex: string): string {
  return mix(hex, "#0A0A0C", 0.62);
}
