import type { ItemId } from "@xmoonverse/shared";
import type { MonsterDefinition } from "./monsters";

import { getItemById } from "./items";

export interface LootDrop {
  itemId: ItemId;
  quantity: number;
}

function getRandomValue(random: () => number): number {
  if (typeof random !== "function") {
    throw new Error("Random source must be a function");
  }

  const value = random();

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    throw new Error("Random value must be between 0 and 1");
  }

  return value;
}

function validateMonsterLoot(
  monster: MonsterDefinition
): void {
  if (
    !monster ||
    typeof monster !== "object" ||
    !Array.isArray(monster.drops)
  ) {
    throw new Error("Invalid monster loot configuration");
  }

  for (const drop of monster.drops) {
    if (!drop || typeof drop !== "object") {
      throw new Error("Invalid loot drop configuration");
    }

    if (
      typeof drop.itemId !== "string" ||
      !drop.itemId.trim()
    ) {
      throw new Error("Loot item ID is required");
    }

    if (
      !Number.isFinite(drop.chance) ||
      drop.chance < 0 ||
      drop.chance > 1
    ) {
      throw new Error("Invalid loot drop chance");
    }

    if (
      !Number.isSafeInteger(drop.minQuantity) ||
      !Number.isSafeInteger(drop.maxQuantity) ||
      drop.minQuantity < 1 ||
      drop.maxQuantity < drop.minQuantity
    ) {
      throw new Error("Invalid loot quantity range");
    }

    const item = getItemById(drop.itemId);

    if (!item) {
      throw new Error("Loot item is not configured");
    }

    if (
      !item.stackable &&
      (
        drop.minQuantity !== 1 ||
        drop.maxQuantity !== 1
      )
    ) {
      throw new Error(
        "Non-stackable loot items must have quantity 1"
      );
    }
  }
}

export function rollMonsterLoot(
  monster: MonsterDefinition,
  random: () => number = Math.random
): LootDrop[] {
  if (typeof random !== "function") {
    throw new Error("Random source must be a function");
  }

  validateMonsterLoot(monster);

  const drops: LootDrop[] = [];

  for (const drop of monster.drops) {
    const chanceRoll = getRandomValue(random);

    if (chanceRoll >= drop.chance) {
      continue;
    }

    const quantityRoll = getRandomValue(random);

    const quantity =
      drop.minQuantity +
      Math.floor(
        quantityRoll *
          (drop.maxQuantity - drop.minQuantity + 1)
      );

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < drop.minQuantity ||
      quantity > drop.maxQuantity
    ) {
      throw new Error("Invalid loot reward quantity");
    }

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
    !monster ||
    typeof monster !== "object" ||
    !Number.isSafeInteger(monster.experienceReward) ||
    monster.experienceReward < 0
  ) {
    throw new Error("Invalid monster experience reward");
  }

  return monster.experienceReward;
}