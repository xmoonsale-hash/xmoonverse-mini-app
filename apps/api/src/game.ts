
import { Hono } from "hono";
import type {
  CharacterClass,
  CreateCharacterResponse,
  GameCharacter,
  GameLocation,
  GameStateResponse,
  InventoryItem,
} from "@xmoonverse/shared";
import { validatePlayerSession } from "../auth/session";

type Env = {
  Bindings: {
    ENVIRONMENT: string;
    GAME_NAME: string;
    TELEGRAM_BOT_TOKEN?: string;
    WEB_APP_ORIGIN?: string;
    DB: D1Database;
  };
};

type CharacterRecord = {
  id: string;
  player_id: string;
  name: string;
  character_class: CharacterClass;
  level: number;
  experience: number;
  skill_points: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  created_at: number;
  updated_at: number;
  region_id: string | null;
  position_x: number | null;
  position_y: number | null;
};

type InventoryRecord = {
  id: string;
  item_id: string;
  quantity: number;
  is_equipped: number;
  created_at: number;
};

const DEFAULT_LOCATION: GameLocation = {
  regionId: "greenhaven",
  x: 1200,
  y: 800,
};

const MIN_CHARACTER_NAME_LENGTH = 3;
const MAX_CHARACTER_NAME_LENGTH = 20;
const INVALID_NAME_CHARACTERS = /[\u0000-\u001F\u007F]/;

const CHARACTER_CLASSES = new Set<CharacterClass>([
  "warrior",
  "ranger",
  "mage",
  "adventurer",
]);

function getExperienceRequired(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

function getBearerToken(authorization: string | undefined): string | null {
  const match = authorization?.match(/^Bearer ([a-f0-9]{64})$/);
  return match?.[1] ?? null;
}

async function getAuthenticatedPlayer(
  authorization: string | undefined,
  db: D1Database
) {
  const token = getBearerToken(authorization);

  if (!token) {
    return null;
  }

  return validatePlayerSession(db, token);
}

function serializeCharacter(record: CharacterRecord): GameCharacter {
  return {
    id: record.id,
    playerId: record.player_id,
    name: record.name,
    characterClass: record.character_class,
    stats: {
      health: record.health,
      maxHealth: record.max_health,
      mana: record.mana,
      maxMana: record.max_mana,
      strength: record.strength,
      agility: record.agility,
      intelligence: record.intelligence,
      vitality: record.vitality,
    },
    progression: {
      level: record.level,
      experience: record.experience,
      experienceToNextLevel: getExperienceRequired(record.level),
      skillPoints: record.skill_points,
    },
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function serializeInventoryItem(record: InventoryRecord): InventoryItem {
  return {
    id: record.id,
    itemId: record.item_id,
    quantity: record.quantity,
    equipped: record.is_equipped === 1,
    acquiredAt: record.created_at,
  };
}

export function registerGameRoutes(app: Hono<Env>) {
  app.get("/api/v1/game/state", async (c) => {
    c.header("Cache-Control", "no-store");

    let player;

    try {
      player = await getAuthenticatedPlayer(
        c.req.header("Authorization"),
        c.env.DB
      );
    } catch {
      return c.json(
        {
          success: false,
          error: "Unable to validate player session",
        },
        503
      );
    }

    if (!player) {
      return c.json(
        {
          success: false,
          error: "Authentication required",
        },
        401
      );
    }

    try {
      const character = await c.env.DB.prepare(
        `SELECT
           characters.id,
           characters.player_id,
           characters.name,
           characters.character_class,
           characters.level,
           characters.experience,
           characters.skill_points,
           characters.health,
           characters.max_health,
           characters.mana,
           characters.max_mana,
           characters.strength,
           characters.agility,
           characters.intelligence,
           characters.vitality,
           characters.created_at,
           characters.updated_at,
           locations.region_id,
           locations.position_x,
           locations.position_y
         FROM game_characters AS characters
         LEFT JOIN player_locations AS locations
           ON locations.character_id = characters.id
         WHERE characters.player_id = ?
         ORDER BY characters.created_at ASC
         LIMIT 1`
      )
        .bind(player.playerId)
        .first<CharacterRecord>();

      if (!character) {
        const response: GameStateResponse = {
          success: true,
          hasCharacter: false,
          character: null,
          location: null,
          inventory: [],
        };

        return c.json(response);
      }

      const inventory = await c.env.DB.prepare(
        `SELECT id, item_id, quantity, is_equipped, created_at
         FROM inventory_items
         WHERE character_id = ?
         ORDER BY created_at ASC`
      )
        .bind(character.id)
        .all<InventoryRecord>();

      const location: GameLocation = {
        regionId: character.region_id ?? DEFAULT_LOCATION.regionId,
        x: character.position_x ?? DEFAULT_LOCATION.x,
        y: character.position_y ?? DEFAULT_LOCATION.y,
      };

      const response: GameStateResponse = {
        success: true,
        hasCharacter: true,
        character: serializeCharacter(character),
        location,
        inventory: (inventory.results ?? []).map(serializeInventoryItem),
      };

      return c.json(response);
    } catch {
      return c.json(
        {
          success: false,
          error: "Unable to load game state",
        },
        503
      );
    }
  });

  app.post("/api/v1/game/character", async (c) => {
    c.header("Cache-Control", "no-store");

    let player;

    try {
      player = await getAuthenticatedPlayer(
        c.req.header("Authorization"),
        c.env.DB
      );
    } catch {
      return c.json(
        {
          success: false,
          error: "Unable to validate player session",
        },
        503
      );
    }

    if (!player) {
      return c.json(
        {
          success: false,
          error: "Authentication required",
        },
        401
      );
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          success: false,
          error: "Invalid JSON body",
        },
        400
      );
    }

    if (typeof body !== "object" || body === null) {
      return c.json(
        {
          success: false,
          error: "Invalid character data",
        },
        400
      );
    }

    const data = body as Record<string, unknown>;
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const characterClass = data.characterClass;

    if (
      name.length < MIN_CHARACTER_NAME_LENGTH ||
      name.length > MAX_CHARACTER_NAME_LENGTH
    ) {
      return c.json(
        {
          success: false,
          error: "Character name must contain 3 to 20 characters",
        },
        400
      );
    }

    if (INVALID_NAME_CHARACTERS.test(name)) {
      return c.json(
        {
          success: false,
          error: "Character name contains invalid characters",
        },
        400
      );
    }

    if (
      typeof characterClass !== "string" ||
      !CHARACTER_CLASSES.has(characterClass as CharacterClass)
    ) {
      return c.json(
        {
          success: false,
          error: "Invalid character class",
        },
        400
      );
    }

    const request: { name: string; characterClass: CharacterClass } = {
      name,
      characterClass: characterClass as CharacterClass,
    };

    const now = Math.floor(Date.now() / 1000);
    const characterId = crypto.randomUUID();

    try {
      await c.env.DB.batch([
        c.env.DB.prepare(
          `INSERT INTO game_characters (
             id,
             player_id,
             name,
             character_class,
             level,
             experience,
             skill_points,
             health,
             max_health,
             mana,
             max_mana,
             strength,
             agility,
             intelligence,
             vitality,
             created_at,
             updated_at
           )
           VALUES (?, ?, ?, ?, 1, 0, 0, 100, 100, 50, 50, 10, 10, 10, 10, ?, ?)`
        ).bind(
          characterId,
          player.playerId,
          request.name,
          request.characterClass,
          now,
          now
        ),

        c.env.DB.prepare(
          `INSERT INTO player_locations (
             character_id,
             region_id,
             position_x,
             position_y,
             updated_at
           )
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          characterId,
          DEFAULT_LOCATION.regionId,
          DEFAULT_LOCATION.x,
          DEFAULT_LOCATION.y,
          now
        ),
      ]);
    } catch {
      let existingCharacter: { id: string } | null = null;

      try {
        existingCharacter = await c.env.DB.prepare(
          `SELECT id
           FROM game_characters
           WHERE player_id = ?
           LIMIT 1`
        )
          .bind(player.playerId)
          .first<{ id: string }>();
      } catch {
        return c.json(
          {
            success: false,
            error: "Unable to create character",
          },
          503
        );
      }

      if (existingCharacter) {
        return c.json(
          {
            success: false,
            error: "Character already exists",
          },
          409
        );
      }

      return c.json(
        {
          success: false,
          error: "Unable to create character",
        },
        503
      );
    }

    try {
      const character = await c.env.DB.prepare(
        `SELECT
           game_characters.id,
           game_characters.player_id,
           game_characters.name,
           game_characters.character_class,
           game_characters.level,
           game_characters.experience,
           game_characters.skill_points,
           game_characters.health,
           game_characters.max_health,
           game_characters.mana,
           game_characters.max_mana,
           game_characters.strength,
           game_characters.agility,
           game_characters.intelligence,
           game_characters.vitality,
           game_characters.created_at,
           game_characters.updated_at,
           player_locations.region_id,
           player_locations.position_x,
           player_locations.position_y
         FROM game_characters
         LEFT JOIN player_locations
           ON player_locations.character_id = game_characters.id
         WHERE game_characters.id = ?
         LIMIT 1`
      )
        .bind(characterId)
        .first<CharacterRecord>();

      if (!character) {
        throw new Error("Created character could not be loaded");
      }

      const location: GameLocation = {
        regionId: character.region_id ?? DEFAULT_LOCATION.regionId,
        x: character.position_x ?? DEFAULT_LOCATION.x,
        y: character.position_y ?? DEFAULT_LOCATION.y,
      };

      const response: CreateCharacterResponse = {
        success: true,
        character: serializeCharacter(character),
        location,
      };

      return c.json(response, 201);
    } catch {
      return c.json(
        {
          success: false,
          error: "Unable to load created character",
        },
        503
      );
    }
  });
}
