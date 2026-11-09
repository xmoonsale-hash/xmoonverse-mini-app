
import type { CharacterStats } from "@xmoonverse/shared";
import type { CharacterVitals } from "./vitals";
import type { EquipmentState } from "./equipment";
import { getEquipmentStats } from "./equipment";
import { applyDamage, isCharacterAlive } from "./vitals";

export interface Combatant {
  id: string;
  name: string;
  stats: CharacterStats;
  vitals: CharacterVitals;
  equipment?: EquipmentState;
}

export interface AttackResult {
  attackerId: string;
  targetId: string;
  damage: number;
  targetVitals: CharacterVitals;
  defeated: boolean;
}

function validateCombatant(
  combatant: Combatant,
  field: string
): void {
  if (
    !combatant ||
    typeof combatant !== "object" ||
    Array.isArray(combatant)
  ) {
    throw new Error(`${field} must be a valid combatant`);
  }

  if (
    typeof combatant.id !== "string" ||
    !combatant.id.trim() ||
    typeof combatant.name !== "string" ||
    !combatant.name.trim()
  ) {
    throw new Error(`${field} has invalid identity`);
  }

  if (
    !combatant.stats ||
    typeof combatant.stats !== "object" ||
    Array.isArray(combatant.stats)
  ) {
    throw new Error(`${field} has invalid stats`);
  }

  for (const stat of Object.values(combatant.stats)) {
    if (
      typeof stat !== "number" ||
      !Number.isFinite(stat) ||
      stat < 0
    ) {
      throw new Error(`${field} has invalid character stats`);
    }
  }

  if (
    !combatant.vitals ||
    typeof combatant.vitals !== "object" ||
    Array.isArray(combatant.vitals)
  ) {
    throw new Error(`${field} has invalid vitals`);
  }

  if (
    !Number.isFinite(combatant.vitals.health) ||
    !Number.isFinite(combatant.vitals.maxHealth) ||
    !Number.isFinite(combatant.vitals.mana) ||
    !Number.isFinite(combatant.vitals.maxMana) ||
    combatant.vitals.health < 0 ||
    combatant.vitals.maxHealth < 0 ||
    combatant.vitals.mana < 0 ||
    combatant.vitals.maxMana < 0 ||
    combatant.vitals.health > combatant.vitals.maxHealth ||
    combatant.vitals.mana > combatant.vitals.maxMana
  ) {
    throw new Error(`${field} has invalid vitals values`);
  }
}

export function calculatePhysicalDamage(
  attacker: Combatant,
  target: Combatant
): number {
  validateCombatant(attacker, "Attacker");
  validateCombatant(target, "Target");

  const equipmentBonuses = getEquipmentStats(
    attacker.equipment ?? {}
  );

  const targetBonuses = getEquipmentStats(
    target.equipment ?? {}
  );

  const attackPower =
    attacker.stats.strength + equipmentBonuses.attack;

  const defense =
    target.stats.vitality + targetBonuses.defense;

  const rawDamage = attackPower * 2 - defense;

  const damage = Math.max(1, Math.floor(rawDamage));

  if (!Number.isFinite(damage)) {
    throw new Error("Calculated physical damage is invalid");
  }

  return damage;
}

export function performBasicAttack(
  attacker: Combatant,
  target: Combatant
): AttackResult {
  validateCombatant(attacker, "Attacker");
  validateCombatant(target, "Target");

  if (attacker.id === target.id) {
    throw new Error("Characters cannot attack themselves");
  }

  if (!isCharacterAlive(attacker.vitals)) {
    throw new Error("Defeated characters cannot attack");
  }

  if (!isCharacterAlive(target.vitals)) {
    throw new Error("Target is already defeated");
  }

  const damage = calculatePhysicalDamage(attacker, target);

  const targetVitals = applyDamage(
    target.vitals,
    damage
  );

  return {
    attackerId: attacker.id,
    targetId: target.id,
    damage,
    targetVitals,
    defeated: !isCharacterAlive(targetVitals)
  };
}

export function isCombatantAlive(
  combatant: Combatant
): boolean {
  validateCombatant(combatant, "Combatant");

  return isCharacterAlive(combatant.vitals);
}
