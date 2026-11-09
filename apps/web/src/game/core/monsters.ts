
import type { ItemId } from "@xmoonverse/shared";

import { getItemById } from "./items";
import { getRegionById } from "./world";

export type MonsterRarity =
  | "normal"
  | "elite"
  | "boss";

export interface MonsterDrop {
  itemId: ItemId;
  chance: number;
  minQuantity: number;
  maxQuantity: number;
}

export interface MonsterDefinition {
  id: string;
  name: string;
  description: string;
  regionId: string;
  rarity: MonsterRarity;
  level: number;
  health: number;
  attack: number;
  defense: number;
  experienceReward: number;
  drops: MonsterDrop[];
}

const MONSTER_RARITIES: readonly MonsterRarity[] = [
  "normal",
  "elite",
  "boss"
];

export const MONSTER_CATALOG: MonsterDefinition[] = [
  {
    id: "forest_slime",
    name: "Лесной слизень",
    description: "Слабый монстр, обитающий на зелёных полянах.",
    regionId: "greenhaven",
    rarity: "normal",
    level: 1,
    health: 35,
    attack: 4,
    defense: 1,
    experienceReward: 15,
    drops: [
      {
        itemId: "wild_herb",
        chance: 0.25,
        minQuantity: 1,
        maxQuantity: 2
      }
    ]
  },
  {
    id: "wild_wolf",
    name: "Дикий волк",
    description: "Быстрый хищник, охраняющий лесные тропы.",
    regionId: "greenhaven",
    rarity: "normal",
    level: 3,
    health: 65,
    attack: 9,
    defense: 3,
    experienceReward: 30,
    drops: [
      {
        itemId: "wood",
        chance: 0.2,
        minQuantity: 1,
        maxQuantity: 2
      }
    ]
  },
  {
    id: "ancient_golem",
    name: "Древний голем",
    description: "Массивный каменный страж древних руин.",
    regionId: "whispering_plains",
    rarity: "elite",
    level: 8,
    health: 350,
    attack: 28,
    defense: 15,
    experienceReward: 180,
    drops: [
      {
        itemId: "iron_ore",
        chance: 0.6,
        minQuantity: 2,
        maxQuantity: 5
      }
    ]
  },
  {
    id: "moon_guardian",
    name: "Лунный страж",
    description: "Могущественный хранитель древней энергии.",
    regionId: "moonfall_desert",
    rarity: "boss",
    level: 25,
    health: 2500,
    attack: 95,
    defense: 55,
    experienceReward: 1500,
    drops: [
      {
        itemId: "moon_crystal",
        chance: 0.8,
        minQuantity: 1,
        maxQuantity: 3
      },
      {
        itemId: "ancient_essence",
        chance: 0.25,
        minQuantity: 1,
        maxQuantity: 1
      }
    ]
  }
];

function validateMonsterDrop(
  drop: MonsterDrop,
  monsterId: string
): void {
  if (
    !drop ||
    typeof drop !== "object" ||
    Array.isArray(drop)
  ) {
    throw new Error(
      `Invalid drop definition for monster "${monsterId}"`
    );
  }

  if (
    typeof drop.itemId !== "string" ||
    !drop.itemId.trim()
  ) {
    throw new Error(
      `Invalid drop item ID for monster "${monsterId}"`
    );
  }

  if (
    typeof drop.chance !== "number" ||
    !Number.isFinite(drop.chance) ||
    drop.chance < 0 ||
    drop.chance > 1
  ) {
    throw new Error(
      `Invalid drop chance for monster "${monsterId}"`
    );
  }

  if (
    !Number.isSafeInteger(drop.minQuantity) ||
    !Number.isSafeInteger(drop.maxQuantity) ||
    drop.minQuantity < 1 ||
    drop.maxQuantity < drop.minQuantity
  ) {
    throw new Error(
      `Invalid drop quantity range for monster "${monsterId}"`
    );
  }

  const item = getItemById(drop.itemId);

  if (!item) {
    throw new Error(
      `Monster "${monsterId}" references unknown item "${drop.itemId}"`
    );
  }

  if (
    !item.stackable &&
    (
      drop.minQuantity !== 1 ||
      drop.maxQuantity !== 1
    )
  ) {
    throw new Error(
      `Non-stackable drop item "${drop.itemId}" must have quantity 1`
    );
  }

  if (
    item.stackable &&
    drop.maxQuantity > item.maxStack
  ) {
    throw new Error(
      `Drop quantity exceeds maximum stack for item "${drop.itemId}"`
    );
  }
}

function validateMonsterDefinition(
  monster: MonsterDefinition
): void {
  if (
    !monster ||
    typeof monster !== "object" ||
    Array.isArray(monster)
  ) {
    throw new Error("Invalid monster definition");
  }

  if (
    typeof monster.id !== "string" ||
    !monster.id.trim()
  ) {
    throw new Error("Monster ID is required");
  }

  if (
    typeof monster.name !== "string" ||
    !monster.name.trim()
  ) {
    throw new Error(
      `Invalid name for monster "${monster.id}"`
    );
  }

  if (typeof monster.description !== "string") {
    throw new Error(
      `Invalid description for monster "${monster.id}"`
    );
  }

  if (
    typeof monster.regionId !== "string" ||
    !monster.regionId.trim()
  ) {
    throw new Error(
      `Invalid region ID for monster "${monster.id}"`
    );
  }

  if (!getRegionById(monster.regionId)) {
    throw new Error(
      `Monster "${monster.id}" references unknown region "${monster.regionId}"`
    );
  }

  if (!MONSTER_RARITIES.includes(monster.rarity)) {
    throw new Error(
      `Invalid rarity for monster "${monster.id}"`
    );
  }

  if (
    !Number.isSafeInteger(monster.level) ||
    monster.level < 1
  ) {
    throw new Error(
      `Invalid level for monster "${monster.id}"`
    );
  }

  const combatStats = [
    ["health", monster.health, 1],
    ["attack", monster.attack, 0],
    ["defense", monster.defense, 0],
    ["experienceReward", monster.experienceReward, 0]
  ] as const;

  for (const [statName, value, minimum] of combatStats) {
    if (
      !Number.isSafeInteger(value) ||
      value < minimum
    ) {
      throw new Error(
        `Invalid ${statName} for monster "${monster.id}"`
      );
    }
  }

  if (!Array.isArray(monster.drops)) {
    throw new Error(
      `Invalid drops list for monster "${monster.id}"`
    );
  }

  const dropItemIds = new Set<string>();

  for (const drop of monster.drops) {
    validateMonsterDrop(drop, monster.id);

    if (dropItemIds.has(drop.itemId)) {
      throw new Error(
        `Duplicate drop item "${drop.itemId}" for monster "${monster.id}"`
      );
    }

    dropItemIds.add(drop.itemId);
  }
}

function validateMonsterCatalog(): void {
  if (
    !Array.isArray(MONSTER_CATALOG) ||
    MONSTER_CATALOG.length === 0
  ) {
    throw new Error("Monster catalog must not be empty");
  }

  const monsterIds = new Set<string>();

  for (const monster of MONSTER_CATALOG) {
    validateMonsterDefinition(monster);

    if (monsterIds.has(monster.id)) {
      throw new Error(
        `Duplicate monster ID "${monster.id}"`
      );
    }

    monsterIds.add(monster.id);
  }
}

validateMonsterCatalog();

export function getMonsterById(
  monsterId: string
): MonsterDefinition | undefined {
  if (
    typeof monsterId !== "string" ||
    !monsterId.trim()
  ) {
    return undefined;
  }

  return MONSTER_CATALOG.find(
    (monster) => monster.id === monsterId
  );
}

export function getMonstersByRegion(
  regionId: string
): MonsterDefinition[] {
  if (
    typeof regionId !== "string" ||
    !regionId.trim()
  ) {
    return [];
  }

  return MONSTER_CATALOG.filter(
    (monster) => monster.regionId === regionId
  );
}

export function getMonstersByLevel(
  minLevel: number,
  maxLevel: number
): MonsterDefinition[] {
  if (
    !Number.isSafeInteger(minLevel) ||
    !Number.isSafeInteger(maxLevel) ||
    minLevel < 1 ||
    maxLevel < minLevel
  ) {
    return [];
  }

  return MONSTER_CATALOG.filter(
    (monster) =>
      monster.level >= minLevel &&
      monster.level <= maxLevel
  );
}
