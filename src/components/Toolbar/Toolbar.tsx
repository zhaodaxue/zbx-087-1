import React from 'react';
import { Download, RotateCcw, Plus, Info } from 'lucide-react';
import { useCueStore } from '../../store/useCueStore';
import { downloadJson } from '../../modules/exportUtils';
import { formatTime } from '../../modules/timeUtils';
import { MAX_TOTAL_DURATION } from '../../constants/config';
import { cn } from '../../lib/utils';

export const Toolbar: React.FC = () => {
  const cues = useCueStore((state) => state.cues);
  const totalDuration = useCueStore((state) => state.totalDuration);
  const violations = useCueStore((state) => state.violations);
  const addCue = useCueStore((state) => state.addCue);
  const resetCues = useCueStore((state) => state.resetCues);

  const handleExport = () => {
    downloadJson(cues, 'cue-program.json');
  };

  const handleReset = () => {
    if (window.confirm('确定要重置为默认编排吗？当前修改将丢失。')) {
      resetCues();
    }
  };

  const isOverDuration = totalDuration > MAX_TOTAL_DURATION;
  const hasErrors = violations.some((v) => v.severity === 'error');

  return (
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
  );
};
