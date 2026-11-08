export type BiomeType =
  | "forest"
  | "plains"
  | "mountains"
  | "desert"
  | "swamp"
  | "snow";

export interface WorldRegion {
  id: string;
  name: string;
  description: string;
  biome: BiomeType;
  recommendedLevel: number;
  unlockedByDefault: boolean;
  resourceIds: string[];
}

export const WORLD_REGIONS: WorldRegion[] = [
  {
    id: "greenhaven",
    name: "Зелёная долина",
    description: "Спокойная стартовая область с лесами и лугами.",
    biome: "forest",
    recommendedLevel: 1,
    unlockedByDefault: true,
    resourceIds: ["wood", "stone", "wild_herb"]
  },
  {
    id: "whispering_plains",
    name: "Шепчущие равнины",
    description: "Просторные земли с редкими растениями и древними руинами.",
    biome: "plains",
    recommendedLevel: 5,
    unlockedByDefault: false,
    resourceIds: ["wood", "wild_herb", "iron_ore"]
  },
  {
    id: "iron_peaks",
    name: "Железные вершины",
    description: "Горный регион, богатый металлическими рудами.",
    biome: "mountains",
    recommendedLevel: 12,
    unlockedByDefault: false,
    resourceIds: ["stone", "iron_ore", "moon_crystal"]
  },
  {
    id: "moonfall_desert",
    name: "Лунная пустыня",
    description: "Таинственная пустыня с древними источниками энергии.",
    biome: "desert",
    recommendedLevel: 20,
    unlockedByDefault: false,
    resourceIds: ["stone", "moon_crystal", "ancient_essence"]
  },
  {
    id: "forgotten_swamp",
    name: "Забытое болото",
    description: "Опасная местность с редкими алхимическими компонентами.",
    biome: "swamp",
    recommendedLevel: 28,
    unlockedByDefault: false,
    resourceIds: ["wild_herb", "ancient_essence"]
  },
  {
    id: "celestial_peaks",
    name: "Небесные пики",
    description: "Высокогорная область, хранящая легендарные материалы.",
    biome: "snow",
    recommendedLevel: 40,
    unlockedByDefault: false,
    resourceIds: ["moon_crystal", "ancient_essence", "celestial_core"]
  }
];

export function getRegionById(
  regionId: string
): WorldRegion | undefined {
  return WORLD_REGIONS.find(
    (region) => region.id === regionId
  );
}

export function getUnlockedRegions(): WorldRegion[] {
  return WORLD_REGIONS.filter(
    (region) => region.unlockedByDefault
  );
}

export function getRegionsByBiome(
  biome: BiomeType
): WorldRegion[] {
  return WORLD_REGIONS.filter(
    (region) => region.biome === biome
  );
}

export function isRegionAvailable(
  regionId: string,
  characterLevel: number
): boolean {
  const region = getRegionById(regionId);

  if (!region || !Number.isInteger(characterLevel) || characterLevel < 1) {
    return false;
  }

  return (
    region.unlockedByDefault ||
    characterLevel >= region.recommendedLevel
  );
}