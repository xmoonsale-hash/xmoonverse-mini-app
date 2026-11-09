
import { ITEM_CATALOG } from "./items";
import { RESOURCE_CATALOG } from "./resources";
import { WORLD_REGIONS } from "./world";
import { PROFESSION_CATALOG } from "./professions";
import { CRAFTING_RECIPES } from "./crafting";
import { MONSTER_CATALOG } from "./monsters";
import { QUEST_CATALOG } from "./quests";
import { ACHIEVEMENT_CATALOG } from "./achievements";
import { GATHERING_NODES } from "./gathering";
import { FISHING_SPOTS } from "./fishing";

export function validateGameCatalogs(): string[] {
  const errors: string[] = [];

  const itemById = new Map(
    ITEM_CATALOG.map((item) => [item.id, item])
  );

  const itemIds = new Set(itemById.keys());

  const resourceIds = new Set(
    RESOURCE_CATALOG.map((resource) => resource.id)
  );

  const regionIds = new Set(
    WORLD_REGIONS.map((region) => region.id)
  );

  const professionIds = new Set(
    PROFESSION_CATALOG.map((profession) => profession.id)
  );

  function checkUniqueIds(
    ids: string[],
    catalogName: string
  ): void {
    const seen = new Set<string>();

    for (const id of ids) {
      if (seen.has(id)) {
        errors.push(
          `${catalogName}: duplicate ID "${id}"`
        );
      }

      seen.add(id);
    }
  }

  checkUniqueIds(
    ITEM_CATALOG.map((item) => item.id),
    "Items"
  );

  checkUniqueIds(
    RESOURCE_CATALOG.map((resource) => resource.id),
    "Resources"
  );

  checkUniqueIds(
    WORLD_REGIONS.map((region) => region.id),
    "Regions"
  );

  checkUniqueIds(
    PROFESSION_CATALOG.map((profession) => profession.id),
    "Professions"
  );

  // Validate item definitions.
  for (const item of ITEM_CATALOG) {
    if (
      !Number.isInteger(item.requiredLevel) ||
      item.requiredLevel < 1
    ) {
      errors.push(
        `Item "${item.id}" has an invalid required level`
      );
    }

    if (
      !Number.isInteger(item.maxStack) ||
      item.maxStack < 1
    ) {
      errors.push(
        `Item "${item.id}" has an invalid maximum stack`
      );
    }

    if (!item.stackable && item.maxStack !== 1) {
      errors.push(
        `Non-stackable item "${item.id}" must have maxStack equal to 1`
      );
    }

    if (item.stackable && item.maxStack < 2) {
      errors.push(
        `Stackable item "${item.id}" must have maxStack greater than 1`
      );
    }

    if (
      ["weapon", "armor", "accessory"].includes(item.type) &&
      !item.equipmentSlot
    ) {
      errors.push(
        `Equipment item "${item.id}" has no equipment slot`
      );
    }

    if (
      item.type === "material" &&
      item.equipmentSlot
    ) {
      errors.push(
        `Material item "${item.id}" must not have an equipment slot`
      );
    }
  }

  // Validate resource-to-item relationships.
  for (const resource of RESOURCE_CATALOG) {
    const item = itemById.get(resource.itemId);

    if (!item) {
      errors.push(
        `Resource "${resource.id}" references unknown item "${resource.itemId}"`
      );
      continue;
    }

    if (item.type !== "material") {
      errors.push(
        `Resource "${resource.id}" must reference a material item`
      );
    }

    if (resource.rarity !== item.rarity) {
      errors.push(
        `Resource "${resource.id}" rarity does not match item "${item.id}"`
      );
    }
  }

  // Validate crafting recipes.
  for (const recipe of CRAFTING_RECIPES) {
    if (!professionIds.has(recipe.professionId)) {
      errors.push(
        `Recipe "${recipe.id}" references an unknown profession`
      );
    }

    if (!itemIds.has(recipe.output.itemId)) {
      errors.push(
        `Recipe "${recipe.id}" references an unknown output item`
      );
    }

    for (const ingredient of recipe.ingredients) {
      if (!itemIds.has(ingredient.itemId)) {
        errors.push(
          `Recipe "${recipe.id}" references unknown ingredient "${ingredient.itemId}"`
        );
      }
    }
  }

  // Validate monsters and their drops.
  for (const monster of MONSTER_CATALOG) {
    if (!regionIds.has(monster.regionId)) {
      errors.push(
        `Monster "${monster.id}" references an unknown region`
      );
    }

    for (const drop of monster.drops) {
      if (!itemIds.has(drop.itemId)) {
        errors.push(
          `Monster "${monster.id}" drops unknown item "${drop.itemId}"`
        );
      }
    }
  }

  // Validate quest rewards.
  for (const quest of QUEST_CATALOG) {
    for (const reward of quest.rewards.items) {
      if (!itemIds.has(reward.itemId)) {
        errors.push(
          `Quest "${quest.id}" rewards an unknown item "${reward.itemId}"`
        );
      }
    }
  }

  // Validate achievement rewards.
  for (const achievement of ACHIEVEMENT_CATALOG) {
    for (const reward of achievement.itemRewards) {
      if (!itemIds.has(reward.itemId)) {
        errors.push(
          `Achievement "${achievement.id}" rewards an unknown item "${reward.itemId}"`
        );
      }
    }
  }

  // Validate gathering nodes.
  for (const node of GATHERING_NODES) {
    if (!regionIds.has(node.regionId)) {
      errors.push(
        `Gathering node "${node.id}" references an unknown region`
      );
    }

    if (!professionIds.has(node.professionId)) {
      errors.push(
        `Gathering node "${node.id}" references an unknown profession`
      );
    }

    if (!resourceIds.has(node.resourceId)) {
      errors.push(
        `Gathering node "${node.id}" references an unknown resource`
      );
    }
  }

  // Validate fishing spots and possible catches.
  for (const spot of FISHING_SPOTS) {
    if (!regionIds.has(spot.regionId)) {
      errors.push(
        `Fishing spot "${spot.id}" references an unknown region`
      );
    }

    for (const entry of spot.possibleCatches) {
      if (!itemIds.has(entry.itemId)) {
        errors.push(
          `Fishing spot "${spot.id}" references unknown item "${entry.itemId}"`
        );
      }
    }
  }

  return errors;
}
