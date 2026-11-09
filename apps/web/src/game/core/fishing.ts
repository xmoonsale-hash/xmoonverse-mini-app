
import type { ItemId } from "@xmoonverse/shared";

import { getItemById } from "./items";
import { getProfessionById } from "./professions";
import { getRegionById, isRegionAvailable } from "./world";

export interface FishingSpot {
  id: string;
  name: string;
  description: string;
  regionId: string;
  requiredProfessionLevel: number;
  fishingTimeSeconds: number;
  experienceReward: number;
  possibleCatches: FishingCatch[];
}

export interface FishingCatch {
  itemId: ItemId;
  chance: number;
  minQuantity: number;
  maxQuantity: number;
}

export interface FishingResult {
  catches: {
    itemId: ItemId;
    quantity: number;
  }[];
  experience: number;
}

export const FISHING_SPOTS: FishingSpot[] = [
  {
    id: "greenhaven_lake",
    name: "Тихое озеро",
    description: "Спокойный водоём в Зелёной долине.",
    regionId: "greenhaven",
    requiredProfessionLevel: 1,
    fishingTimeSeconds: 15,
    experienceReward: 8,
    possibleCatches: [
      {
        itemId: "raw_fish",
        chance: 0.8,
        minQuantity: 1,
        maxQuantity: 2
      },
      {
        itemId: "rare_fish",
        chance: 0.1,
        minQuantity: 1,
        maxQuantity: 1
      }
    ]
  },
  {
    id: "whispering_river",
    name: "Шепчущая река",
    description: "Река с необычными видами рыбы.",
    regionId: "whispering_plains",
    requiredProfessionLevel: 5,
    fishingTimeSeconds: 25,
    experienceReward: 18,
    possibleCatches: [
      {
        itemId: "raw_fish",
        chance: 0.7,
        minQuantity: 1,
        maxQuantity: 3
      },
      {
        itemId: "rare_fish",
        chance: 0.25,
        minQuantity: 1,
        maxQuantity: 2
      }
    ]
  }
];

function isPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function validateFishingSpot(spot: FishingSpot): boolean {
  if (
    !spot ||
    typeof spot !== "object" ||
    typeof spot.id !== "string" ||
    !spot.id.trim() ||
    typeof spot.name !== "string" ||
    !spot.name.trim() ||
    typeof spot.description !== "string" ||
    typeof spot.regionId !== "string" ||
    !spot.regionId.trim() ||
    !Array.isArray(spot.possibleCatches)
  ) {
    return false;
  }

  if (
    !isPositiveInteger(spot.requiredProfessionLevel) ||
    !isPositiveInteger(spot.fishingTimeSeconds) ||
    !isPositiveInteger(spot.experienceReward)
  ) {
    return false;
  }

  const region = getRegionById(spot.regionId);
  const profession = getProfessionById("fishing");

  if (!region || !profession) {
    return false;
  }

  if (profession.category !== "gathering") {
    return false;
  }

  if (spot.requiredProfessionLevel > profession.maxLevel) {
    return false;
  }

  for (const entry of spot.possibleCatches) {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.itemId !== "string" ||
      !entry.itemId.trim() ||
      !Number.isFinite(entry.chance) ||
      entry.chance < 0 ||
      entry.chance > 1 ||
      !isPositiveInteger(entry.minQuantity) ||
      !isPositiveInteger(entry.maxQuantity) ||
      entry.maxQuantity < entry.minQuantity
    ) {
      return false;
    }

    const item = getItemById(entry.itemId);

    if (!item || item.type !== "material" || !item.stackable) {
      return false;
    }

    if (entry.maxQuantity > item.maxStack) {
      return false;
    }
  }

  return true;
}

function getRandomValue(random: () => number): number {
  if (typeof random !== "function") {
    throw new Error("Random source must be a function");
  }

  const value = random();

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    throw new Error("Random value must be between 0 and 1");
  }

  return value;
}

export function getFishingSpotById(
  spotId: string
): FishingSpot | undefined {
  if (typeof spotId !== "string" || !spotId.trim()) {
    return undefined;
  }

  return FISHING_SPOTS.find(
    (spot) => spot.id === spotId
  );
}

export function getFishingSpotsByRegion(
  regionId: string
): FishingSpot[] {
  if (
    typeof regionId !== "string" ||
    !regionId.trim() ||
    !getRegionById(regionId)
  ) {
    return [];
  }

  return FISHING_SPOTS.filter(
    (spot) => spot.regionId === regionId
  );
}

export function canFish(
  spotId: string,
  characterLevel: number,
  professionLevel: number
): boolean {
  if (
    !isPositiveInteger(characterLevel) ||
    !isPositiveInteger(professionLevel)
  ) {
    return false;
  }

  const spot = getFishingSpotById(spotId);

  if (!spot || !validateFishingSpot(spot)) {
    return false;
  }

  const profession = getProfessionById("fishing");

  if (
    !profession ||
    profession.category !== "gathering" ||
    professionLevel > profession.maxLevel
  ) {
    return false;
  }

  return (
    isRegionAvailable(spot.regionId, characterLevel) &&
    professionLevel >= spot.requiredProfessionLevel
  );
}

export function catchFish(
  spotId: string,
  random: () => number = Math.random
): FishingResult {
  const spot = getFishingSpotById(spotId);

  if (!spot) {
    throw new Error("Unknown fishing spot");
  }

  if (!validateFishingSpot(spot)) {
    throw new Error("Invalid fishing spot configuration");
  }

  const catches: FishingResult["catches"] = [];

  for (const entry of spot.possibleCatches) {
    const chanceRoll = getRandomValue(random);

    if (chanceRoll >= entry.chance) {
      continue;
    }

    const quantityRoll = getRandomValue(random);

    const quantity =
      entry.minQuantity +
      Math.floor(
        quantityRoll *
          (entry.maxQuantity - entry.minQuantity + 1)
      );

    catches.push({
      itemId: entry.itemId,
      quantity
    });
  }

  return {
    catches,
    experience: spot.experienceReward
  };
}
