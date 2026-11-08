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
  return SKILL_CATALOG.filter(
    (skill) => skill.characterClasses.includes(characterClass)
  );
}

export function canLearnSkill(
  skillId: string,
  characterClass: CharacterClass,
  characterLevel: number
): boolean {
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
    : [...skills.map((skill) => ({ ...skill })), {
        skillId,
        level: 1
      }];

  return {
    skills: nextSkills,
    remainingSkillPoints: availableSkillPoints - 1
  };
}