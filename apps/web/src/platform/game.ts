import type { CharacterClass } from "@xmoonverse/shared";

export type GameCharacter = {
  id: string;
  playerId: string;
  name: string;
  characterClass: CharacterClass;
  stats: {
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    strength: number;
    agility: number;
    intelligence: number;
    vitality: number;
  };
  progression: {
    level: number;
    experience: number;
    skillPoints: number;
  };
  createdAt: number;
  updatedAt: number;
};

export type GameLocation = {
  regionId: string;
  x: number;
  y: number;
};

export type GameInventoryItem = {
  itemId: string;
  quantity: number;
  equipped: boolean;
  acquiredAt: number;
};

export type GameStateResponse = {
  success: true;
  hasCharacter: boolean;
  character: GameCharacter | null;
  location: GameLocation | null;
  inventory: GameInventoryItem[];
};

export type CreateCharacterResponse = {
  success: true;
  character: GameCharacter;
  location: GameLocation;
};

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

export type CreateCharacterInput = {
  name: string;
  characterClass: CharacterClass;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(
  /\/+$/,
  ""
);

const CHARACTER_CLASSES = new Set<CharacterClass>([
  "warrior",
  "ranger",
  "mage",
  "adventurer",
]);

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

function isNonEmptyString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0
  );
}

function isValidSessionToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

function isGameCharacter(
  value: unknown
): value is GameCharacter {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.playerId) ||
    !isNonEmptyString(value.name) ||
    typeof value.characterClass !== "string" ||
    !CHARACTER_CLASSES.has(
      value.characterClass as CharacterClass
    ) ||
    !isFiniteNumber(value.createdAt) ||
    !isFiniteNumber(value.updatedAt) ||
    !isRecord(value.stats) ||
    !isRecord(value.progression)
  ) {
    return false;
  }

  const stats = value.stats;
  const progression = value.progression;

  const statKeys = [
    "health",
    "maxHealth",
    "mana",
    "maxMana",
    "strength",
    "agility",
    "intelligence",
    "vitality",
  ] as const;

  for (const key of statKeys) {
    if (!isFiniteNumber(stats[key])) {
      return false;
    }
  }

  const progressionKeys = [
    "level",
    "experience",
    "skillPoints",
  ] as const;

  for (const key of progressionKeys) {
    if (!isFiniteNumber(progression[key])) {
      return false;
    }
  }

  return true;
}

function isGameLocation(
  value: unknown
): value is GameLocation {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.regionId) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y)
  );
}

function isInventoryItem(
  value: unknown
): value is GameInventoryItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.itemId) &&
    isFiniteNumber(value.quantity) &&
    value.quantity > 0 &&
    typeof value.equipped === "boolean" &&
    isFiniteNumber(value.acquiredAt)
  );
}

function isGameStateResponse(
  value: unknown
): value is GameStateResponse {
  if (!isRecord(value) || value.success !== true) {
    return false;
  }

  if (
    typeof value.hasCharacter !== "boolean" ||
    !Array.isArray(value.inventory)
  ) {
    return false;
  }

  if (!value.hasCharacter) {
    return (
      value.character === null &&
      value.location === null &&
      value.inventory.length === 0
    );
  }

  return (
    isGameCharacter(value.character) &&
    isGameLocation(value.location) &&
    value.inventory.every(isInventoryItem)
  );
}

function isCreateCharacterResponse(
  value: unknown
): value is CreateCharacterResponse {
  if (!isRecord(value) || value.success !== true) {
    return false;
  }

  return (
    isGameCharacter(value.character) &&
    isGameLocation(value.location)
  );
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

  const data = await readJson(response);

  if (!isGameStateResponse(data)) {
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

  const name = input.name.trim();

  if (
    name.length < 2 ||
    name.length > 24 ||
    !CHARACTER_CLASSES.has(input.characterClass)
  ) {
    return {
      ok: false,
      error: "invalid_request",
    };
  }

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

  const data = await readJson(response);

  if (!isCreateCharacterResponse(data)) {
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