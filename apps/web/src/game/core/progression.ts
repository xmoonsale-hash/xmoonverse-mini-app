
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

export const INITIAL_CHARACTER_LEVEL = 1;
export const INITIAL_SKILL_POINTS = 0;

export function getExperienceRequired(level: number): number {
  if (!Number.isSafeInteger(level) || level < 1) {
    throw new Error("Level must be a valid character level");
  }

  const experience = Math.floor(100 * Math.pow(level, 1.5));

  if (!Number.isSafeInteger(experience) || experience < 1) {
    throw new Error("Experience requirement exceeds the safe integer range");
  }

  return experience;
}

export function createInitialProgression(): ProgressionState {
  return {
    level: INITIAL_CHARACTER_LEVEL,
    experience: 0,
    experienceToNextLevel: getExperienceRequired(
      INITIAL_CHARACTER_LEVEL
    ),
    skillPoints: INITIAL_SKILL_POINTS
  };
}

function validateProgressionState(
  current: ProgressionState
): void {
  if (
    !current ||
    typeof current !== "object" ||
    Array.isArray(current)
  ) {
    throw new Error("Progression state must be a valid object");
  }

  if (
    !Number.isSafeInteger(current.level) ||
    current.level < 1
  ) {
    throw new Error("Invalid progression level");
  }

  if (
    !Number.isSafeInteger(current.experience) ||
    current.experience < 0
  ) {
    throw new Error("Invalid progression experience");
  }

  if (
    !Number.isSafeInteger(current.skillPoints) ||
    current.skillPoints < 0
  ) {
    throw new Error("Invalid progression skill points");
  }

  const expectedExperienceToNextLevel =
    getExperienceRequired(current.level);

  if (
    current.experienceToNextLevel !==
    expectedExperienceToNextLevel
  ) {
    throw new Error("Invalid experience requirement in progression state");
  }

  if (
    current.experience >= expectedExperienceToNextLevel
  ) {
    throw new Error("Progression experience exceeds the level threshold");
  }
}

export function addExperience(
  current: ProgressionState,
  amount: number
): ProgressionResult {
  validateProgressionState(current);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error("Experience amount must be a non-negative number");
  }

  const normalizedAmount = Math.floor(amount);

  if (!Number.isSafeInteger(normalizedAmount)) {
    throw new Error("Experience amount is too large");
  }

  if (normalizedAmount === 0) {
    return {
      progression: { ...current },
      levelsGained: 0
    };
  }

  let level = current.level;
  let experience = current.experience + normalizedAmount;
  let skillPoints = current.skillPoints;
  let levelsGained = 0;

  if (!Number.isSafeInteger(experience)) {
    throw new Error("Total experience exceeds the safe integer range");
  }

  while (experience >= getExperienceRequired(level)) {
    const requiredExperience = getExperienceRequired(level);

    experience -= requiredExperience;
    level += 1;
    levelsGained += 1;
    skillPoints += 1;

    if (
      !Number.isSafeInteger(level) ||
      !Number.isSafeInteger(levelsGained)
    ) {
      throw new Error("Character level exceeds the safe integer range");
    }

    if (!Number.isSafeInteger(skillPoints)) {
      throw new Error("Skill points exceed the safe integer range");
    }
  }

  const progression: ProgressionState = {
    level,
    experience,
    experienceToNextLevel: getExperienceRequired(level),
    skillPoints
  };

  return {
    progression,
    levelsGained
  };
}
