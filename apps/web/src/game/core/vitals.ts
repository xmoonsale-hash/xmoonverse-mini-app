import type { CharacterStats } from "@xmoonverse/shared";

export interface CharacterVitals {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
}

export function createInitialVitals(
  stats: CharacterStats
): CharacterVitals {
  return {
    health: stats.maxHealth,
    maxHealth: stats.maxHealth,
    mana: stats.maxMana,
    maxMana: stats.maxMana
  };
}

export function restoreHealth(
  vitals: CharacterVitals,
  amount: number
): CharacterVitals {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Restore amount must be non-negative");
  }

  return {
    ...vitals,
    health: Math.min(
      vitals.maxHealth,
      vitals.health + Math.floor(amount)
    )
  };
}

export function restoreMana(
  vitals: CharacterVitals,
  amount: number
): CharacterVitals {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Restore amount must be non-negative");
  }

  return {
    ...vitals,
    mana: Math.min(
      vitals.maxMana,
      vitals.mana + Math.floor(amount)
    )
  };
}

export function applyDamage(
  vitals: CharacterVitals,
  amount: number
): CharacterVitals {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Damage must be non-negative");
  }

  return {
    ...vitals,
    health: Math.max(
      0,
      vitals.health - Math.floor(amount)
    )
  };
}

export function isCharacterAlive(
  vitals: CharacterVitals
): boolean {
  return vitals.health > 0;
}

export function isCharacterDefeated(
  vitals: CharacterVitals
): boolean {
  return vitals.health <= 0;
}