
-- Ensure that each player can own only one game character.
-- This database constraint also protects against concurrent creation requests.

CREATE UNIQUE INDEX IF NOT EXISTS idx_game_characters_player_unique
ON game_characters(player_id);
