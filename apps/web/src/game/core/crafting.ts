
import type { ItemId } from "@xmoonverse/shared";
import { ITEM_CATALOG } from "./items";
import {
  PROFESSION_CATALOG,
  type ProfessionId
} from "./professions";

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

const MAX_PROFESSION_LEVEL = 50;

const ITEM_IDS = new Set(
  ITEM_CATALOG.map((item) => item.id)
);

const PROFESSION_BY_ID = new Map(
  PROFESSION_CATALOG.map((profession) => [
    profession.id,
    profession
  ])
);

function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function cloneRecipe(recipe: CraftingRecipe): CraftingRecipe {
  return {
    ...recipe,
    ingredients: recipe.ingredients.map((ingredient) => ({
      ...ingredient
    })),
    output: {
      ...recipe.output
    }
  };
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

export function validateCraftingCatalog(): string[] {
  const errors: string[] = [];
  const seenRecipeIds = new Set<string>();

  for (const recipe of CRAFTING_RECIPES) {
    if (!recipe || typeof recipe !== "object") {
      errors.push("Crafting: invalid recipe definition");
      continue;
    }

    if (
      typeof recipe.id !== "string" ||
      !recipe.id.trim()
    ) {
      errors.push("Crafting: invalid recipe ID");
    } else if (seenRecipeIds.has(recipe.id)) {
      errors.push(
        `Crafting: duplicate recipe ID "${recipe.id}"`
      );
    }

    if (typeof recipe.id === "string") {
      seenRecipeIds.add(recipe.id);
    }

    if (
      typeof recipe.name !== "string" ||
      !recipe.name.trim()
    ) {
      errors.push(
        `Recipe "${recipe.id}" has an invalid name`
      );
    }

    if (
      typeof recipe.description !== "string" ||
      !recipe.description.trim()
    ) {
      errors.push(
        `Recipe "${recipe.id}" has an invalid description`
      );
    }

    const profession = PROFESSION_BY_ID.get(
      recipe.professionId
    );

    if (!profession) {
      errors.push(
        `Recipe "${recipe.id}" references an unknown profession`
      );
    } else if (profession.category !== "crafting") {
      errors.push(
        `Recipe "${recipe.id}" requires a non-crafting profession`
      );
    }

    if (
      !isPositiveSafeInteger(recipe.requiredProfessionLevel) ||
      recipe.requiredProfessionLevel > MAX_PROFESSION_LEVEL ||
      (
        profession &&
        recipe.requiredProfessionLevel > profession.maxLevel
      )
    ) {
      errors.push(
        `Recipe "${recipe.id}" has an invalid required profession level`
      );
    }

    if (!Array.isArray(recipe.ingredients)) {
      errors.push(
        `Recipe "${recipe.id}" has invalid ingredients`
      );
    } else if (recipe.ingredients.length === 0) {
      errors.push(
        `Recipe "${recipe.id}" must have at least one ingredient`
      );
    } else {
      const seenIngredientIds = new Set<string>();

      for (const ingredient of recipe.ingredients) {
        if (!ingredient || typeof ingredient !== "object") {
          errors.push(
            `Recipe "${recipe.id}" contains an invalid ingredient`
          );
          continue;
        }

        if (
          typeof ingredient.itemId !== "string" ||
          !ingredient.itemId.trim()
        ) {
          errors.push(
            `Recipe "${recipe.id}" contains an invalid ingredient item ID`
          );
          continue;
        }

        if (seenIngredientIds.has(ingredient.itemId)) {
          errors.push(
            `Recipe "${recipe.id}" has duplicate ingredient "${ingredient.itemId}"`
          );
        }

        seenIngredientIds.add(ingredient.itemId);

        if (!ITEM_IDS.has(ingredient.itemId)) {
          errors.push(
            `Recipe "${recipe.id}" references unknown ingredient "${ingredient.itemId}"`
          );
        }

        if (!isPositiveSafeInteger(ingredient.quantity)) {
          errors.push(
            `Recipe "${recipe.id}" has an invalid quantity for ingredient "${ingredient.itemId}"`
          );
        }
      }
    }

    if (!recipe.output || typeof recipe.output !== "object") {
      errors.push(
        `Recipe "${recipe.id}" has an invalid output`
      );
      continue;
    }

    if (
      typeof recipe.output.itemId !== "string" ||
      !recipe.output.itemId.trim()
    ) {
      errors.push(
        `Recipe "${recipe.id}" has an invalid output item ID`
      );
    } else {
      const outputItem = ITEM_CATALOG.find(
        (item) => item.id === recipe.output.itemId
      );

      if (!outputItem) {
        errors.push(
          `Recipe "${recipe.id}" references an unknown output item`
        );
      } else if (
        !outputItem.stackable &&
        recipe.output.quantity !== 1
      ) {
        errors.push(
          `Recipe "${recipe.id}" produces multiple non-stackable items`
        );
      }
    }

    if (!isPositiveSafeInteger(recipe.output.quantity)) {
      errors.push(
        `Recipe "${recipe.id}" has an invalid output quantity`
      );
    }

    if (!isNonNegativeSafeInteger(recipe.craftingTimeSeconds)) {
      errors.push(
        `Recipe "${recipe.id}" has an invalid crafting time`
      );
    }
  }

  return errors;
}

const CRAFTING_CATALOG_ERRORS = validateCraftingCatalog();

if (CRAFTING_CATALOG_ERRORS.length > 0) {
  throw new Error(
    `Invalid crafting catalog:\n${CRAFTING_CATALOG_ERRORS.join("\n")}`
  );
}

export function getRecipeById(
  recipeId: string
): CraftingRecipe | undefined {
  if (
    typeof recipeId !== "string" ||
    !recipeId.trim()
  ) {
    return undefined;
  }

  const recipe = CRAFTING_RECIPES.find(
    (entry) => entry.id === recipeId
  );

  return recipe ? cloneRecipe(recipe) : undefined;
}

export function getRecipesByProfession(
  professionId: ProfessionId
): CraftingRecipe[] {
  if (!PROFESSION_BY_ID.has(professionId)) {
    return [];
  }

  return CRAFTING_RECIPES
    .filter(
      (recipe) => recipe.professionId === professionId
    )
    .map(cloneRecipe);
}

export function getAvailableRecipes(
  professionId: ProfessionId,
  professionLevel: number
): CraftingRecipe[] {
  if (
    !PROFESSION_BY_ID.has(professionId) ||
    !isPositiveSafeInteger(professionLevel)
  ) {
    return [];
  }

  const profession = PROFESSION_BY_ID.get(professionId);

  if (
    !profession ||
    professionLevel > profession.maxLevel
  ) {
    return [];
  }

  return CRAFTING_RECIPES
    .filter(
      (recipe) =>
        recipe.professionId === professionId &&
        recipe.requiredProfessionLevel <= professionLevel
    )
    .map(cloneRecipe);
}
