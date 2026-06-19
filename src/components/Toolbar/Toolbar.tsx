import React, { useEffect, useRef } from 'react';
import { Download, RotateCcw, Plus, Info, Repeat, X } from 'lucide-react';
import { useCueStore } from '../../store/useCueStore';
import { downloadJson } from '../../modules/exportUtils';
import { formatTime } from '../../modules/timeUtils';
import { MAX_TOTAL_DURATION } from '../../constants/config';
import { cn } from '../../lib/utils';

export const Toolbar: React.FC = () => {
  const cues = useCueStore((state) => state.cues);
  const totalDuration = useCueStore((state) => state.totalDuration);
  const violations = useCueStore((state) => state.violations);
  const loopRange = useCueStore((state) => state.loopRange);
  const isLoopMode = useCueStore((state) => state.isLoopMode);
  const loopCount = useCueStore((state) => state.loopCount);
  const loopMessage = useCueStore((state) => state.loopMessage);
  const addCue = useCueStore((state) => state.addCue);
  const resetCues = useCueStore((state) => state.resetCues);
  const setLoopMode = useCueStore((state) => state.setLoopMode);
  const setLoopCount = useCueStore((state) => state.setLoopCount);
  const clearLoopRange = useCueStore((state) => state.clearLoopRange);
  const clearLoopMessage = useCueStore((state) => state.clearLoopMessage);

  const messageTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (loopMessage) {
      if (messageTimerRef.current) {
        window.clearTimeout(messageTimerRef.current);
      }
      messageTimerRef.current = window.setTimeout(() => {
        clearLoopMessage();
      }, 3000);
    }
    return () => {
      if (messageTimerRef.current) {
        window.clearTimeout(messageTimerRef.current);
      }
    };
  }, [loopMessage, clearLoopMessage]);

  const handleExport = () => {
    downloadJson(cues, 'cue-program.json');
  };

  const handleReset = () => {
    if (window.confirm('确定要重置为默认编排吗？当前修改将丢失。')) {
      resetCues();
    }
  };

  const handleLoopCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) {
      setLoopCount(0);
    } else {
      setLoopCount(val);
    }
  };

  const isOverDuration = totalDuration > MAX_TOTAL_DURATION;
  const hasErrors = violations.some((v) => v.severity === 'error');

  return (
    <div className="space-y-3">
      {loopMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-400 animate-pulse">
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span>{loopMessage}</span>
          </div>
          <button
            onClick={clearLoopMessage}
            className="p-1 hover:bg-amber-500/20 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">龙</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">队形 Cue 编排器</h1>
              <p className="text-xs text-zinc-500">舞龙队排练口令卡编排工具</p>
            </div>
          </div>

          {loopRange && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
              <Repeat size={14} className={cn(isLoopMode ? 'text-amber-400' : 'text-zinc-500')} />
              <div className="text-xs">
                <div className="text-zinc-400">循环区间</div>
                <div className="font-mono text-zinc-200">
                  {formatTime(loopRange.start)} - {formatTime(loopRange.end)}
                </div>
              </div>
              <div className="h-6 w-px bg-zinc-700 mx-1" />
              <div className="flex items-center gap-1">
                <label className="text-xs text-zinc-400">次数</label>
                <input
                  type="number"
                  min={0}
                  value={loopCount || ''}
                  onChange={handleLoopCountChange}
                  placeholder="∞"
                  className="w-14 px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-white font-mono focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <button
                onClick={() => setLoopMode(!isLoopMode)}
                className={cn(
                  'px-2 py-1 text-xs rounded transition-colors',
                  isLoopMode
                    ? 'bg-amber-500 text-zinc-900 font-medium'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                )}
              >
                {isLoopMode ? '循环中' : '循环'}
              </button>
              <button
                onClick={clearLoopRange}
                className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                title="清除循环区间"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
            <Info size={14} className="text-zinc-500" />
            <span className="text-sm text-zinc-400">
              {cues.length} 条 Cue · 
              <span className={cn('ml-1 font-mono', isOverDuration && 'text-red-400')}>
                {formatTime(totalDuration)}
              </span>
            </span>
            {hasErrors && (
              <span className="text-xs text-red-400 ml-2">
                {violations.filter(v => v.severity === 'error').length} 个违规
              </span>
            )}
          </div>

          <button
            onClick={() => addCue()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-medium rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            添加 Cue
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all hover:scale-105 active:scale-95 border border-zinc-700"
          >
            <Download size={18} />
            导出 JSON
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="重置"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
