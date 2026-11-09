
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

const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  "weapon",
  "head",
  "chest",
  "legs",
  "accessory"
];

export function createInitialEquipment(): EquipmentState {
  return {};
}

function validateEquipment(
  inventory: InventoryItem[],
  equipment: EquipmentState
): void {
  const equippedIds = new Set<ItemId>();

  for (const slot of EQUIPMENT_SLOTS) {
    const itemId = equipment[slot];

    if (!itemId) {
      continue;
    }

    if (equippedIds.has(itemId)) {
      throw new Error(`Item "${itemId}" is equipped more than once`);
    }

    equippedIds.add(itemId);

    const definition = getItemById(itemId);

    if (!definition || definition.equipmentSlot !== slot) {
      throw new Error(`Invalid equipment assigned to slot "${slot}"`);
    }

    const inventoryItem = inventory.find(
      (entry) => entry.itemId === itemId
    );

    if (
      !inventoryItem ||
      inventoryItem.quantity !== 1 ||
      !inventoryItem.equipped
    ) {
      throw new Error(
        `Equipment "${itemId}" is inconsistent with inventory`
      );
    }
  }

  for (const entry of inventory) {
    if (entry.equipped && !equippedIds.has(entry.itemId)) {
      throw new Error(
        `Inventory item "${entry.itemId}" is marked equipped but has no equipment slot`
      );
    }
  }
}

export function equipItem(
  inventory: InventoryItem[],
  equipment: EquipmentState,
  itemId: ItemId,
  characterLevel: number
): EquipmentResult {
  if (!Number.isInteger(characterLevel) || characterLevel < 1) {
    throw new Error("Character level must be a positive integer");
  }

  validateEquipment(inventory, equipment);

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

  if (
    !inventoryItem ||
    inventoryItem.quantity !== 1
  ) {
    throw new Error("Item is not available in inventory");
  }

  const slot = item.equipmentSlot;
  const previousItemId = equipment[slot];

  if (previousItemId === itemId) {
    return {
      inventory: inventory.map((entry) => ({ ...entry })),
      equipment: { ...equipment }
    };
  }

  if (inventoryItem.equipped) {
    throw new Error("Item is already equipped");
  }

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

  validateEquipment(nextInventory, nextEquipment);

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
  validateEquipment(inventory, equipment);

  if (!EQUIPMENT_SLOTS.includes(slot)) {
    throw new Error(`Unknown equipment slot "${slot}"`);
  }

  const itemId = equipment[slot];

  if (!itemId) {
    return {
      inventory: inventory.map((item) => ({ ...item })),
      equipment: { ...equipment }
    };
  }

  const nextEquipment = { ...equipment };
  delete nextEquipment[slot];

  const nextInventory = inventory.map((item) => ({
    ...item,
    equipped:
      item.itemId === itemId ? false : item.equipped
  }));

  validateEquipment(nextInventory, nextEquipment);

  return {
    inventory: nextInventory,
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

  const equippedIds = new Set<ItemId>();

  for (const slot of EQUIPMENT_SLOTS) {
    const itemId = equipment[slot];

    if (!itemId) {
      continue;
    }

    if (equippedIds.has(itemId)) {
      throw new Error(`Item "${itemId}" is equipped more than once`);
    }

    equippedIds.add(itemId);

    const item = getItemById(itemId);

    if (!item || item.equipmentSlot !== slot) {
      throw new Error(`Invalid equipment assigned to slot "${slot}"`);
    }

    if (!item.stats) {
      continue;
    }

    total.attack += item.stats.attack ?? 0;
    total.defense += item.stats.defense ?? 0;
    total.health += item.stats.health ?? 0;
    total.mana += item.stats.mana ?? 0;
  }

  return total;
}
