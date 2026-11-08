import type { ItemId } from "@xmoonverse/shared";
import type { QuestProgress } from "./quests";
import { getQuestById } from "./quests";

export interface QuestRewardResult {
  progress: QuestProgress;
  experience: number;
  items: {
    itemId: ItemId;
    quantity: number;
  }[];
}

export function claimQuestReward(
  progress: QuestProgress
): QuestRewardResult {
  const quest = getQuestById(progress.questId);

  if (!quest) {
    throw new Error("Unknown quest");
  }

  if (!progress.completed) {
    throw new Error("Quest is not completed");
  }

  if (progress.claimed) {
    throw new Error("Quest reward has already been claimed");
  }

  return {
    progress: {
      ...progress,
      claimed: true
    },
    experience: quest.rewards.experience,
    items: quest.rewards.items.map((item) => ({
      ...item
    }))
  };
}