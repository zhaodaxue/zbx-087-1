import React, { useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useCueStore } from '../../store/useCueStore';
import { getCueAtTime, formatTime } from '../../modules/timeUtils';
import { getFormationColor, SWITCH_MODE_LABELS } from '../../constants/config';
import { cn } from '../../lib/utils';

export const Preview: React.FC = () => {
  const cues = useCueStore((state) => state.cues);
  const currentTime = useCueStore((state) => state.currentTime);
  const totalDuration = useCueStore((state) => state.totalDuration);
  const isPlaying = useCueStore((state) => state.isPlaying);
  const setCurrentTime = useCueStore((state) => state.setCurrentTime);
  const setIsPlaying = useCueStore((state) => state.setIsPlaying);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const currentCue = useMemo(() => getCueAtTime(cues, currentTime), [cues, currentTime]);

  useEffect(() => {
    if (isPlaying && totalDuration > 0) {
      lastTimeRef.current = performance.now();

      const animate = (timestamp: number) => {
        const delta = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
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
  }, [isPlaying, totalDuration, setCurrentTime, setIsPlaying]);

  const handlePlayPause = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
  };

  const handleSkipBack = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSkipForward = () => {
    setCurrentTime(totalDuration);
    setIsPlaying(false);
  };

  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const formationColor = currentCue ? getFormationColor(currentCue.formation) : '#6B7280';

  const currentCueIndex = cues.findIndex((c) => c.id === currentCue?.id) + 1;

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
      </div>

      <div className="mb-4">
        <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-100"
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
          className="absolute opacity-0 w-full cursor-pointer -mt-2"
          disabled={totalDuration === 0}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-mono text-zinc-400">
          {formatTime(currentTime)}
        </span>
        <span className="text-sm font-mono text-zinc-500">
          {formatTime(totalDuration)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleSkipBack}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          disabled={totalDuration === 0}
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
        >
          <SkipForward size={20} />
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 text-center">
          拖动时间轴或使用滑块预览队形
        </p>
      </div>
    </div>
  );
};
