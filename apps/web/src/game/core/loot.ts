import type { ItemId } from "@xmoonverse/shared";
import type { MonsterDefinition } from "./monsters";

export interface LootDrop {
  itemId: ItemId;
  quantity: number;
}

export function rollMonsterLoot(
  monster: MonsterDefinition,
  random: () => number = Math.random
): LootDrop[] {
  const drops: LootDrop[] = [];

  for (const drop of monster.drops) {
    if (
      !Number.isFinite(drop.chance) ||
      drop.chance < 0 ||
      drop.chance > 1
    ) {
      throw new Error("Invalid loot drop chance");
    }

    if (
      !Number.isInteger(drop.minQuantity) ||
      !Number.isInteger(drop.maxQuantity) ||
      drop.minQuantity < 1 ||
      drop.maxQuantity < drop.minQuantity
    ) {
      throw new Error("Invalid loot quantity range");
    }

    const chanceRoll = random();

    if (chanceRoll < 0 || chanceRoll >= 1) {
      throw new Error("Random value must be between 0 and 1");
    }

    if (chanceRoll >= drop.chance) {
      continue;
    }

    const quantityRoll = random();

    if (quantityRoll < 0 || quantityRoll >= 1) {
      throw new Error("Random value must be between 0 and 1");
    }

    const quantity =
      drop.minQuantity +
      Math.floor(
        quantityRoll *
        (drop.maxQuantity - drop.minQuantity + 1)
      );

    drops.push({
      itemId: drop.itemId,
      quantity
    });
  }

  return drops;
}

export function getGuaranteedMonsterExperience(
  monster: MonsterDefinition
): number {
  if (
    !Number.isInteger(monster.experienceReward) ||
    monster.experienceReward < 0
  ) {
    throw new Error("Invalid monster experience reward");
  }

  return monster.experienceReward;
}