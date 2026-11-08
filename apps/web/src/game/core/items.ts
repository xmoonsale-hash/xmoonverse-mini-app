import type { ItemId } from "@xmoonverse/shared";

export type ItemType =
  | "weapon"
  | "armor"
  | "accessory"
  | "material"
  | "consumable"
  | "quest";

export type EquipmentSlot =
  | "weapon"
  | "head"
  | "chest"
  | "legs"
  | "accessory";

export interface GameItem {
  id: ItemId;
  name: string;
  description: string;
  type: ItemType;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  requiredLevel: number;
  stackable: boolean;
  maxStack: number;
  equipmentSlot?: EquipmentSlot;
  stats?: {
    attack?: number;
    defense?: number;
    health?: number;
    mana?: number;
  };
}

export const ITEM_CATALOG: GameItem[] = [
  {
    id: "wooden_sword",
    name: "Деревянный меч",
    description: "Простой меч для начинающего искателя приключений.",
    type: "weapon",
    rarity: "common",
    requiredLevel: 1,
    stackable: false,
    maxStack: 1,
    equipmentSlot: "weapon",
    stats: { attack: 3 }
  },
  {
    id: "traveler_armor",
    name: "Доспех путешественника",
    description: "Лёгкая защита для первых путешествий.",
    type: "armor",
    rarity: "common",
    requiredLevel: 1,
    stackable: false,
    maxStack: 1,
    equipmentSlot: "chest",
    stats: { defense: 2, health: 10 }
  },
  {
    id: "small_health_potion",
    name: "Малое зелье здоровья",
    description: "Восстанавливает часть здоровья.",
    type: "consumable",
    rarity: "common",
    requiredLevel: 1,
    stackable: true,
    maxStack: 99
  },
  {
    id: "wood",
    name: "Древесина",
    description: "Материал для изготовления предметов.",
    type: "material",
    rarity: "common",
    requiredLevel: 1,
    stackable: true,
    maxStack: 999
  },
  {
    id: "stone",
    name: "Камень",
    description: "Базовый материал для изготовления инструментов и экипировки.",
    type: "material",
    rarity: "common",
    requiredLevel: 1,
    stackable: true,
    maxStack: 999
  },
  {
    id: "wild_herb",
    name: "Дикая трава",
    description: "Растение для приготовления зелий.",
    type: "material",
    rarity: "common",
    requiredLevel: 1,
    stackable: true,
    maxStack: 999
  },
  {
    id: "iron_ore",
    name: "Железная руда",
    description: "Металлическая руда для кузнечного дела.",
    type: "material",
    rarity: "uncommon",
    requiredLevel: 1,
    stackable: true,
    maxStack: 999
  },
  {
    id: "moon_crystal",
    name: "Лунный кристалл",
    description: "Редкий кристалл с необычной энергией.",
    type: "material",
    rarity: "rare",
    requiredLevel: 1,
    stackable: true,
    maxStack: 999
  },
  {
    id: "ancient_essence",
    name: "Древняя эссенция",
    description: "Мистический материал древнего мира.",
    type: "material",
    rarity: "epic",
    requiredLevel: 1,
    stackable: true,
    maxStack: 999
  },
  {
    id: "celestial_core",
    name: "Небесное ядро",
    description: "Чрезвычайно редкий источник энергии.",
    type: "material",
    rarity: "legendary",
    requiredLevel: 1,
    stackable: true,
    maxStack: 999
  },
  {
    id: "raw_fish",
    name: "Сырая рыба",
    description: "Обычная рыба, пойманная в водоёмах игрового мира.",
    type: "material",
    rarity: "common",
    requiredLevel: 1,
    stackable: true,
    maxStack: 999
  },
  {
    id: "rare_fish",
    name: "Редкая рыба",
    description: "Редкий улов, который может использоваться в особых рецептах.",
    type: "material",
    rarity: "rare",
    requiredLevel: 1,
    stackable: true,
    maxStack: 999
  }
];

export function getItemById(
  itemId: ItemId
): GameItem | undefined {
  return ITEM_CATALOG.find((item) => item.id === itemId);
}

export function getItemsByType(type: ItemType): GameItem[] {
  return ITEM_CATALOG.filter((item) => item.type === type);
}

export function getItemsByRarity(
  rarity: GameItem["rarity"]
): GameItem[] {
  return ITEM_CATALOG.filter((item) => item.rarity === rarity);
}

export function getAllItems(): GameItem[] {
  return ITEM_CATALOG.map((item) => ({
    ...item,
    stats: item.stats ? { ...item.stats } : undefined
  }));
}