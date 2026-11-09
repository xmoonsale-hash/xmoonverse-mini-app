
import type {
  CharacterClass,
  GameCharacter as SharedGameCharacter,
  GameLocation as SharedGameLocation,
  InventoryItem,
  GameStateResponse as SharedGameStateResponse,
  CreateCharacterRequest,
  CreateCharacterResponse as SharedCreateCharacterResponse,
} from "@xmoonverse/shared";

export type GameCharacter = SharedGameCharacter;
export type GameLocation = SharedGameLocation;
export type GameInventoryItem = InventoryItem;
export type GameStateResponse = SharedGameStateResponse;
export type CreateCharacterResponse = SharedCreateCharacterResponse;
export type CreateCharacterInput = CreateCharacterRequest;

export type GameApiError =
  | "api_not_configured"
  | "network_error"
  | "session_invalid"
  | "character_exists"
  | "invalid_request"
  | "server_error"
  | "invalid_response";

export type GameStateResult =
  | {
      ok: true;
      data: GameStateResponse;
    }
  | {
      ok: false;
      error: GameApiError;
      status?: number;
    };

export type CreateCharacterResult =
  | {
      ok: true;
      data: CreateCharacterResponse;
    }
  | {
      ok: false;
      error: GameApiError;
      status?: number;
    };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(
  /\/+$/,
  ""
);

const MIN_CHARACTER_NAME_LENGTH = 3;
const MAX_CHARACTER_NAME_LENGTH = 20;
const INVALID_NAME_CHARACTERS = /[\u0000-\u001F\u007F]/;

const CHARACTER_CLASSES = new Set<CharacterClass>([
  "warrior",
  "ranger",
  "mage",
  "adventurer",
]);

const CHARACTER_STAT_KEYS = [
  "health",
  "maxHealth",
  "mana",
  "maxMana",
  "strength",
  "agility",
  "intelligence",
  "vitality",
] as const;

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isSafeNonNegativeInteger(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isPositiveSafeInteger(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function isNonEmptyString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isUnixTimestamp(value: unknown): value is number {
  return isPositiveSafeInteger(value);
}

function isValidSessionToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

/**
 * Must stay synchronized with the progression formula
 * in apps/web/src/game/core/progression.ts.
 */
function getExperienceRequired(level: number): number | null {
  if (!isPositiveSafeInteger(level)) {
    return null;
  }

  const requiredExperience = Math.floor(
    100 * Math.pow(level, 1.5)
  );

  if (
    !Number.isSafeInteger(requiredExperience) ||
    requiredExperience < 1
  ) {
    return null;
  }

  return requiredExperience;
}

function normalizeCharacter(
  value: unknown
): GameCharacter | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.playerId) ||
    !isNonEmptyString(value.name) ||
    typeof value.characterClass !== "string" ||
    !CHARACTER_CLASSES.has(
      value.characterClass as CharacterClass
    ) ||
    !isUnixTimestamp(value.createdAt) ||
    !isUnixTimestamp(value.updatedAt) ||
    !isRecord(value.stats) ||
    !isRecord(value.progression)
  ) {
    return null;
  }

  const stats = value.stats;
  const progression = value.progression;

  for (const key of CHARACTER_STAT_KEYS) {
    if (
      !isSafeNonNegativeInteger(stats[key])
    ) {
      return null;
    }
  }

  const level = progression.level;
  const experience = progression.experience;
  const skillPoints = progression.skillPoints;

  if (
    !isPositiveSafeInteger(level) ||
    !isSafeNonNegativeInteger(experience) ||
    !isSafeNonNegativeInteger(skillPoints)
  ) {
    return null;
  }

  const expectedExperienceToNextLevel =
    getExperienceRequired(level);

  if (expectedExperienceToNextLevel === null) {
    return null;
  }

  if (experience >= expectedExperienceToNextLevel) {
    return null;
  }

  if (
    progression.experienceToNextLevel !== undefined &&
    progression.experienceToNextLevel !==
      expectedExperienceToNextLevel
  ) {
    return null;
  }

  if (
    progression.totalExperience !== undefined &&
    !isSafeNonNegativeInteger(progression.totalExperience)
  ) {
    return null;
  }

  return {
    id: value.id,
    playerId: value.playerId,
    name: value.name,
    characterClass: value.characterClass as CharacterClass,
    stats: {
      health: stats.health as number,
      maxHealth: stats.maxHealth as number,
      mana: stats.mana as number,
      maxMana: stats.maxMana as number,
      strength: stats.strength as number,
      agility: stats.agility as number,
      intelligence: stats.intelligence as number,
      vitality: stats.vitality as number,
    },
    progression: {
      level,
      experience,
      experienceToNextLevel: expectedExperienceToNextLevel,
      skillPoints,
      ...(progression.totalExperience !== undefined
        ? {
            totalExperience:
              progression.totalExperience as number,
          }
        : {}),
    },
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function normalizeGameLocation(
  value: unknown
): GameLocation | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.regionId) ||
    !isFiniteNumber(value.x) ||
    !isFiniteNumber(value.y)
  ) {
    return null;
  }

  return {
    regionId: value.regionId,
    x: value.x,
    y: value.y,
  };
}

function normalizeInventoryItem(
  value: unknown
): GameInventoryItem | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.itemId) ||
    !isPositiveSafeInteger(value.quantity) ||
    typeof value.equipped !== "boolean"
  ) {
    return null;
  }

  if (
    value.id !== undefined &&
    !isNonEmptyString(value.id)
  ) {
    return null;
  }

  if (
    value.acquiredAt !== undefined &&
    !isUnixTimestamp(value.acquiredAt)
  ) {
    return null;
  }

  return {
    ...(value.id !== undefined
      ? { id: value.id as string }
      : {}),
    itemId: value.itemId,
    quantity: value.quantity,
    equipped: value.equipped,
    ...(value.acquiredAt !== undefined
      ? { acquiredAt: value.acquiredAt as number }
      : {}),
  };
}

function normalizeInventory(
  value: unknown
): GameInventoryItem[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items: GameInventoryItem[] = [];

  for (const entry of value) {
    const item = normalizeInventoryItem(entry);

    if (!item) {
      return null;
    }

    items.push(item);
  }

  return items;
}

function normalizeGameStateResponse(
  value: unknown
): GameStateResponse | null {
  if (
    !isRecord(value) ||
    value.success !== true ||
    typeof value.hasCharacter !== "boolean"
  ) {
    return null;
  }

  const inventory = normalizeInventory(value.inventory);

  if (!inventory) {
    return null;
  }

  if (!value.hasCharacter) {
    if (
      value.character !== null ||
      value.location !== null ||
      inventory.length !== 0
    ) {
      return null;
    }

    return {
      success: true,
      hasCharacter: false,
      character: null,
      location: null,
      inventory: [],
    };
  }

  const character = normalizeCharacter(value.character);
  const location = normalizeGameLocation(value.location);

  if (!character || !location) {
    return null;
  }

  return {
    success: true,
    hasCharacter: true,
    character,
    location,
    inventory,
  };
}

function normalizeCreateCharacterResponse(
  value: unknown
): CreateCharacterResponse | null {
  if (
    !isRecord(value) ||
    value.success !== true
  ) {
    return null;
  }

  const character = normalizeCharacter(value.character);
  const location = normalizeGameLocation(value.location);

  if (!character || !location) {
    return null;
  }

  return {
    success: true,
    character,
    location,
  };
}

async function readJson(
  response: Response
): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getHttpError(
  status: number
): GameApiError {
  if (status === 401) {
    return "session_invalid";
  }

  if (status === 409) {
    return "character_exists";
  }

  if (status === 400) {
    return "invalid_request";
  }

  return "server_error";
}

function validateCharacterInput(
  input: CreateCharacterInput
): boolean {
  if (
    !input ||
    typeof input.name !== "string" ||
    typeof input.characterClass !== "string"
  ) {
    return false;
  }

  const name = input.name.trim();

  return (
    name.length >= MIN_CHARACTER_NAME_LENGTH &&
    name.length <= MAX_CHARACTER_NAME_LENGTH &&
    !INVALID_NAME_CHARACTERS.test(name) &&
    CHARACTER_CLASSES.has(input.characterClass as CharacterClass)
  );
}

export async function fetchGameState(
  sessionToken: string
): Promise<GameStateResult> {
  if (!API_BASE_URL) {
    return {
      ok: false,
      error: "api_not_configured",
    };
  }

  if (!isValidSessionToken(sessionToken)) {
    return {
      ok: false,
      error: "session_invalid",
    };
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/v1/game/state`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
        cache: "no-store",
        credentials: "omit",
      }
    );
  } catch {
    return {
      ok: false,
      error: "network_error",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: getHttpError(response.status),
      status: response.status,
    };
  }

  const rawData = await readJson(response);
  const data = normalizeGameStateResponse(rawData);

  if (!data) {
    return {
      ok: false,
      error: "invalid_response",
    };
  }

  return {
    ok: true,
    data,
  };
}

export async function createCharacter(
  sessionToken: string,
  input: CreateCharacterInput
): Promise<CreateCharacterResult> {
  if (!API_BASE_URL) {
    return {
      ok: false,
      error: "api_not_configured",
    };
  }

  if (!isValidSessionToken(sessionToken)) {
    return {
      ok: false,
      error: "session_invalid",
    };
  }

  if (!validateCharacterInput(input)) {
    return {
      ok: false,
      error: "invalid_request",
    };
  }

  const name = input.name.trim();

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/v1/game/character`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          name,
          characterClass: input.characterClass,
        }),
        cache: "no-store",
        credentials: "omit",
      }
    );
  } catch {
    return {
      ok: false,
      error: "network_error",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: getHttpError(response.status),
      status: response.status,
    };
  }

  const rawData = await readJson(response);
  const data = normalizeCreateCharacterResponse(rawData);

  if (!data) {
    return {
      ok: false,
      error: "invalid_response",
    };
  }

  return {
    ok: true,
    data,
  };
}
