import type { ItemId } from "@xmoonverse/shared";

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

export function getFishingSpotById(
  spotId: string
): FishingSpot | undefined {
  return FISHING_SPOTS.find(
    (spot) => spot.id === spotId
  );
}

export function getFishingSpotsByRegion(
  regionId: string
): FishingSpot[] {
  return FISHING_SPOTS.filter(
    (spot) => spot.regionId === regionId
  );
}

export function canFish(
  spotId: string,
  characterLevel: number,
  professionLevel: number
): boolean {
  const spot = getFishingSpotById(spotId);

  if (!spot) {
    return false;
  }

  return (
    characterLevel >= 1 &&
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

  const catches: FishingResult["catches"] = [];

  for (const entry of spot.possibleCatches) {
    if (
      !Number.isFinite(entry.chance) ||
      entry.chance < 0 ||
      entry.chance > 1 ||
      !Number.isInteger(entry.minQuantity) ||
      !Number.isInteger(entry.maxQuantity) ||
      entry.minQuantity < 1 ||
      entry.maxQuantity < entry.minQuantity
    ) {
      throw new Error("Invalid fishing catch configuration");
    }

    const chanceRoll = random();

    if (
      !Number.isFinite(chanceRoll) ||
      chanceRoll < 0 ||
      chanceRoll >= 1
    ) {
      throw new Error("Random value must be between 0 and 1");
    }

    if (chanceRoll >= entry.chance) {
      continue;
    }

    const quantityRoll = random();

    if (
      !Number.isFinite(quantityRoll) ||
      quantityRoll < 0 ||
      quantityRoll >= 1
    ) {
      throw new Error("Random value must be between 0 and 1");
    }

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