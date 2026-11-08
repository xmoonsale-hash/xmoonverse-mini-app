export interface ProgressionState {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  skillPoints: number;
}

export interface ProgressionResult {
  progression: ProgressionState;
  levelsGained: number;
}

export const MAX_CHARACTER_LEVEL = 100;
export const INITIAL_CHARACTER_LEVEL = 1;
export const INITIAL_SKILL_POINTS = 0;

export function getExperienceRequired(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error("Level must be a positive integer");
  }

  return Math.floor(100 * Math.pow(level, 1.5));
}

export function createInitialProgression(): ProgressionState {
  return {
    level: INITIAL_CHARACTER_LEVEL,
    experience: 0,
    experienceToNextLevel: getExperienceRequired(1),
    skillPoints: INITIAL_SKILL_POINTS
  };
}

export function addExperience(
  current: ProgressionState,
  amount: number
): ProgressionResult {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Experience amount must be a non-negative number");
  }

  if (
    !Number.isInteger(current.level) ||
    current.level < 1 ||
    current.level > MAX_CHARACTER_LEVEL ||
    !Number.isFinite(current.experience) ||
    current.experience < 0
  ) {
    throw new Error("Invalid progression state");
  }

  let level = current.level;
  let experience = current.experience + Math.floor(amount);
  let skillPoints = current.skillPoints;
  let levelsGained = 0;

  while (
    level < MAX_CHARACTER_LEVEL &&
    experience >= getExperienceRequired(level)
  ) {
    experience -= getExperienceRequired(level);
    level += 1;
    skillPoints += 1;
    levelsGained += 1;
  }

  if (level === MAX_CHARACTER_LEVEL) {
    experience = 0;
  }

  return {
    progression: {
      level,
      experience,
      experienceToNextLevel:
        level === MAX_CHARACTER_LEVEL
          ? 0
          : getExperienceRequired(level),
      skillPoints
    },
    levelsGained
  };
}