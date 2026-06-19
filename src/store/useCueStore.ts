import { create } from 'zustand';
import { Cue, RuleViolation, SwitchMode } from '../types/cue';
import { validateAllRules } from '../modules/rulesEngine';
import { calculateTotalDuration } from '../modules/timeUtils';
import { DEFAULT_FORMATIONS } from '../constants/config';

const generateId = (): string => Math.random().toString(36).substring(2, 11);

const clampTime = (time: number, max: number): number => {
  if (max <= 0) return 0;
  return Math.min(Math.max(time, 0), max);
};

const MIN_LOOP_DURATION = 0.5;

interface LoopRange {
  start: number;
  end: number;
}

const isValidLoopRange = (range: LoopRange | null, totalDuration: number): boolean => {
  if (!range) return false;
  if (totalDuration <= 0) return false;
  if (range.start < 0 || range.end > totalDuration) return false;
  if (range.end - range.start < MIN_LOOP_DURATION) return false;
  return true;
};

const clampTimeToLoop = (time: number, range: LoopRange): number => {
  return Math.min(Math.max(time, range.start), range.end);
};

const adjustLoopRange = (
  range: LoopRange | null,
  oldDuration: number,
  newDuration: number
): { range: LoopRange | null; message: string | null } => {
  if (!range) return { range: null, message: null };
  if (newDuration <= 0) return { range: null, message: '总时长变为 0，循环区间已清除' };

  let { start, end } = range;
  let message: string | null = null;

  if (end > newDuration) {
    end = newDuration;
    message = '总时长缩短，循环区间结束点已自动收缩';
  }
  if (start > newDuration) {
    start = Math.max(0, newDuration - MIN_LOOP_DURATION);
  }

  if (end - start < MIN_LOOP_DURATION) {
    return { range: null, message: '循环区间过小，已自动清除并退出循环模式' };
  }

  return { range: { start, end }, message };
};

const createDefaultCues = (): Cue[] => [
  {
    id: generateId(),
    name: '入场',
    duration: 30,
    formation: '一字',
    switchMode: 'march',
    isTransition: false,
  },
  {
    id: generateId(),
    name: '螺旋变换',
    duration: 20,
    formation: '螺旋',
    switchMode: 'run',
    isTransition: false,
  },
  {
    id: generateId(),
    name: '过渡',
    duration: 5,
    formation: 'S形',
    switchMode: 'march',
    isTransition: true,
  },
  {
    id: generateId(),
    name: 'S形造型',
    duration: 25,
    formation: 'S形',
    switchMode: 'run',
    isTransition: false,
  },
  {
    id: generateId(),
    name: '圆形收尾',
    duration: 30,
    formation: '圆形',
    switchMode: 'march',
    isTransition: false,
  },
];

interface CueState {
  cues: Cue[];
  currentTime: number;
  isPlaying: boolean;
  violations: RuleViolation[];
  totalDuration: number;
  editingCueId: string | null;

  loopRange: LoopRange | null;
  isLoopMode: boolean;
  loopCount: number;
  currentLoopIndex: number;
  loopMessage: string | null;

  addCue: (cue?: Partial<Cue>) => void;
  updateCue: (id: string, updates: Partial<Cue>) => void;
  deleteCue: (id: string) => void;
  reorderCues: (fromIndex: number, toIndex: number) => void;
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
  setIsPlaying: (playing: boolean) => void;
  setEditingCueId: (id: string | null) => void;
  resetCues: () => void;
  recalculateViolations: () => void;

  setLoopRange: (start: number, end: number) => void;
  clearLoopRange: () => void;
  setLoopMode: (enabled: boolean) => void;
  setLoopCount: (count: number) => void;
  setCurrentLoopIndex: (index: number) => void;
  snapTimeToLoop: (time: number) => number;
  clearLoopMessage: () => void;
}

export const useCueStore = create<CueState>((set, get) => {
  const initialCues = createDefaultCues();
  const initialDuration = calculateTotalDuration(initialCues);
  return {
    cues: initialCues,
    currentTime: 0,
    isPlaying: false,
    violations: validateAllRules(initialCues),
    totalDuration: initialDuration,
    editingCueId: null,

    loopRange: null,
    isLoopMode: false,
    loopCount: 0,
    currentLoopIndex: 0,
    loopMessage: null,

    addCue: (cue?: Partial<Cue>) => {
      const newCue: Cue = {
        id: generateId(),
        name: '新口令',
        duration: 10,
        formation: DEFAULT_FORMATIONS[0],
        switchMode: 'march' as SwitchMode,
        isTransition: false,
        ...cue,
      };
      set((state) => {
        const newCues = [...state.cues, newCue];
        const newDuration = calculateTotalDuration(newCues);
        const { range: adjustedRange, message } = adjustLoopRange(
          state.loopRange,
          state.totalDuration,
          newDuration
        );
        const newIsLoopMode = adjustedRange ? state.isLoopMode : false;
        return {
          cues: newCues,
          violations: validateAllRules(newCues),
          totalDuration: newDuration,
          currentTime: clampTime(state.currentTime, newDuration),
          loopRange: adjustedRange,
          isLoopMode: newIsLoopMode,
          loopMessage: message,
          currentLoopIndex: 0,
        };
      });
    },

    updateCue: (id: string, updates: Partial<Cue>) => {
      set((state) => {
        const newCues = state.cues.map((cue) =>
          cue.id === id ? { ...cue, ...updates } : cue
        );
        const newDuration = calculateTotalDuration(newCues);
        const { range: adjustedRange, message } = adjustLoopRange(
          state.loopRange,
          state.totalDuration,
          newDuration
        );
        const newIsLoopMode = adjustedRange ? state.isLoopMode : false;
        return {
          cues: newCues,
          violations: validateAllRules(newCues),
          totalDuration: newDuration,
          currentTime: clampTime(state.currentTime, newDuration),
          loopRange: adjustedRange,
          isLoopMode: newIsLoopMode,
          loopMessage: message,
          currentLoopIndex: 0,
        };
      });
    },

    deleteCue: (id: string) => {
      set((state) => {
        const newCues = state.cues.filter((cue) => cue.id !== id);
        const newDuration = calculateTotalDuration(newCues);
        const { range: adjustedRange, message } = adjustLoopRange(
          state.loopRange,
          state.totalDuration,
          newDuration
        );
        const newIsLoopMode = adjustedRange ? state.isLoopMode : false;
        return {
          cues: newCues,
          violations: validateAllRules(newCues),
          totalDuration: newDuration,
          currentTime: clampTime(state.currentTime, newDuration),
          editingCueId: state.editingCueId === id ? null : state.editingCueId,
          isPlaying: newDuration === 0 ? false : state.isPlaying,
          loopRange: adjustedRange,
          isLoopMode: newIsLoopMode,
          loopMessage: message,
          currentLoopIndex: 0,
        };
      });
    },

    reorderCues: (fromIndex: number, toIndex: number) => {
      set((state) => {
        const newCues = [...state.cues];
        const [removed] = newCues.splice(fromIndex, 1);
        newCues.splice(toIndex, 0, removed);
        return {
          cues: newCues,
          violations: validateAllRules(newCues),
          totalDuration: state.totalDuration,
          currentLoopIndex: 0,
        };
      });
    },

    setCurrentTime: (time: number | ((prev: number) => number)) => {
      set((state) => {
        const raw = typeof time === 'function' ? time(state.currentTime) : time;
        return {
          currentTime: clampTime(raw, state.totalDuration),
        };
      });
    },

    setIsPlaying: (playing: boolean) => {
      set((state) => {
        if (playing && state.isLoopMode && state.loopRange && state.loopCount > 0) {
          return { isPlaying: true, currentLoopIndex: 0 };
        }
        return { isPlaying: playing };
      });
    },

    setEditingCueId: (id: string | null) => {
      set({ editingCueId: id });
    },

    resetCues: () => {
      const defaultCues = createDefaultCues();
      const defaultDuration = calculateTotalDuration(defaultCues);
      set({
        cues: defaultCues,
        currentTime: 0,
        isPlaying: false,
        violations: validateAllRules(defaultCues),
        totalDuration: defaultDuration,
        editingCueId: null,
        loopRange: null,
        isLoopMode: false,
        loopCount: 0,
        currentLoopIndex: 0,
        loopMessage: null,
      });
    },

    recalculateViolations: () => {
      const { cues, currentTime, loopRange, totalDuration: oldDuration, isLoopMode } = get();
      const newDuration = calculateTotalDuration(cues);
      const { range: adjustedRange, message } = adjustLoopRange(
        loopRange,
        oldDuration,
        newDuration
      );
      const newIsLoopMode = adjustedRange ? isLoopMode : false;
      set({
        violations: validateAllRules(cues),
        totalDuration: newDuration,
        currentTime: clampTime(currentTime, newDuration),
        loopRange: adjustedRange,
        isLoopMode: newIsLoopMode,
        loopMessage: message,
        currentLoopIndex: 0,
      });
    },

    setLoopRange: (start: number, end: number) => {
      set((state) => {
        const clampedStart = clampTime(start, state.totalDuration);
        const clampedEnd = clampTime(end, state.totalDuration);
        const realStart = Math.min(clampedStart, clampedEnd);
        const realEnd = Math.max(clampedStart, clampedEnd);

        if (realEnd - realStart < MIN_LOOP_DURATION) {
          return {
            loopRange: state.loopRange,
            loopMessage: '循环区间过小，请选择更长的时间段',
          };
        }

        const newRange = { start: realStart, end: realEnd };
        const newTime = clampTimeToLoop(state.currentTime, newRange);

        return {
          loopRange: newRange,
          currentTime: newTime,
          loopMessage: null,
          currentLoopIndex: 0,
        };
      });
    },

    clearLoopRange: () => {
      set({
        loopRange: null,
        isLoopMode: false,
        loopMessage: null,
        currentLoopIndex: 0,
      });
    },

    setLoopMode: (enabled: boolean) => {
      set((state) => {
        if (enabled && !isValidLoopRange(state.loopRange, state.totalDuration)) {
          return {
            isLoopMode: false,
            loopMessage: '请先在时间轴上拖拽选择循环区间',
          };
        }
        if (enabled && state.loopRange) {
          return {
            isLoopMode: true,
            currentTime: clampTimeToLoop(state.currentTime, state.loopRange),
            currentLoopIndex: 0,
            loopMessage: null,
          };
        }
        return { isLoopMode: false, loopMessage: null };
      });
    },

    setLoopCount: (count: number) => {
      set({ loopCount: Math.max(0, Math.floor(count)) });
    },

    setCurrentLoopIndex: (index: number) => {
      set({ currentLoopIndex: Math.max(0, index) });
    },

    snapTimeToLoop: (time: number): number => {
      const state = get();
      if (!state.isLoopMode || !state.loopRange) {
        return clampTime(time, state.totalDuration);
      }
      return clampTimeToLoop(time, state.loopRange);
    },

    clearLoopMessage: () => {
      set({ loopMessage: null });
    },
  };
});
