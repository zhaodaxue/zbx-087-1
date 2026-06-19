import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Clock, Repeat } from 'lucide-react';
import { useCueStore } from '../../store/useCueStore';
import { calculateCueTimings, formatTime } from '../../modules/timeUtils';
import { getFormationColor, MAX_TOTAL_DURATION } from '../../constants/config';
import { cn } from '../../lib/utils';

type DragMode = 'none' | 'create' | 'move-start' | 'move-end' | 'move-range';

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
  const loopRange = useCueStore((state) => state.loopRange);
  const isLoopMode = useCueStore((state) => state.isLoopMode);
  const setCurrentTime = useCueStore((state) => state.setCurrentTime);
  const setEditingCueId = useCueStore((state) => state.setEditingCueId);
  const setLoopRange = useCueStore((state) => state.setLoopRange);

  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStartX, setDragStartX] = useState(0);
  const [dragInitialRange, setDragInitialRange] = useState<{ start: number; end: number } | null>(null);
  const [draggingNow, setDraggingNow] = useState<{ start: number; end: number } | null>(null);

  const timings = useMemo(() => calculateCueTimings(cues), [cues]);

  const getTimeFromX = useCallback((clientX: number): number => {
    if (!timelineRef.current || totalDuration <= 0) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * totalDuration;
  }, [totalDuration]);

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

  const displayRange = draggingNow || loopRange;
  const rangeStartPercent = displayRange && totalDuration > 0 ? (displayRange.start / totalDuration) * 100 : 0;
  const rangeEndPercent = displayRange && totalDuration > 0 ? (displayRange.end / totalDuration) * 100 : 0;
  const rangeWidthPercent = rangeEndPercent - rangeStartPercent;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragMode !== 'none') return;
    const time = getTimeFromX(e.clientX);
    setCurrentTime(time);
  };

  const handleSelectionMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const time = getTimeFromX(e.clientX);
    setDragMode('create');
    setDragStartX(e.clientX);
    setDragInitialRange(null);
    setDraggingNow({ start: time, end: time });
  };

  const handleHandleMouseDown = (mode: 'move-start' | 'move-end', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!loopRange) return;
    setDragMode(mode);
    setDragStartX(e.clientX);
    setDragInitialRange({ ...loopRange });
    setDraggingNow({ ...loopRange });
  };

  const handleRangeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!loopRange) return;
    setDragMode('move-range');
    setDragStartX(e.clientX);
    setDragInitialRange({ ...loopRange });
    setDraggingNow({ ...loopRange });
  };

  useEffect(() => {
    if (dragMode === 'none') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragInitialRange && dragMode !== 'create') return;

      if (dragMode === 'create') {
        const startTime = getTimeFromX(dragStartX);
        const endTime = getTimeFromX(e.clientX);
        setDraggingNow({
          start: Math.min(startTime, endTime),
          end: Math.max(startTime, endTime),
        });
      } else if (dragMode === 'move-start' && dragInitialRange) {
        const dxTime = getTimeFromX(e.clientX) - getTimeFromX(dragStartX);
        const newStart = Math.max(0, Math.min(dragInitialRange.end - 0.5, dragInitialRange.start + dxTime));
        setDraggingNow({ start: newStart, end: dragInitialRange.end });
      } else if (dragMode === 'move-end' && dragInitialRange) {
        const dxTime = getTimeFromX(e.clientX) - getTimeFromX(dragStartX);
        const newEnd = Math.min(totalDuration, Math.max(dragInitialRange.start + 0.5, dragInitialRange.end + dxTime));
        setDraggingNow({ start: dragInitialRange.start, end: newEnd });
      } else if (dragMode === 'move-range' && dragInitialRange) {
        const dxTime = getTimeFromX(e.clientX) - getTimeFromX(dragStartX);
        const rangeDuration = dragInitialRange.end - dragInitialRange.start;
        let newStart = dragInitialRange.start + dxTime;
        let newEnd = dragInitialRange.end + dxTime;
        if (newStart < 0) {
          newStart = 0;
          newEnd = rangeDuration;
        }
        if (newEnd > totalDuration) {
          newEnd = totalDuration;
          newStart = totalDuration - rangeDuration;
        }
        setDraggingNow({ start: newStart, end: newEnd });
      }
    };

    const handleMouseUp = () => {
      if (draggingNow) {
        if (draggingNow.end - draggingNow.start >= 0.5) {
          setLoopRange(draggingNow.start, draggingNow.end);
        }
      }
      setDragMode('none');
      setDraggingNow(null);
      setDragInitialRange(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, dragStartX, dragInitialRange, draggingNow, getTimeFromX, setLoopRange, totalDuration]);

  const handleClearLoop = (e: React.MouseEvent) => {
    e.stopPropagation();
    const clearLoopRange = useCueStore.getState().clearLoopRange;
    clearLoopRange();
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-amber-500" />
          <h3 className="font-semibold text-white">时间轴</h3>
          {displayRange && (
            <span className={cn(
              'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
              isLoopMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            )}>
              <Repeat size={12} />
              循环区间: {formatTime(displayRange.start)} - {formatTime(displayRange.end)}
            </span>
          )}
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
        ref={timelineRef}
        className="relative h-16 bg-zinc-800/50 rounded-lg cursor-pointer overflow-hidden select-none"
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

            {displayRange && (
              <>
                <div
                  className="absolute top-0 bottom-0 bg-black/50 pointer-events-none z-[1]"
                  style={{ left: 0, width: `${rangeStartPercent}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 bg-black/50 pointer-events-none z-[1]"
                  style={{ right: 0, width: `${100 - rangeEndPercent}%` }}
                />

                <div
                  className={cn(
                    'absolute top-0 bottom-0 z-[2] cursor-move border-l-2 border-r-2 border-amber-400',
                    isLoopMode ? 'bg-amber-500/15' : 'bg-amber-500/10'
                  )}
                  style={{
                    left: `${rangeStartPercent}%`,
                    width: `${rangeWidthPercent}%`,
                  }}
                  onMouseDown={handleRangeMouseDown}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2 -ml-1 cursor-ew-resize z-[3] flex items-center justify-start"
                    onMouseDown={(e) => handleHandleMouseDown('move-start', e)}
                  >
                    <div className="w-1 h-6 bg-amber-400 rounded-full shadow-lg shadow-amber-500/50 ml-0.5" />
                  </div>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 -mr-1 cursor-ew-resize z-[3] flex items-center justify-end"
                    onMouseDown={(e) => handleHandleMouseDown('move-end', e)}
                  >
                    <div className="w-1 h-6 bg-amber-400 rounded-full shadow-lg shadow-amber-500/50 mr-0.5" />
                  </div>
                </div>
              </>
            )}

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/30 z-10 pointer-events-none"
              style={{ left: `${progressPercentage}%` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-white rounded-full" />
            </div>
          </>
        )}
      </div>

      <div
        className={cn(
          'relative h-4 mt-2 rounded-md transition-colors',
          dragMode !== 'none' ? 'bg-amber-500/10' : 'bg-zinc-800/50 hover:bg-zinc-800'
        )}
        onMouseDown={handleSelectionMouseDown}
        title={loopRange ? '拖拽调整循环区间，双击清除' : '拖拽选择循环区间'}
        onDoubleClick={handleClearLoop}
      >
        {displayRange && totalDuration > 0 && (
          <>
            <div
              className={cn(
                'absolute top-0 bottom-0 rounded-sm',
                isLoopMode ? 'bg-amber-500/40' : 'bg-amber-500/25'
              )}
              style={{
                left: `${rangeStartPercent}%`,
                width: `${rangeWidthPercent}%`,
              }}
            />
            <div
              className="absolute top-0 bottom-0 w-1 -left-0.5 bg-amber-400 rounded-sm"
              style={{ left: `${rangeStartPercent}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-1 -right-0.5 bg-amber-400 rounded-sm"
              style={{ left: `${rangeEndPercent}%` }}
            />
          </>
        )}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
          <span className="text-[10px] text-zinc-500">
            {loopRange ? '双击清除区间' : '← 拖拽选择循环区间 →'}
          </span>
        </div>
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
