
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS player_sessions (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    revoked_at INTEGER,

    FOREIGN KEY (player_id)
        REFERENCES player_profiles(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_player_sessions_player
ON player_sessions(player_id);

CREATE INDEX IF NOT EXISTS idx_player_sessions_expires
ON player_sessions(expires_at);
