import type { InventoryItem, ItemId } from "@xmoonverse/shared";

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

  const existingItem = inventory.find(
    (item) => item.itemId === itemId
  );

  if (existingItem) {
    return inventory.map((item) =>
      item.itemId === itemId
        ? { ...item, quantity: item.quantity + quantity }
        : { ...item }
    );
  }

  return [
    ...inventory.map((item) => ({ ...item })),
    {
      itemId,
      quantity,
      equipped: false
    }
  ];
}

export function removeItem(
  inventory: InventoryItem[],
  itemId: ItemId,
  quantity: number
): InventoryItem[] {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer");
  }

  const existingItem = inventory.find(
    (item) => item.itemId === itemId
  );

  if (!existingItem || existingItem.quantity < quantity) {
    throw new Error("Not enough items in inventory");
  }

  return inventory
    .map((item) =>
      item.itemId === itemId
        ? { ...item, quantity: item.quantity - quantity }
        : { ...item }
    )
    .filter((item) => item.quantity > 0);
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
  return inventory.length;
}