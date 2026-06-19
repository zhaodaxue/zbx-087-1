import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Clock, Footprints, Zap } from 'lucide-react';
import { Cue } from '../../types/cue';
import { getFormationColor, SWITCH_MODE_LABELS } from '../../constants/config';
import { useCueStore } from '../../store/useCueStore';
import { cn } from '../../lib/utils';

interface CueCardProps {
  cue: Cue;
  index: number;
  isEditing: boolean;
}

export const CueCard: React.FC<CueCardProps> = ({ cue, index, isEditing }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cue.id });

  const updateCue = useCueStore((state) => state.updateCue);
  const deleteCue = useCueStore((state) => state.deleteCue);
  const setEditingCueId = useCueStore((state) => state.setEditingCueId);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formationColor = getFormationColor(cue.formation);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCueId(isEditing ? null : cue.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCue(cue.id);
  };

  const handleInputChange = (field: keyof Cue, value: string | number | boolean) => {
    updateCue(cue.id, { [field]: value });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-xl border-2 transition-all duration-200',
        'bg-zinc-900/60 backdrop-blur-sm',
        isDragging ? 'opacity-50 scale-105 z-50' : 'opacity-100',
        cue.isTransition ? 'border-dashed border-amber-500/50' : 'border-zinc-700',
        'hover:border-zinc-500'
      )}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{ backgroundColor: formationColor }}
      />

      <div className="p-4 pl-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <GripVertical size={18} />
            </button>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={cue.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-zinc-800 text-white px-2 py-1 rounded text-sm font-medium w-32 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <h3 className="text-white font-medium">{cue.name}</h3>
              )}
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-zinc-500">#{index + 1}</span>
                {cue.isTransition && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    过渡
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEditClick}
              className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-800/50 rounded-lg p-2">
            <div className="flex items-center gap-1 text-zinc-500 text-xs mb-1">
              <Clock size={12} />
              <span>时长</span>
            </div>
            {isEditing ? (
              <input
                type="number"
                value={cue.duration}
                onChange={(e) => handleInputChange('duration', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-zinc-700 text-white px-1 py-0.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                onClick={(e) => e.stopPropagation()}
                min={1}
              />
            ) : (
              <p className="text-white font-semibold text-sm">{cue.duration}秒</p>
            )}
          </div>

          <div className="bg-zinc-800/50 rounded-lg p-2">
            <div className="flex items-center gap-1 text-zinc-500 text-xs mb-1">
              <Zap size={12} />
              <span>队形</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={cue.formation}
                onChange={(e) => handleInputChange('formation', e.target.value)}
                className="w-full bg-zinc-700 text-white px-1 py-0.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p
                className="font-semibold text-sm"
                style={{ color: formationColor }}
              >
                {cue.formation}
              </p>
            )}
          </div>

          <div className="bg-zinc-800/50 rounded-lg p-2">
            <div className="flex items-center gap-1 text-zinc-500 text-xs mb-1">
              <Footprints size={12} />
              <span>切换</span>
            </div>
            {isEditing ? (
              <select
                value={cue.switchMode}
                onChange={(e) => handleInputChange('switchMode', e.target.value)}
                className="w-full bg-zinc-700 text-white px-1 py-0.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="march">齐步</option>
                <option value="run">跑步</option>
              </select>
            ) : (
              <p className={cn(
                'font-semibold text-sm',
                cue.switchMode === 'run' ? 'text-red-400' : 'text-emerald-400'
              )}>
                {SWITCH_MODE_LABELS[cue.switchMode]}
              </p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-3 pt-3 border-t border-zinc-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cue.isTransition}
                onChange={(e) => handleInputChange('isTransition', e.target.checked)}
                className="w-4 h-4 accent-amber-500"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-sm text-zinc-400">标记为过渡 Cue</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
