
import type { ItemId } from "@xmoonverse/shared";
import type { AchievementProgress } from "./achievements";
import { getAchievementById } from "./achievements";

export interface AchievementRewardResult {
  progress: AchievementProgress;
  experience: number;
  items: {
    itemId: ItemId;
    quantity: number;
  }[];
}

function validateAchievementProgress(
  progress: AchievementProgress
): void {
  if (
    typeof progress !== "object" ||
    progress === null ||
    Array.isArray(progress)
  ) {
    throw new Error("Invalid achievement progress");
  }

  if (
    typeof progress.achievementId !== "string" ||
    !progress.achievementId.trim()
  ) {
    throw new Error("Invalid achievement ID");
  }

  if (typeof progress.unlocked !== "boolean") {
    throw new Error("Invalid achievement unlock state");
  }

  if (typeof progress.claimed !== "boolean") {
    throw new Error("Invalid achievement claim state");
  }
}

function validateReward(
  experience: number,
  items: { itemId: ItemId; quantity: number }[]
): void {
  if (
    !Number.isSafeInteger(experience) ||
    experience < 0
  ) {
    throw new Error("Invalid achievement experience reward");
  }

  if (!Array.isArray(items)) {
    throw new Error("Invalid achievement item rewards");
  }

  const seenItemIds = new Set<ItemId>();

  for (const item of items) {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item)
    ) {
      throw new Error("Invalid achievement item reward");
    }

    if (
      typeof item.itemId !== "string" ||
      !item.itemId.trim()
    ) {
      throw new Error("Invalid achievement reward item ID");
    }

    if (
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error("Invalid achievement reward quantity");
    }

    if (seenItemIds.has(item.itemId)) {
      throw new Error("Duplicate achievement reward item");
    }

    seenItemIds.add(item.itemId);
  }
}

export function claimAchievementReward(
  progress: AchievementProgress
): AchievementRewardResult {
  validateAchievementProgress(progress);

  const achievement = getAchievementById(
    progress.achievementId
  );

  if (!achievement) {
    throw new Error("Unknown achievement");
  }

  if (!progress.unlocked) {
    throw new Error("Achievement is not unlocked");
  }

  if (progress.claimed) {
    throw new Error("Achievement reward has already been claimed");
  }

  validateReward(
    achievement.experienceReward,
    achievement.itemRewards
  );

  return {
    progress: {
      ...progress,
      claimed: true
    },
    experience: achievement.experienceReward,
    items: achievement.itemRewards.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity
    }))
  };
}
