export type ProfessionId =
  | "woodcutting"
  | "mining"
  | "herbalism"
  | "fishing"
  | "blacksmithing"
  | "alchemy";

export type ProfessionCategory =
  | "gathering"
  | "crafting";

export interface ProfessionDefinition {
  id: ProfessionId;
  name: string;
  description: string;
  category: ProfessionCategory;
  maxLevel: number;
  resourceIds: string[];
}

export interface ProfessionProgress {
  professionId: ProfessionId;
  level: number;
  experience: number;
  experienceToNextLevel: number;
}

export const MAX_PROFESSION_LEVEL = 50;

export const PROFESSION_CATALOG: ProfessionDefinition[] = [
  {
    id: "woodcutting",
    name: "Лесоруб",
    description: "Позволяет добывать древесину и лесные материалы.",
    category: "gathering",
    maxLevel: MAX_PROFESSION_LEVEL,
    resourceIds: ["wood"]
  },
  {
    id: "mining",
    name: "Шахтёр",
    description: "Позволяет добывать камень и различные руды.",
    category: "gathering",
    maxLevel: MAX_PROFESSION_LEVEL,
    resourceIds: ["stone", "iron_ore", "moon_crystal"]
  },
  {
    id: "herbalism",
    name: "Травник",
    description: "Позволяет собирать растения и алхимические компоненты.",
    category: "gathering",
    maxLevel: MAX_PROFESSION_LEVEL,
    resourceIds: ["wild_herb"]
  },
  {
    id: "fishing",
    name: "Рыбак",
    description: "Позволяет ловить рыбу в водоёмах игрового мира.",
    category: "gathering",
    maxLevel: MAX_PROFESSION_LEVEL,
    resourceIds: []
  },
  {
    id: "blacksmithing",
    name: "Кузнец",
    description: "Позволяет создавать оружие и металлическую экипировку.",
    category: "crafting",
    maxLevel: MAX_PROFESSION_LEVEL,
    resourceIds: ["iron_ore"]
  },
  {
    id: "alchemy",
    name: "Алхимик",
    description: "Позволяет создавать зелья и специальные расходники.",
    category: "crafting",
    maxLevel: MAX_PROFESSION_LEVEL,
    resourceIds: ["wild_herb", "ancient_essence"]
  }
];

export function getProfessionById(
  professionId: ProfessionId
): ProfessionDefinition | undefined {
  return PROFESSION_CATALOG.find(
    (profession) => profession.id === professionId
  );
}

export function createProfessionProgress(
  professionId: ProfessionId
): ProfessionProgress {
  if (!getProfessionById(professionId)) {
    throw new Error("Unknown profession");
  }

  return {
    professionId,
    level: 1,
    experience: 0,
    experienceToNextLevel: getProfessionExperienceRequired(1)
  };
}

export function getProfessionExperienceRequired(
  level: number
): number {
  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level >= MAX_PROFESSION_LEVEL
  ) {
    if (level === MAX_PROFESSION_LEVEL) {
      return 0;
    }

    throw new Error("Invalid profession level");
  }

  return Math.floor(75 * Math.pow(level, 1.6));
}

export function addProfessionExperience(
  progress: ProfessionProgress,
  amount: number
): ProfessionProgress {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Experience must be a non-negative number");
  }

  if (
    !Number.isInteger(progress.level) ||
    progress.level < 1 ||
    progress.level > MAX_PROFESSION_LEVEL ||
    !Number.isFinite(progress.experience) ||
    progress.experience < 0
  ) {
    throw new Error("Invalid profession progress");
  }

  let level = progress.level;
  let experience = progress.experience + Math.floor(amount);

  while (
    level < MAX_PROFESSION_LEVEL &&
    experience >= getProfessionExperienceRequired(level)
  ) {
    experience -= getProfessionExperienceRequired(level);
    level += 1;
  }

  if (level === MAX_PROFESSION_LEVEL) {
    experience = 0;
  }

  return {
    professionId: progress.professionId,
    level,
    experience,
    experienceToNextLevel:
      getProfessionExperienceRequired(level)
  };
}