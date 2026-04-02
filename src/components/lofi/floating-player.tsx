'use client';

import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Clock, Maximize2, Minimize2, Loader2, List, Radio, X, Sparkles, Music4, Music, Moon, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useAudioStore } from '@/store/audioStore';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { useSleepTimer } from '@/hooks/useSleepTimer';
import { stations, categories, getFilteredStations, Station } from '@/lib/stations';
import { cn } from '@/lib/utils';

// ==================== 黑胶唱片组件 ====================
const VinylRecord = memo(({ isPlaying, size = 120, color = '#8B5CF6' }: { isPlaying: boolean; size?: number; color?: string }) => {
  return (
    <div
      className="relative flex-shrink-0 cursor-pointer select-none"
      style={{ width: size, height: size }}
    >
      {/* 外部光晕 */}
      <div
        className={cn(
          "absolute -inset-4 rounded-full transition-opacity duration-500",
          isPlaying ? "animate-pulse-subtle" : "opacity-20"
        )}
        style={{
          background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
        }}
      />
      
      {/* 唱片主体 */}
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
        {/* 纹路 */}
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
        <Music 
          className="w-10 h-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
          style={{ color: 'rgba(255,255,255,0.95)' }}
        />
      </div>
    </div>
  );
});
VinylRecord.displayName = 'VinylRecord';

// ==================== 音量滑块组件 ====================
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
  const displayVolume = isMuted ? 0 : volume;

  return (
    <div className="flex items-center gap-3 w-full">
      <button
        onClick={onMuteToggle}
        aria-label={isMuted || volume === 0 ? '取消静音' : '静音'}
        className="flex-shrink-0 p-2 rounded-xl hover:bg-white/5 transition-colors"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-5 h-5 text-white/40" />
        ) : (
          <Volume2 className="w-5 h-5 text-white/60" />
        )}
      </button>
      
      <div className="flex-1 relative h-8 flex items-center group">
        {/* 背景轨道 */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/10 pointer-events-none" />
        
        {/* 已填充轨道 */}
        <div
          className="absolute left-0 h-1.5 rounded-full pointer-events-none transition-all duration-75"
          style={{
            background: `linear-gradient(90deg, ${stationColor}, ${stationColor}bb)`,
            width: `${displayVolume * 100}%`
          }}
        />
        
        {/* 原生 range input */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={displayVolume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          aria-label="音量"
          className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer appearance-none touch-pan-x z-10"
        />
        
        {/* 自定义滑块圆点 */}
        <div
          className="absolute w-4 h-4 rounded-full pointer-events-none transition-all duration-75"
          style={{
            background: 'linear-gradient(135deg, #fff, #e0e0e0)',
            left: `calc(${displayVolume * 100}% - 8px)`,
            boxShadow: `0 2px 6px rgba(0,0,0,0.25), 0 0 0 2px ${stationColor}25`,
            transform: 'translateZ(0)' // 硬件加速
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
      
      {/* 分类标签 */}
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
                  ? "text-white"
                  : "text-white/60 hover:text-white/80 bg-white/[0.06] hover:bg-white/[0.1]"
              )}
              style={{
                background: selectedCategory === cat.id
                  ? `linear-gradient(135deg, ${stationColor}, ${stationColor}dd)`
                  : undefined,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* 电台列表 */}
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
                  {/* 标签 */}
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
                        className="w-[2px] rounded-full animate-equalizer will-change-transform"
                        style={{ 
                          background: station.color,
                          animationDelay: `${i * 0.1}s`,
                          height: '16px', transform: 'scaleY(0.3)',
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
const FullScreenPlayer = memo(({ onClose, remainingSeconds }: { onClose: () => void; remainingSeconds: number | null }) => {
  const {
    isPlaying, isLoading, currentStation, volume, isMuted, userWantsPlay,
    hasError, errorMessage,
    requestPlay, requestPause, toggleMute, setVolume,
    nextStation, prevStation, selectStationById,
  } = useAudioStore();
  
  // 切换播放状态
  const togglePlay = useCallback(() => {
    if (userWantsPlay) {
      requestPause();
    } else {
      requestPlay();
    }
  }, [userWantsPlay, requestPlay, requestPause]);
  
  const { focusTime } = useFocusTimer();
  const { sleepTimerMinutes, sleepTimerEndTime, setSleepTimer } = useAudioStore();
  const stationColor = currentStation?.color || '#8B5CF6';
  const [showStationList, setShowStationList] = useState(false);
  const [showSleepTimerPanel, setShowSleepTimerPanel] = useState(false);
  const [customSleepMinutes, setCustomSleepMinutes] = useState('');
  const sleepPresetOptions = useMemo(() => [15, 30, 45, 60, 90, 120], []);

  const toggleSleepTimerPanel = useCallback(() => {
    setShowSleepTimerPanel(prev => !prev);
  }, []);

  const handleSleepPreset = useCallback((minutes: number | null) => {
    setSleepTimer(minutes);
    setShowSleepTimerPanel(false);
  }, [setSleepTimer]);

  const parsedCustomMinutes = Number(customSleepMinutes);
  const isCustomMinutesValid = customSleepMinutes.trim().length > 0 && Number.isFinite(parsedCustomMinutes) && parsedCustomMinutes >= 1 && parsedCustomMinutes <= 480;

  const handleCustomSleepTimer = useCallback(() => {
    if (!isCustomMinutesValid) return;
    setSleepTimer(Math.round(parsedCustomMinutes));
    setCustomSleepMinutes('');
    setShowSleepTimerPanel(false);
  }, [isCustomMinutesValid, parsedCustomMinutes, setSleepTimer]);

  const formatRemaining = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
  };
  
  const handleStationSelect = useCallback((station: Station) => {
    selectStationById(station.id);
  }, [selectStationById]);
  
  return (
    <div className="relative w-full h-full flex overflow-hidden">
      {/* 背景层 */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(135deg, 
            ${stationColor}25 0%, 
            ${stationColor}10 30%,
            ${stationColor}08 70%,
            ${stationColor}18 100%
          ),
          linear-gradient(45deg,
            ${stationColor}10 0%,
            ${stationColor}15 50%,
            ${stationColor}10 100%
          ),
          rgba(15, 15, 25, 0.95)`,
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)'
        }}
      />
      
      {/* 主内容区 */}
      <div className="relative z-10 flex-1 h-full flex flex-col lg:flex-row overflow-y-auto overscroll-contain">
        {/* 播放器主体 */}
        <div className="flex-1 flex flex-col min-w-0 flex items-center justify-start lg:justify-center py-14 sm:py-16 lg:py-0">
          {/* 唱片容器 */}
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
          
          {/* 错误提示 */}
          <AnimatePresence>
            {hasError && errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <p className="text-red-400 text-sm text-center">{errorMessage}</p>
                <p className="text-red-400/60 text-xs text-center mt-1">试试切换到其他电台</p>
              </motion.div>
            )}
          </AnimatePresence>
          
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
          
          {/* 专注时间 + 睡眠定时器 */}
          <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            {/* 专注时间 */}
            <div 
              className="flex items-center justify-center gap-1 px-1 py-2 rounded-full whitespace-nowrap"
              style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
            >
              <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: `${stationColor}80` }} />
              <span className="text-[11px] text-white/30">今日专注</span>
              <span 
                className="text-xs font-bold tabular-nums"
                style={{ color: stationColor }}
              >
                {focusTime}分钟
              </span>
            </div>

            {/* 睡眠定时器 */}
            <button
              onClick={toggleSleepTimerPanel}
              className="flex items-center justify-center gap-1 px-1 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all duration-200 hover:bg-white/[0.08] active:scale-[0.97]"
              style={{
                background: sleepTimerEndTime ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.04)',
                border: sleepTimerEndTime ? `1px solid ${stationColor}25` : '1px solid rgba(255, 255, 255, 0.05)'
              }}
              title="打开睡眠定时设置"
            >
              <Moon className="w-5 h-5 flex-shrink-0" style={{ color: sleepTimerEndTime ? stationColor : 'rgba(255,255,255,0.3)' }} />
              <span className="text-[11px] text-white/30">睡眠定时</span>
              <span
                className="text-xs font-bold tabular-nums"
                style={{ color: sleepTimerEndTime ? stationColor : 'rgba(255,255,255,0.3)' }}
              >
                {sleepTimerEndTime && remainingSeconds !== null
                  ? formatRemaining(remainingSeconds)
                  : '关闭'}
              </span>
              {showSleepTimerPanel ? (
                <ChevronUp className="w-3.5 h-3.5 text-white/35" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-white/35" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {showSleepTimerPanel && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="w-full max-w-xs sm:max-w-sm mt-3 p-3 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/55">快速设置</span>
                  <button
                    onClick={() => handleSleepPreset(null)}
                    className="text-xs px-2 py-1 rounded-full transition-colors hover:bg-white/[0.09]"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    关闭定时
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {sleepPresetOptions.map((minutes) => {
                    const isActive = sleepTimerMinutes === minutes;
                    return (
                      <button
                        key={minutes}
                        onClick={() => handleSleepPreset(minutes)}
                        className="px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150"
                        style={{
                          background: isActive ? `${stationColor}26` : 'rgba(255, 255, 255, 0.05)',
                          border: isActive ? `1px solid ${stationColor}55` : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isActive ? stationColor : 'rgba(255, 255, 255, 0.76)'
                        }}
                      >
                        {minutes} 分钟
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    type="number"
                    min={1}
                    max={480}
                    inputMode="numeric"
                    value={customSleepMinutes}
                    onChange={(e) => setCustomSleepMinutes(e.target.value.replace(/[^\d]/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCustomSleepTimer();
                      }
                    }}
                    placeholder="自定义分钟（1-480）"
                    className="flex-1 h-10 px-3 rounded-xl text-sm text-white placeholder:text-white/35 outline-none"
                    style={{
                      background: 'rgba(0, 0, 0, 0.18)',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                  />
                  <button
                    onClick={handleCustomSleepTimer}
                    disabled={!isCustomMinutesValid}
                    className="h-10 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(135deg, ${stationColor}, ${stationColor}cc)`,
                      color: 'white'
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    设置
                  </button>
                </div>
                {customSleepMinutes.trim().length > 0 && !isCustomMinutesValid && (
                  <p className="text-[11px] text-amber-300/90 mt-2">请输入 1 到 480 分钟</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 移动端电台列表按钮 */}
          <button
            onClick={() => setShowStationList(true)}
            className="lg:hidden mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
          >
            <List className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-sm">电台列表</span>
          </button>
        </div>
        
        {/* 右侧电台列表 */}
        <div 
          className="hidden lg:flex w-80 flex-col border-l border-white/[0.08]"
          style={{ 
            background: 'linear-gradient(180deg, rgba(30, 30, 45, 0.6) 0%, rgba(20, 20, 35, 0.7) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <StationList onClose={() => {}} onSelect={handleStationSelect} isDesktop={true} />
        </div>
      </div>
      
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.08] hover:bg-white/[0.15] transition-all duration-200"
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
        <span className="text-white/60 text-sm font-medium">Lofi Radio</span>
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
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowStationList(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 h-[80vh] rounded-t-3xl overflow-hidden"
              style={{ 
                background: 'linear-gradient(180deg, rgba(35, 35, 50, 0.85) 0%, rgba(25, 25, 40, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
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

// ==================== 迷你灵动岛 ====================
const MiniPlayer = memo(({ onExpand }: { onExpand: () => void }) => {
  const { isPlaying, currentStation, isLoading, userWantsPlay, hasError, requestPlay, requestPause, nextStation, prevStation } = useAudioStore();
  const { focusTime } = useFocusTimer();
  const stationColor = hasError ? '#EF4444' : (currentStation?.color || '#8B5CF6');
  
  const togglePlay = useCallback(() => {
    if (userWantsPlay) requestPause();
    else requestPlay();
  }, [userWantsPlay, requestPlay, requestPause]);
  
  return (
    <div className="relative cursor-grab active:cursor-grabbing select-none group/island">
      {/* 外部光晕 */}
      <div
        className={cn(
          "absolute -inset-3 sm:-inset-4 rounded-full transition-all duration-700 ease-in-out",
          isPlaying ? "opacity-100 animate-breathe" : "opacity-30"
        )}
        style={{ 
          background: `radial-gradient(ellipse, ${stationColor}40 0%, ${stationColor}15 45%, transparent 70%)`,
          filter: 'blur(12px)',
        }}
      />
      
      {/* 主体 */}
      <div
        className="relative flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-2 rounded-full overflow-hidden transition-all duration-300 bg-white/55 dark:bg-[#1a1a2e]/50 border border-white/50 dark:border-white/[0.12] shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
        style={{
          backdropFilter: 'blur(24px) saturate(170%)',
          WebkitBackdropFilter: 'blur(24px) saturate(170%)',
        }}
      >
        {/* 动态主题色内发光 */}
        <div 
          className={cn(
            "absolute inset-0 pointer-events-none rounded-full transition-opacity duration-500",
            isPlaying ? "opacity-100" : "opacity-50"
          )}
          style={{ boxShadow: `inset 0 0 24px ${stationColor}18` }}
        />
        {/* 亮色模式边缘反射 */}
        <div className="absolute inset-0 pointer-events-none rounded-full dark:hidden" style={{ boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.04)' }} />
        {/* 暗色模式边缘反射 */}
        <div className="absolute inset-0 pointer-events-none rounded-full hidden dark:block" style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), inset 0 -1px 1px rgba(0,0,0,0.2)' }} />
        {/* 顶部流光 */}
        <div className="absolute top-0 inset-x-0 h-[45%] pointer-events-none rounded-t-full bg-gradient-to-b from-white/40 dark:from-white/[0.08] to-transparent" />

        {/* 唱片 */}
        <div className="relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0">
          <div
            className={cn(
              "absolute inset-0 rounded-full overflow-hidden",
              isPlaying && "animate-spin-slow"
            )}
            style={{ 
              background: 'conic-gradient(from 45deg, #3a3a52, #2c2c44, #3a3a52, #2c2c44)',
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                inset: '22%',
                background: `linear-gradient(135deg, ${stationColor}, ${stationColor}bb)`,
              }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-black/25 dark:bg-black/35" />
          </div>
        </div>
        
        {/* 站点信息 */}
        <div className="flex flex-col min-w-0 flex-1 relative z-10">
          <span className="text-slate-700 dark:text-white/95 text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-[100px]">
            {currentStation?.name || 'Lofi Radio'}
          </span>
          <div className="flex items-center gap-1 text-slate-500 dark:text-white/55 text-[10px] sm:text-xs font-medium">
            {hasError ? (
              <span className="text-red-500 dark:text-red-400">播放失败</span>
            ) : (
              <>
                <Clock className="w-2.5 h-2.5" />
                <span className="tabular-nums">{focusTime} min</span>
              </>
            )}
          </div>
        </div>

        {/* 移动端：⏮ ▶ ⏭ */}
        <div className="flex items-center gap-0.5 sm:hidden relative z-10">
          <button
            onClick={(e) => { e.stopPropagation(); prevStation(); }}
            aria-label="上一首"
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <SkipBack className="w-2.5 h-2.5 text-slate-400 dark:text-white/50 fill-current" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            aria-label={isPlaying ? '暂停' : '播放'}
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ 
              background: `linear-gradient(135deg, ${stationColor}, ${stationColor}dd)`,
            }}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-3 h-3 text-white" />
            ) : (
              <Play className="w-3 h-3 text-white ml-[1px]" />
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextStation(); }}
            aria-label="下一首"
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <SkipForward className="w-2.5 h-2.5 text-slate-400 dark:text-white/50 fill-current" />
          </button>
        </div>

        {/* 桌面端：播放 + 展开 */}
        <div className="hidden sm:flex items-center gap-2.5 relative z-10">
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            aria-label={isPlaying ? '暂停' : '播放'}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 hover:scale-105 transition-transform"
            style={{ 
              background: `linear-gradient(135deg, ${stationColor}, ${stationColor}dd)`,
            }}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-white" />
            ) : (
              <Play className="w-3.5 h-3.5 text-white ml-0.5" />
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            aria-label="展开播放器"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/[0.08] hover:bg-black/[0.12] dark:bg-white/[0.1] dark:hover:bg-white/[0.18] transition-all duration-200"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-500 dark:text-white/70" />
          </button>
        </div>
      </div>
    </div>
  );
});
MiniPlayer.displayName = 'MiniPlayer';

// ==================== 主组件 ====================
export function FloatingPlayer() {
  const { remainingSeconds } = useSleepTimer();
  const { isMiniMode, setMiniMode, currentStation } = useAudioStore();
  const dragControls = useDragControls();
  const miniIslandRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  const [miniIslandWidth, setMiniIslandWidth] = useState(220);
  const lastTapRef = useRef<number>(0);
  const scrollYRef = useRef(0);

  // 全屏模式锁定页面滚动，避免移动端滚动穿透到底层页面
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isMiniMode) return;

    const html = document.documentElement;
    const body = document.body;

    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyLeft = body.style.left;
    const prevBodyRight = body.style.right;
    const prevBodyWidth = body.style.width;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevHtmlOverscroll = html.style.overscrollBehavior;

    scrollYRef.current = window.scrollY || window.pageYOffset || 0;

    body.style.position = 'fixed';
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    html.style.overscrollBehavior = 'none';

    return () => {
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.width = prevBodyWidth;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      html.style.overscrollBehavior = prevHtmlOverscroll;

      window.scrollTo(0, scrollYRef.current);
    };
  }, [isMiniMode]);
  
  // 灵动岛边界约束 - 允许拖到屏幕边缘
  useEffect(() => {
    const edgePadding = 20;
    const initialY = 70;

    const getIslandSize = () => {
      const width = miniIslandRef.current?.offsetWidth;
      const height = miniIslandRef.current?.offsetHeight;

      if (width && height) {
        setMiniIslandWidth(width);
        return { width, height };
      }

      const fallbackWidth = window.innerWidth < 640 ? 200 : 220;
      return {
        width: fallbackWidth,
        height: window.innerWidth < 640 ? 50 : 56,
      };
    };

    const getComputedConstraints = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const { width: islandWidth, height: islandHeight } = getIslandSize();
      const initialX = (windowWidth - islandWidth) / 2;

      return {
        left: edgePadding - initialX,
        right: windowWidth - islandWidth - edgePadding - initialX,
        top: edgePadding - initialY,
        bottom: windowHeight - islandHeight - edgePadding - initialY,
      };
    };

    const clampToConstraints = (nextConstraints: { left: number; right: number; top: number; bottom: number }) => {
      setPosition((prev) => ({
        x: Math.min(nextConstraints.right, Math.max(nextConstraints.left, prev.x)),
        y: Math.min(nextConstraints.bottom, Math.max(nextConstraints.top, prev.y)),
      }));
    };

    const updateConstraints = () => {
      const nextConstraints = getComputedConstraints();
      setConstraints(nextConstraints);
      clampToConstraints(nextConstraints);
    };
    
    const rafId = window.requestAnimationFrame(updateConstraints);
    window.addEventListener('resize', updateConstraints);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateConstraints);
    };
  }, [isMiniMode, currentStation?.id]);
  
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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <FullScreenPlayer onClose={() => setMiniMode(true)} remainingSeconds={remainingSeconds} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 迷你灵动岛 */}
      <AnimatePresence>
        {isMiniMode && (
          <motion.div
            ref={miniIslandRef}
            className={cn("fixed pointer-events-auto z-50", isDragging ? "cursor-grabbing" : "cursor-grab")}
            style={{ 
              left: '50%', 
              top: '70px',
              marginLeft: `-${miniIslandWidth / 2}px`,
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
