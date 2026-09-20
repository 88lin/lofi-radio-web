export interface Station {
  id: string;
  name: string;
  scene: string;
  type: 'mp3' | 'm3u8' | 'bilibili';
  url: string;
  style1: string;
  style2: string;
  description?: string;
  custom?: string;
  color: string;
}

export const stations: Station[] = [
  {
    id: 'lofi-girl',
    name: 'Lofi Girl',
    scene: '学习',
    type: 'bilibili',
    url: 'https://live.bilibili.com/27519423',
    style1: 'Lofi',
    style2: 'Chill',
    // custom: 'B站',
    color: '#8B5CF6'
  },
  {
    id: 'lofi-box',
    name: 'Lofi Box',
    scene: '学习',
    type: 'mp3',
    url: 'https://boxradio-edge-00.streamafrica.net/lofi',
    style1: 'Lofi',
    style2: 'Chill',
    // custom: '高性能',
    color: '#A78BFA'
  },
  {
    id: 'lofi-cafe-studying',
    name: 'Lofi Studying',
    scene: '学习',
    type: 'mp3',
    url: 'https://radio.loficafe.net/listen/studying/radio.mp3',
    style1: 'Lofi',
    style2: 'Study',
    color: '#3B82F6'
  },
  {
    id: 'chill-sky',
    name: 'Chill Sky',
    scene: '阅读',
    type: 'mp3',
    url: 'https://chill.radioca.st/stream',
    style1: 'Chill',
    style2: 'Electro',
    color: '#06B6D4'
  },
  {
    id: 'lofi-cafe-japanese',
    name: 'Lofi Japanese',
    scene: '阅读',
    type: 'mp3',
    url: 'https://radio.loficafe.net/listen/japanese-lofi/radio.mp3',
    style1: 'Japanese',
    style2: 'Lofi',
    color: '#F472B6'
  },
  {
    id: 'jazz-box',
    name: 'Jazz Box',
    scene: '阅读',
    type: 'mp3',
    url: 'https://boxradio-edge-01.streamafrica.net/jazz',
    style1: 'Jazz',
    style2: 'Smooth',
    color: '#D946EF'
  },
  {
    id: 'b3cks-radio',
    name: 'B3cks Radio',
    scene: '阅读',
    type: 'mp3',
    url: 'https://radio.b3ck.com/listen/b3cks-radio/radio.mp3',
    style1: 'Lofi',
    style2: 'Relax',
    color: '#ff7096'
  },
  {
    id: 'chill-wave',
    name: 'Chill Wave',
    scene: '放松',
    type: 'mp3',
    url: 'https://boxradio-edge-00.streamafrica.net/chillwave',
    style1: 'Chill',
    style2: 'Electro',
    color: '#EC4899'
  },
   {
    id: 'lofi-cafe-chilling',
    name: 'Lofi Chilling',
    scene: '放松',
    type: 'mp3',
    url: 'https://radio.loficafe.net/listen/chilling/radio.mp3',
    style1: 'Lofi',
    style2: 'Chill',
    color: '#f65c71'
  },
  {
    id: 'paradise',
    name: 'Paradise',
    scene: '放松',
    type: 'mp3',
    url: 'https://stream.radioparadise.com/mellow-128',
    style1: 'Chill',
    style2: 'Alt',
    color: '#F59E0B'
  },
  {
    id: 'groove-salad',
    name: 'Groove Salad',
    scene: '编程',
    type: 'mp3',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    style1: 'Chill',
    style2: 'Ambient',
    color: '#10B981'
  },
  {
    id: 'freecodecamp-coderadio',
    name: 'Code Radio',
    scene: '编程',
    type: 'mp3',
    url: 'https://coderadio-admin-v2.freecodecamp.org/listen/coderadio/radio.mp3',
    style1: 'Lofi',
    style2: 'Coding',
    color: '#9050b3'
  },
  {
    id: 'rain-sounds',
    name: 'Rain Sounds',
    scene: '助眠',
    type: 'mp3',
    url: 'https://boxradio-edge-01.streamafrica.net/rain',
    style1: 'Ambient',
    style2: 'Nature',
    color: '#0EA5E9'
  },
  {
    id: 'lofi-cafe-sleeping',
    name: 'Lofi Sleeping',
    scene: '助眠',
    type: 'mp3',
    url: 'https://radio.loficafe.net/listen/sleeping/radio.mp3',
    style1: 'Lofi',
    style2: 'Sleep',
    color: '#498eef'
  },
  {
    id: 'drone-zone',
    name: 'Drone Zone',
    scene: '助眠',
    type: 'mp3',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    style1: 'Ambient',
    style2: 'Deep',
    color: '#743bed'
  },
  {
    id: 'asp',
    name: 'ASP',
    scene: '助眠',
    type: 'mp3',
    url: 'https://radio.stereoscenic.com/asp-s',
    style1: 'Ambient',
    style2: 'Sleep',
    color: '#6366F1'
  },
  {
    id: 'swiss-classic',
    name: 'Swiss Classic',
    scene: '专注',
    type: 'mp3',
    url: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
    style1: 'Classical',
    style2: 'Symphony',
    color: '#84CC16'
  },
  {
    id: 'jazz-groove',
    name: 'Jazz Groove',
    scene: '写作',
    type: 'mp3',
    url: 'https://west-mp3-128.streamthejazzgroove.com/stream',
    style1: 'Jazz',
    style2: 'Groove',
    color: '#F97316'
  },
  {
    id: 'jazz-smooth',
    name: 'Jazz Smooth',
    scene: '办公',
    type: 'mp3',
    url: 'https://smoothjazz.cdnstream1.com/2585_128.mp3',
    style1: 'Jazz',
    style2: 'Mellow',
    color: '#A855F7'
  },
  {
    id: 'rap',
    name: 'Rap Beats',
    scene: '运动',
    type: 'mp3',
    url: 'https://boxradio-edge-00.streamafrica.net/rap',
    style1: 'Hip-Hop',
    style2: 'Beats',
    color: '#F43F5E'
  },
  {
    id: 'lofi-cafe-gaming',
    name: 'Lofi Gaming',
    scene: '娱乐',
    type: 'mp3',
    url: 'https://radio.loficafe.net/listen/gaming/radio.mp3',
    style1: 'Lofi',
    style2: 'Gaming',
    color: '#22C55E'
  }
];

const PRIMARY_SCENES = ['学习', '编程', '阅读', '放松', '助眠', '专注'] as const;

function countByScene(scene: string): number {
  return stations.filter((s) => s.scene === scene).length;
}

function countOtherScenes(): number {
  return stations.filter((s) => !PRIMARY_SCENES.includes(s.scene as (typeof PRIMARY_SCENES)[number])).length;
}

// 播放器分类条：主场景单独列出，写作 / 办公 / 运动 / 娱乐并入「其他」，避免小屏挤成两行。
export const categories = [
  { id: 'all', name: '全部', count: stations.length },
  { id: '学习', name: '学习', count: countByScene('学习') },
  { id: '编程', name: '编程', count: countByScene('编程') },
  { id: '阅读', name: '阅读', count: countByScene('阅读') },
  { id: '放松', name: '放松', count: countByScene('放松') },
  { id: '助眠', name: '助眠', count: countByScene('助眠') },
  { id: '专注', name: '专注', count: countByScene('专注') },
  { id: '其他', name: '其他', count: countOtherScenes() },
];

/** 场景名 → URL 锚点 slug。中文锚点在部分抓取器与分享场景里不可靠，统一用 ASCII slug。 */
export const sceneSlugs: Record<string, string> = {
  学习: "study",
  编程: "coding",
  阅读: "reading",
  放松: "relax",
  助眠: "sleep",
  专注: "focus",
  写作: "writing",
  办公: "office",
  运动: "workout",
  娱乐: "gaming",
};

export function getSceneSlug(scene: string): string {
  return sceneSlugs[scene] ?? "other";
}

/** 站点实际出现过的全部场景，按电台数量从多到少排序，用于生成目录页与 sitemap。 */
export function getSceneList(): { scene: string; slug: string; count: number }[] {
  const counters = new Map<string, number>();
  for (const station of stations) {
    counters.set(station.scene, (counters.get(station.scene) ?? 0) + 1);
  }
  return [...counters.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([scene, count]) => ({ scene, slug: getSceneSlug(scene), count }));
}

export function getFilteredStations(scene: string): Station[] {
  if (scene === 'all') return stations;
  if (scene === '其他') {
    return stations.filter((s) => !PRIMARY_SCENES.includes(s.scene as (typeof PRIMARY_SCENES)[number]));
  }
  return stations.filter((s) => s.scene === scene);
}

export function getStationsByScene(scene: string): Station[] {
  return stations.filter(s => s.scene === scene);
}

/**
 * 首页「精选电台」用的抽样：每个场景取第一个，按场景在数组里首次出现的顺序。
 *
 * 首页不再铺满全部电台——21 张卡片把首屏拉得很长，而完整清单在 /stations
 * （带风格 / 场景 / 音源类型）、JSON-LD 的 ItemList 与 llms.txt 里都是全量的，
 * 浮动播放器也能按分类浏览到每一个，所以这里只负责给出覆盖面。
 */
export function getFeaturedStations(limit = 8): Station[] {
  const picked = new Map<string, Station>();
  for (const station of stations) {
    if (!picked.has(station.scene)) picked.set(station.scene, station);
    if (picked.size === limit) break;
  }
  return [...picked.values()];
}

/**
 * 场景色 = 该场景第一个电台的颜色。
 *
 * 派生而不是另写一张映射表：加电台、改配色时不会出现「场景是紫色、
 * 里面的电台全是青色」这种对不上的情况。
 *
 * 只用于填充与浅色底（`${color}18` 这类），不要直接当浅色背景上的文字色——
 * 数据里有 #84CC16、#22C55E 这种亮色，作为正文色对比度不过关。
 */
export function getSceneColor(scene: string): string {
  return stations.find((s) => s.scene === scene)?.color ?? '#8B5CF6';
}

export function getStationById(id: string): Station | undefined {
  return stations.find(s => s.id === id);
}
