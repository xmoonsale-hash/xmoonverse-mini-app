
import type { InventoryItem } from "@xmoonverse/shared";
import type { ProfessionId } from "./professions";

import { getRecipeById } from "./crafting";
import { addItem, removeItem } from "./inventory";
import { getItemById } from "./items";

export interface CraftingResult {
  inventory: InventoryItem[];
  craftedItemId: string;
  craftedQuantity: number;
  craftingTimeSeconds: number;
}

function hasRequiredIngredients(
  inventory: InventoryItem[],
  ingredients: { itemId: string; quantity: number }[]
): boolean {
  return ingredients.every((ingredient) => {
    const item = getItemById(ingredient.itemId);

    if (
      !item ||
      !Number.isInteger(ingredient.quantity) ||
      ingredient.quantity <= 0
    ) {
      return false;
    }

    const availableQuantity = inventory.reduce(
      (total, entry) =>
        entry.itemId === ingredient.itemId && !entry.equipped
          ? total + entry.quantity
          : total,
      0
    );

    return availableQuantity >= ingredient.quantity;
  });
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

  if (
    !Number.isInteger(recipe.output.quantity) ||
    recipe.output.quantity <= 0 ||
    !Number.isInteger(recipe.craftingTimeSeconds) ||
    recipe.craftingTimeSeconds < 0
  ) {
    return false;
  }

  const outputItem = getItemById(recipe.output.itemId);

  if (!outputItem) {
    return false;
  }

  if (
    !outputItem.stackable &&
    recipe.output.quantity !== 1
  ) {
    return false;
  }

  return hasRequiredIngredients(
    inventory,
    recipe.ingredients
  );
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
