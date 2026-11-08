import type { CharacterStats } from "@xmoonverse/shared";
import type { CharacterVitals } from "./vitals";
import type { EquipmentState } from "./equipment";
import { getEquipmentStats } from "./equipment";

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

export function calculatePhysicalDamage(
  attacker: Combatant,
  target: Combatant
): number {
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

  return Math.max(1, Math.floor(rawDamage));
}

export function performBasicAttack(
  attacker: Combatant,
  target: Combatant
): AttackResult {
  if (attacker.vitals.health <= 0) {
    throw new Error("Defeated characters cannot attack");
  }

  if (target.vitals.health <= 0) {
    throw new Error("Target is already defeated");
  }

  const damage = calculatePhysicalDamage(attacker, target);

  const targetVitals: CharacterVitals = {
    ...target.vitals,
    health: Math.max(0, target.vitals.health - damage)
  };

  return {
    attackerId: attacker.id,
    targetId: target.id,
    damage,
    targetVitals,
    defeated: targetVitals.health <= 0
  };
}

export function isCombatantAlive(
  combatant: Combatant
): boolean {
  return combatant.vitals.health > 0;
}