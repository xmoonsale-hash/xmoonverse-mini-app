
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

const CHARACTER_CLASSES: readonly CharacterClass[] = [
  "warrior",
  "ranger",
  "mage",
  "adventurer"
];

const MIN_CHARACTER_NAME_LENGTH = 3;
const MAX_CHARACTER_NAME_LENGTH = 20;

function validatePlayerId(playerId: string): void {
  if (
    typeof playerId !== "string" ||
    !playerId.trim()
  ) {
    throw new Error("Player ID is required");
  }
}

function normalizeCharacterName(name: string): string {
  if (typeof name !== "string") {
    throw new Error("Character name must be a string");
  }

  const normalizedName = name.trim();

  if (
    normalizedName.length < MIN_CHARACTER_NAME_LENGTH ||
    normalizedName.length > MAX_CHARACTER_NAME_LENGTH
  ) {
    throw new Error(
      "Character name must contain 3–20 characters"
    );
  }

  if (/[\u0000-\u001F\u007F]/.test(normalizedName)) {
    throw new Error(
      "Character name contains invalid characters"
    );
  }

  return normalizedName;
}

function validateCharacterClass(
  characterClass: CharacterClass
): void {
  if (!CHARACTER_CLASSES.includes(characterClass)) {
    throw new Error("Invalid character class");
  }
}

function generateCharacterId(): string {
  if (
    typeof crypto === "undefined" ||
    typeof crypto.randomUUID !== "function"
  ) {
    throw new Error(
      "Secure UUID generation is not available"
    );
  }

  return crypto.randomUUID();
}

export function createCharacter(
  playerId: string,
  name: string,
  characterClass: CharacterClass = "adventurer"
): GameCharacter {
  validatePlayerId(playerId);

  const normalizedName = normalizeCharacterName(name);

  validateCharacterClass(characterClass);

  const now = Date.now();

  if (!Number.isSafeInteger(now) || now <= 0) {
    throw new Error("Unable to generate character timestamps");
  }

  return {
    id: generateCharacterId(),
    playerId: playerId.trim(),
    name: normalizedName,
    characterClass,
    stats: { ...DEFAULT_CHARACTER_STATS },
    progression: createInitialProgression(),
    createdAt: now,
    updatedAt: now
  };
}
