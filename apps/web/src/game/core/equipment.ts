
import type { InventoryItem, ItemId } from "@xmoonverse/shared";
import type { EquipmentSlot } from "./items";
import { getItemById } from "./items";

export type EquipmentState = Partial<
  Record<EquipmentSlot, ItemId>
>;

export interface EquipmentStatBonuses {
  attack: number;
  defense: number;
  health: number;
  mana: number;
}

export interface EquipmentResult {
  inventory: InventoryItem[];
  equipment: EquipmentState;
}

export function createInitialEquipment(): EquipmentState {
  return {};
}

export function equipItem(
  inventory: InventoryItem[],
  equipment: EquipmentState,
  itemId: ItemId,
  characterLevel: number
): EquipmentResult {
  const item = getItemById(itemId);

  if (!item || !item.equipmentSlot) {
    throw new Error("Item cannot be equipped");
  }

  if (characterLevel < item.requiredLevel) {
    throw new Error("Character level is too low");
  }

  const inventoryItem = inventory.find(
    (entry) => entry.itemId === itemId
  );

  if (!inventoryItem || inventoryItem.quantity < 1) {
    throw new Error("Item is not available in inventory");
  }

  const slot = item.equipmentSlot;
  const previousItemId = equipment[slot];

  const nextEquipment: EquipmentState = {
    ...equipment,
    [slot]: itemId
  };

  const nextInventory = inventory.map((entry) => ({
    ...entry,
    equipped:
      entry.itemId === itemId
        ? true
        : entry.itemId === previousItemId
          ? false
          : entry.equipped
  }));

  return {
    inventory: nextInventory,
    equipment: nextEquipment
  };
}

export function unequipItem(
  inventory: InventoryItem[],
  equipment: EquipmentState,
  slot: EquipmentSlot
): EquipmentResult {
  const itemId = equipment[slot];

  if (!itemId) {
    return {
      inventory: inventory.map((item) => ({ ...item })),
      equipment: { ...equipment }
    };
  }

  const nextEquipment = { ...equipment };
  delete nextEquipment[slot];

  return {
    inventory: inventory.map((item) => ({
      ...item,
      equipped:
        item.itemId === itemId ? false : item.equipped
    })),
    equipment: nextEquipment
  };
}

export function getEquipmentStats(
  equipment: EquipmentState
): EquipmentStatBonuses {
  const total: EquipmentStatBonuses = {
    attack: 0,
    defense: 0,
    health: 0,
    mana: 0
  };

  for (const itemId of Object.values(equipment)) {
    if (!itemId) continue;

    const item = getItemById(itemId);

    if (!item?.stats) continue;

    total.attack += item.stats.attack ?? 0;
    total.defense += item.stats.defense ?? 0;
    total.health += item.stats.health ?? 0;
    total.mana += item.stats.mana ?? 0;
  }

  return total;
}
