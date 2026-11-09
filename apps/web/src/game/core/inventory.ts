
import type { InventoryItem, ItemId } from "@xmoonverse/shared";
import { getItemById } from "./items";

function validateInventory(inventory: InventoryItem[]): void {
  for (const entry of inventory) {
    const definition = getItemById(entry.itemId);

    if (!definition) {
      throw new Error(`Unknown item "${entry.itemId}" in inventory`);
    }

    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0) {
      throw new Error(`Invalid quantity for item "${entry.itemId}"`);
    }

    if (entry.quantity > definition.maxStack) {
      throw new Error(`Stack limit exceeded for item "${entry.itemId}"`);
    }

    if (!definition.stackable && entry.quantity !== 1) {
      throw new Error(`Item "${entry.itemId}" cannot be stacked`);
    }
  }
}

export function addItem(
  inventory: InventoryItem[],
  itemId: ItemId,
  quantity: number
): InventoryItem[] {
  if (!itemId.trim()) {
    throw new Error("Item ID is required");
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer");
  }

  validateInventory(inventory);

  const definition = getItemById(itemId);

  if (!definition) {
    throw new Error(`Unknown item "${itemId}"`);
  }

  const result = inventory.map((entry) => ({ ...entry }));

  if (!definition.stackable) {
    if (quantity !== 1) {
      throw new Error("Non-stackable items must be added one at a time");
    }

    if (result.some((entry) => entry.itemId === itemId)) {
      throw new Error("This item is already present in inventory");
    }

    result.push({
      itemId,
      quantity: 1,
      equipped: false
    });

    return result;
  }

  let remaining = quantity;

  for (const entry of result) {
    if (entry.itemId !== itemId || entry.equipped) {
      continue;
    }

    const availableSpace = definition.maxStack - entry.quantity;

    if (availableSpace <= 0) {
      continue;
    }

    const added = Math.min(availableSpace, remaining);

    entry.quantity += added;
    remaining -= added;

    if (remaining === 0) {
      return result;
    }
  }

  while (remaining > 0) {
    const stackQuantity = Math.min(
      definition.maxStack,
      remaining
    );

    result.push({
      itemId,
      quantity: stackQuantity,
      equipped: false
    });

    remaining -= stackQuantity;
  }

  return result;
}

export function removeItem(
  inventory: InventoryItem[],
  itemId: ItemId,
  quantity: number
): InventoryItem[] {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer");
  }

  validateInventory(inventory);

  const definition = getItemById(itemId);

  if (!definition) {
    throw new Error(`Unknown item "${itemId}"`);
  }

  const availableQuantity = inventory.reduce(
    (total, entry) =>
      entry.itemId === itemId && !entry.equipped
        ? total + entry.quantity
        : total,
    0
  );

  if (availableQuantity < quantity) {
    throw new Error("Not enough unequipped items in inventory");
  }

  let remaining = quantity;

  const result: InventoryItem[] = [];

  for (const entry of inventory) {
    const nextEntry = { ...entry };

    if (
      nextEntry.itemId === itemId &&
      !nextEntry.equipped &&
      remaining > 0
    ) {
      const removed = Math.min(
        nextEntry.quantity,
        remaining
      );

      nextEntry.quantity -= removed;
      remaining -= removed;
    }

    if (nextEntry.quantity > 0) {
      result.push(nextEntry);
    }
  }

  return result;
}

export function getInventoryItemCount(
  inventory: InventoryItem[]
): number {
  return inventory.reduce(
    (total, item) => total + item.quantity,
    0
  );
}

export function getUniqueInventoryItems(
  inventory: InventoryItem[]
): number {
  return new Set(
    inventory.map((item) => item.itemId)
  ).size;
}
