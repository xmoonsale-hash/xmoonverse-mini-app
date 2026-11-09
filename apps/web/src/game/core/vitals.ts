
import type { CharacterStats } from "@xmoonverse/shared";

export interface CharacterVitals {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
}

function validateNonNegativeNumber(
  value: number,
  field: string
): void {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(`${field} must be a finite non-negative number`);
  }
}

function validateVitals(
  vitals: CharacterVitals
): void {
  if (
    !vitals ||
    typeof vitals !== "object" ||
    Array.isArray(vitals)
  ) {
    throw new Error("Character vitals must be a valid object");
  }

  validateNonNegativeNumber(vitals.health, "Health");
  validateNonNegativeNumber(vitals.maxHealth, "Maximum health");
  validateNonNegativeNumber(vitals.mana, "Mana");
  validateNonNegativeNumber(vitals.maxMana, "Maximum mana");

  if (
    vitals.health > vitals.maxHealth ||
    vitals.mana > vitals.maxMana
  ) {
    throw new Error("Current vitals cannot exceed maximum values");
  }
}

function validateAmount(
  amount: number,
  field: string
): void {
  validateNonNegativeNumber(amount, field);
}

export function createInitialVitals(
  stats: CharacterStats
): CharacterVitals {
  if (
    !stats ||
    typeof stats !== "object" ||
    Array.isArray(stats)
  ) {
    throw new Error("Character stats must be a valid object");
  }

  validateNonNegativeNumber(stats.maxHealth, "Maximum health");
  validateNonNegativeNumber(stats.maxMana, "Maximum mana");

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
  validateVitals(vitals);
  validateAmount(amount, "Restore amount");

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
  validateVitals(vitals);
  validateAmount(amount, "Restore amount");

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
  validateVitals(vitals);
  validateAmount(amount, "Damage");

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
  validateVitals(vitals);

  return vitals.health > 0;
}

export function isCharacterDefeated(
  vitals: CharacterVitals
): boolean {
  validateVitals(vitals);

  return vitals.health <= 0;
}
