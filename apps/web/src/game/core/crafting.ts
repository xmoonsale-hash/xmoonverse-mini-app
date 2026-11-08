import type { ItemId } from "@xmoonverse/shared";
import type { ProfessionId } from "./professions";

export interface CraftingIngredient {
  itemId: string;
  quantity: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  professionId: ProfessionId;
  requiredProfessionLevel: number;
  ingredients: CraftingIngredient[];
  output: {
    itemId: ItemId;
    quantity: number;
  };
  craftingTimeSeconds: number;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: "recipe_wooden_sword",
    name: "Деревянный меч",
    description: "Изготовление простого оружия для начинающего героя.",
    professionId: "blacksmithing",
    requiredProfessionLevel: 1,
    ingredients: [
      {
        itemId: "wood",
        quantity: 5
      }
    ],
    output: {
      itemId: "wooden_sword",
      quantity: 1
    },
    craftingTimeSeconds: 30
  },
  {
    id: "recipe_traveler_armor",
    name: "Доспех путешественника",
    description: "Создание лёгкой защитной экипировки.",
    professionId: "blacksmithing",
    requiredProfessionLevel: 2,
    ingredients: [
      {
        itemId: "wood",
        quantity: 8
      },
      {
        itemId: "stone",
        quantity: 3
      }
    ],
    output: {
      itemId: "traveler_armor",
      quantity: 1
    },
    craftingTimeSeconds: 60
  },
  {
    id: "recipe_health_potion",
    name: "Малое зелье здоровья",
    description: "Приготовление простого восстанавливающего зелья.",
    professionId: "alchemy",
    requiredProfessionLevel: 1,
    ingredients: [
      {
        itemId: "wild_herb",
        quantity: 3
      }
    ],
    output: {
      itemId: "small_health_potion",
      quantity: 1
    },
    craftingTimeSeconds: 20
  }
];

export function getRecipeById(
  recipeId: string
): CraftingRecipe | undefined {
  return CRAFTING_RECIPES.find(
    (recipe) => recipe.id === recipeId
  );
}

export function getRecipesByProfession(
  professionId: ProfessionId
): CraftingRecipe[] {
  return CRAFTING_RECIPES.filter(
    (recipe) => recipe.professionId === professionId
  );
}

export function getAvailableRecipes(
  professionId: ProfessionId,
  professionLevel: number
): CraftingRecipe[] {
  return CRAFTING_RECIPES.filter(
    (recipe) =>
      recipe.professionId === professionId &&
      recipe.requiredProfessionLevel <= professionLevel
  );
}