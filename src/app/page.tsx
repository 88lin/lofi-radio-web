'use client';

import { useEffect, useSyncExternalStore, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Github, Headphones, Sparkles, Play, Pause, ExternalLink, Waves, Music4, ChevronRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import { FloatingPlayer } from '@/components/lofi/floating-player';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { useAudioStore } from '@/store/audioStore';
import { stations } from '@/lib/stations';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 客户端挂载检测
function useMounted() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

// 动画变体 - 简化版
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// 浮动粒子 - 使用 CSS 动画，减少数量
const FloatingParticles = memo(({ isDark }: { isDark: boolean }) => {
  // 预计算粒子位置，避免每次渲染重新计算
  const particles = useMemo(() => 
    [...Array(8)].map((_, i) => ({
      id: i,
      width: 2 + (i % 3),
      height: 2 + (i % 3),
      left: (i * 12.5) + Math.random() * 5,
      top: 10 + (i * 10) + Math.random() * 5,
      delay: i * 0.5,
      duration: 6 + (i % 4),
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-float"
          style={{
            width: p.width,
            height: p.height,
            background: isDark 
              ? `rgba(139, 92, 246, ${0.1 + (p.id % 3) * 0.05})`
              : `rgba(139, 92, 246, ${0.05 + (p.id % 3) * 0.03})`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
});
FloatingParticles.displayName = 'FloatingParticles';

// 流动渐变背景 - 使用 CSS 动画替代 Framer Motion
const GradientOrb = memo(({ 
  color1, 
  color2, 
  size, 
  top, 
  left, 
  delay = 0,
  duration = 15 
}: { 
  color1: string; 
  color2: string; 
  size: number; 
  top: string; 
  left: string;
  delay?: number;
  duration?: number;
}) => (
  <div
    className="absolute rounded-full animate-orb blur-[60px] sm:blur-[80px]"
    style={{
      width: size,
      height: size,
      top,
      left,
      background: `linear-gradient(135deg, ${color1}, ${color2})`,
      opacity: 0.12,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  />
));
GradientOrb.displayName = 'GradientOrb';

// 特性数据
const features = [
  {
    icon: Headphones,
    title: '16 精选电台',
    description: '涵盖 Lo-Fi、Chill、Jazz、Classical 等多种音乐风格，适合学习、工作、阅读、放松等各种场景',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Sparkles,
    title: '专注计时',
    description: '记录你的每日专注时长，帮助你培养高效工作习惯，让音乐陪伴你的专注时光',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Waves,
    title: '在线收听',
    description: '无需下载安装，打开网页即可享受高品质音乐，支持 PWA 离线使用',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    icon: Headphones,
    title: '快捷键支持',
    description: 'Space 播放/暂停，方向键切歌，M 静音，T 切换主题，让你的操作更高效',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
  },
];

// 使用场景
const scenes = [
  { id: '学习', icon: '📚', title: '学习', description: 'Lo-fi 音乐帮助你集中注意力' },
  { id: '编程', icon: '💻', title: '编程', description: '氛围音乐激发创作灵感' },
  { id: '阅读', icon: '📖', title: '阅读', description: '轻柔爵士陪伴你的阅读时光' },
  { id: '助眠', icon: '🌙', title: '助眠', description: '自然白噪音帮助你入眠' },
];

// 快捷键列表
const shortcuts = [
  { key: 'Space', label: '播放/暂停' },
  { key: '←', label: '上一首' },
  { key: '→', label: '下一首' },
  { key: 'M', label: '静音' },
  { key: 'T', label: '切换主题' },
];

// 导航栏组件 - 药丸胶囊形式
const NavBar = memo(({ 
  isDark, 
  isPlaying, 
  currentStation, 
  stationColor,
  onThemeToggle,
  theme
}: { 
  isDark: boolean; 
  isPlaying: boolean; 
  currentStation: typeof stations[0] | null;
  stationColor: string;
  onThemeToggle: () => void;
  theme: string | undefined;
}) => (
  <motion.nav 
    className="fixed top-4 left-1/2 -translate-x-1/2 z-40"
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div 
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-full",
        "backdrop-blur-xl shadow-lg border",
        isDark 
          ? "bg-black/50 border-white/[0.08]" 
          : "bg-white/70 border-black/[0.05]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 py-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
        >
          <Headphones className="w-4 h-4 text-white" />
        </div>
        <span className={cn("font-semibold text-sm hidden sm:block", isDark ? "text-white" : "text-zinc-900")}>
          Lofi Radio
        </span>
      </div>

      {/* 分隔线 */}
      <div className={cn("w-px h-5", isDark ? "bg-white/10" : "bg-black/10")} />

      {/* 播放状态指示 */}
      <AnimatePresence>
        {isPlaying && currentStation && (
          <motion.div
            initial={{ opacity: 0, width: 0, marginRight: 0 }}
            animate={{ opacity: 1, width: 'auto', marginRight: 8 }}
            exit={{ opacity: 0, width: 0, marginRight: 0 }}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full overflow-hidden"
            style={{ 
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: stationColor }}
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className={cn("text-xs font-medium whitespace-nowrap", isDark ? "text-white/70" : "text-zinc-600")}>
              {currentStation.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主题切换 */}
      <motion.button
        onClick={onThemeToggle}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
          isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-zinc-600 hover:text-zinc-900 hover:bg-black/5"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sun className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Moon className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 分隔线 */}
      <div className={cn("w-px h-5", isDark ? "bg-white/10" : "bg-black/10")} />

      {/* GitHub */}
      <motion.a
        href="https://github.com/88lin/lofi-radio-web"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
          isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-zinc-600 hover:text-zinc-900 hover:bg-black/5"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Github className="w-4 h-4" />
      </motion.a>
    </div>
  </motion.nav>
));
NavBar.displayName = 'NavBar';

// 特性卡片组件
const FeatureCard = memo(({ 
  feature, 
  isDark 
}: { 
  feature: typeof features[0];
  isDark: boolean;
}) => (
  <motion.div
    variants={scaleIn}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className={cn(
      "relative p-5 rounded-2xl transition-all duration-300 overflow-hidden group",
      isDark ? "bg-white/[0.03] hover:bg-white/[0.05]" : "bg-white hover:shadow-lg"
    )}
  >
    {/* Hover 光效 */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{
        background: `radial-gradient(circle at 50% 0%, ${feature.color}10 0%, transparent 60%)`,
      }}
    />
    
    {/* 图标容器 */}
    <div
      className={cn(
        "relative w-11 h-11 rounded-xl flex items-center justify-center mb-4",
        `bg-gradient-to-br ${feature.gradient}`
      )}
    >
      <feature.icon className="w-5 h-5 text-white" />
    </div>
    
    <h3 className={cn(
      "relative text-base font-semibold mb-1.5",
      isDark ? "text-white" : "text-zinc-900"
    )}>
      {feature.title}
    </h3>
    <p className={cn(
      "relative text-sm leading-relaxed",
      isDark ? "text-white/40" : "text-zinc-600"
    )}>
      {feature.description}
    </p>
  </motion.div>
));
FeatureCard.displayName = 'FeatureCard';

// 场景卡片组件
const SceneCard = memo(({ 
  scene, 
  isDark,
  onClick
}: { 
  scene: typeof scenes[0];
  isDark: boolean;
  onClick: () => void;
}) => (
  <motion.div
    variants={scaleIn}
    whileHover={{ y: -3 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "p-4 rounded-2xl text-center transition-all cursor-pointer",
      isDark ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-white shadow-sm hover:shadow-md"
    )}
  >
    <div className="text-2xl mb-2">{scene.icon}</div>
    <h4 className={cn(
      "font-semibold text-sm mb-0.5",
      isDark ? "text-white" : "text-zinc-900"
    )}>
      {scene.title}
    </h4>
    <p className={cn(
      "text-xs",
      isDark ? "text-white/40" : "text-zinc-500"
    )}>
      {scene.description}
    </p>
  </motion.div>
));
SceneCard.displayName = 'SceneCard';

// 电台卡片组件
const StationCard = memo(({ 
  station, 
  isDark,
  onClick
}: { 
  station: typeof stations[0];
  isDark: boolean;
  onClick: () => void;
}) => (
  <motion.div
    variants={scaleIn}
    whileHover={{ y: -3, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "relative p-3.5 rounded-xl cursor-pointer overflow-hidden group",
      isDark ? "bg-white/[0.03] hover:bg-white/[0.05]" : "bg-white hover:shadow-lg"
    )}
    style={{
      borderLeft: `3px solid ${station.color}`,
    }}
  >
    {/* Hover 背景光效 */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      style={{
        background: `linear-gradient(135deg, ${station.color}08 0%, transparent 50%)`,
      }}
    />
    
    <div className="relative flex items-center gap-3">
      <div 
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${station.color}15` }}
      >
        <Waves className="w-4 h-4" style={{ color: station.color }} />
      </div>
      <div className="min-w-0">
        <h4 className={cn(
          "text-sm font-medium truncate",
          isDark ? "text-white" : "text-zinc-900"
        )}>
          {station.name}
        </h4>
        <span className={cn(
          "text-xs",
          isDark ? "text-white/30" : "text-zinc-500"
        )}>
          {station.style1}
        </span>
      </div>
    </div>
  </motion.div>
));
StationCard.displayName = 'StationCard';

export default function Home() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();
  const togglePlay = useAudioStore((state) => state.togglePlay);
  const nextStation = useAudioStore((state) => state.nextStation);
  const prevStation = useAudioStore((state) => state.prevStation);
  const toggleMute = useAudioStore((state) => state.toggleMute);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const currentStation = useAudioStore((state) => state.currentStation);
  const setMiniMode = useAudioStore((state) => state.setMiniMode);
  const selectStationById = useAudioStore((state) => state.selectStationById);
  const setSelectedCategory = useAudioStore((state) => state.setSelectedCategory);
  
  // 初始化
  useAudioPlayer();
  useFocusTimer();
  
  // 处理电台卡片点击
  const handleStationClick = useCallback((stationId: string) => {
    selectStationById(stationId);
    setMiniMode(false);
  }, [selectStationById, setMiniMode]);

  // 处理场景点击
  const handleSceneClick = useCallback((sceneId: string) => {
    // 找到该场景的第一个电台并播放
    const sceneStations = stations.filter(s => s.scene === sceneId);
    if (sceneStations.length > 0) {
      setSelectedCategory(sceneId);
      selectStationById(sceneStations[0].id);
      setMiniMode(false);
    }
  }, [selectStationById, setMiniMode, setSelectedCategory]);

  // 主题切换
  const handleThemeToggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);
  
  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevStation();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextStation();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyT':
          e.preventDefault();
          handleThemeToggle();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleThemeToggle, togglePlay, nextStation, prevStation, toggleMute]);

  // 避免闪屏 - 在未挂载时默认使用暗色主题
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const stationColor = currentStation?.color || '#8B5CF6';
  
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* 背景 */}
      <div className="fixed inset-0">
        {/* 纯色背景 */}
        <div
          className={cn(
            "absolute inset-0 transition-colors duration-500",
            isDark ? "bg-zinc-950" : "bg-gray-50"
          )}
        />
        
        {/* 流动渐变光球 - 减少 blur */}
        <GradientOrb color1="#8B5CF6" color2="#D946EF" size={400} top="-5%" left="5%" delay={0} duration={20} />
        <GradientOrb color1="#06B6D4" color2="#8B5CF6" size={350} top="50%" left="55%" delay={3} duration={18} />
        <GradientOrb color1="#EC4899" color2="#F59E0B" size={280} top="75%" left="10%" delay={6} duration={22} />
        
        {/* 网格图案 */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px),
              linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* 浮动粒子 */}
        <FloatingParticles isDark={isDark} />
      </div>
      
      {/* 内容 */}
      <div className="relative z-10">
        {/* 导航栏 - 药丸胶囊形式 */}
        <NavBar 
          isDark={isDark}
          isPlaying={isPlaying}
          currentStation={currentStation}
          stationColor={stationColor}
          onThemeToggle={handleThemeToggle}
          theme={theme}
        />
        
        {/* Hero Section */}
        <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {/* 标签 */}
              <motion.div variants={fadeInUp} className="mb-5">
                <span
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors"
                  style={{
                    background: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                    color: isDark ? '#a78bfa' : '#7c3aed',
                    border: isDark ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(139, 92, 246, 0.12)',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  网页版全新上线
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </span>
              </motion.div>
              
              {/* 标题 */}
              <motion.h1
                variants={fadeInUp}
                className={cn(
                  "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6",
                  isDark ? "text-white" : "text-zinc-900"
                )}
              >
                专注音乐
                <br />
                <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                  触手可及
                </span>
              </motion.h1>
              
              {/* 描述 */}
              <motion.p
                variants={fadeInUp}
                className={cn(
                  "text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed",
                  isDark ? "text-white/50" : "text-zinc-600"
                )}
              >
                Lofi 音乐被科学家认为是最适合专注工作学习的音乐。
                <br className="hidden sm:block" />
                macOS 风格灵动岛设计，{stations.length} 个精选电台，打开即用，无需下载。
              </motion.p>
              
              {/* 操作按钮 */}
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    onClick={() => {
                      togglePlay();
                      if (!isPlaying) setMiniMode(false);
                    }}
                    className="w-full sm:w-auto rounded-full px-8 h-12 sm:h-14 text-base font-medium shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        <span>正在播放</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        <span>开始播放</span>
                      </>
                    )}
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "w-full sm:w-auto rounded-full px-8 h-12 sm:h-14 text-base font-medium group",
                      isDark && "border-white/20 text-white hover:bg-white/10"
                    )}
                    asChild
                  >
                    <a href="https://github.com/88lin/lofi-radio-web" target="_blank" rel="noopener noreferrer">
                      <Github className="w-5 h-5 mr-2" />
                      查看源码
                      <ExternalLink className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
            
            {/* 快捷键提示 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mt-10"
            >
              <div className={cn(
                "inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-5 py-2.5 rounded-2xl",
                isDark ? "bg-white/[0.02]" : "bg-black/[0.02]"
              )}>
                {shortcuts.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <kbd className={cn(
                      "px-1.5 py-0.5 rounded-md text-xs font-mono",
                      isDark ? "bg-white/10 text-white/60" : "bg-black/5 text-zinc-600"
                    )}>
                      {item.key}
                    </kbd>
                    <span className={cn("text-xs", isDark ? "text-white/40" : "text-zinc-500")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* 当前播放状态 */}
            <AnimatePresence>
              {isPlaying && currentStation && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="mt-6"
                >
                  <motion.div
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full cursor-pointer"
                    style={{
                      background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(12px)',
                      border: `1px solid ${stationColor}25`,
                    }}
                    onClick={() => setMiniMode(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* 唱片旋转图标 */}
                    <motion.div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: `${stationColor}20` }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    >
                      <Music4 className="w-3.5 h-3.5" style={{ color: stationColor }} />
                    </motion.div>
                    
                    <div className="flex flex-col">
                      <span className={cn("text-xs font-medium", isDark ? "text-white" : "text-zinc-900")}>
                        正在播放
                      </span>
                      <span className={cn("text-[10px]", isDark ? "text-white/50" : "text-zinc-500")}>
                        {currentStation.name}
                      </span>
                    </div>
                    
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ 
                        background: `${stationColor}20`,
                        color: stationColor,
                      }}
                    >
                      {currentStation.style1}
                    </span>
                    
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: stationColor }}
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className={cn(
                "text-2xl sm:text-3xl font-bold mb-3",
                isDark ? "text-white" : "text-zinc-900"
              )}>
                为什么选择 Lofi Radio
              </h2>
              <p className={cn(
                "text-base sm:text-lg max-w-xl mx-auto",
                isDark ? "text-white/40" : "text-zinc-600"
              )}>
                专为专注设计，让音乐成为你工作和学习的最佳伴侣
              </p>
            </motion.div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {features.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} isDark={isDark} />
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* 使用场景 Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <h2 className={cn(
                "text-2xl sm:text-3xl font-bold mb-3",
                isDark ? "text-white" : "text-zinc-900"
              )}>
                适用场景
              </h2>
              <p className={cn(
                "text-base sm:text-lg",
                isDark ? "text-white/40" : "text-zinc-600"
              )}>
                无论学习、工作还是放松，总有一个电台适合你
              </p>
            </motion.div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {scenes.map((scene) => (
                <SceneCard 
                  key={scene.title} 
                  scene={scene} 
                  isDark={isDark}
                  onClick={() => handleSceneClick(scene.id)}
                />
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* 电台展示 */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <h2 className={cn(
                "text-2xl sm:text-3xl font-bold mb-3",
                isDark ? "text-white" : "text-zinc-900"
              )}>
                精选电台
              </h2>
              <p className={cn(
                "text-base sm:text-lg",
                isDark ? "text-white/40" : "text-zinc-600"
              )}>
                涵盖多种风格，总有适合你的音乐
              </p>
            </motion.div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            >
              {stations.slice(0, 8).map((station) => (
                <StationCard 
                  key={station.id} 
                  station={station} 
                  isDark={isDark}
                  onClick={() => handleStationClick(station.id)}
                />
              ))}
            </motion.div>
            
            {/* 查看更多按钮 */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-6"
            >
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full gap-1.5",
                  isDark && "border-white/20 text-white hover:bg-white/10"
                )}
                onClick={() => setMiniMode(false)}
              >
                查看全部电台
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div
              className="relative p-6 sm:p-10 rounded-3xl overflow-hidden"
              style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(217, 70, 239, 0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(217, 70, 239, 0.03) 100%)',
                border: isDark ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid rgba(139, 92, 246, 0.1)',
              }}
            >
              <h2 className={cn(
                "text-xl sm:text-2xl font-bold mb-3 relative",
                isDark ? "text-white" : "text-zinc-900"
              )}>
                开始你的专注之旅
              </h2>
              <p className={cn(
                "text-sm mb-6 relative max-w-xl mx-auto",
                isDark ? "text-white/50" : "text-zinc-600"
              )}>
                无需注册，无需下载，打开网页即可享受高品质的专注音乐。让 Lofi Radio 成为你每天工作学习的最佳伴侣。
              </p>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative">
                <Button
                  size="lg"
                  onClick={() => {
                    togglePlay();
                    if (!isPlaying) setMiniMode(false);
                  }}
                  className="rounded-full px-8 h-12 text-sm font-medium shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      正在播放
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      立即开始
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </section>
        
        {/* 底部 */}
        <footer className={cn(
          "py-10 px-4 sm:px-6",
          isDark ? "border-t border-white/5" : "border-t border-zinc-100"
        )}>
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className={cn("flex items-center gap-2 text-sm", isDark ? "text-white/40" : "text-zinc-500")}>
                <span>Made with love by</span>
                <span className={cn("font-semibold", isDark ? "text-white/70" : "text-zinc-700")}>茉灵智库</span>
              </div>
              
              <span className={cn("hidden sm:block", isDark ? "text-white/20" : "text-zinc-300")}>|</span>
              
              <a
                href="https://github.com/88lin/lofi-radio-web"
                target="_blank"
                rel="noopener noreferrer"
                className={cn("hover:text-current transition-colors flex items-center gap-1.5 text-sm", isDark ? "text-white/40" : "text-zinc-500")}
              >
                <Github className="w-4 h-4" />
                GitHub: 88lin/lofi-radio-web
              </a>
            </div>
          </div>
        </footer>
      </div>
      
      {/* 浮动播放器 */}
      <FloatingPlayer />
    </main>
  );
}
