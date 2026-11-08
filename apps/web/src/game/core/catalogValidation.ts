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

  const itemIds = new Set(
    ITEM_CATALOG.map((item) => item.id)
  );

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
  ) {
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

  for (const quest of QUEST_CATALOG) {
    for (const reward of quest.rewards.items) {
      if (!itemIds.has(reward.itemId)) {
        errors.push(
          `Quest "${quest.id}" rewards an unknown item "${reward.itemId}"`
        );
      }
    }
  }

  for (const achievement of ACHIEVEMENT_CATALOG) {
    for (const reward of achievement.itemRewards) {
      if (!itemIds.has(reward.itemId)) {
        errors.push(
          `Achievement "${achievement.id}" rewards an unknown item "${reward.itemId}"`
        );
      }
    }
  }

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