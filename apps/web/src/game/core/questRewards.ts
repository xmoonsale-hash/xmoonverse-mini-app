import type { ItemId } from "@xmoonverse/shared";
import type { QuestProgress } from "./quests";
import { getQuestById } from "./quests";
import { getItemById } from "./items";
import { isQuestCompleted } from "./questProgress";

export interface QuestRewardResult {
  progress: QuestProgress;
  experience: number;
  items: {
    itemId: ItemId;
    quantity: number;
  }[];
}

function validateQuestRewards(
  rewards: {
    experience: number;
    items: {
      itemId: ItemId;
      quantity: number;
    }[];
  }
): boolean {
  if (
    typeof rewards !== "object" ||
    rewards === null ||
    !Number.isSafeInteger(rewards.experience) ||
    rewards.experience < 0 ||
    !Array.isArray(rewards.items)
  ) {
    return false;
  }

  const rewardedItems = new Set<ItemId>();

  for (const reward of rewards.items) {
    if (
      typeof reward !== "object" ||
      reward === null ||
      typeof reward.itemId !== "string" ||
      !getItemById(reward.itemId) ||
      !Number.isSafeInteger(reward.quantity) ||
      reward.quantity <= 0 ||
      rewardedItems.has(reward.itemId)
    ) {
      return false;
    }

    rewardedItems.add(reward.itemId);
  }

  return true;
}

export function claimQuestReward(
  progress: QuestProgress
): QuestRewardResult {
  if (
    typeof progress !== "object" ||
    progress === null ||
    typeof progress.questId !== "string" ||
    typeof progress.completed !== "boolean" ||
    typeof progress.claimed !== "boolean"
  ) {
    throw new Error("Invalid quest progress");
  }

  const quest = getQuestById(progress.questId);

  if (!quest) {
    throw new Error("Unknown quest");
  }

  if (!isQuestCompleted(quest, progress)) {
    throw new Error("Quest is not completed");
  }

  if (progress.claimed) {
    throw new Error("Quest reward has already been claimed");
  }

  if (!validateQuestRewards(quest.rewards)) {
    throw new Error("Invalid quest rewards");
  }

  return {
    progress: {
      ...progress,
      completedObjectives: {
        ...progress.completedObjectives
      },
      claimed: true
    },
    experience: quest.rewards.experience,
    items: quest.rewards.items.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity
    }))
  };
}