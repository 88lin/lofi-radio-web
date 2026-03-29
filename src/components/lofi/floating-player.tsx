'use client';

import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Clock, Maximize2, Minimize2, Loader2, List, Radio, Headphones, X, Sparkles, Music4, Music } from 'lucide-react';
import { useAudioStore } from '@/store/audioStore';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { stations, categories, getFilteredStations, Station } from '@/lib/stations';
import { cn } from '@/lib/utils';

// ==================== 黑胶唱片组件 - 优化版 ====================
const VinylRecord = memo(({ isPlaying, size = 120, color = '#8B5CF6' }: { isPlaying: boolean; size?: number; color?: string }) => {
  return (
    <div
      className="relative flex-shrink-0 cursor-pointer select-none"
      style={{ width: size, height: size }}
    >
      {/* 外部光晕 - 使用 CSS 动画 */}
      <div
        className={cn(
          "absolute -inset-4 rounded-full transition-opacity duration-500",
          isPlaying ? "animate-pulse-subtle" : "opacity-20"
        )}
        style={{
          background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
        }}
      />
      
      {/* 唱片主体 - 使用 CSS 旋转动画 */}
      <div
        className={cn("absolute inset-0 rounded-full", isPlaying && "animate-spin-slow")}
        style={{
          background: `
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 45%),
            radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.35) 0%, transparent 45%),
            conic-gradient(from 0deg, #1a1a1a, #252525, #1a1a1a, #252525, #1a1a1a)
          `,
          boxShadow: `
            inset 0 2px 6px rgba(255, 255, 255, 0.05),
            inset 0 -2px 6px rgba(0, 0, 0, 0.35),
            0 15px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.02)
            ${isPlaying ? `, 0 0 40px ${color}15` : ''}
          `
        }}
      >
        {/* 纹路 - 减少数量 */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              inset: `${(i + 1) * 7}%`,
              border: '1px solid rgba(255, 255, 255, 0.012)'
            }}
          />
        ))}
      </div>
      
      {/* 中心标签 - 带音乐符号 */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          inset: '18%',
          background: `
            radial-gradient(circle at 35% 35%, ${color}70 0%, transparent 50%),
            linear-gradient(135deg, ${color}, ${color}cc)
          `,
          boxShadow: `
            inset 0 2px 8px rgba(0, 0, 0, 0.25),
            inset 0 -1px 2px rgba(255, 255, 255, 0.08),
            0 0 30px ${color}40
          `
        }}
      >
        <Music className="w-10 h-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
      </div>
      
      {/* 中心小孔 - 更小 */}
      <div
        className="absolute rounded-full"
        style={{
          inset: '48%',
          background: 'radial-gradient(circle, #000 0%, #1a1a1a 100%)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)'
        }}
      />
    </div>
  );
});
VinylRecord.displayName = 'VinylRecord';

// ==================== 音量滑块组件 - 优化版 ====================
const VolumeSlider = memo(({ 
  volume, 
  isMuted, 
  onVolumeChange, 
  onMuteToggle,
  stationColor 
}: { 
  volume: number; 
  isMuted: boolean; 
  onVolumeChange: (v: number) => void;
  onMuteToggle: () => void;
  stationColor: string;
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const calculateVolume = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onVolumeChange(percentage);
  }, [onVolumeChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    calculateVolume(e.clientX);
  }, [calculateVolume]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    isDragging.current = true;
    calculateVolume(e.touches[0].clientX);
  }, [calculateVolume]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        e.preventDefault();
        calculateVolume(e.clientX);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging.current) {
        calculateVolume(e.touches[0].clientX);
      }
    };
    const handleEnd = () => {
      isDragging.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [calculateVolume]);

  const displayVolume = isMuted ? 0 : volume;

  return (
    <div 
      className="flex items-center gap-3 w-full"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMuteToggle();
        }}
        className="flex-shrink-0 p-2 rounded-xl hover:bg-white/5 transition-colors"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-5 h-5 text-white/40" />
        ) : (
          <Volume2 className="w-5 h-5 text-white/60" />
        )}
      </button>
      
      <div 
        ref={sliderRef}
        className="flex-1 relative h-8 flex items-center cursor-pointer"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* 背景轨道 */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/10" />
        
        {/* 已填充轨道 */}
        <div
          className="absolute left-0 h-1.5 rounded-full pointer-events-none transition-all duration-75"
          style={{
            background: `linear-gradient(90deg, ${stationColor}, ${stationColor}bb)`,
            width: `${displayVolume * 100}%`
          }}
        />
        
        {/* 滑块 */}
        <div
          className="absolute w-4 h-4 rounded-full pointer-events-none transition-all duration-75"
          style={{
            background: 'linear-gradient(135deg, #fff, #e0e0e0)',
            left: `calc(${displayVolume * 100}% - 8px)`,
            boxShadow: `0 2px 6px rgba(0,0,0,0.25), 0 0 0 2px ${stationColor}25`
          }}
        />
      </div>
      
      <span className="text-white/40 text-xs w-10 text-right tabular-nums font-mono">
        {Math.round(displayVolume * 100)}%
      </span>
    </div>
  );
});
VolumeSlider.displayName = 'VolumeSlider';

// ==================== 电台列表组件 - 桌面端优化版 ====================
const StationList = memo(({ 
  onClose, 
  onSelect, 
  initialScene,
  isDesktop = false 
}: { 
  onClose: () => void; 
  onSelect: (station: Station) => void; 
  initialScene?: string;
  isDesktop?: boolean;
}) => {
  const {
    isPlaying, currentStation, selectedCategory,
    setSelectedCategory,
  } = useAudioStore();
  
  // 初始化时设置分类
  useEffect(() => {
    if (initialScene && categories.find(c => c.id === initialScene)) {
      setSelectedCategory(initialScene);
    }
  }, [initialScene, setSelectedCategory]);
  
  const filteredStations = getFilteredStations(selectedCategory);
  const stationColor = currentStation?.color || '#8B5CF6';
  
  return (
    <div 
      className="h-full flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 头部 - 桌面端不显示关闭按钮 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`,
            }}
          >
            <Radio className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-white font-medium text-sm">电台列表</h3>
          <span className="text-white/30 text-xs">({filteredStations.length})</span>
        </div>
        {/* 移动端显示关闭按钮 */}
        {!isDesktop && (
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              onClose(); 
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        )}
      </div>
      
      {/* 分类标签 - 横向滚动 */}
      <div className="px-3 py-2.5 border-b border-white/[0.04]">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCategory(cat.id);
              }}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                selectedCategory === cat.id
                  ? "text-white shadow-lg"
                  : "text-white/60 hover:text-white/80 bg-white/[0.06] hover:bg-white/[0.1]"
              )}
              style={{
                background: selectedCategory === cat.id
                  ? `linear-gradient(135deg, ${stationColor}, ${stationColor}cc)`
                  : undefined,
                boxShadow: selectedCategory === cat.id
                  ? `0 4px 15px ${stationColor}30`
                  : undefined,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* 电台列表 - 桌面端优化布局 */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className={cn(
          "grid gap-2",
          isDesktop ? "grid-cols-1" : "grid-cols-1"
        )}>
          {filteredStations.map((station) => {
            const isActive = currentStation?.id === station.id;
            return (
              <button
                key={station.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(station);
                }}
                className={cn(
                  "w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all relative overflow-hidden group",
                  isActive 
                    ? "bg-white/[0.08] border border-white/[0.08]" 
                    : "hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04]"
                )}
                style={{
                  borderLeft: isActive ? `3px solid ${station.color}` : '3px solid transparent',
                }}
              >
                {/* 悬停背景光效 */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at 30% 50%, ${station.color}08 0%, transparent 60%)`,
                  }}
                />
                
                {/* 图标 */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative"
                  style={{ background: `${station.color}15` }}
                >
                  {isActive && isPlaying ? (
                    <div
                      className="w-4 h-4 rounded-full animate-pulse"
                      style={{ 
                        background: `linear-gradient(135deg, ${station.color}, ${station.color}bb)`,
                        boxShadow: `0 0 10px ${station.color}60`,
                      }}
                    />
                  ) : (
                    <Music4 className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" style={{ color: station.color }} />
                  )}
                </div>
                
                {/* 信息 */}
                <div className="flex-1 min-w-0 text-left relative">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-sm font-medium truncate transition-colors duration-200",
                      isActive ? "text-white" : "text-white/80 group-hover:text-white"
                    )}>
                      {station.name}
                    </span>
                    {station.custom && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                        style={{
                          background: `${station.color}25`,
                          color: station.color
                        }}
                      >
                        {station.custom}
                      </span>
                    )}
                  </div>
                  {/* 标签 - 完整显示 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 whitespace-nowrap">
                      {station.style1}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/40 whitespace-nowrap">
                      {station.scene}
                    </span>
                  </div>
                </div>
                
                {/* 播放指示 */}
                {isActive && isPlaying && (
                  <div className="flex items-center gap-0.5 mr-1 flex-shrink-0">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-0.5 rounded-full animate-equalizer"
                        style={{ 
                          background: station.color,
                          animationDelay: `${i * 0.1}s`,
                          height: `${12 + i * 4}px`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
StationList.displayName = 'StationList';

// ==================== 全屏播放器 - 灵感来自HeoMusic ====================
const FullScreenPlayer = memo(({ onClose }: { onClose: () => void }) => {
  const {
    isPlaying, isLoading, currentStation, volume, isMuted,
    togglePlay, toggleMute, setVolume,
    nextStation, prevStation, selectStationById,
  } = useAudioStore();
  
  const { focusTime } = useFocusTimer();
  const stationColor = currentStation?.color || '#8B5CF6';
  const [showStationList, setShowStationList] = useState(false);
  
  const handleStationSelect = useCallback((station: Station) => {
    selectStationById(station.id);
  }, [selectStationById]);
  
  return (
    <div className="relative w-full h-full flex overflow-hidden">
      {/* 主背景 */}
      <div 
        className="absolute inset-0 z-0"
        style={{ background: '#0a0a0f' }}
      />
      
      {/* 左上光晕 - 纯色大块 + blur */}
      <div
        className="absolute z-0"
        style={{
          top: '-20%',
          left: '-10%',
          width: '60%',
          height: '60%',
          background: stationColor,
          opacity: 0.25,
          filter: 'blur(150px)',
        }}
      />
      
      {/* 右下光晕 - 纯色大块 + blur */}
      <div
        className="absolute z-0"
        style={{
          bottom: '-15%',
          right: '-10%',
          width: '50%',
          height: '50%',
          background: stationColor,
          opacity: 0.18,
          filter: 'blur(120px)',
        }}
      />
      
      {/* 主内容区 - 桌面端左右布局 */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 左侧：播放器主体 */}
        <div className="flex-1 flex flex-col min-w-0 flex items-center justify-center">
          {/* 唱片容器 - 添加缩放动画 */}
          <motion.div 
            onClick={togglePlay}
            className="cursor-pointer mb-6"
            animate={{ 
              scale: isPlaying ? 1 : 0.95,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <VinylRecord isPlaying={isPlaying} size={180} color={stationColor} />
          </motion.div>
          
          {/* 歌曲信息 */}
          <div className="text-center mb-6 px-6">
            <h3 className="text-white text-xl sm:text-2xl font-bold mb-2 truncate max-w-sm">
              {currentStation?.name || 'Lofi Radio'}
            </h3>
            <p className="text-white/40 text-sm mb-4">专注音乐，触手可及</p>
            
            {/* 标签 */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {currentStation?.style1 && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: `${stationColor}20`,
                    color: stationColor
                  }}
                >
                  {currentStation.style1}
                </span>
              )}
              {currentStation?.scene && (
                <span className="px-3 py-1 rounded-full text-xs bg-white/[0.06] text-white/50">
                  {currentStation.scene}
                </span>
              )}
            </div>
          </div>
          
          {/* 播放控制 */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <button
              onClick={prevStation}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] transition-all duration-200 hover:scale-105"
            >
              <SkipBack className="w-5 h-5 text-white/60" />
            </button>
            
            <button
              onClick={togglePlay}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-200 hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, ${stationColor}, ${stationColor}cc)`,
                boxShadow: `0 8px 32px ${stationColor}40`
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 text-white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-0.5" />
              )}
            </button>
            
            <button
              onClick={nextStation}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] transition-all duration-200 hover:scale-105"
            >
              <SkipForward className="w-5 h-5 text-white/60" />
            </button>
          </div>
          
          {/* 音量控制 */}
          <div className="w-full max-w-xs mb-4">
            <div 
              className="px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(255, 255, 255, 0.04)' }}
            >
              <VolumeSlider
                volume={volume}
                isMuted={isMuted}
                onVolumeChange={setVolume}
                onMuteToggle={toggleMute}
                stationColor={stationColor}
              />
            </div>
          </div>
          
          {/* 专注时间 */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255, 255, 255, 0.04)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white/30" />
            <span className="text-white/40 text-xs">今日专注</span>
            <span 
              className="text-xs font-semibold tabular-nums"
              style={{ color: stationColor }}
            >
              {focusTime} 分钟
            </span>
          </div>
          
          {/* 移动端电台列表按钮 */}
          <button
            onClick={() => setShowStationList(true)}
            className="lg:hidden mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
          >
            <List className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-sm">电台列表</span>
          </button>
        </div>
        
        {/* 右侧：电台列表 - 桌面端固定显示 */}
        <div 
          className="hidden lg:flex w-80 flex-col border-l border-white/[0.06]"
          style={{ 
            background: 'linear-gradient(180deg, rgba(18, 18, 20, 0.95) 0%, rgba(12, 12, 14, 0.98) 100%)',
          }}
        >
          <StationList onClose={() => {}} onSelect={handleStationSelect} isDesktop={true} />
        </div>
      </div>
      
      {/* 关闭按钮 - 固定在左上角 */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] transition-all duration-200"
      >
        <Minimize2 className="w-4 h-4 text-white/60" />
      </button>
      
      {/* 播放状态指示 */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div
          className={cn("w-2 h-2 rounded-full", isPlaying && "animate-pulse")}
          style={{ 
            background: stationColor,
            boxShadow: `0 0 8px ${stationColor}`
          }}
        />
        <span className="text-white/50 text-sm font-medium">Lofi Radio</span>
      </div>
      
      {/* 移动端电台列表弹窗 */}
      <AnimatePresence>
        {showStationList && (
          <motion.div 
            className="lg:hidden fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowStationList(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 h-[80vh] rounded-t-3xl overflow-hidden"
              style={{ background: 'rgb(20, 20, 22)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* 拖动指示器 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <StationList onClose={() => setShowStationList(false)} onSelect={handleStationSelect} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
FullScreenPlayer.displayName = 'FullScreenPlayer';

// ==================== 迷你灵动岛 - 精致玻璃版 ====================
const MiniPlayer = memo(({ onExpand }: { onExpand: () => void }) => {
  const { isPlaying, currentStation, togglePlay, isLoading } = useAudioStore();
  const { focusTime } = useFocusTimer();
  const stationColor = currentStation?.color || '#8B5CF6';
  
  return (
    <div className="relative cursor-grab active:cursor-grabbing select-none">
      {/* 外部光晕 - 精致柔和 */}
      <div
        className={cn(
          "absolute -inset-2 sm:-inset-3 rounded-full transition-opacity duration-500",
          isPlaying ? "opacity-40" : "opacity-20"
        )}
        style={{ 
          background: `radial-gradient(ellipse, ${stationColor}20 0%, transparent 70%)`,
        }}
      />
      
      {/* 主体 - 玻璃质感灵动岛 */}
      <div
        className="relative flex items-center gap-2 sm:gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full"
        style={{
          background: `linear-gradient(145deg, rgba(40, 40, 50, 0.85) 0%, rgba(25, 25, 35, 0.9) 100%)`,
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 0 0.5px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 0 20px ${stationColor}15
          `
        }}
      >
        {/* 迷你唱片 */}
        <div
          className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 relative overflow-hidden",
            isPlaying && "animate-spin-slow"
          )}
          style={{ 
            background: `linear-gradient(145deg, rgba(30, 30, 40, 0.9), rgba(15, 15, 20, 0.95))`,
            boxShadow: `inset 0 1px 2px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3)`
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              inset: '20%',
              background: `linear-gradient(135deg, ${stationColor}, ${stationColor}cc)`,
              boxShadow: `0 0 10px ${stationColor}40`
            }}
          />
          <div
            className="absolute rounded-full"
            style={{ inset: '42%', background: 'rgba(0,0,0,0.6)' }}
          />
        </div>
        
        {/* 信息 */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white text-xs sm:text-sm font-semibold truncate max-w-[80px] sm:max-w-[100px]">
            {currentStation?.name || 'Lofi Radio'}
          </span>
          <div className="flex items-center gap-1 text-white/50 text-[10px] sm:text-xs">
            <Clock className="w-2.5 h-2.5" />
            <span className="tabular-nums font-medium">{focusTime} min</span>
          </div>
        </div>
        
        {/* 播放按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ 
            background: `linear-gradient(135deg, ${stationColor}, ${stationColor}cc)`,
            boxShadow: `0 2px 12px ${stationColor}40`
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white ml-0.5" />
          )}
        </button>
        
        {/* 展开按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
        >
          <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/50" />
        </button>
      </div>
    </div>
  );
});
MiniPlayer.displayName = 'MiniPlayer';

// ==================== 主组件 ====================
export function FloatingPlayer() {
  const { isMiniMode, setMiniMode } = useAudioStore();
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  const lastTapRef = useRef<number>(0);
  
  // 灵动岛边界约束 - 严格边界防止越界
  useEffect(() => {
    const updateConstraints = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // 灵动岛尺寸
      const islandWidth = windowWidth < 640 ? 200 : 220;
      const islandHeight = windowWidth < 640 ? 46 : 50;
      // 边距 - 确保不越界
      const padding = 16;
      const topPadding = 80; // 顶部留出导航空间
      
      // 计算边界
      const leftLimit = padding;
      const rightLimit = Math.max(padding, windowWidth - islandWidth - padding);
      const topLimit = topPadding;
      const bottomLimit = Math.max(topPadding, windowHeight - islandHeight - padding - 60);
      
      // 初始位置
      const initialX = (windowWidth - islandWidth) / 2;
      const initialY = topPadding + 10;
      
      setConstraints({
        left: leftLimit - initialX,
        right: rightLimit - initialX,
        top: 0, // 相对于初始位置，向下为正
        bottom: bottomLimit - initialY
      });
      
      setPosition({ x: 0, y: 0 });
    };
    
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);
  
  // 双击展开
  const handleDoubleClick = useCallback(() => {
    if (!isMiniMode) return;
    setMiniMode(false);
  }, [isMiniMode, setMiniMode]);
  
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isMiniMode) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleClick();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    
    setIsDragging(true);
    dragControls.start(e);
  }, [isMiniMode, dragControls, handleDoubleClick]);
  
  const handleDragEnd = useCallback((_: never, info: PanInfo) => {
    setIsDragging(false);
    setPosition(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y
    }));
  }, []);
  
  return (
    <>
      {/* 全屏播放器 - 减少闪屏 */}
      <AnimatePresence>
        {!isMiniMode && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-auto"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <FullScreenPlayer onClose={() => setMiniMode(true)} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 迷你灵动岛 */}
      <AnimatePresence>
        {isMiniMode && (
          <motion.div
            className={cn("fixed pointer-events-auto z-50", isDragging ? "cursor-grabbing" : "cursor-grab")}
            style={{ 
              left: '50%', 
              top: '90px',
              marginLeft: '-110px',
              x: position.x,
              y: position.y,
            }}
            drag
            dragControls={dragControls}
            dragConstraints={constraints}
            dragMomentum={false}
            dragElastic={0}
            onPointerDown={handlePointerDown}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.02 }}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <MiniPlayer onExpand={() => setMiniMode(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
