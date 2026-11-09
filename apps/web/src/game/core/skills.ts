
import type { CharacterClass } from "@xmoonverse/shared";

export type SkillCategory =
  | "combat"
  | "defense"
  | "utility"
  | "gathering";

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  characterClasses: CharacterClass[];
  maxLevel: number;
  requiredCharacterLevel: number;
}

export interface CharacterSkill {
  skillId: string;
  level: number;
}

export const SKILL_CATALOG: SkillDefinition[] = [
  {
    id: "power_strike",
    name: "Мощный удар",
    description: "Усиливает следующую физическую атаку.",
    category: "combat",
    characterClasses: ["warrior", "adventurer"],
    maxLevel: 5,
    requiredCharacterLevel: 1
  },
  {
    id: "quick_shot",
    name: "Быстрый выстрел",
    description: "Позволяет совершить быструю дальнюю атаку.",
    category: "combat",
    characterClasses: ["ranger"],
    maxLevel: 5,
    requiredCharacterLevel: 1
  },
  {
    id: "arcane_bolt",
    name: "Чародейский заряд",
    description: "Наносит магический урон противнику.",
    category: "combat",
    characterClasses: ["mage"],
    maxLevel: 5,
    requiredCharacterLevel: 1
  },
  {
    id: "iron_defense",
    name: "Железная защита",
    description: "Повышает защитные возможности персонажа.",
    category: "defense",
    characterClasses: ["warrior", "adventurer"],
    maxLevel: 5,
    requiredCharacterLevel: 3
  },
  {
    id: "resource_sense",
    name: "Чутьё собирателя",
    description: "Помогает находить полезные ресурсы.",
    category: "gathering",
    characterClasses: ["warrior", "ranger", "mage", "adventurer"],
    maxLevel: 5,
    requiredCharacterLevel: 2
  },
  {
    id: "efficient_rest",
    name: "Эффективный отдых",
    description: "Улучшает восстановление персонажа.",
    category: "utility",
    characterClasses: ["warrior", "ranger", "mage", "adventurer"],
    maxLevel: 5,
    requiredCharacterLevel: 4
  }
];

const CHARACTER_CLASSES: readonly CharacterClass[] = [
  "warrior",
  "ranger",
  "mage",
  "adventurer"
];

function validateCharacterClass(
  characterClass: CharacterClass
): void {
  if (!CHARACTER_CLASSES.includes(characterClass)) {
    throw new Error("Invalid character class");
  }
}

function validateCharacterLevel(characterLevel: number): void {
  if (
    !Number.isInteger(characterLevel) ||
    characterLevel < 1
  ) {
    throw new Error("Character level must be a positive integer");
  }
}

function validateCharacterSkills(skills: CharacterSkill[]): void {
  if (!Array.isArray(skills)) {
    throw new Error("Character skills must be an array");
  }

  const knownSkillIds = new Set<string>();

  for (const skill of skills) {
    if (
      !skill ||
      typeof skill !== "object" ||
      typeof skill.skillId !== "string" ||
      !skill.skillId.trim() ||
      !Number.isInteger(skill.level) ||
      skill.level < 1
    ) {
      throw new Error("Invalid character skill entry");
    }

    if (knownSkillIds.has(skill.skillId)) {
      throw new Error(
        `Duplicate character skill "${skill.skillId}"`
      );
    }

    knownSkillIds.add(skill.skillId);

    const definition = getSkillById(skill.skillId);

    if (!definition || skill.level > definition.maxLevel) {
      throw new Error(
        `Invalid level for character skill "${skill.skillId}"`
      );
    }
  }
}

export function getSkillById(
  skillId: string
): SkillDefinition | undefined {
  return SKILL_CATALOG.find(
    (skill) => skill.id === skillId
  );
}

export function getSkillsForClass(
  characterClass: CharacterClass
): SkillDefinition[] {
  validateCharacterClass(characterClass);

  return SKILL_CATALOG
    .filter((skill) => skill.characterClasses.includes(characterClass))
    .map((skill) => ({
      ...skill,
      characterClasses: [...skill.characterClasses]
    }));
}

export function canLearnSkill(
  skillId: string,
  characterClass: CharacterClass,
  characterLevel: number
): boolean {
  validateCharacterClass(characterClass);
  validateCharacterLevel(characterLevel);

  const skill = getSkillById(skillId);

  return Boolean(
    skill &&
    skill.characterClasses.includes(characterClass) &&
    characterLevel >= skill.requiredCharacterLevel
  );
}

export function upgradeSkill(
  skills: CharacterSkill[],
  skillId: string,
  availableSkillPoints: number,
  characterClass: CharacterClass,
  characterLevel: number
): {
  skills: CharacterSkill[];
  remainingSkillPoints: number;
} {
  validateCharacterSkills(skills);
  validateCharacterClass(characterClass);
  validateCharacterLevel(characterLevel);

  if (
    !Number.isInteger(availableSkillPoints) ||
    availableSkillPoints < 0
  ) {
    throw new Error("Available skill points must be a non-negative integer");
  }

  if (availableSkillPoints < 1) {
    throw new Error("Not enough skill points");
  }

  if (!canLearnSkill(skillId, characterClass, characterLevel)) {
    throw new Error("Skill is not available");
  }

  const definition = getSkillById(skillId);

  if (!definition) {
    throw new Error("Unknown skill");
  }

  const existingSkill = skills.find(
    (skill) => skill.skillId === skillId
  );

  const currentLevel = existingSkill?.level ?? 0;

  if (currentLevel >= definition.maxLevel) {
    throw new Error("Skill has reached maximum level");
  }

  const nextSkills = existingSkill
    ? skills.map((skill) =>
        skill.skillId === skillId
          ? { ...skill, level: skill.level + 1 }
          : { ...skill }
      )
    : [
        ...skills.map((skill) => ({ ...skill })),
        {
          skillId,
          level: 1
        }
      ];

  return {
    skills: nextSkills,
    remainingSkillPoints: availableSkillPoints - 1
  };
}
