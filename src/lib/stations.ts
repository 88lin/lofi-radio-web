export interface Station {
  id: string;
  name: string;
  category: string;
  type: 'mp3' | 'm3u8' | 'bilibili';
  url: string;
  style1: string;
  style2: string;
  scene: string;
  custom?: string;
  color: string;
}

export const stations: Station[] = [
  {
    id: 'lofi-girl',
    name: 'Lofi Girl',
    category: 'Lo-Fi',
    type: 'bilibili',
    url: 'https://live.bilibili.com/27519423?live_from=84001&spm_id_from=333.337.0.0',
    style1: 'Lo-fi',
    style2: 'Chill',
    scene: '学习',
    custom: '最稳定',
    color: '#8B5CF6'
  },
  {
    id: 'lofi-box',
    name: 'Lofi Box',
    category: 'Lo-Fi',
    type: 'mp3',
    url: 'https://boxradio-edge-00.streamafrica.net/lofi',
    style1: 'Lo-fi',
    style2: 'Chill',
    scene: '学习',
    custom: '高性能',
    color: '#A78BFA'
  },
  {
    id: 'chill-sky',
    name: 'Chill Sky',
    category: 'Chill',
    type: 'mp3',
    url: 'http://chill.radioca.st/stream',
    style1: 'Chill',
    style2: 'Electro',
    scene: '阅读',
    color: '#06B6D4'
  },
  {
    id: 'chill-wave',
    name: 'Chill Wave',
    category: 'Chill',
    type: 'mp3',
    url: 'https://boxradio-edge-00.streamafrica.net/chillwave',
    style1: 'Chill',
    style2: 'Electro',
    scene: '放松',
    color: '#EC4899'
  },
  {
    id: 'groove-salad',
    name: 'Groove Salad',
    category: 'Chill',
    type: 'mp3',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    style1: 'Chill',
    style2: 'Ambient',
    scene: '编码',
    color: '#10B981'
  },
  {
    id: 'asp',
    name: 'ASP',
    category: 'Chill',
    type: 'mp3',
    url: 'http://radio.stereoscenic.com/asp-s',
    style1: 'Ambient',
    style2: 'Sleep',
    scene: '助眠',
    color: '#6366F1'
  },
  {
    id: 'paradise',
    name: 'Paradise',
    category: 'Chill',
    type: 'mp3',
    url: 'https://stream.radioparadise.com/mellow-128',
    style1: 'Chill',
    style2: 'Alt',
    scene: '休闲',
    color: '#F59E0B'
  },
  {
    id: 'drone-zone',
    name: 'Drone Zone',
    category: 'Chill',
    type: 'mp3',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    style1: 'Ambient',
    style2: 'Deep',
    scene: '催眠',
    color: '#64748B'
  },
  {
    id: 'rain-sounds',
    name: 'Rain Sounds',
    category: 'Ambient',
    type: 'mp3',
    url: 'https://boxradio-edge-01.streamafrica.net/rain',
    style1: 'Ambient',
    style2: 'Nature',
    scene: '助眠',
    color: '#0EA5E9'
  },
  {
    id: 'jazz-box',
    name: 'Jazz Box',
    category: 'Jazz',
    type: 'mp3',
    url: 'https://boxradio-edge-01.streamafrica.net/jazz',
    style1: 'Jazz',
    style2: 'Smooth',
    scene: '阅读',
    color: '#D946EF'
  },
  {
    id: 'jazz-groove',
    name: 'Jazz Groove',
    category: 'Jazz',
    type: 'mp3',
    url: 'http://west-mp3-128.streamthejazzgroove.com/stream',
    style1: 'Jazz',
    style2: 'Groove',
    scene: '写作',
    color: '#F97316'
  },
  {
    id: 'jazz-smooth',
    name: 'Jazz Smooth',
    category: 'Jazz',
    type: 'mp3',
    url: 'http://smoothjazz.cdnstream1.com/2585_128.mp3',
    style1: 'Jazz',
    style2: 'Mellow',
    scene: '办公',
    color: '#A855F7'
  },
  {
    id: 'swiss-classic',
    name: 'Swiss Classic',
    category: 'Classical',
    type: 'mp3',
    url: 'http://stream.srg-ssr.ch/m/rsc_de/mp3_128',
    style1: 'Classical',
    style2: 'Symphony',
    scene: '专注',
    color: '#84CC16'
  },
  {
    id: 'bbc-3',
    name: 'BBC 3',
    category: 'Classical',
    type: 'm3u8',
    url: 'http://as-hls-ww-live.akamaized.net/pool_904/live/ww/bbc_radio_three/bbc_radio_three.isml/bbc_radio_three-audio=320000.m3u8',
    style1: 'Classical',
    style2: 'Arts',
    scene: '探索',
    color: '#EF4444'
  },
  {
    id: 'rap',
    name: 'Rap Beats',
    category: 'Hip-Hop',
    type: 'mp3',
    url: 'https://boxradio-edge-00.streamafrica.net/rap',
    style1: 'Hip-Hop',
    style2: 'Beats',
    scene: '运动',
    color: '#F43F5E'
  },
  {
    id: 'kexp',
    name: 'KEXP',
    category: 'Rock/Indie',
    type: 'mp3',
    url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3',
    style1: 'Indie',
    style2: 'Alt',
    scene: '娱乐',
    color: '#22C55E'
  }
];

export const categories = [
  { id: 'all', name: '全部', count: stations.length },
  { id: 'Lo-Fi', name: 'Lo-Fi', count: stations.filter(s => s.category === 'Lo-Fi').length },
  { id: 'Chill', name: 'Chill', count: stations.filter(s => s.category === 'Chill').length },
  { id: 'Jazz', name: 'Jazz', count: stations.filter(s => s.category === 'Jazz').length },
  { id: 'Classical', name: '古典', count: stations.filter(s => s.category === 'Classical').length },
  { id: 'Hip-Hop', name: 'Hip-Hop', count: stations.filter(s => s.category === 'Hip-Hop').length },
  { id: 'Ambient', name: '氛围', count: stations.filter(s => s.category === 'Ambient').length },
  { id: 'Rock/Indie', name: 'Rock', count: stations.filter(s => s.category === 'Rock/Indie').length },
];

export function getFilteredStations(category: string): Station[] {
  if (category === 'all') return stations;
  return stations.filter(s => s.category === category);
}

export function getStationById(id: string): Station | undefined {
  return stations.find(s => s.id === id);
}
