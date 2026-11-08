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

export function claimAchievementReward(
  progress: AchievementProgress
): AchievementRewardResult {
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

  return {
    progress: {
      ...progress,
      claimed: true
    },
    experience: achievement.experienceReward,
    items: achievement.itemRewards.map((item) => ({
      ...item
    }))
  };
}