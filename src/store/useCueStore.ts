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

  addCue: (cue?: Partial<Cue>) => void;
  updateCue: (id: string, updates: Partial<Cue>) => void;
  deleteCue: (id: string) => void;
  reorderCues: (fromIndex: number, toIndex: number) => void;
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
  setIsPlaying: (playing: boolean) => void;
  setEditingCueId: (id: string | null) => void;
  resetCues: () => void;
  recalculateViolations: () => void;
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
        return {
          cues: newCues,
          violations: validateAllRules(newCues),
          totalDuration: newDuration,
          currentTime: clampTime(state.currentTime, newDuration),
        };
      });
    },

    updateCue: (id: string, updates: Partial<Cue>) => {
      set((state) => {
        const newCues = state.cues.map((cue) =>
          cue.id === id ? { ...cue, ...updates } : cue
        );
        const newDuration = calculateTotalDuration(newCues);
        return {
          cues: newCues,
          violations: validateAllRules(newCues),
          totalDuration: newDuration,
          currentTime: clampTime(state.currentTime, newDuration),
        };
      });
    },

    deleteCue: (id: string) => {
      set((state) => {
        const newCues = state.cues.filter((cue) => cue.id !== id);
        const newDuration = calculateTotalDuration(newCues);
        return {
          cues: newCues,
          violations: validateAllRules(newCues),
          totalDuration: newDuration,
          currentTime: clampTime(state.currentTime, newDuration),
          editingCueId: state.editingCueId === id ? null : state.editingCueId,
          isPlaying: newDuration === 0 ? false : state.isPlaying,
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
      set({ isPlaying: playing });
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
      });
    },

    recalculateViolations: () => {
      const { cues, currentTime } = get();
      const newDuration = calculateTotalDuration(cues);
      set({
        violations: validateAllRules(cues),
        totalDuration: newDuration,
        currentTime: clampTime(currentTime, newDuration),
      });
    },
  };
});
