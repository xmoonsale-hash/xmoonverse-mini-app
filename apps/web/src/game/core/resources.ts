
import type { GameResource } from "@xmoonverse/shared";

/**
 * Resource catalog.
 *
 * Каждый игровой ресурс связан с предметом из ITEM_CATALOG
 * через itemId. Это позволяет системам сбора и инвентаря
 * использовать единый идентификатор предмета.
 */
export const RESOURCE_CATALOG: GameResource[] = [
  {
    id: "wood",
    itemId: "wood",
    name: "Древесина",
    description: "Обычный строительный материал из деревьев.",
    rarity: "common",
  },
  {
    id: "stone",
    itemId: "stone",
    name: "Камень",
    description: "Базовый материал для изготовления инструментов.",
    rarity: "common",
  },
  {
    id: "wild_herb",
    itemId: "wild_herb",
    name: "Дикая трава",
    description: "Растение, используемое в приготовлении зелий.",
    rarity: "common",
  },
  {
    id: "iron_ore",
    itemId: "iron_ore",
    name: "Железная руда",
    description: "Руда для создания металлического снаряжения.",
    rarity: "uncommon",
  },
  {
    id: "moon_crystal",
    itemId: "moon_crystal",
    name: "Лунный кристалл",
    description: "Редкий кристалл с необычной энергией.",
    rarity: "rare",
  },
  {
    id: "ancient_essence",
    itemId: "ancient_essence",
    name: "Древняя эссенция",
    description: "Мистический материал древнего мира.",
    rarity: "epic",
  },
  {
    id: "celestial_core",
    itemId: "celestial_core",
    name: "Небесное ядро",
    description: "Чрезвычайно редкий источник энергии.",
    rarity: "legendary",
  },
];

export function getResourceById(
  resourceId: string
): GameResource | undefined {
  return RESOURCE_CATALOG.find(
    (resource) => resource.id === resourceId
  );
}

export function getResourcesByRarity(
  rarity: GameResource["rarity"]
): GameResource[] {
  return RESOURCE_CATALOG.filter(
    (resource) => resource.rarity === rarity
  );
}

export function getAllResources(): GameResource[] {
  return RESOURCE_CATALOG.map((resource) => ({
    ...resource,
  }));
}
