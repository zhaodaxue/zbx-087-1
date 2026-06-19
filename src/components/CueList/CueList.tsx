import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { CueCard } from './CueCard';
import { useCueStore } from '../../store/useCueStore';

export const CueList: React.FC = () => {
  const cues = useCueStore((state) => state.cues);
  const editingCueId = useCueStore((state) => state.editingCueId);
  const addCue = useCueStore((state) => state.addCue);
  const reorderCues = useCueStore((state) => state.reorderCues);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = cues.findIndex((cue) => cue.id === active.id);
      const newIndex = cues.findIndex((cue) => cue.id === over.id);
      reorderCues(oldIndex, newIndex);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">口令卡列表</h2>
          <p className="text-sm text-zinc-500">共 {cues.length} 条 Cue</p>
        </div>
        <button
          onClick={() => addCue()}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-medium rounded-lg transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={18} />
          添加
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {cues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p className="mb-4">暂无口令卡</p>
            <button
              onClick={() => addCue()}
              className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              添加第一条 Cue
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={cues.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {cues.map((cue, index) => (
                <CueCard
                  key={cue.id}
                  cue={cue}
                  index={index}
                  isEditing={editingCueId === cue.id}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
