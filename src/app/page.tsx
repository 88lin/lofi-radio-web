'use client';

import { useEffect, useSyncExternalStore, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Github, Headphones, Sparkles, Zap, Globe, Keyboard, Heart, Play, Pause, ExternalLink, Coffee, MoonStar, Waves, Music4, Clock, Target, Volume2, ChevronRight } from 'lucide-react';
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

// 动画变体
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// 浮动粒子
const FloatingParticles = ({ isDark }: { isDark: boolean }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: isDark 
              ? `rgba(139, 92, 246, ${Math.random() * 0.3 + 0.1})`
              : `rgba(139, 92, 246, ${Math.random() * 0.2 + 0.05})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// 流动渐变背景
const GradientOrb = ({ color1, color2, size, top, left, delay = 0 }: { 
  color1: string; 
  color2: string; 
  size: number; 
  top: string; 
  left: string;
  delay?: number;
}) => (
  <motion.div
    className="absolute rounded-full blur-[80px] sm:blur-[100px]"
    style={{
      width: size,
      height: size,
      top,
      left,
      background: `linear-gradient(135deg, ${color1}, ${color2})`,
    }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.15, 0.25, 0.15],
      x: [0, 30, 0],
      y: [0, -20, 0],
    }}
    transition={{
      duration: 10,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
);

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
    icon: Target,
    title: '专注计时',
    description: '记录你的每日专注时长，帮助你培养高效工作习惯，让音乐陪伴你的专注时光',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Globe,
    title: '在线收听',
    description: '无需下载安装，打开网页即可享受高品质音乐，支持 PWA 离线使用',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    icon: Keyboard,
    title: '快捷键支持',
    description: 'Space 播放/暂停，方向键切歌，M 静音，T 切换主题，让你的操作更高效',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
  },
];

// 使用场景
const scenes = [
  { icon: '📚', title: '学习', description: 'Lo-fi 音乐帮助你集中注意力' },
  { icon: '💻', title: '编程', description: '氛围音乐激发创作灵感' },
  { icon: '📖', title: '阅读', description: '轻柔爵士陪伴你的阅读时光' },
  { icon: '🌙', title: '放松', description: '自然白噪音帮助你入眠' },
];

// 快捷键列表
const shortcuts = [
  { key: 'Space', label: '播放/暂停' },
  { key: '←', label: '上一首' },
  { key: '→', label: '下一首' },
  { key: 'M', label: '静音' },
  { key: 'T', label: '切换主题' },
];

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
  
  // 初始化
  useAudioPlayer();
  useFocusTimer();
  
  // 处理电台卡片点击
  const handleStationClick = useCallback((stationId: string) => {
    selectStationById(stationId);
    setMiniMode(false);
  }, [selectStationById, setMiniMode]);
  
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
          setTheme(theme === 'dark' ? 'light' : 'dark');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theme, setTheme, togglePlay, nextStation, prevStation, toggleMute]);
  
  if (!mounted) return null;
  
  const isDark = resolvedTheme === 'dark';
  const stationColor = currentStation?.color || '#8B5CF6';
  
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* 背景 */}
      <div className="fixed inset-0">
        {/* 纯色背景 */}
        <div
          className={cn(
            "absolute inset-0 transition-colors duration-700",
            isDark ? "bg-zinc-950" : "bg-gray-50"
          )}
        />
        
        {/* 流动渐变光球 */}
        <GradientOrb color1="#8B5CF6" color2="#D946EF" size={500} top="-10%" left="5%" delay={0} />
        <GradientOrb color1="#06B6D4" color2="#8B5CF6" size={400} top="60%" left="60%" delay={2} />
        <GradientOrb color1="#EC4899" color2="#F59E0B" size={300} top="80%" left="10%" delay={4} />
        
        {/* 网格图案 */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
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
        {/* 导航栏 */}
        <motion.nav 
          className="fixed top-0 left-0 right-0 z-40"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div 
            className={cn(
              "max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between",
              "backdrop-blur-xl border-b",
              isDark 
                ? "bg-zinc-950/60 border-white/5" 
                : "bg-white/60 border-black/5"
            )}
          >
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2.5 group cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
                whileHover={{ scale: 1.05 }}
              >
                <Headphones className="w-5 h-5 text-white relative z-10" />
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: '-100%', y: '-100%' }}
                  whileHover={{ x: '100%', y: '100%' }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
              <span className={cn("font-bold text-lg", isDark ? "text-white" : "text-zinc-900")}>
                Lofi Radio
              </span>
            </motion.div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-1.5">
              {/* 播放状态指示 */}
              <AnimatePresence>
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                    className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-full overflow-hidden"
                    style={{ 
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ background: stationColor }}
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className={cn("text-xs font-medium whitespace-nowrap", isDark ? "text-white/70" : "text-zinc-600")}>
                      {currentStation?.name}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={cn(
                    "rounded-full h-9 w-9",
                    isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-zinc-600 hover:text-zinc-900 hover:bg-black/5"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isDark ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Sun className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MoonStar className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className={cn(
                    "rounded-full h-9 w-9",
                    isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-zinc-600 hover:text-zinc-900 hover:bg-black/5"
                  )}
                >
                  <a href="https://github.com/labilio/lofi-radio" target="_blank" rel="noopener noreferrer">
                    <Github className="w-5 h-5" />
                  </a>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.nav>
        
        {/* Hero Section */}
        <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {/* 标签 */}
              <motion.div variants={fadeInUp} className="mb-6">
                <motion.span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer"
                  style={{
                    background: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                    color: isDark ? '#a78bfa' : '#7c3aed',
                    border: isDark ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(139, 92, 246, 0.12)',
                  }}
                  whileHover={{ scale: 1.05, backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.12)' }}
                >
                  <Sparkles className="w-4 h-4" />
                  网页版全新上线
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </motion.span>
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
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    onClick={() => {
                      togglePlay();
                      if (!isPlaying) setMiniMode(false);
                    }}
                    className="w-full sm:w-auto rounded-full px-8 h-12 sm:h-14 text-base font-medium shadow-lg transition-all relative overflow-hidden group"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
                  >
                    {/* 按钮内光效 */}
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.5 }}
                    />
                    
                    {isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 mr-2 relative z-10" />
                        <span className="relative z-10">正在播放</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2 relative z-10" />
                        <span className="relative z-10">开始播放</span>
                      </>
                    )}
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "w-full sm:w-auto rounded-full px-8 h-12 sm:h-14 text-base font-medium group",
                      isDark && "border-white/20 text-white hover:bg-white/10"
                    )}
                    asChild
                  >
                    <a href="https://github.com/labilio/lofi-radio" target="_blank" rel="noopener noreferrer">
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
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-12"
            >
              <div className={cn(
                "inline-flex flex-wrap items-center justify-center gap-3 sm:gap-5 px-6 py-3 rounded-2xl",
                isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"
              )}>
                {shortcuts.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <kbd className={cn(
                      "px-2 py-1 rounded-lg text-xs font-mono shadow-sm",
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
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="mt-8"
                >
                  <motion.div
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-full cursor-pointer"
                    style={{
                      background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${stationColor}30`,
                      boxShadow: `0 0 30px ${stationColor}20`,
                    }}
                    onClick={() => setMiniMode(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* 唱片旋转图标 */}
                    <motion.div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: `${stationColor}20` }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <Music4 className="w-4 h-4" style={{ color: stationColor }} />
                    </motion.div>
                    
                    <div className="flex flex-col">
                      <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-zinc-900")}>
                        正在播放
                      </span>
                      <span className={cn("text-xs", isDark ? "text-white/50" : "text-zinc-500")}>
                        {currentStation.name}
                      </span>
                    </div>
                    
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ 
                        background: `${stationColor}20`,
                        color: stationColor,
                      }}
                    >
                      {currentStation.style1}
                    </span>
                    
                    <motion.div
                      className="w-2 h-2 rounded-full ml-1"
                      style={{ background: stationColor }}
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className={cn(
                "text-2xl sm:text-3xl font-bold mb-3",
                isDark ? "text-white" : "text-zinc-900"
              )}>
                为什么选择 Lofi Radio
              </h2>
              <p className={cn(
                "text-sm sm:text-base max-w-xl mx-auto",
                isDark ? "text-white/40" : "text-zinc-600"
              )}>
                专为专注设计，让音乐成为你工作和学习的最佳伴侣
              </p>
            </motion.div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={cn(
                    "relative p-6 rounded-2xl transition-all duration-300 overflow-hidden group",
                    isDark ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-white hover:shadow-lg"
                  )}
                  style={{
                    boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Hover 光效 */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${feature.color}12 0%, transparent 60%)`,
                    }}
                  />
                  
                  {/* 图标容器 */}
                  <motion.div
                    className={cn(
                      "relative w-12 h-12 rounded-xl flex items-center justify-center mb-5",
                      `bg-gradient-to-br ${feature.gradient}`
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-white/20"
                      initial={{ x: '-100%', y: '-100%' }}
                      whileHover={{ x: '100%', y: '100%' }}
                      transition={{ duration: 0.4 }}
                    />
                  </motion.div>
                  
                  <h3 className={cn(
                    "relative text-lg font-semibold mb-2",
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
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* 使用场景 Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <h2 className={cn(
                "text-2xl sm:text-3xl font-bold mb-3",
                isDark ? "text-white" : "text-zinc-900"
              )}>
                适用场景
              </h2>
              <p className={cn(
                "text-sm sm:text-base",
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
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {scenes.map((scene, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  whileHover={{ y: -4 }}
                  className={cn(
                    "p-5 rounded-2xl text-center transition-all",
                    isDark ? "bg-white/[0.03]" : "bg-white shadow-sm"
                  )}
                >
                  <div className="text-3xl mb-3">{scene.icon}</div>
                  <h4 className={cn(
                    "font-semibold mb-1",
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
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* 电台展示 */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <h2 className={cn(
                "text-2xl sm:text-3xl font-bold mb-3",
                isDark ? "text-white" : "text-zinc-900"
              )}>
                精选电台
              </h2>
              <p className={cn(
                "text-sm sm:text-base",
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
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
            >
              {stations.slice(0, 8).map((station, index) => (
                <motion.div
                  key={station.id}
                  variants={scaleIn}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStationClick(station.id)}
                  className={cn(
                    "relative p-4 rounded-xl cursor-pointer overflow-hidden group",
                    isDark ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-white hover:shadow-lg"
                  )}
                  style={{
                    borderLeft: `3px solid ${station.color}`,
                  }}
                >
                  {/* Hover 背景光效 */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${station.color}08 0%, transparent 50%)`,
                    }}
                  />
                  
                  <div className="relative flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${station.color}15` }}
                    >
                      <Waves className="w-5 h-5" style={{ color: station.color }} />
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
              ))}
            </motion.div>
            
            {/* 查看更多按钮 */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-8"
            >
              <Button
                variant="outline"
                className={cn(
                  "rounded-full gap-2",
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
        <section className="py-20 sm:py-28 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div
              className="relative p-8 sm:p-12 rounded-3xl overflow-hidden"
              style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(217, 70, 239, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(217, 70, 239, 0.04) 100%)',
                border: isDark ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(139, 92, 246, 0.12)',
              }}
            >
              {/* 背景装饰 */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl"
                  style={{ background: 'rgba(139, 92, 246, 0.2)' }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </div>
              
              <h2 className={cn(
                "text-2xl sm:text-3xl font-bold mb-4 relative",
                isDark ? "text-white" : "text-zinc-900"
              )}>
                开始你的专注之旅
              </h2>
              <p className={cn(
                "text-sm sm:text-base mb-8 relative max-w-xl mx-auto",
                isDark ? "text-white/50" : "text-zinc-600"
              )}>
                无需注册，无需下载，打开网页即可享受高品质的专注音乐。让 Lofi Radio 成为你每天工作学习的最佳伴侣。
              </p>
              
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="relative">
                <Button
                  size="lg"
                  onClick={() => {
                    togglePlay();
                    if (!isPlaying) setMiniMode(false);
                  }}
                  className="rounded-full px-10 h-14 text-base font-medium shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      正在播放
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <motion.div 
                className={cn("flex items-center gap-2 text-sm", isDark ? "text-white/40" : "text-zinc-500")}
                whileHover={{ scale: 1.02 }}
              >
                <Heart className="w-4 h-4 text-pink-500" />
                <span>Made with love for focus lovers</span>
              </motion.div>
              
              <div className={cn("flex items-center gap-4 text-sm", isDark ? "text-white/40" : "text-zinc-500")}>
                <motion.a
                  href="https://github.com/labilio/lofi-radio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-current transition-colors flex items-center gap-1.5"
                  whileHover={{ scale: 1.05 }}
                >
                  <Github className="w-4 h-4" />
                  原项目
                </motion.a>
                <span className={isDark ? "text-white/20" : "text-zinc-300"}>·</span>
                <span>MIT License</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      {/* 浮动播放器 */}
      <FloatingPlayer />
    </main>
  );
}
