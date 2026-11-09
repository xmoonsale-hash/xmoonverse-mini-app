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

const BIOME_TYPES: readonly BiomeType[] = [
  "forest",
  "plains",
  "mountains",
  "desert",
  "swamp",
  "snow"
];

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

function validateRegion(region: WorldRegion): void {
  if (!region || typeof region !== "object") {
    throw new Error("Invalid world region definition");
  }

  if (
    typeof region.id !== "string" ||
    !region.id.trim()
  ) {
    throw new Error("World region ID is required");
  }

  if (
    typeof region.name !== "string" ||
    !region.name.trim()
  ) {
    throw new Error(`Invalid name for region "${region.id}"`);
  }

  if (typeof region.description !== "string") {
    throw new Error(
      `Invalid description for region "${region.id}"`
    );
  }

  if (!BIOME_TYPES.includes(region.biome)) {
    throw new Error(`Invalid biome for region "${region.id}"`);
  }

  if (
    !Number.isSafeInteger(region.recommendedLevel) ||
    region.recommendedLevel < 1
  ) {
    throw new Error(
      `Invalid recommended level for region "${region.id}"`
    );
  }

  if (typeof region.unlockedByDefault !== "boolean") {
    throw new Error(
      `Invalid unlock setting for region "${region.id}"`
    );
  }

  if (
    !Array.isArray(region.resourceIds) ||
    region.resourceIds.some(
      (resourceId) =>
        typeof resourceId !== "string" ||
        !resourceId.trim()
    )
  ) {
    throw new Error(
      `Invalid resource list for region "${region.id}"`
    );
  }

  if (
    new Set(region.resourceIds).size !==
    region.resourceIds.length
  ) {
    throw new Error(
      `Duplicate resource IDs in region "${region.id}"`
    );
  }

  if (
    region.unlockedByDefault &&
    region.recommendedLevel !== 1
  ) {
    throw new Error(
      `Default unlocked region "${region.id}" must have level 1`
    );
  }
}

function validateWorldCatalog(): void {
  const regionIds = new Set<string>();

  for (const region of WORLD_REGIONS) {
    validateRegion(region);

    if (regionIds.has(region.id)) {
      throw new Error(`Duplicate world region ID "${region.id}"`);
    }

    regionIds.add(region.id);
  }

  if (
    WORLD_REGIONS.length === 0 ||
    !WORLD_REGIONS.some((region) => region.unlockedByDefault)
  ) {
    throw new Error("World must have at least one default region");
  }
}

validateWorldCatalog();

export function getRegionById(
  regionId: string
): WorldRegion | undefined {
  if (
    typeof regionId !== "string" ||
    !regionId.trim()
  ) {
    return undefined;
  }

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
  if (!BIOME_TYPES.includes(biome)) {
    return [];
  }

  return WORLD_REGIONS.filter(
    (region) => region.biome === biome
  );
}

export function isRegionAvailable(
  regionId: string,
  characterLevel: number
): boolean {
  if (
    typeof regionId !== "string" ||
    !regionId.trim() ||
    !Number.isSafeInteger(characterLevel) ||
    characterLevel < 1
  ) {
    return false;
  }

  const region = getRegionById(regionId);

  if (!region) {
    return false;
  }

  return (
    region.unlockedByDefault ||
    characterLevel >= region.recommendedLevel
  );
}