'use client';

import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Clock, Maximize2, Minimize2, Loader2, List, Radio, Headphones, X, Sparkles, Music4 } from 'lucide-react';
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
      
      {/* 中心标签 */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          inset: '25%',
          background: `
            radial-gradient(circle at 35% 35%, ${color}50 0%, transparent 50%),
            linear-gradient(135deg, ${color}, ${color}cc)
          `,
          boxShadow: `
            inset 0 2px 8px rgba(0, 0, 0, 0.25),
            inset 0 -1px 2px rgba(255, 255, 255, 0.08),
            0 0 20px ${color}20
          `
        }}
      >
        <Headphones className="w-4 h-4 text-white/85" />
      </div>
      
      {/* 中心孔 */}
      <div
        className="absolute rounded-full"
        style={{
          inset: '44%',
          background: 'radial-gradient(circle, #000 0%, #151515 100%)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)'
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

// ==================== 电台列表组件 ====================
const StationList = memo(({ onClose, onSelect }: { onClose: () => void; onSelect: (station: Station) => void }) => {
  const {
    isPlaying, currentStation, selectedCategory,
    setSelectedCategory,
  } = useAudioStore();
  
  const filteredStations = getFilteredStations(selectedCategory);
  const stationColor = currentStation?.color || '#8B5CF6';
  
  return (
    <div 
      className="h-full flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 头部 */}
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
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            onClose(); 
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
        >
          <X className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>
      
      {/* 分类标签 */}
      <div className="px-3 py-2.5 border-b border-white/[0.04]">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCategory(cat.id);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                selectedCategory === cat.id
                  ? "text-white"
                  : "text-white/50 hover:text-white/70 bg-white/[0.03] hover:bg-white/[0.05]"
              )}
              style={{
                background: selectedCategory === cat.id
                  ? `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`
                  : undefined,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* 电台列表 */}
      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="grid gap-1.5">
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
                  "w-full p-2.5 rounded-xl text-left flex items-center gap-2.5 transition-all relative overflow-hidden group",
                  isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                )}
                style={{
                  borderLeft: isActive ? `2.5px solid ${station.color}` : '2.5px solid transparent',
                }}
              >
                {/* 图标 */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${station.color}12` }}
                >
                  {isActive && isPlaying ? (
                    <div
                      className={cn("w-3 h-3 rounded-full animate-pulse")}
                      style={{ 
                        background: `linear-gradient(135deg, ${station.color}, ${station.color}bb)`,
                      }}
                    />
                  ) : (
                    <Music4 className="w-4 h-4" style={{ color: station.color }} />
                  )}
                </div>
                
                {/* 信息 */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn(
                      "text-xs font-medium truncate",
                      isActive ? "text-white" : "text-white/80"
                    )}>
                      {station.name}
                    </span>
                    {station.custom && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: `${station.color}20`,
                          color: station.color
                        }}
                      >
                        {station.custom}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/40">
                      {station.style1}
                    </span>
                    <span className="text-[10px] text-white/25">
                      {station.scene}
                    </span>
                  </div>
                </div>
                
                {/* 播放指示 - 使用 CSS 动画 */}
                {isActive && isPlaying && (
                  <div className="flex items-center gap-0.5 mr-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-0.5 rounded-full animate-equalizer"
                        style={{ 
                          background: station.color,
                          animationDelay: `${i * 0.1}s`
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

// ==================== 全屏播放器 ====================
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
    setShowStationList(false);
  }, [selectStationById]);
  
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* 背景渐变 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 40% at 20% -5%, ${stationColor}10 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 80% 105%, ${stationColor}06 0%, transparent 50%),
            linear-gradient(180deg, rgba(15, 15, 18, 0.98) 0%, rgba(10, 10, 12, 0.99) 100%)
          `
        }}
      />
      
      {/* 顶部导航 */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
        >
          <Minimize2 className="w-4 h-4 text-white/50" />
        </button>
        
        <div className="flex items-center gap-2">
          <div
            className={cn("w-2 h-2 rounded-full", isPlaying && "animate-pulse")}
            style={{ 
              background: `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`,
            }}
          />
          <h2 className="text-white/70 font-medium text-sm">Lofi Radio</h2>
        </div>
        
        <button
          onClick={() => setShowStationList(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
        >
          <List className="w-4 h-4 text-white/50" />
        </button>
      </div>
      
      {/* 主内容区 */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* 当前播放区域 */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
          {/* 唱片 */}
          <div onClick={togglePlay} className="mb-5">
            <VinylRecord isPlaying={isPlaying} size={140} color={stationColor} />
          </div>
          
          {/* 信息 */}
          <div className="text-center mb-5">
            <h3 className="text-white text-xl sm:text-2xl font-bold mb-1.5">
              {currentStation?.name || 'Lofi Radio'}
            </h3>
            <p className="text-white/30 text-xs mb-3">专注音乐，触手可及</p>
            
            {/* 标签 */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {currentStation?.style1 && (
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: `${stationColor}15`,
                    color: stationColor
                  }}
                >
                  {currentStation.style1}
                </span>
              )}
              {currentStation?.style2 && (
                <span className="px-2.5 py-1 rounded-full text-xs bg-white/[0.05] text-white/50">
                  {currentStation.style2}
                </span>
              )}
            </div>
          </div>
          
          {/* 播放控制 */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              onClick={prevStation}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
            >
              <SkipBack className="w-5 h-5 text-white/50" />
            </button>
            
            <button
              onClick={togglePlay}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`,
                boxShadow: `0 8px 30px ${stationColor}30`
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
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
            >
              <SkipForward className="w-5 h-5 text-white/50" />
            </button>
          </div>
          
          {/* 音量控制 */}
          <div className="w-full max-w-xs px-4">
            <div className="px-4 py-3 rounded-xl bg-white/[0.02]">
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
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02]">
              <Sparkles className="w-3.5 h-3.5 text-white/30" />
              <span className="text-white/30 text-xs">今日专注</span>
              <span 
                className="text-xs font-semibold tabular-nums"
                style={{ color: stationColor }}
              >
                {focusTime} 分钟
              </span>
            </div>
          </div>
        </div>
        
        {/* 电台列表按钮 - 桌面端侧边栏 */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-72 border-l border-white/[0.04] bg-black/20">
          <StationList onClose={() => setShowStationList(false)} onSelect={handleStationSelect} />
        </div>
      </div>
      
      {/* 移动端电台列表弹窗 */}
      <AnimatePresence>
        {showStationList && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div 
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowStationList(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 h-[75vh] rounded-t-2xl overflow-hidden bg-gradient-to-b from-zinc-900/95 to-black/98"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* 拖动指示器 */}
              <div className="flex justify-center pt-2.5 pb-1.5">
                <div className="w-9 h-1 rounded-full bg-white/20" />
              </div>
              <StationList onClose={() => setShowStationList(false)} onSelect={handleStationSelect} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
FullScreenPlayer.displayName = 'FullScreenPlayer';

// ==================== 迷你灵动岛 - 精致版 ====================
const MiniPlayer = memo(({ onExpand }: { onExpand: () => void }) => {
  const { isPlaying, currentStation, togglePlay, isLoading } = useAudioStore();
  const { focusTime } = useFocusTimer();
  const stationColor = currentStation?.color || '#8B5CF6';
  
  return (
    <div className="relative cursor-grab active:cursor-grabbing select-none">
      {/* 外部光晕 - 更柔和 */}
      <div
        className={cn(
          "absolute -inset-3 rounded-full transition-opacity duration-500",
          isPlaying ? "opacity-25" : "opacity-10"
        )}
        style={{ 
          background: `radial-gradient(ellipse, ${stationColor}12 0%, transparent 70%)`,
        }}
      />
      
      {/* 主体 - 更精致的玻璃质感 */}
      <div
        className="relative flex items-center gap-2 px-3 py-2 rounded-full"
        style={{
          background: `linear-gradient(145deg, rgba(30, 30, 35, 0.92) 0%, rgba(18, 18, 22, 0.96) 100%)`,
          backdropFilter: 'blur(20px)',
          boxShadow: `
            0 8px 30px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.04)
          `
        }}
      >
        {/* 迷你唱片 */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex-shrink-0 relative overflow-hidden",
            isPlaying && "animate-spin-slow"
          )}
          style={{ 
            background: 'linear-gradient(145deg, #1c1c1c, #0c0c0c)',
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              inset: '22%',
              background: `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`,
            }}
          />
          <div
            className="absolute rounded-full bg-black/50"
            style={{ inset: '44%' }}
          />
        </div>
        
        {/* 信息 */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white text-[11px] font-semibold truncate max-w-[80px]">
            {currentStation?.name || 'Lofi Radio'}
          </span>
          <div className="flex items-center gap-1 text-white/40 text-[9px]">
            <Clock className="w-2 h-2" />
            <span className="tabular-nums font-medium">{focusTime} min</span>
          </div>
        </div>
        
        {/* 播放按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ 
            background: `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`,
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5 text-white" />
          ) : (
            <Play className="w-3.5 h-3.5 text-white ml-0.5" />
          )}
        </button>
        
        {/* 展开按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
        >
          <Maximize2 className="w-3 h-3 text-white/50" />
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
  
  // 灵动岛边界约束
  useEffect(() => {
    const updateConstraints = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      const islandWidth = 200;
      const islandHeight = 45;
      const padding = 12;
      
      const leftLimit = padding;
      const rightLimit = windowWidth - islandWidth - padding;
      const topLimit = padding + 70;
      const bottomLimit = windowHeight - islandHeight - padding;
      
      const initialX = (windowWidth - islandWidth) / 2;
      const initialY = 75;
      
      setConstraints({
        left: leftLimit - initialX,
        right: rightLimit - initialX,
        top: topLimit - initialY,
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
      {/* 全屏播放器 */}
      <AnimatePresence>
        {!isMiniMode && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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
              top: '75px',
              marginLeft: '-100px',
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
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <MiniPlayer onExpand={() => setMiniMode(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
