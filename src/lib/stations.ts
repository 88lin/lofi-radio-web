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
    // Replaces the former "Chill Sky" (https://chill.radioca.st/stream), which
    // has been returning 502 Bad Gateway + text/html for some time. SomaFM's
    // Beat Blender fills the same downtempo/electronic slot, sends
    // `Access-Control-Allow-Origin: *`, and exposes a now-playing feed.
    id: 'beat-blender',
    name: 'Beat Blender',
    scene: '阅读',
    type: 'mp3',
    url: 'https://ice1.somafm.com/beatblender-128-mp3',
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

// 按场景分类
/**
 * Scenes that get their own filter chip. Anything else lands in 其他, so adding
 * a station with a new scene never makes it unreachable in the UI.
 */
export const MAIN_SCENES = ['学习', '编程', '阅读', '放松', '助眠', '专注'] as const;

export interface Category {
  id: string;
  name: string;
  count: number;
}

/**
 * Scene filter over an arbitrary catalogue, so user-added stations participate
 * in exactly the same filtering as the built-in ones.
 */
export function filterByScene(list: Station[], scene: string): Station[] {
  if (scene === 'all') return list;
  if (scene === '其他') {
    return list.filter(s => !(MAIN_SCENES as readonly string[]).includes(s.scene));
  }
  return list.filter(s => s.scene === scene);
}

/** Chip list with live counts for the given catalogue. */
export function buildCategories(list: Station[]): Category[] {
  return [
    { id: 'all', name: '全部', count: list.length },
    ...MAIN_SCENES.map(scene => ({
      id: scene,
      name: scene,
      count: list.filter(s => s.scene === scene).length,
    })),
    { id: '其他', name: '其他', count: filterByScene(list, '其他').length },
  ];
}

/** Built-in catalogue only; kept for callers that render before hydration. */
export const categories: Category[] = buildCategories(stations);

export function getFilteredStations(scene: string): Station[] {
  return filterByScene(stations, scene);
}

export function getStationsByScene(scene: string): Station[] {
  return stations.filter(s => s.scene === scene);
}

export function getStationById(id: string): Station | undefined {
  return stations.find(s => s.id === id);
}

/** Distinct style tags across a catalogue, for the style filter row. */
export function collectStyles(list: Station[]): string[] {
  const seen = new Set<string>();
  for (const s of list) {
    if (s.style1) seen.add(s.style1);
    if (s.style2) seen.add(s.style2);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}
