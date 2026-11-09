
import type { GameResource } from "@xmoonverse/shared";
import { RESOURCE_CATALOG } from "./resources";

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

function isPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function isValidCategory(
  category: unknown
): category is ProfessionCategory {
  return category === "gathering" || category === "crafting";
}

function isValidProfessionDefinition(
  profession: ProfessionDefinition
): boolean {
  if (
    !profession ||
    typeof profession !== "object" ||
    typeof profession.id !== "string" ||
    !profession.id.trim() ||
    typeof profession.name !== "string" ||
    !profession.name.trim() ||
    typeof profession.description !== "string" ||
    !profession.description.trim() ||
    !isValidCategory(profession.category) ||
    !isPositiveInteger(profession.maxLevel) ||
    !Array.isArray(profession.resourceIds)
  ) {
    return false;
  }

  const knownResourceIds = new Set(
    RESOURCE_CATALOG.map((resource) => resource.id)
  );

  const seenResourceIds = new Set<string>();

  for (const resourceId of profession.resourceIds) {
    if (
      typeof resourceId !== "string" ||
      !resourceId.trim() ||
      !knownResourceIds.has(resourceId) ||
      seenResourceIds.has(resourceId)
    ) {
      return false;
    }

    seenResourceIds.add(resourceId);
  }

  return true;
}

export function validateProfessionCatalog(): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const profession of PROFESSION_CATALOG) {
    if (!profession || typeof profession !== "object") {
      errors.push("Professions: invalid profession definition");
      continue;
    }

    if (
      typeof profession.id !== "string" ||
      !profession.id.trim()
    ) {
      errors.push("Professions: invalid profession ID");
    } else if (seenIds.has(profession.id)) {
      errors.push(
        `Professions: duplicate ID "${profession.id}"`
      );
    }

    if (typeof profession.id === "string") {
      seenIds.add(profession.id);
    }

    if (
      typeof profession.name !== "string" ||
      !profession.name.trim()
    ) {
      errors.push(
        `Profession "${profession.id}" has an invalid name`
      );
    }

    if (
      typeof profession.description !== "string" ||
      !profession.description.trim()
    ) {
      errors.push(
        `Profession "${profession.id}" has an invalid description`
      );
    }

    if (!isValidCategory(profession.category)) {
      errors.push(
        `Profession "${profession.id}" has an invalid category`
      );
    }

    if (!isPositiveInteger(profession.maxLevel)) {
      errors.push(
        `Profession "${profession.id}" has an invalid maximum level`
      );
    }

    if (!Array.isArray(profession.resourceIds)) {
      errors.push(
        `Profession "${profession.id}" has invalid resource IDs`
      );
      continue;
    }

    const professionResourceIds = new Set<string>();

    for (const resourceId of profession.resourceIds) {
      if (
        typeof resourceId !== "string" ||
        !resourceId.trim()
      ) {
        errors.push(
          `Profession "${profession.id}" has an invalid resource ID`
        );
        continue;
      }

      if (professionResourceIds.has(resourceId)) {
        errors.push(
          `Profession "${profession.id}" has duplicate resource "${resourceId}"`
        );
        continue;
      }

      professionResourceIds.add(resourceId);

      if (
        !RESOURCE_CATALOG.some(
          (resource: GameResource) => resource.id === resourceId
        )
      ) {
        errors.push(
          `Profession "${profession.id}" references unknown resource "${resourceId}"`
        );
      }
    }
  }

  return errors;
}

export function isProfessionId(
  value: unknown
): value is ProfessionId {
  return (
    typeof value === "string" &&
    PROFESSION_CATALOG.some(
      (profession) => profession.id === value
    )
  );
}

export function getProfessionById(
  professionId: ProfessionId
): ProfessionDefinition | undefined {
  if (!isProfessionId(professionId)) {
    return undefined;
  }

  const profession = PROFESSION_CATALOG.find(
    (entry) => entry.id === professionId
  );

  if (!profession) {
    return undefined;
  }

  return {
    ...profession,
    resourceIds: [...profession.resourceIds]
  };
}

export function getProfessionsByCategory(
  category: ProfessionCategory
): ProfessionDefinition[] {
  if (!isValidCategory(category)) {
    return [];
  }

  return PROFESSION_CATALOG
    .filter((profession) => profession.category === category)
    .map((profession) => ({
      ...profession,
      resourceIds: [...profession.resourceIds]
    }));
}

export function getAllProfessions(): ProfessionDefinition[] {
  return PROFESSION_CATALOG.map((profession) => ({
    ...profession,
    resourceIds: [...profession.resourceIds]
  }));
}

export function createProfessionProgress(
  professionId: ProfessionId
): ProfessionProgress {
  const profession = getProfessionById(professionId);

  if (!profession) {
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
  if (!Number.isSafeInteger(level)) {
    throw new Error("Invalid profession level");
  }

  if (level === MAX_PROFESSION_LEVEL) {
    return 0;
  }

  if (level < 1 || level > MAX_PROFESSION_LEVEL) {
    throw new Error("Invalid profession level");
  }

  return Math.floor(75 * Math.pow(level, 1.6));
}

export function addProfessionExperience(
  progress: ProfessionProgress,
  amount: number
): ProfessionProgress {
  if (
    !progress ||
    typeof progress !== "object" ||
    !isProfessionId(progress.professionId)
  ) {
    throw new Error("Invalid profession progress");
  }

  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    !Number.isSafeInteger(Math.floor(amount))
  ) {
    throw new Error(
      "Experience must be a non-negative safe number"
    );
  }

  const profession = getProfessionById(progress.professionId);

  if (
    !profession ||
    !Number.isSafeInteger(progress.level) ||
    progress.level < 1 ||
    progress.level > profession.maxLevel ||
    !Number.isSafeInteger(progress.experience) ||
    progress.experience < 0 ||
    !Number.isFinite(progress.experienceToNextLevel) ||
    progress.experienceToNextLevel < 0
  ) {
    throw new Error("Invalid profession progress");
  }

  let level = progress.level;
  let experience = progress.experience + Math.floor(amount);

  if (!Number.isSafeInteger(experience)) {
    throw new Error("Profession experience exceeds safe integer range");
  }

  while (
    level < profession.maxLevel &&
    experience >= getProfessionExperienceRequired(level)
  ) {
    experience -= getProfessionExperienceRequired(level);
    level += 1;
  }

  if (level === profession.maxLevel) {
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
