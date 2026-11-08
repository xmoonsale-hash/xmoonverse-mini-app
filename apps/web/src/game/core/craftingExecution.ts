import type { InventoryItem } from "@xmoonverse/shared";
import type { ProfessionId } from "./professions";

import {
  getRecipeById
} from "./crafting";

import {
  addItem,
  removeItem
} from "./inventory";

import {
  getItemById
} from "./items";

export interface CraftingResult {
  inventory: InventoryItem[];
  craftedItemId: string;
  craftedQuantity: number;
  craftingTimeSeconds: number;
}

export function canCraftRecipe(
  recipeId: string,
  professionId: ProfessionId,
  professionLevel: number,
  inventory: InventoryItem[]
): boolean {
  const recipe = getRecipeById(recipeId);

  if (!recipe || recipe.professionId !== professionId) {
    return false;
  }

  if (
    !Number.isInteger(professionLevel) ||
    professionLevel < recipe.requiredProfessionLevel
  ) {
    return false;
  }

  if (!getItemById(recipe.output.itemId)) {
    return false;
  }

  return recipe.ingredients.every((ingredient) => {
    const item = getItemById(ingredient.itemId);

    const inventoryItem = inventory.find(
      (entry) => entry.itemId === ingredient.itemId
    );

    return Boolean(
      item &&
      inventoryItem &&
      inventoryItem.quantity >= ingredient.quantity
    );
  });
}

export function craftItem(
  recipeId: string,
  professionId: ProfessionId,
  professionLevel: number,
  inventory: InventoryItem[]
): CraftingResult {
  const recipe = getRecipeById(recipeId);

  if (!recipe) {
    throw new Error("Unknown crafting recipe");
  }

  if (
    !canCraftRecipe(
      recipeId,
      professionId,
      professionLevel,
      inventory
    )
  ) {
    throw new Error("Crafting requirements are not met");
  }

  let nextInventory = inventory.map((item) => ({
    ...item
  }));

  for (const ingredient of recipe.ingredients) {
    nextInventory = removeItem(
      nextInventory,
      ingredient.itemId,
      ingredient.quantity
    );
  }

  nextInventory = addItem(
    nextInventory,
    recipe.output.itemId,
    recipe.output.quantity
  );

  return {
    inventory: nextInventory,
    craftedItemId: recipe.output.itemId,
    craftedQuantity: recipe.output.quantity,
    craftingTimeSeconds: recipe.craftingTimeSeconds
  };
}