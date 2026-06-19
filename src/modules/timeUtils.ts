import { Cue, CueTiming } from '../types/cue';

export const calculateTotalDuration = (cues: Cue[]): number => {
  return cues.reduce((sum, cue) => sum + cue.duration, 0);
};

export const calculateCueTimings = (cues: Cue[]): CueTiming[] => {
  const timings: CueTiming[] = [];
  let currentTime = 0;

  for (const cue of cues) {
    timings.push({
      startTime: currentTime,
      endTime: currentTime + cue.duration,
    });
    currentTime += cue.duration;
  }

  return timings;
};

export const getCueAtTime = (cues: Cue[], time: number): Cue | null => {
  if (cues.length === 0 || time < 0) return null;

  const timings = calculateCueTimings(cues);

  for (let i = 0; i < cues.length; i++) {
    if (time >= timings[i].startTime && time < timings[i].endTime) {
      return cues[i];
    }
  }

  if (time === calculateTotalDuration(cues) && cues.length > 0) {
    return cues[cues.length - 1];
  }

  return null;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
