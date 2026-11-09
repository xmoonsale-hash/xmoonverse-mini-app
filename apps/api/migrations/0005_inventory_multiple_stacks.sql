
-- Allow multiple inventory stacks of the same item per character.
-- Preserve existing inventory records while rebuilding the table.

CREATE TABLE inventory_items_new (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_equipped INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,

    FOREIGN KEY (character_id)
        REFERENCES game_characters(id)
        ON DELETE CASCADE
);

INSERT INTO inventory_items_new (
    id,
    character_id,
    item_id,
    quantity,
    is_equipped,
    created_at
)
SELECT
    id,
    character_id,
    item_id,
    quantity,
    is_equipped,
    created_at
FROM inventory_items;

DROP TABLE inventory_items;

ALTER TABLE inventory_items_new
RENAME TO inventory_items;

CREATE INDEX IF NOT EXISTS idx_inventory_character
ON inventory_items(character_id);
