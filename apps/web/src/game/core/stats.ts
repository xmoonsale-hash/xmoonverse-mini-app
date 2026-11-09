
import type { CharacterStats } from "@xmoonverse/shared";
import type { EquipmentState } from "./equipment";
import { getEquipmentStats } from "./equipment";

export interface DerivedCharacterStats {
  maxHealth: number;
  maxMana: number;
  attack: number;
  defense: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
}

const CHARACTER_STAT_FIELDS: readonly (keyof CharacterStats)[] = [
  "health",
  "maxHealth",
  "mana",
  "maxMana",
  "strength",
  "agility",
  "intelligence",
  "vitality"
];

function validateBaseStats(baseStats: CharacterStats): void {
  if (
    !baseStats ||
    typeof baseStats !== "object" ||
    Array.isArray(baseStats)
  ) {
    throw new Error("Character stats must be a valid object");
  }

  for (const field of CHARACTER_STAT_FIELDS) {
    const value = baseStats[field];

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new Error(
        `Character stat "${field}" must be a finite non-negative number`
      );
    }
  }
}

function validateDerivedStats(
  stats: DerivedCharacterStats
): DerivedCharacterStats {
  for (const [field, value] of Object.entries(stats)) {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new Error(
        `Derived character stat "${field}" is invalid`
      );
    }
  }

  return stats;
}

export function calculateCharacterStats(
  baseStats: CharacterStats,
  equipment: EquipmentState
): DerivedCharacterStats {
  validateBaseStats(baseStats);

  const bonuses = getEquipmentStats(equipment);

  const derivedStats: DerivedCharacterStats = {
    maxHealth: baseStats.maxHealth + bonuses.health,
    maxMana: baseStats.maxMana + bonuses.mana,
    attack: baseStats.strength + bonuses.attack,
    defense: bonuses.defense,
    strength: baseStats.strength,
    agility: baseStats.agility,
    intelligence: baseStats.intelligence,
    vitality: baseStats.vitality
  };

  return validateDerivedStats(derivedStats);
}
