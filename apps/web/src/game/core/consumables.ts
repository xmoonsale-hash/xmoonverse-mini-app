
import type {
  InventoryItem,
  ItemId
} from "@xmoonverse/shared";

import type { CharacterVitals } from "./vitals";

import {
  restoreHealth,
  restoreMana
} from "./vitals";

import {
  removeItem
} from "./inventory";

export interface ConsumableEffect {
  itemId: ItemId;
  name: string;
  healthRestore: number;
  manaRestore: number;
}

export interface ConsumableResult {
  inventory: InventoryItem[];
  vitals: CharacterVitals;
  itemId: ItemId;
}

export const CONSUMABLE_CATALOG: ConsumableEffect[] = [
  {
    itemId: "small_health_potion",
    name: "Малое зелье здоровья",
    healthRestore: 40,
    manaRestore: 0
  }
];

export function getConsumableById(
  itemId: ItemId
): ConsumableEffect | undefined {
  return CONSUMABLE_CATALOG.find(
    (item) => item.itemId === itemId
  );
}

function isValidVitals(vitals: CharacterVitals): boolean {
  return (
    Number.isFinite(vitals.health) &&
    Number.isFinite(vitals.maxHealth) &&
    Number.isFinite(vitals.mana) &&
    Number.isFinite(vitals.maxMana) &&
    vitals.maxHealth > 0 &&
    vitals.maxMana >= 0 &&
    vitals.health >= 0 &&
    vitals.health <= vitals.maxHealth &&
    vitals.mana >= 0 &&
    vitals.mana <= vitals.maxMana
  );
}

function getAvailableQuantity(
  inventory: InventoryItem[],
  itemId: ItemId
): number {
  return inventory.reduce(
    (total, item) =>
      item.itemId === itemId && !item.equipped
        ? total + item.quantity
        : total,
    0
  );
}

export function canUseConsumable(
  itemId: ItemId,
  inventory: InventoryItem[],
  vitals: CharacterVitals
): boolean {
  const consumable = getConsumableById(itemId);

  if (!consumable || !isValidVitals(vitals)) {
    return false;
  }

  if (
    !Number.isFinite(consumable.healthRestore) ||
    !Number.isFinite(consumable.manaRestore) ||
    consumable.healthRestore < 0 ||
    consumable.manaRestore < 0 ||
    (
      consumable.healthRestore === 0 &&
      consumable.manaRestore === 0
    )
  ) {
    return false;
  }

  if (getAvailableQuantity(inventory, itemId) < 1) {
    return false;
  }

  return (
    vitals.health > 0 &&
    (
      (
        consumable.healthRestore > 0 &&
        vitals.health < vitals.maxHealth
      ) ||
      (
        consumable.manaRestore > 0 &&
        vitals.mana < vitals.maxMana
      )
    )
  );
}

export function useConsumable(
  itemId: ItemId,
  inventory: InventoryItem[],
  vitals: CharacterVitals
): ConsumableResult {
  const consumable = getConsumableById(itemId);

  if (!consumable) {
    throw new Error("Unknown consumable");
  }

  if (!canUseConsumable(itemId, inventory, vitals)) {
    throw new Error("Consumable cannot be used");
  }

  let nextVitals = { ...vitals };

  if (consumable.healthRestore > 0) {
    nextVitals = restoreHealth(
      nextVitals,
      consumable.healthRestore
    );
  }

  if (consumable.manaRestore > 0) {
    nextVitals = restoreMana(
      nextVitals,
      consumable.manaRestore
    );
  }

  return {
    inventory: removeItem(inventory, itemId, 1),
    vitals: nextVitals,
    itemId
  };
}
