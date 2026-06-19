import React, { useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1 } from 'lucide-react';
import { useCueStore } from '../../store/useCueStore';
import { getCueAtTime, formatTime } from '../../modules/timeUtils';
import { getFormationColor, SWITCH_MODE_LABELS } from '../../constants/config';
import { cn } from '../../lib/utils';

export const Preview: React.FC = () => {
  const cues = useCueStore((state) => state.cues);
  const currentTime = useCueStore((state) => state.currentTime);
  const totalDuration = useCueStore((state) => state.totalDuration);
  const isPlaying = useCueStore((state) => state.isPlaying);
  const isLoopMode = useCueStore((state) => state.isLoopMode);
  const loopRange = useCueStore((state) => state.loopRange);
  const loopCount = useCueStore((state) => state.loopCount);
  const currentLoopIndex = useCueStore((state) => state.currentLoopIndex);
  const setCurrentTime = useCueStore((state) => state.setCurrentTime);
  const setIsPlaying = useCueStore((state) => state.setIsPlaying);
  const setCurrentLoopIndex = useCueStore((state) => state.setCurrentLoopIndex);
  const snapTimeToLoop = useCueStore((state) => state.snapTimeToLoop);
  const setLoopMode = useCueStore((state) => state.setLoopMode);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const currentCue = useMemo(
    () => getCueAtTime(cues, currentTime),
    [cues, currentTime]
  );

  const playEnd = isLoopMode && loopRange ? loopRange.end : totalDuration;
  const playStart = isLoopMode && loopRange ? loopRange.start : 0;

  useEffect(() => {
    if (isPlaying && totalDuration > 0 && (!isLoopMode || loopRange)) {
      lastTimeRef.current = performance.now();

      const animate = (timestamp: number) => {
        const delta = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        setCurrentTime((prev) => {
          const next = prev + delta;
          const end = isLoopMode && loopRange ? loopRange.end : totalDuration;
          if (next >= end) {
            return end;
          }
          return next;
        });

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, totalDuration, isLoopMode, loopRange, setCurrentTime]);

  useEffect(() => {
    if (!isPlaying) return;

    if (isLoopMode && loopRange) {
      if (currentTime >= loopRange.end) {
        const nextIndex = currentLoopIndex + 1;
        if (loopCount > 0 && nextIndex >= loopCount) {
          setIsPlaying(false);
          setCurrentTime(loopRange.end);
        } else {
          setCurrentTime(loopRange.start);
          setCurrentLoopIndex(nextIndex);
        }
      }
    } else {
      if (currentTime >= totalDuration && totalDuration > 0) {
        setIsPlaying(false);
      }
    }
  }, [currentTime, isPlaying, totalDuration, isLoopMode, loopRange, loopCount, currentLoopIndex, setIsPlaying, setCurrentTime, setCurrentLoopIndex]);

  const handlePlayPause = () => {
    if (isLoopMode && loopRange) {
      if (currentTime >= loopRange.end) {
        setCurrentTime(loopRange.start);
        setCurrentLoopIndex(0);
        setIsPlaying(true);
      } else {
        setIsPlaying(!isPlaying);
      }
    } else {
      if (currentTime >= totalDuration) {
        setCurrentTime(0);
        setIsPlaying(true);
      } else {
        setIsPlaying(!isPlaying);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const snapped = snapTimeToLoop(time);
    setCurrentTime(snapped);
  };

  const handleSkipBack = () => {
    if (isLoopMode && loopRange) {
      setCurrentTime(loopRange.start);
    } else {
      setCurrentTime(0);
    }
    setIsPlaying(false);
    setCurrentLoopIndex(0);
  };

  const handleSkipForward = () => {
    if (isLoopMode && loopRange) {
      setCurrentTime(loopRange.end);
    } else {
      setCurrentTime(totalDuration);
    }
    setIsPlaying(false);
  };

  const handleToggleLoop = () => {
    setLoopMode(!isLoopMode);
  };

  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const formationColor = currentCue ? getFormationColor(currentCue.formation) : '#6B7280';

  const currentCueIndex = cues.findIndex((c) => c.id === currentCue?.id) + 1;

  const loopStartPercent = loopRange && totalDuration > 0 ? (loopRange.start / totalDuration) * 100 : 0;
  const loopEndPercent = loopRange && totalDuration > 0 ? (loopRange.end / totalDuration) * 100 : 0;
  const loopWidthPercent = loopEndPercent - loopStartPercent;

  return (
    <div className="bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-zinc-800 p-6">
      <div className="text-center mb-6">
        <p className="text-sm text-zinc-500 mb-2">当前队形</p>
        <div
          className="text-6xl font-bold mb-3 transition-all duration-300"
          style={{ color: formationColor }}
        >
          {currentCue ? currentCue.formation : '---'}
        </div>
        {currentCue && (
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="text-zinc-400">
              #{currentCueIndex} {currentCue.name}
            </span>
            <span className={cn(
              'px-2 py-0.5 rounded text-xs',
              currentCue.switchMode === 'run'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
            )}>
              {SWITCH_MODE_LABELS[currentCue.switchMode]}
            </span>
            {currentCue.isTransition && (
              <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">
                过渡
              </span>
            )}
          </div>
        )}
        {isLoopMode && loopRange && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <Repeat size={12} />
              循环排练中
            </span>
            {loopCount > 0 && (
              <span className="text-xs text-zinc-400">
                第 {currentLoopIndex + 1} / {loopCount} 次
              </span>
            )}
            {loopCount === 0 && (
              <span className="text-xs text-zinc-500">无限循环</span>
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="relative h-8 flex items-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-zinc-800 rounded-full overflow-hidden pointer-events-none">
            {loopRange && isLoopMode && (
              <>
                <div
                  className="absolute top-0 bottom-0 bg-zinc-900/70"
                  style={{ left: 0, width: `${loopStartPercent}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 bg-zinc-900/70"
                  style={{ right: 0, width: `${100 - loopEndPercent}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 bg-amber-500/20"
                  style={{
                    left: `${loopStartPercent}%`,
                    width: `${loopWidthPercent}%`,
                  }}
                />
              </>
            )}
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={totalDuration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-8 z-10 bg-transparent"
            disabled={totalDuration === 0}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-mono text-zinc-400">
          {formatTime(currentTime)}
        </span>
        {isLoopMode && loopRange ? (
          <span className="text-xs text-amber-400 font-mono">
            {formatTime(loopRange.start)} - {formatTime(loopRange.end)}
          </span>
        ) : (
          <span className="text-sm font-mono text-zinc-500">
            {formatTime(totalDuration)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleSkipBack}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          disabled={totalDuration === 0}
          title="回到起点"
        >
          <SkipBack size={20} />
        </button>

        <button
          onClick={handlePlayPause}
          className={cn(
            'p-4 rounded-full transition-all',
            totalDuration === 0
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-zinc-900 hover:scale-105 active:scale-95'
          )}
          disabled={totalDuration === 0}
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>

        <button
          onClick={handleSkipForward}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          disabled={totalDuration === 0}
          title="跳到结尾"
        >
          <SkipForward size={20} />
        </button>

        <button
          onClick={handleToggleLoop}
          className={cn(
            'p-2 rounded-lg transition-colors ml-2',
            isLoopMode
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800',
            !loopRange && 'opacity-50 cursor-not-allowed'
          )}
          disabled={!loopRange}
          title={loopRange ? '切换循环模式' : '请先在时间轴选择循环区间'}
        >
          {loopCount > 0 ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 text-center">
          {isLoopMode ? '循环播放模式：在区间内重复播放' : '拖动滑块或使用控制按钮预览队形'}
        </p>
      </div>
    </div>
  );
};
