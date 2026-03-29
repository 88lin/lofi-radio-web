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
    style1: 'Lo-fi',
    style2: 'Chill',
    custom: 'B站直播',
    color: '#8B5CF6'
  },
  {
    id: 'lofi-box',
    name: 'Lofi Box',
    scene: '学习',
    type: 'mp3',
    url: 'https://boxradio-edge-00.streamafrica.net/lofi',
    style1: 'Lo-fi',
    style2: 'Chill',
    custom: '高性能',
    color: '#A78BFA'
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
    id: 'chill-sky',
    name: 'Chill Sky',
    scene: '阅读',
    type: 'mp3',
    url: 'http://chill.radioca.st/stream',
    style1: 'Chill',
    style2: 'Electro',
    color: '#06B6D4'
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
    id: 'asp',
    name: 'ASP',
    scene: '助眠',
    type: 'mp3',
    url: 'http://radio.stereoscenic.com/asp-s',
    style1: 'Ambient',
    style2: 'Sleep',
    color: '#6366F1'
  },
  {
    id: 'drone-zone',
    name: 'Drone Zone',
    scene: '助眠',
    type: 'mp3',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    style1: 'Ambient',
    style2: 'Deep',
    color: '#64748B'
  },
  {
    id: 'swiss-classic',
    name: 'Swiss Classic',
    scene: '专注',
    type: 'mp3',
    url: 'http://stream.srg-ssr.ch/m/rsc_de/mp3_128',
    style1: 'Classical',
    style2: 'Symphony',
    color: '#84CC16'
  },
  {
    id: 'bbc-3',
    name: 'BBC 3',
    scene: '专注',
    type: 'm3u8',
    url: 'http://as-hls-ww-live.akamaized.net/pool_904/live/ww/bbc_radio_three/bbc_radio_three.isml/bbc_radio_three-audio=320000.m3u8',
    style1: 'Classical',
    style2: 'Arts',
    color: '#EF4444'
  },
  {
    id: 'jazz-groove',
    name: 'Jazz Groove',
    scene: '写作',
    type: 'mp3',
    url: 'http://west-mp3-128.streamthejazzgroove.com/stream',
    style1: 'Jazz',
    style2: 'Groove',
    color: '#F97316'
  },
  {
    id: 'jazz-smooth',
    name: 'Jazz Smooth',
    scene: '办公',
    type: 'mp3',
    url: 'http://smoothjazz.cdnstream1.com/2585_128.mp3',
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
    id: 'kexp',
    name: 'KEXP',
    scene: '娱乐',
    type: 'mp3',
    url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3',
    style1: 'Indie',
    style2: 'Alt',
    color: '#22C55E'
  }
];

// 按场景分类
export const categories = [
  { id: 'all', name: '全部', count: stations.length },
  { id: '学习', name: '学习', count: stations.filter(s => s.scene === '学习').length },
  { id: '编程', name: '编程', count: stations.filter(s => s.scene === '编程').length },
  { id: '阅读', name: '阅读', count: stations.filter(s => s.scene === '阅读').length },
  { id: '放松', name: '放松', count: stations.filter(s => s.scene === '放松').length },
  { id: '助眠', name: '助眠', count: stations.filter(s => s.scene === '助眠').length },
  { id: '专注', name: '专注', count: stations.filter(s => s.scene === '专注').length },
  { id: '其他', name: '其他', count: stations.filter(s => !['学习', '编程', '阅读', '放松', '助眠', '专注'].includes(s.scene)).length },
];

export function getFilteredStations(scene: string): Station[] {
  if (scene === 'all') return stations;
  if (scene === '其他') {
    return stations.filter(s => !['学习', '编程', '阅读', '放松', '助眠', '专注'].includes(s.scene));
  }
  return stations.filter(s => s.scene === scene);
}

export function getStationsByScene(scene: string): Station[] {
  return stations.filter(s => s.scene === scene);
}

export function getStationById(id: string): Station | undefined {
  return stations.find(s => s.id === id);
}
