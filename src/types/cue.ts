export type SwitchMode = 'march' | 'run';

export interface Cue {
  id: string;
  name: string;
  duration: number;
  formation: string;
  switchMode: SwitchMode;
  isTransition: boolean;
}

export interface RuleViolation {
  id: string;
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  cueIds?: string[];
  position?: number;
}

export interface CueTiming {
  startTime: number;
  endTime: number;
}

export interface ExportCue {
  index: number;
  name: string;
  formation: string;
  switchMode: string;
  isTransition: boolean;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface ExportData {
  totalDuration: number;
  cueCount: number;
  cues: ExportCue[];
}
