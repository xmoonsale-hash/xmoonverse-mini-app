CREATE TABLE IF NOT EXISTS telegram_auth_replays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    init_data_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telegram_auth_replays_expires
ON telegram_auth_replays(expires_at);