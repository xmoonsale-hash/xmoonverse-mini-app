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

export function calculateCharacterStats(
  baseStats: CharacterStats,
  equipment: EquipmentState
): DerivedCharacterStats {
  const bonuses = getEquipmentStats(equipment);

  return {
    maxHealth: baseStats.maxHealth + bonuses.health,
    maxMana: baseStats.maxMana + bonuses.mana,
    attack: baseStats.strength + bonuses.attack,
    defense: bonuses.defense,
    strength: baseStats.strength,
    agility: baseStats.agility,
    intelligence: baseStats.intelligence,
    vitality: baseStats.vitality
  };
}