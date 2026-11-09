
/**
 * xMoonVerse Realm
 * Shared domain contracts
 *
 * Единые типы для клиента, игровых систем и будущего backend.
 * Здесь находятся только модели и типы — без игровой логики и UI.
 */

/* -------------------------------------------------------------------------- */
/* IDs                                                                         */
/* -------------------------------------------------------------------------- */

export type PlayerId = string;
export type CharacterId = string;
export type ItemId = string;
export type ResourceId = string;
export type ResourceNodeId = string;
export type QuestId = string;
export type AchievementId = string;
export type RecipeId = string;
export type RegionId = string;
export type SessionId = string;

/* -------------------------------------------------------------------------- */
/* Common                                                                      */
/* -------------------------------------------------------------------------- */

export type UnixTimestamp = number;

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export type CharacterClass =
  | "warrior"
  | "ranger"
  | "mage"
  | "adventurer";

export type EntityStatus =
  | "active"
  | "inactive"
  | "disabled";

export interface Position2D {
  x: number;
  y: number;
}

export interface WorldBounds {
  width: number;
  height: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  hasMore: boolean;
}

/* -------------------------------------------------------------------------- */
/* Player                                                                      */
/* -------------------------------------------------------------------------- */

export interface PlayerProfile {
  id: PlayerId;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: UnixTimestamp;
  updatedAt?: UnixTimestamp;
}

export interface PlayerPreferences {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  reducedMotion: boolean;
  language: string;
}

export interface PlayerLocation {
  regionId: RegionId;
  x: number;
  y: number;
  updatedAt?: UnixTimestamp;
}

/* -------------------------------------------------------------------------- */
/* Character                                                                   */
/* -------------------------------------------------------------------------- */

export interface CharacterStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
}

export interface CharacterProgression {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  skillPoints: number;
  totalExperience?: number;
}

export interface GameCharacter {
  id: CharacterId;
  playerId: PlayerId;
  name: string;
  characterClass: CharacterClass;
  stats: CharacterStats;
  progression: CharacterProgression;
  createdAt: UnixTimestamp;
  updatedAt: UnixTimestamp;
}

export interface CharacterAppearance {
  portraitUrl?: string;
  modelId?: string;
  outfitId?: string;
  colorVariant?: string;
}

/* -------------------------------------------------------------------------- */
/* Items and inventory                                                         */
/* -------------------------------------------------------------------------- */

export type ItemCategory =
  | "resource"
  | "consumable"
  | "equipment"
  | "material"
  | "quest"
  | "misc";

export type EquipmentSlot =
  | "head"
  | "chest"
  | "legs"
  | "feet"
  | "weapon"
  | "offhand"
  | "accessory";

export interface ItemDefinition {
  id: ItemId;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: Rarity;
  icon?: string;
  stackable: boolean;
  maxStack: number;
  sellPrice?: number;
  weight?: number;
  equipmentSlot?: EquipmentSlot;
  requiredLevel?: number;
  status: EntityStatus;
}

export interface InventoryItem {
  itemId: ItemId;
  quantity: number;
  equipped: boolean;
  acquiredAt?: UnixTimestamp;
}

export interface InventoryState {
  items: InventoryItem[];
  capacity: number;
  updatedAt: UnixTimestamp;
}

export interface EquipmentState {
  slots: Partial<Record<EquipmentSlot, ItemId>>;
  updatedAt: UnixTimestamp;
}

/* -------------------------------------------------------------------------- */
/* Resources and gathering                                                     */
/* -------------------------------------------------------------------------- */

export interface GameResource {
  id: ResourceId;
  name: string;
  description: string;
  rarity: Rarity;
  itemId: ItemId;
  gatheringTimeSeconds?: number;
}

export type ResourceNodeStatus =
  | "available"
  | "depleted"
  | "regrowing"
  | "disabled";

export interface ResourceNode {
  id: ResourceNodeId;
  resourceId: ResourceId;
  regionId: RegionId;
  position: Position2D;
  status: ResourceNodeStatus;
  quantity: number;
  maxQuantity: number;
  respawnAt?: UnixTimestamp;
  updatedAt: UnixTimestamp;
}

/* -------------------------------------------------------------------------- */
/* Quests                                                                      */
/* -------------------------------------------------------------------------- */

export type QuestType =
  | "main"
  | "side"
  | "daily"
  | "weekly"
  | "event";

export type QuestStatus =
  | "locked"
  | "available"
  | "active"
  | "completed"
  | "claimed"
  | "failed";

export type QuestObjectiveType =
  | "collect"
  | "gather"
  | "craft"
  | "interact"
  | "discover"
  | "defeat"
  | "reach_level";

export interface QuestObjectiveDefinition {
  id: string;
  type: QuestObjectiveType;
  targetId?: string;
  description: string;
  requiredAmount: number;
}

export interface QuestReward {
  experience?: number;
  currency?: number;
  items?: InventoryItem[];
}

export interface QuestDefinition {
  id: QuestId;
  title: string;
  description: string;
  type: QuestType;
  objectives: QuestObjectiveDefinition[];
  rewards: QuestReward;
  requiredLevel?: number;
  prerequisiteQuestIds?: QuestId[];
  status: EntityStatus;
}

export interface QuestObjectiveProgress {
  objectiveId: string;
  currentAmount: number;
  completed: boolean;
}

export interface QuestProgress {
  questId: QuestId;
  status: QuestStatus;
  objectives: QuestObjectiveProgress[];
  startedAt?: UnixTimestamp;
  completedAt?: UnixTimestamp;
  claimedAt?: UnixTimestamp;
}

/* -------------------------------------------------------------------------- */
/* Achievements                                                                */
/* -------------------------------------------------------------------------- */

export type AchievementConditionType =
  | "level_reached"
  | "items_collected"
  | "resources_gathered"
  | "quests_completed"
  | "crafting_completed"
  | "regions_discovered";

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  conditionType: AchievementConditionType;
  targetAmount: number;
  rewards: QuestReward;
  icon?: string;
  rarity: Rarity;
  status: EntityStatus;
}

export interface AchievementProgress {
  achievementId: AchievementId;
  currentAmount: number;
  unlocked: boolean;
  claimed: boolean;
  unlockedAt?: UnixTimestamp;
  claimedAt?: UnixTimestamp;
}

/* -------------------------------------------------------------------------- */
/* Crafting                                                                    */
/* -------------------------------------------------------------------------- */

export interface RecipeIngredient {
  itemId: ItemId;
  quantity: number;
}

export interface CraftingRecipe {
  id: RecipeId;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  result: InventoryItem;
  craftingTimeSeconds: number;
  requiredLevel?: number;
  status: EntityStatus;
}

/* -------------------------------------------------------------------------- */
/* World                                                                       */
/* -------------------------------------------------------------------------- */

export interface RegionDefinition {
  id: RegionId;
  name: string;
  description: string;
  bounds: WorldBounds;
  spawnPoint: Position2D;
  requiredLevel?: number;
  status: EntityStatus;
}

export interface WorldClock {
  day: number;
  timeOfDay: number;
  cycleDurationSeconds: number;
  paused: boolean;
}

export interface WorldState {
  currentRegionId: RegionId;
  clock: WorldClock;
  discoveredRegionIds: RegionId[];
  updatedAt: UnixTimestamp;
}

/* -------------------------------------------------------------------------- */
/* Game session                                                                */
/* -------------------------------------------------------------------------- */

export interface GameSession {
  id?: SessionId;
  playerId: PlayerId;
  character: GameCharacter;
  location: PlayerLocation;
  inventory: InventoryItem[];
  lastActiveAt: UnixTimestamp;
}

/* -------------------------------------------------------------------------- */
/* Persistent game state                                                       */
/* -------------------------------------------------------------------------- */

export interface GameSaveSnapshot {
  schemaVersion: number;
  playerId: PlayerId;
  character: GameCharacter;
  location: PlayerLocation;
  inventory: InventoryState;
  equipment: EquipmentState;
  quests: QuestProgress[];
  achievements: AchievementProgress[];
  world: WorldState;
  preferences: PlayerPreferences;
  createdAt: UnixTimestamp;
  updatedAt: UnixTimestamp;
}

export interface SaveMetadata {
  schemaVersion: number;
  playerId: PlayerId;
  createdAt: UnixTimestamp;
  updatedAt: UnixTimestamp;
  checksum?: string;
}

export type SaveSyncStatus =
  | "local_only"
  | "pending"
  | "synced"
  | "conflict"
  | "failed";

export interface SaveSyncState {
  status: SaveSyncStatus;
  lastSyncedAt?: UnixTimestamp;
  lastError?: ApiError;
}

/* -------------------------------------------------------------------------- */
/* Runtime game state                                                          */
/* -------------------------------------------------------------------------- */

export interface PlayerRuntimeState {
  position: Position2D;
  destination: Position2D | null;
  moving: boolean;
  facing: "left" | "right" | "up" | "down";
  interactingWith: string | null;
}

export interface GameRuntimeState {
  isPaused: boolean;
  isLoading: boolean;
  isReady: boolean;
  activeRegionId: RegionId;
  player: PlayerRuntimeState;
}
