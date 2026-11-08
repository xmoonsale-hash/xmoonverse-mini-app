PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS player_profiles (
    id TEXT PRIMARY KEY,
    telegram_user_id TEXT UNIQUE,
    username TEXT NOT NULL,
    avatar_url TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS game_characters (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    name TEXT NOT NULL,
    character_class TEXT NOT NULL DEFAULT 'adventurer',
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    skill_points INTEGER NOT NULL DEFAULT 0,
    health INTEGER NOT NULL DEFAULT 100,
    max_health INTEGER NOT NULL DEFAULT 100,
    mana INTEGER NOT NULL DEFAULT 50,
    max_mana INTEGER NOT NULL DEFAULT 50,
    strength INTEGER NOT NULL DEFAULT 10,
    agility INTEGER NOT NULL DEFAULT 10,
    intelligence INTEGER NOT NULL DEFAULT 10,
    vitality INTEGER NOT NULL DEFAULT 10,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (player_id)
        REFERENCES player_profiles(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS player_locations (
    character_id TEXT PRIMARY KEY,
    region_id TEXT NOT NULL DEFAULT 'greenhaven',
    position_x REAL NOT NULL DEFAULT 0,
    position_y REAL NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (character_id)
        REFERENCES game_characters(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_equipped INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,

    FOREIGN KEY (character_id)
        REFERENCES game_characters(id)
        ON DELETE CASCADE,

    UNIQUE(character_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_characters_player
ON game_characters(player_id);

CREATE INDEX IF NOT EXISTS idx_inventory_character
ON inventory_items(character_id);

CREATE INDEX IF NOT EXISTS idx_locations_region
ON player_locations(region_id);