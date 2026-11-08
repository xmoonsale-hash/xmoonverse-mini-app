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

export function getAchievementById(
  achievementId: string
): AchievementDefinition | undefined {
  return ACHIEVEMENT_CATALOG.find(
    (achievement) => achievement.id === achievementId
  );
}

export function getAchievementsByCategory(
  category: AchievementCategory
): AchievementDefinition[] {
  return ACHIEVEMENT_CATALOG.filter(
    (achievement) => achievement.category === category
  );
}

export function createAchievementProgress(
  achievementId: string
): AchievementProgress {
  if (!getAchievementById(achievementId)) {
    throw new Error("Unknown achievement");
  }

  return {
    achievementId,
    currentAmount: 0,
    unlocked: false,
    claimed: false
  };
}

export function updateAchievementProgress(
  progress: AchievementProgress,
  amount: number
): AchievementProgress {
  const achievement = getAchievementById(
    progress.achievementId
  );

  if (!achievement) {
    throw new Error("Unknown achievement");
  }

  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("Progress amount must be non-negative");
  }

  if (progress.unlocked) {
    return { ...progress };
  }

  const currentAmount = Math.min(
    achievement.targetAmount,
    progress.currentAmount + amount
  );

  return {
    ...progress,
    currentAmount,
    unlocked: currentAmount >= achievement.targetAmount
  };
}