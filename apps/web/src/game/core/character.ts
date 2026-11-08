import type {
  CharacterStats,
  GameCharacter,
  CharacterClass
} from "@xmoonverse/shared";

import { createInitialProgression } from "./progression";

export const DEFAULT_CHARACTER_STATS: CharacterStats = {
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  strength: 10,
  agility: 10,
  intelligence: 10,
  vitality: 10
};

export function createCharacter(
  playerId: string,
  name: string,
  characterClass: CharacterClass = "adventurer"
): GameCharacter {
  const normalizedName = name.trim();

  if (!playerId.trim()) {
    throw new Error("Player ID is required");
  }

  if (normalizedName.length < 3 || normalizedName.length > 20) {
    throw new Error("Character name must contain 3–20 characters");
  }

  const now = Date.now();

  return {
    id: crypto.randomUUID(),
    playerId,
    name: normalizedName,
    characterClass,
    stats: { ...DEFAULT_CHARACTER_STATS },
    progression: createInitialProgression(),
    createdAt: now,
    updatedAt: now
  };
}