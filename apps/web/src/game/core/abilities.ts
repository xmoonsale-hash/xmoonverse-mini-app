
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

const CHARACTER_CLASSES: readonly CharacterClass[] = [
  "warrior",
  "ranger",
  "mage",
  "adventurer"
];

function validateAbilityCatalog(): void {
  const abilityIds = new Set<string>();

  for (const ability of ABILITY_CATALOG) {
    if (
      !ability ||
      typeof ability.id !== "string" ||
      !ability.id.trim() ||
      typeof ability.skillId !== "string" ||
      !ability.skillId.trim() ||
      typeof ability.name !== "string" ||
      !ability.name.trim() ||
      typeof ability.description !== "string" ||
      !ability.description.trim()
    ) {
      throw new Error("Invalid ability definition");
    }

    if (abilityIds.has(ability.id)) {
      throw new Error(`Duplicate ability ID "${ability.id}"`);
    }

    abilityIds.add(ability.id);

    const skill = getSkillById(ability.skillId);

    if (!skill) {
      throw new Error(
        `Unknown skill "${ability.skillId}" for ability "${ability.id}"`
      );
    }

    const numericFields = [
      ability.manaCost,
      ability.cooldownSeconds,
      ability.basePower,
      ability.powerPerLevel,
      ability.requiredCharacterLevel
    ];

    if (
      numericFields.some(
        (value) =>
          !Number.isFinite(value) ||
          value < 0
      ) ||
      !Number.isInteger(ability.requiredCharacterLevel) ||
      ability.requiredCharacterLevel < 1
    ) {
      throw new Error(
        `Invalid numeric values for ability "${ability.id}"`
      );
    }

    if (
      !Array.isArray(ability.characterClasses) ||
      ability.characterClasses.length === 0
    ) {
      throw new Error(
        `Ability "${ability.id}" must have at least one character class`
      );
    }

    const classSet = new Set<CharacterClass>();

    for (const characterClass of ability.characterClasses) {
      if (!CHARACTER_CLASSES.includes(characterClass)) {
        throw new Error(
          `Invalid character class for ability "${ability.id}"`
        );
      }

      if (classSet.has(characterClass)) {
        throw new Error(
          `Duplicate character class for ability "${ability.id}"`
        );
      }

      if (!skill.characterClasses.includes(characterClass)) {
        throw new Error(
          `Ability "${ability.id}" is incompatible with skill "${skill.id}"`
        );
      }

      classSet.add(characterClass);
    }
  }
}

validateAbilityCatalog();

export function getAbilityById(
  abilityId: string
): AbilityDefinition | undefined {
  if (typeof abilityId !== "string" || !abilityId.trim()) {
    return undefined;
  }

  return ABILITY_CATALOG.find(
    (ability) => ability.id === abilityId
  );
}

export function getAbilitiesForClass(
  characterClass: CharacterClass
): AbilityDefinition[] {
  if (!CHARACTER_CLASSES.includes(characterClass)) {
    throw new Error("Invalid character class");
  }

  return ABILITY_CATALOG
    .filter(
      (ability) => ability.characterClasses.includes(characterClass)
    )
    .map((ability) => ({
      ...ability,
      characterClasses: [...ability.characterClasses]
    }));
}

export function calculateAbilityPower(
  abilityId: string,
  skillLevel: number
): number {
  const ability = getAbilityById(abilityId);

  if (!ability) {
    throw new Error("Unknown ability");
  }

  const skill = getSkillById(ability.skillId);

  if (!skill) {
    throw new Error("Ability skill is not available");
  }

  if (
    !Number.isInteger(skillLevel) ||
    skillLevel < 1 ||
    skillLevel > skill.maxLevel
  ) {
    throw new Error("Invalid skill level");
  }

  const power =
    ability.basePower +
    (skillLevel - 1) * ability.powerPerLevel;

  if (!Number.isFinite(power) || power < 0) {
    throw new Error("Calculated ability power is invalid");
  }

  return power;
}

export function canUseAbility(
  abilityId: string,
  characterClass: CharacterClass,
  characterLevel: number,
  skillLevel: number,
  currentMana: number
): boolean {
  const ability = getAbilityById(abilityId);

  if (!ability) {
    return false;
  }

  if (
    !CHARACTER_CLASSES.includes(characterClass) ||
    !Number.isInteger(characterLevel) ||
    characterLevel < 1 ||
    !Number.isInteger(skillLevel) ||
    !Number.isFinite(currentMana) ||
    currentMana < 0
  ) {
    return false;
  }

  const skill = getSkillById(ability.skillId);

  if (!skill) {
    return false;
  }

  return Boolean(
    ability.characterClasses.includes(characterClass) &&
    skill.characterClasses.includes(characterClass) &&
    characterLevel >= ability.requiredCharacterLevel &&
    characterLevel >= skill.requiredCharacterLevel &&
    skillLevel >= 1 &&
    skillLevel <= skill.maxLevel &&
    currentMana >= ability.manaCost
  );
}
