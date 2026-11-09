
import type { ItemId } from "@xmoonverse/shared";

export type AchievementCategory =
  | "combat"
  | "exploration"
  | "gathering"
  | "progression"
  | "crafting"
  | "social";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  targetAmount: number;
  experienceReward: number;
  itemRewards: {
    itemId: ItemId;
    quantity: number;
  }[];
}

export interface AchievementProgress {
  achievementId: string;
  currentAmount: number;
  unlocked: boolean;
  claimed: boolean;
}

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  {
    id: "first_victory",
    name: "Первая победа",
    description: "Победи своего первого монстра.",
    category: "combat",
    targetAmount: 1,
    experienceReward: 25,
    itemRewards: [
      {
        itemId: "small_health_potion",
        quantity: 1
      }
    ]
  },
  {
    id: "monster_hunter",
    name: "Охотник",
    description: "Победи 50 монстров.",
    category: "combat",
    targetAmount: 50,
    experienceReward: 250,
    itemRewards: []
  },
  {
    id: "first_exploration",
    name: "Первые открытия",
    description: "Посети три разных региона.",
    category: "exploration",
    targetAmount: 3,
    experienceReward: 100,
    itemRewards: []
  },
  {
    id: "resource_collector",
    name: "Собиратель",
    description: "Собери 100 единиц ресурсов.",
    category: "gathering",
    targetAmount: 100,
    experienceReward: 150,
    itemRewards: [
      {
        itemId: "wood",
        quantity: 10
      }
    ]
  },
  {
    id: "experienced_adventurer",
    name: "Опытный искатель",
    description: "Достигни 10-го уровня персонажа.",
    category: "progression",
    targetAmount: 10,
    experienceReward: 200,
    itemRewards: []
  },
  {
    id: "first_craft",
    name: "Начинающий мастер",
    description: "Создай свой первый предмет.",
    category: "crafting",
    targetAmount: 1,
    experienceReward: 75,
    itemRewards: [
      {
        itemId: "iron_ore",
        quantity: 2
      }
    ]
  }
];

const ACHIEVEMENT_CATEGORIES: readonly AchievementCategory[] = [
  "combat",
  "exploration",
  "gathering",
  "progression",
  "crafting",
  "social"
];

function cloneAchievement(
  achievement: AchievementDefinition
): AchievementDefinition {
  return {
    ...achievement,
    itemRewards: achievement.itemRewards.map((reward) => ({
      ...reward
    }))
  };
}

function validateAchievementDefinition(
  achievement: AchievementDefinition
): void {
  if (
    !achievement.id ||
    typeof achievement.id !== "string" ||
    !achievement.id.trim()
  ) {
    throw new Error("Achievement ID is required");
  }

  if (
    !achievement.name ||
    typeof achievement.name !== "string" ||
    !achievement.name.trim()
  ) {
    throw new Error(
      `Achievement "${achievement.id}" must have a name`
    );
  }

  if (
    !ACHIEVEMENT_CATEGORIES.includes(achievement.category)
  ) {
    throw new Error(
      `Achievement "${achievement.id}" has an invalid category`
    );
  }

  if (
    !Number.isSafeInteger(achievement.targetAmount) ||
    achievement.targetAmount <= 0
  ) {
    throw new Error(
      `Achievement "${achievement.id}" has an invalid target amount`
    );
  }

  if (
    !Number.isSafeInteger(achievement.experienceReward) ||
    achievement.experienceReward < 0
  ) {
    throw new Error(
      `Achievement "${achievement.id}" has an invalid experience reward`
    );
  }

  if (!Array.isArray(achievement.itemRewards)) {
    throw new Error(
      `Achievement "${achievement.id}" has invalid item rewards`
    );
  }

  for (const reward of achievement.itemRewards) {
    if (
      !reward.itemId ||
      typeof reward.itemId !== "string" ||
      !reward.itemId.trim()
    ) {
      throw new Error(
        `Achievement "${achievement.id}" has an invalid reward item ID`
      );
    }

    if (
      !Number.isSafeInteger(reward.quantity) ||
      reward.quantity <= 0
    ) {
      throw new Error(
        `Achievement "${achievement.id}" has an invalid reward quantity`
      );
    }
  }
}

function validateAchievementProgress(
  progress: AchievementProgress,
  achievement: AchievementDefinition
): void {
  if (!progress || typeof progress !== "object") {
    throw new Error("Achievement progress is required");
  }

  if (progress.achievementId !== achievement.id) {
    throw new Error("Achievement progress ID mismatch");
  }

  if (
    !Number.isSafeInteger(progress.currentAmount) ||
    progress.currentAmount < 0 ||
    progress.currentAmount > achievement.targetAmount
  ) {
    throw new Error("Invalid achievement progress amount");
  }

  if (
    typeof progress.unlocked !== "boolean" ||
    typeof progress.claimed !== "boolean"
  ) {
    throw new Error("Invalid achievement progress status");
  }

  if (
    progress.unlocked &&
    progress.currentAmount < achievement.targetAmount
  ) {
    throw new Error(
      "Unlocked achievement has incomplete progress"
    );
  }

  if (
    !progress.unlocked &&
    progress.currentAmount >= achievement.targetAmount
  ) {
    throw new Error(
      "Completed achievement must be unlocked"
    );
  }

  if (progress.claimed && !progress.unlocked) {
    throw new Error(
      "Achievement reward cannot be claimed before unlocking"
    );
  }
}

export function getAchievementById(
  achievementId: string
): AchievementDefinition | undefined {
  if (
    typeof achievementId !== "string" ||
    !achievementId.trim()
  ) {
    return undefined;
  }

  const achievement = ACHIEVEMENT_CATALOG.find(
    (entry) => entry.id === achievementId
  );

  return achievement
    ? cloneAchievement(achievement)
    : undefined;
}

export function getAchievementsByCategory(
  category: AchievementCategory
): AchievementDefinition[] {
  if (!ACHIEVEMENT_CATEGORIES.includes(category)) {
    return [];
  }

  return ACHIEVEMENT_CATALOG
    .filter((achievement) => achievement.category === category)
    .map(cloneAchievement);
}

export function createAchievementProgress(
  achievementId: string
): AchievementProgress {
  const achievement = getAchievementById(achievementId);

  if (!achievement) {
    throw new Error("Unknown achievement");
  }

  return {
    achievementId: achievement.id,
    currentAmount: 0,
    unlocked: false,
    claimed: false
  };
}

export function updateAchievementProgress(
  progress: AchievementProgress,
  amount: number
): AchievementProgress {
  if (
    !Number.isSafeInteger(amount) ||
    amount < 0
  ) {
    throw new Error(
      "Progress amount must be a non-negative safe integer"
    );
  }

  const achievement = getAchievementById(
    progress?.achievementId
  );

  if (!achievement) {
    throw new Error("Unknown achievement");
  }

  validateAchievementDefinition(achievement);
  validateAchievementProgress(progress, achievement);

  if (progress.unlocked || amount === 0) {
    return { ...progress };
  }

  const remainingAmount =
    achievement.targetAmount - progress.currentAmount;

  const currentAmount =
    amount >= remainingAmount
      ? achievement.targetAmount
      : progress.currentAmount + amount;

  return {
    ...progress,
    currentAmount,
    unlocked: currentAmount >= achievement.targetAmount
  };
}
