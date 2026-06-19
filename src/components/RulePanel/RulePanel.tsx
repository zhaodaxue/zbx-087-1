import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { useCueStore } from '../../store/useCueStore';
import { cn } from '../../lib/utils';

export const RulePanel: React.FC = () => {
  const violations = useCueStore((state) => state.violations);
  const setEditingCueId = useCueStore((state) => state.setEditingCueId);
  const cues = useCueStore((state) => state.cues);

  const errorCount = violations.filter((v) => v.severity === 'error').length;
  const warningCount = violations.filter((v) => v.severity === 'warning').length;

  const handleViolationClick = (violation: typeof violations[0]) => {
    if (violation.cueIds && violation.cueIds.length > 0) {
      setEditingCueId(violation.cueIds[0]);
    }
  };

  const getCueIndexById = (id: string): number => {
    return cues.findIndex((c) => c.id === id) + 1;
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-zinc-800 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h3 className="font-semibold text-white">规则校验</h3>
        </div>
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
              <AlertCircle size={12} />
              {errorCount} 错误
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
              <AlertTriangle size={12} />
              {warningCount} 警告
            </span>
          )}
          {violations.length === 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
              <CheckCircle size={12} />
              全部通过
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
        {violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <CheckCircle size={32} className="mb-2 text-emerald-500" />
            <p className="text-sm">所有规则校验通过</p>
            <p className="text-xs text-zinc-600 mt-1">队形编排符合规范</p>
          </div>
        ) : (
          violations.map((violation) => (
            <div
              key={violation.id}
              className={cn(
                'p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02]',
                violation.severity === 'error'
                  ? 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/15'
                  : 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15'
              )}
              onClick={() => handleViolationClick(violation)}
            >
              <div className="flex items-start gap-2">
                {violation.severity === 'error' ? (
                  <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-xs font-medium mb-1',
                    violation.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                  )}>
                    {violation.rule}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {violation.message}
                  </p>
                  {violation.cueIds && violation.cueIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {violation.cueIds.map((id) => (
                        <span
                          key={id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
                        >
                          Cue #{getCueIndexById(id)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 mb-2">编排规则</p>
        <ul className="space-y-1 text-[11px] text-zinc-600">
          <li className="flex items-start gap-2">
            <span className="text-zinc-500">•</span>
            <span>相邻跑步切换需插入过渡 Cue（≥3秒）</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-zinc-500">•</span>
            <span>总时长不超过 480 秒</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-zinc-500">•</span>
            <span>同一队形不能连续出现 3 次</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
