export type PlayerId = string;
export type ItemId = string;
export type ResourceId = string;
export type CharacterId = string;

export type CharacterClass =
  | "warrior"
  | "ranger"
  | "mage"
  | "adventurer";

export interface PlayerProfile {
  id: PlayerId;
  username: string;
  avatarUrl?: string;
  createdAt: number;
}

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
}

export interface GameCharacter {
  id: CharacterId;
  playerId: PlayerId;
  name: string;
  characterClass: CharacterClass;
  stats: CharacterStats;
  progression: CharacterProgression;
  createdAt: number;
  updatedAt: number;
}

export interface InventoryItem {
  itemId: ItemId;
  quantity: number;
  equipped: boolean;
}

export interface GameResource {
  id: ResourceId;
  name: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export interface PlayerLocation {
  regionId: string;
  x: number;
  y: number;
}

export interface GameSession {
  playerId: PlayerId;
  character: GameCharacter;
  location: PlayerLocation;
  inventory: InventoryItem[];
  lastActiveAt: number;
}