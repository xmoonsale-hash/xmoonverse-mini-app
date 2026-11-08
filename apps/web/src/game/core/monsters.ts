import type { ItemId } from "@xmoonverse/shared";

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

export function getMonsterById(
  monsterId: string
): MonsterDefinition | undefined {
  return MONSTER_CATALOG.find(
    (monster) => monster.id === monsterId
  );
}

export function getMonstersByRegion(
  regionId: string
): MonsterDefinition[] {
  return MONSTER_CATALOG.filter(
    (monster) => monster.regionId === regionId
  );
}

export function getMonstersByLevel(
  minLevel: number,
  maxLevel: number
): MonsterDefinition[] {
  return MONSTER_CATALOG.filter(
    (monster) =>
      monster.level >= minLevel &&
      monster.level <= maxLevel
  );
}