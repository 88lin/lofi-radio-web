'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Clock, Maximize2, Minimize2, Loader2, List, Radio, Headphones, X, Sparkles, Music4 } from 'lucide-react';
import { useAudioStore } from '@/store/audioStore';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { stations, categories, getFilteredStations, Station } from '@/lib/stations';
import { cn } from '@/lib/utils';

// ==================== 黑胶唱片组件 ====================
const VinylRecord = ({ isPlaying, size = 120, color = '#8B5CF6' }: { isPlaying: boolean; size?: number; color?: string }) => {
  return (
    <motion.div
      className="relative flex-shrink-0 cursor-pointer select-none"
      style={{ width: size, height: size }}
      animate={{ rotate: isPlaying ? 360 : 0 }}
      transition={{ duration: 8, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
    >
      {/* 外部光晕 */}
      <motion.div
        className="absolute -inset-6 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        }}
        animate={{ 
          opacity: isPlaying ? [0.3, 0.6, 0.3] : 0.2,
          scale: isPlaying ? [1, 1.05, 1] : 1 
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      {/* 唱片主体 - 更精致的渐变 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.4) 0%, transparent 45%),
            conic-gradient(from 0deg, #1a1a1a, #252525, #1a1a1a, #252525, #1a1a1a)
          `,
          boxShadow: `
            inset 0 2px 8px rgba(255, 255, 255, 0.06),
            inset 0 -2px 8px rgba(0, 0, 0, 0.4),
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.02)
            ${isPlaying ? `, 0 0 60px ${color}20` : ''}
          `
        }}
      >
        {/* 纹路 */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              inset: `${(i + 1) * 5.5}%`,
              border: '1px solid rgba(255, 255, 255, 0.015)'
            }}
          />
        ))}
      </div>
      
      {/* 中心标签 - 更精致 */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          inset: '25%',
          background: `
            radial-gradient(circle at 35% 35%, ${color}60 0%, transparent 50%),
            linear-gradient(135deg, ${color}, ${color}cc)
          `,
          boxShadow: `
            inset 0 2px 10px rgba(0, 0, 0, 0.3),
            inset 0 -1px 3px rgba(255, 255, 255, 0.1),
            0 0 25px ${color}25
          `
        }}
      >
        <Headphones className="w-5 h-5 text-white/90 drop-shadow-lg" />
      </div>
      
      {/* 中心孔 */}
      <div
        className="absolute rounded-full"
        style={{
          inset: '44%',
          background: 'radial-gradient(circle, #000 0%, #151515 100%)',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.9)'
        }}
      />
    </motion.div>
  );
};

// ==================== 音量滑块组件 ====================
const VolumeSlider = ({ 
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
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onMuteToggle();
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flex-shrink-0 p-2 rounded-xl hover:bg-white/5 transition-colors"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-5 h-5 text-white/40" />
        ) : (
          <Volume2 className="w-5 h-5 text-white/60" />
        )}
      </motion.button>
      
      <div 
        ref={sliderRef}
        className="flex-1 relative h-8 flex items-center cursor-pointer"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* 背景轨道 */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/10" />
        
        {/* 已填充轨道 */}
        <motion.div
          className="absolute left-0 h-1.5 rounded-full pointer-events-none"
          style={{
            background: `linear-gradient(90deg, ${stationColor}, ${stationColor}bb)`,
            width: `${displayVolume * 100}%`
          }}
        />
        
        {/* 滑块 */}
        <motion.div
          className="absolute w-4 h-4 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #fff, #e0e0e0)',
            left: `calc(${displayVolume * 100}% - 8px)`,
            boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 0 3px ${stationColor}30`
          }}
        />
      </div>
      
      <span className="text-white/40 text-xs w-10 text-right tabular-nums font-mono">
        {Math.round(displayVolume * 100)}%
      </span>
    </div>
  );
};

// ==================== 电台列表组件 ====================
const StationList = ({ onClose, onSelect }: { onClose: () => void; onSelect: (station: Station) => void }) => {
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
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`,
              boxShadow: `0 4px 15px ${stationColor}30`
            }}
          >
            <Radio className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-white font-semibold text-base">电台列表</h3>
          <span className="text-white/30 text-xs">({filteredStations.length})</span>
        </div>
        <motion.button
          onClick={(e) => { 
            e.stopPropagation(); 
            onClose(); 
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4 text-white/60" />
        </motion.button>
      </div>
      
      {/* 分类标签 */}
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCategory(cat.id);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                selectedCategory === cat.id
                  ? "text-white shadow-lg"
                  : "text-white/50 hover:text-white/70 bg-white/[0.03] hover:bg-white/[0.06]"
              )}
              style={{
                background: selectedCategory === cat.id
                  ? `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`
                  : undefined,
                boxShadow: selectedCategory === cat.id
                  ? `0 4px 15px ${stationColor}30`
                  : undefined
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {cat.name}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* 电台列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid gap-2">
          {filteredStations.map((station, index) => {
            const isActive = currentStation?.id === station.id;
            return (
              <motion.button
                key={station.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(station);
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                className={cn(
                  "w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all relative overflow-hidden group",
                  isActive
                    ? "bg-white/[0.08]"
                    : "hover:bg-white/[0.04]"
                )}
                style={{
                  borderLeft: isActive ? `3px solid ${station.color}` : '3px solid transparent',
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* 悬停背景效果 */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at 10% 50%, ${station.color}08 0%, transparent 50%)`,
                  }}
                />
                
                {/* 图标 */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                  style={{ 
                    background: `${station.color}12`,
                  }}
                >
                  {isActive && isPlaying ? (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="w-4 h-4 rounded-full"
                      style={{ 
                        background: `linear-gradient(135deg, ${station.color}, ${station.color}bb)`,
                        boxShadow: `0 0 10px ${station.color}50`
                      }}
                    />
                  ) : (
                    <Music4 className="w-5 h-5" style={{ color: station.color }} />
                  )}
                </div>
                
                {/* 信息 */}
                <div className="flex-1 min-w-0 text-left relative">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      isActive ? "text-white" : "text-white/80"
                    )}>
                      {station.name}
                    </span>
                    {station.custom && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: `${station.color}25`,
                          color: station.color
                        }}
                      >
                        {station.custom}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40">
                      {station.style1}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/30">
                      {station.style2}
                    </span>
                    <span className="text-[10px] text-white/25">
                      · {station.scene}
                    </span>
                  </div>
                </div>
                
                {/* 播放指示 */}
                {isActive && isPlaying && (
                  <motion.div
                    className="flex items-center gap-0.5 mr-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 rounded-full"
                        style={{ background: station.color }}
                        animate={{ height: [4, 10, 4] }}
                        transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ==================== 全屏播放器 ====================
const FullScreenPlayer = ({ onClose }: { onClose: () => void }) => {
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
    <motion.div
      className="relative w-full h-full flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 背景渐变 - 更精致的暗色 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% -10%, ${stationColor}12 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 110%, ${stationColor}08 0%, transparent 50%),
            linear-gradient(180deg, rgba(15, 15, 18, 0.99) 0%, rgba(10, 10, 12, 0.995) 100%)
          `
        }}
      />
      
      {/* 动态背景粒子 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              width: 180 + i * 40,
              height: 180 + i * 40,
              left: `${8 + i * 18}%`,
              top: `${15 + i * 12}%`,
              background: `${stationColor}06`,
            }}
            animate={{
              x: [0, 25, 0],
              y: [0, -15, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
      
      {/* 顶部导航 */}
      <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.04]">
        <motion.button
          onClick={onClose}
          className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Minimize2 className="w-5 h-5 text-white/50" />
        </motion.button>
        
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-2.5 h-2.5 rounded-full"
            style={{ 
              background: `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`,
              boxShadow: `0 0 12px ${stationColor}50`
            }}
            animate={isPlaying ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <h2 className="text-white/80 font-medium text-base">Lofi Radio</h2>
        </div>
        
        <motion.button
          onClick={() => setShowStationList(true)}
          className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <List className="w-5 h-5 text-white/50" />
        </motion.button>
      </div>
      
      {/* 主内容区 */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* 当前播放区域 */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* 唱片 */}
          <motion.div
            onClick={togglePlay}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mb-6 sm:mb-8"
          >
            <VinylRecord isPlaying={isPlaying} size={160} color={stationColor} />
          </motion.div>
          
          {/* 信息 */}
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-white text-2xl sm:text-3xl font-bold mb-2 tracking-tight">
              {currentStation?.name || 'Lofi Radio'}
            </h3>
            <p className="text-white/30 text-sm mb-4">专注音乐，触手可及</p>
            
            {/* 标签 */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {currentStation?.style1 && (
                <span
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    background: `${stationColor}18`,
                    color: stationColor
                  }}
                >
                  {currentStation.style1}
                </span>
              )}
              {currentStation?.style2 && (
                <span className="px-3 py-1.5 rounded-full text-sm bg-white/[0.06] text-white/50">
                  {currentStation.style2}
                </span>
              )}
              {currentStation?.scene && (
                <span className="px-3 py-1.5 rounded-full text-sm bg-blue-500/10 text-blue-300/80">
                  {currentStation.scene}
                </span>
              )}
            </div>
          </div>
          
          {/* 播放控制 */}
          <div className="flex items-center justify-center gap-8 sm:gap-10 mb-8 sm:mb-10">
            <motion.button
              onClick={prevStation}
              className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <SkipBack className="w-6 h-6 text-white/50" />
            </motion.button>
            
            <motion.button
              onClick={togglePlay}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`,
                boxShadow: `0 10px 40px ${stationColor}35`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              {/* 内部光效 */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                animate={isPlaying ? { opacity: [0.2, 0.4, 0.2] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {isLoading ? (
                <Loader2 className="w-9 h-9 text-white animate-spin relative z-10" />
              ) : isPlaying ? (
                <Pause className="w-9 h-9 text-white relative z-10" />
              ) : (
                <Play className="w-9 h-9 text-white ml-1 relative z-10" />
              )}
            </motion.button>
            
            <motion.button
              onClick={nextStation}
              className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <SkipForward className="w-6 h-6 text-white/50" />
            </motion.button>
          </div>
          
          {/* 音量控制 */}
          <div className="w-full max-w-md px-4">
            <div className="px-5 py-4 rounded-2xl bg-white/[0.02]">
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
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.02]">
              <Sparkles className="w-4 h-4 text-white/30" />
              <span className="text-white/30 text-sm">今日专注</span>
              <span 
                className="text-sm font-semibold tabular-nums"
                style={{ color: stationColor }}
              >
                {focusTime} 分钟
              </span>
            </div>
          </div>
        </div>
        
        {/* 电台列表按钮 - 桌面端侧边栏 */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-80 border-l border-white/[0.04] bg-black/20 backdrop-blur-sm">
          <StationList onClose={() => setShowStationList(false)} onSelect={handleStationSelect} />
        </div>
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
            <motion.div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowStationList(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 h-[80vh] rounded-t-3xl overflow-hidden bg-gradient-to-b from-zinc-900/95 to-black/98 backdrop-blur-xl"
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
    </motion.div>
  );
};

// ==================== 迷你灵动岛 - 精致版 ====================
const MiniPlayer = ({ onExpand }: { onExpand: () => void }) => {
  const { isPlaying, currentStation, togglePlay, isLoading } = useAudioStore();
  const { focusTime } = useFocusTimer();
  const stationColor = currentStation?.color || '#8B5CF6';
  
  return (
    <motion.div
      className="relative cursor-grab active:cursor-grabbing select-none"
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
    >
      {/* 外部光晕 - 更柔和 */}
      <motion.div
        className="absolute -inset-5 rounded-full blur-2xl"
        style={{ background: `radial-gradient(ellipse, ${stationColor}15 0%, transparent 70%)` }}
        animate={{ opacity: isPlaying ? [0.15, 0.3, 0.15] : 0.08 }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      {/* 主体 - 更精致的玻璃质感 */}
      <div
        className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full"
        style={{
          background: `
            linear-gradient(145deg, rgba(35, 35, 40, 0.95) 0%, rgba(18, 18, 22, 0.98) 100%)
          `,
          backdropFilter: 'blur(40px)',
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            ${isPlaying ? `0 0 40px ${stationColor}10` : ''}
          `
        }}
      >
        {/* 迷你唱片 - 更精致 */}
        <motion.div
          className="w-9 h-9 rounded-full flex-shrink-0 relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(145deg, #1c1c1c, #0c0c0c)',
            boxShadow: 'inset 0 1px 4px rgba(255,255,255,0.04), inset 0 -1px 4px rgba(0,0,0,0.3)'
          }}
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 4, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
        >
          <div
            className="absolute rounded-full"
            style={{
              inset: '20%',
              background: `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`,
              boxShadow: `0 0 12px ${stationColor}30`
            }}
          />
          <div
            className="absolute rounded-full bg-black/60"
            style={{ inset: '44%' }}
          />
        </motion.div>
        
        {/* 信息 */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white text-xs font-semibold truncate max-w-[85px] drop-shadow-sm">
            {currentStation?.name || 'Lofi Radio'}
          </span>
          <div className="flex items-center gap-1.5 text-white/50 text-[10px]">
            <Clock className="w-2.5 h-2.5" />
            <span className="tabular-nums font-medium">{focusTime} min</span>
          </div>
        </div>
        
        {/* 播放按钮 - 更精致 */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`,
            boxShadow: `0 3px 12px ${stationColor}35`
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 text-white drop-shadow-sm" />
          ) : (
            <Play className="w-4 h-4 text-white ml-0.5 drop-shadow-sm" />
          )}
        </motion.button>
        
        {/* 展开按钮 */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Maximize2 className="w-3.5 h-3.5 text-white/50" />
        </motion.button>
      </div>
    </motion.div>
  );
};

// ==================== 主组件 ====================
export function FloatingPlayer() {
  const { isMiniMode, setMiniMode } = useAudioStore();
  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  const lastTapRef = useRef<number>(0);
  
  // 灵动岛边界约束 - 动态计算
  useEffect(() => {
    const updateConstraints = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // 灵动岛尺寸
      const islandWidth = 220;
      const islandHeight = 50;
      const padding = 16;
      
      // 计算边界
      const leftLimit = padding;
      const rightLimit = windowWidth - islandWidth - padding;
      const topLimit = padding + 60; // 考虑导航栏高度
      const bottomLimit = windowHeight - islandHeight - padding;
      
      // 初始位置在屏幕中央
      const initialX = (windowWidth - islandWidth) / 2;
      const initialY = 80;
      
      // 计算相对于初始位置的约束
      setConstraints({
        left: leftLimit - initialX,
        right: rightLimit - initialX,
        top: topLimit - initialY,
        bottom: bottomLimit - initialY
      });
      
      // 重置位置到中央
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
    // 如果点击的是按钮或输入框，不触发拖动
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
    // 更新位置
    setPosition(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y
    }));
  }, []);
  
  return (
    <>
      {/* 全屏播放器 - 固定位置，不可拖动 */}
      <AnimatePresence>
        {!isMiniMode && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FullScreenPlayer onClose={() => setMiniMode(true)} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 迷你灵动岛 - 可拖动 */}
      <AnimatePresence>
        {isMiniMode && (
          <motion.div
            ref={containerRef}
            className={cn("fixed pointer-events-auto z-50", isDragging ? "cursor-grabbing" : "cursor-grab")}
            style={{ 
              left: '50%', 
              top: '80px',
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
            whileDrag={{ scale: 1.03 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <MiniPlayer onExpand={() => setMiniMode(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
