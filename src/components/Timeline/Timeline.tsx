import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { useCueStore } from '../../store/useCueStore';
import { calculateCueTimings, formatTime } from '../../modules/timeUtils';
import { getFormationColor, MAX_TOTAL_DURATION } from '../../constants/config';
import { cn } from '../../lib/utils';

const generateTimeMarkers = (totalDuration: number): number[] => {
  const markers: number[] = [];
  const interval = totalDuration > 300 ? 60 : totalDuration > 120 ? 30 : 10;
  for (let t = 0; t <= totalDuration; t += interval) {
    markers.push(t);
  }
  if (markers[markers.length - 1] !== totalDuration) {
    markers.push(totalDuration);
  }
  return markers;
};

export const Timeline: React.FC = () => {
  const cues = useCueStore((state) => state.cues);
  const currentTime = useCueStore((state) => state.currentTime);
  const totalDuration = useCueStore((state) => state.totalDuration);
  const setCurrentTime = useCueStore((state) => state.setCurrentTime);
  const setEditingCueId = useCueStore((state) => state.setEditingCueId);

  const timings = useMemo(() => calculateCueTimings(cues), [cues]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * totalDuration;
    setCurrentTime(Math.max(0, Math.min(time, totalDuration)));
  };

  const getCueIndexAtTime = (time: number): number => {
    for (let i = 0; i < timings.length; i++) {
      if (time >= timings[i].startTime && time < timings[i].endTime) {
        return i;
      }
    }
    if (time >= totalDuration && cues.length > 0) {
      return cues.length - 1;
    }
    return -1;
  };

  const currentCueIndex = getCueIndexAtTime(currentTime);

  const markers = useMemo(() => generateTimeMarkers(totalDuration), [totalDuration]);
  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-amber-500" />
          <h3 className="font-semibold text-white">时间轴</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-400">
            当前: <span className="text-white font-mono">{formatTime(currentTime)}</span>
          </span>
          <span className="text-zinc-500">/</span>
          <span className={cn(
            'font-mono',
            totalDuration > MAX_TOTAL_DURATION ? 'text-red-400' : 'text-zinc-400'
          )}>
            总时长: <span className="text-white">{formatTime(totalDuration)}</span>
            <span className="text-zinc-500 ml-1">/ {formatTime(MAX_TOTAL_DURATION)}</span>
          </span>
        </div>
      </div>

      <div
        className="relative h-16 bg-zinc-800/50 rounded-lg cursor-pointer overflow-hidden"
        onClick={handleTimelineClick}
      >
        {cues.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
            暂无 Cue
          </div>
        ) : (
          <>
            <div className="absolute inset-0 flex">
              {cues.map((cue, index) => {
                const width = totalDuration > 0 ? (cue.duration / totalDuration) * 100 : 0;
                const color = getFormationColor(cue.formation);
                const isActive = index === currentCueIndex;

                return (
                  <div
                    key={cue.id}
                    className={cn(
                      'relative h-full transition-all duration-200 group',
                      cue.isTransition && 'border-l-2 border-dashed border-zinc-600'
                    )}
                    style={{
                      width: `${width}%`,
                      backgroundColor: color,
                      opacity: isActive ? 1 : 0.7,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCueId(cue.id);
                    }}
                    title={`${cue.name} - ${cue.duration}秒`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    {width > 8 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-medium drop-shadow-lg truncate px-1">
                          {cue.formation}
                        </span>
                      </div>
                    )}
                    {cue.isTransition && width > 10 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                        <span className="text-[10px] text-white/80 bg-black/30 px-1 rounded">
                          过渡
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/30 z-10 pointer-events-none"
              style={{ left: `${progressPercentage}%` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-white rounded-full" />
            </div>
          </>
        )}
      </div>

      <div className="relative h-6 mt-1">
        {markers.map((time, index) => {
          const left = totalDuration > 0 ? (time / totalDuration) * 100 : 0;
          return (
            <div
              key={index}
              className="absolute -translate-x-1/2"
              style={{ left: `${left}%` }}
            >
              <div className="w-px h-2 bg-zinc-600 mx-auto" />
              <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                {formatTime(time)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
