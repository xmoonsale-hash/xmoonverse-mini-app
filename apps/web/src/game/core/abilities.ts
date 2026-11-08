import type { CharacterClass } from "@xmoonverse/shared";
import { getSkillById } from "./skills";

export interface AbilityDefinition {
  id: string;
  skillId: string;
  name: string;
  description: string;
  manaCost: number;
  cooldownSeconds: number;
  basePower: number;
  powerPerLevel: number;
  requiredCharacterLevel: number;
  characterClasses: CharacterClass[];
}

export const ABILITY_CATALOG: AbilityDefinition[] = [
  {
    id: "power_strike_ability",
    skillId: "power_strike",
    name: "Мощный удар",
    description: "Мощная физическая атака по одной цели.",
    manaCost: 5,
    cooldownSeconds: 8,
    basePower: 15,
    powerPerLevel: 5,
    requiredCharacterLevel: 1,
    characterClasses: ["warrior", "adventurer"]
  },
  {
    id: "quick_shot_ability",
    skillId: "quick_shot",
    name: "Быстрый выстрел",
    description: "Быстрая дальняя атака по противнику.",
    manaCost: 4,
    cooldownSeconds: 5,
    basePower: 12,
    powerPerLevel: 4,
    requiredCharacterLevel: 1,
    characterClasses: ["ranger"]
  },
  {
    id: "arcane_bolt_ability",
    skillId: "arcane_bolt",
    name: "Чародейский заряд",
    description: "Магическая атака, расходующая ману.",
    manaCost: 10,
    cooldownSeconds: 6,
    basePower: 20,
    powerPerLevel: 6,
    requiredCharacterLevel: 1,
    characterClasses: ["mage"]
  }
];

export function getAbilityById(
  abilityId: string
): AbilityDefinition | undefined {
  return ABILITY_CATALOG.find(
    (ability) => ability.id === abilityId
  );
}

export function getAbilitiesForClass(
  characterClass: CharacterClass
): AbilityDefinition[] {
  return ABILITY_CATALOG.filter(
    (ability) => ability.characterClasses.includes(characterClass)
  );
}

export function calculateAbilityPower(
  abilityId: string,
  skillLevel: number
): number {
  const ability = getAbilityById(abilityId);

  if (!ability) {
    throw new Error("Unknown ability");
  }

  if (
    !Number.isInteger(skillLevel) ||
    skillLevel < 1 ||
    skillLevel > 5
  ) {
    throw new Error("Invalid skill level");
  }

  return (
    ability.basePower +
    (skillLevel - 1) * ability.powerPerLevel
  );
}

export function canUseAbility(
  abilityId: string,
  characterClass: CharacterClass,
  characterLevel: number,
  skillLevel: number,
  currentMana: number
): boolean {
  const ability = getAbilityById(abilityId);

  if (!ability) return false;

  const skill = getSkillById(ability.skillId);

  return Boolean(
    skill &&
    ability.characterClasses.includes(characterClass) &&
    characterLevel >= ability.requiredCharacterLevel &&
    characterLevel >= skill.requiredCharacterLevel &&
    skillLevel >= 1 &&
    skillLevel <= skill.maxLevel &&
    currentMana >= ability.manaCost
  );
}