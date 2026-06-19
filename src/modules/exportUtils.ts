import { Cue, ExportData, ExportCue } from '../types/cue';
import { calculateCueTimings, calculateTotalDuration } from './timeUtils';
import { SWITCH_MODE_LABELS } from '../constants/config';

export const generateExportData = (cues: Cue[]): ExportData => {
  const timings = calculateCueTimings(cues);
  const totalDuration = calculateTotalDuration(cues);

  const exportCues: ExportCue[] = cues.map((cue, index) => ({
    index: index + 1,
    name: cue.name,
    formation: cue.formation,
    switchMode: SWITCH_MODE_LABELS[cue.switchMode] || cue.switchMode,
    isTransition: cue.isTransition,
    startTime: timings[index].startTime,
    endTime: timings[index].endTime,
    duration: cue.duration,
  }));

  return {
    totalDuration,
    cueCount: cues.length,
    cues: exportCues,
  };
};

export const exportToJson = (cues: Cue[]): string => {
  const data = generateExportData(cues);
  return JSON.stringify(data, null, 2);
};

export const downloadJson = (cues: Cue[], filename: string = 'cue-program.json'): void => {
  const jsonString = exportToJson(cues);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
