import { Cue, RuleViolation } from '../types/cue';
import { MAX_TOTAL_DURATION, MIN_TRANSITION_DURATION, MAX_FORMATION_REPEAT } from '../constants/config';

const generateId = (): string => Math.random().toString(36).substring(2, 11);

export const validateRunTransition = (cues: Cue[]): RuleViolation[] => {
  const violations: RuleViolation[] = [];

  for (let i = 0; i < cues.length - 1; i++) {
    const current = cues[i];
    const next = cues[i + 1];

    if (current.switchMode === 'run' && next.switchMode === 'run') {
      violations.push({
        id: generateId(),
        rule: '跑步过渡规则',
        severity: 'error',
        message: `第 ${i + 1} 条「${current.name}」和第 ${i + 2} 条「${next.name}」均为跑步切换，中间须插入至少 1 条过渡 Cue`,
        cueIds: [current.id, next.id],
        position: i,
      });
    }
  }

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (cue.isTransition && cue.duration < MIN_TRANSITION_DURATION) {
      violations.push({
        id: generateId(),
        rule: '跑步过渡规则',
        severity: 'warning',
        message: `第 ${i + 1} 条「${cue.name}」是过渡 Cue，持续时间 ${cue.duration} 秒不足 ${MIN_TRANSITION_DURATION} 秒`,
        cueIds: [cue.id],
        position: i,
      });
    }
  }

  return violations;
};

export const validateTotalDuration = (cues: Cue[]): RuleViolation[] => {
  const violations: RuleViolation[] = [];
  const totalDuration = cues.reduce((sum, cue) => sum + cue.duration, 0);

  if (totalDuration > MAX_TOTAL_DURATION) {
    violations.push({
      id: generateId(),
      rule: '总时长规则',
      severity: 'error',
      message: `总时长 ${totalDuration} 秒超过限制 ${MAX_TOTAL_DURATION} 秒，超出 ${totalDuration - MAX_TOTAL_DURATION} 秒`,
      position: -1,
    });
  }

  return violations;
};

export const validateFormationRepeat = (cues: Cue[]): RuleViolation[] => {
  const violations: RuleViolation[] = [];
  if (cues.length < MAX_FORMATION_REPEAT) return violations;

  let count = 1;
  let lastFormation = cues[0].formation;
  let startIndex = 0;

  for (let i = 1; i < cues.length; i++) {
    if (cues[i].formation === lastFormation) {
      count++;
      if (count === MAX_FORMATION_REPEAT) {
        const cueIds = cues.slice(startIndex, i + 1).map(c => c.id);
        violations.push({
          id: generateId(),
          rule: '队形连续规则',
          severity: 'warning',
          message: `队形「${lastFormation}」连续出现 ${count} 次（第 ${startIndex + 1} - ${i + 1} 条），不能连续出现超过 ${MAX_FORMATION_REPEAT - 1} 次`,
          cueIds,
          position: startIndex,
        });
      }
    } else {
      count = 1;
      lastFormation = cues[i].formation;
      startIndex = i;
    }
  }

  return violations;
};

export const validateAllRules = (cues: Cue[]): RuleViolation[] => {
  return [
    ...validateRunTransition(cues),
    ...validateTotalDuration(cues),
    ...validateFormationRepeat(cues),
  ];
};
