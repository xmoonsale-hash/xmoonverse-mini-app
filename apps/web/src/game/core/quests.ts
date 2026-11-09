
import type { ItemId } from "@xmoonverse/shared";
import { ITEM_CATALOG } from "./items";
import { MONSTER_CATALOG } from "./monsters";
import { RESOURCE_CATALOG } from "./resources";
import { WORLD_REGIONS } from "./world";
import { CRAFTING_RECIPES } from "./crafting";

export type QuestType =
  | "main"
  | "side"
  | "daily"
  | "achievement";

export type QuestObjectiveType =
  | "defeat_monsters"
  | "collect_resources"
  | "craft_items"
  | "visit_region";

export interface QuestObjective {
  id: string;
  type: QuestObjectiveType;
  targetId: string;
  requiredAmount: number;
}

export interface QuestReward {
  experience: number;
  items: {
    itemId: ItemId;
    quantity: number;
  }[];
}

export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  requiredLevel: number;
  objectives: QuestObjective[];
  rewards: QuestReward;
}

export interface QuestProgress {
  questId: string;
  completedObjectives: Record<string, number>;
  completed: boolean;
  claimed: boolean;
}

const QUEST_TYPES: readonly QuestType[] = [
  "main",
  "side",
  "daily",
  "achievement"
];

const OBJECTIVE_TYPES: readonly QuestObjectiveType[] = [
  "defeat_monsters",
  "collect_resources",
  "craft_items",
  "visit_region"
];

const ITEM_IDS = new Set(
  ITEM_CATALOG.map((item) => item.id)
);

const MONSTER_IDS = new Set(
  MONSTER_CATALOG.map((monster) => monster.id)
);

const RESOURCE_IDS = new Set(
  RESOURCE_CATALOG.map((resource) => resource.id)
);

const REGION_IDS = new Set(
  WORLD_REGIONS.map((region) => region.id)
);

const CRAFTABLE_ITEM_IDS = new Set(
  CRAFTING_RECIPES.map((recipe) => recipe.output.itemId)
);

function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isValidQuestType(value: unknown): value is QuestType {
  return (
    typeof value === "string" &&
    QUEST_TYPES.includes(value as QuestType)
  );
}

function isValidObjectiveType(
  value: unknown
): value is QuestObjectiveType {
  return (
    typeof value === "string" &&
    OBJECTIVE_TYPES.includes(value as QuestObjectiveType)
  );
}

function isValidObjectiveTarget(
  type: QuestObjectiveType,
  targetId: string
): boolean {
  switch (type) {
    case "defeat_monsters":
      return MONSTER_IDS.has(targetId);

    case "collect_resources":
      return RESOURCE_IDS.has(targetId);

    case "craft_items":
      return (
        ITEM_IDS.has(targetId) &&
        CRAFTABLE_ITEM_IDS.has(targetId)
      );

    case "visit_region":
      return REGION_IDS.has(targetId);

    default:
      return false;
  }
}

function cloneQuest(quest: QuestDefinition): QuestDefinition {
  return {
    ...quest,
    objectives: quest.objectives.map((objective) => ({
      ...objective
    })),
    rewards: {
      ...quest.rewards,
      items: quest.rewards.items.map((item) => ({
        ...item
      }))
    }
  };
}

export const QUEST_CATALOG: QuestDefinition[] = [
  {
    id: "first_hunt",
    name: "Первая охота",
    description: "Победи лесных слизней в Зелёной долине.",
    type: "main",
    requiredLevel: 1,
    objectives: [
      {
        id: "defeat_slimes",
        type: "defeat_monsters",
        targetId: "forest_slime",
        requiredAmount: 3
      }
    ],
    rewards: {
      experience: 50,
      items: [
        {
          itemId: "small_health_potion",
          quantity: 2
        }
      ]
    }
  },
  {
    id: "gathering_basics",
    name: "Основы собирательства",
    description: "Собери древесину для будущих путешествий.",
    type: "side",
    requiredLevel: 1,
    objectives: [
      {
        id: "collect_wood",
        type: "collect_resources",
        targetId: "wood",
        requiredAmount: 10
      }
    ],
    rewards: {
      experience: 40,
      items: [
        {
          itemId: "small_health_potion",
          quantity: 1
        }
      ]
    }
  },
  {
    id: "first_crafting",
    name: "Первое ремесло",
    description: "Изготовь деревянный меч.",
    type: "side",
    requiredLevel: 1,
    objectives: [
      {
        id: "craft_sword",
        type: "craft_items",
        targetId: "wooden_sword",
        requiredAmount: 1
      }
    ],
    rewards: {
      experience: 75,
      items: [
        {
          itemId: "wood",
          quantity: 5
        }
      ]
    }
  },
  {
    id: "daily_hunt",
    name: "Ежедневная охота",
    description: "Победи пять любых лесных слизней.",
    type: "daily",
    requiredLevel: 1,
    objectives: [
      {
        id: "daily_defeat_slimes",
        type: "defeat_monsters",
        targetId: "forest_slime",
        requiredAmount: 5
      }
    ],
    rewards: {
      experience: 75,
      items: [
        {
          itemId: "small_health_potion",
          quantity: 2
        }
      ]
    }
  },
  {
    id: "daily_gathering",
    name: "Запасы путешественника",
    description: "Собери 20 единиц древесины.",
    type: "daily",
    requiredLevel: 1,
    objectives: [
      {
        id: "daily_collect_wood",
        type: "collect_resources",
        targetId: "wood",
        requiredAmount: 20
      }
    ],
    rewards: {
      experience: 60,
      items: [
        {
          itemId: "wood",
          quantity: 10
        }
      ]
    }
  },
  {
    id: "daily_crafting",
    name: "Работа мастера",
    description: "Создай один любой деревянный меч.",
    type: "daily",
    requiredLevel: 1,
    objectives: [
      {
        id: "daily_craft_sword",
        type: "craft_items",
        targetId: "wooden_sword",
        requiredAmount: 1
      }
    ],
    rewards: {
      experience: 100,
      items: [
        {
          itemId: "iron_ore",
          quantity: 2
        }
      ]
    }
  }
];

export function validateQuestCatalog(): string[] {
  const errors: string[] = [];
  const seenQuestIds = new Set<string>();

  if (
    !Array.isArray(QUEST_CATALOG) ||
    QUEST_CATALOG.length === 0
  ) {
    return ["Quests: catalog must not be empty"];
  }

  for (const quest of QUEST_CATALOG) {
    if (
      !quest ||
      typeof quest !== "object" ||
      Array.isArray(quest)
    ) {
      errors.push("Quests: invalid quest definition");
      continue;
    }

    if (
      typeof quest.id !== "string" ||
      !quest.id.trim()
    ) {
      errors.push("Quests: invalid quest ID");
    } else if (seenQuestIds.has(quest.id)) {
      errors.push(
        `Quests: duplicate quest ID "${quest.id}"`
      );
    }

    if (typeof quest.id === "string") {
      seenQuestIds.add(quest.id);
    }

    if (
      typeof quest.name !== "string" ||
      !quest.name.trim()
    ) {
      errors.push(
        `Quest "${quest.id}" has an invalid name`
      );
    }

    if (
      typeof quest.description !== "string" ||
      !quest.description.trim()
    ) {
      errors.push(
        `Quest "${quest.id}" has an invalid description`
      );
    }

    if (!isValidQuestType(quest.type)) {
      errors.push(
        `Quest "${quest.id}" has an invalid type`
      );
    }

    if (!isPositiveSafeInteger(quest.requiredLevel)) {
      errors.push(
        `Quest "${quest.id}" has an invalid required level`
      );
    }

    if (
      !Array.isArray(quest.objectives) ||
      quest.objectives.length === 0
    ) {
      errors.push(
        `Quest "${quest.id}" must have at least one objective`
      );
    } else {
      const objectiveIds = new Set<string>();

      for (const objective of quest.objectives) {
        if (
          !objective ||
          typeof objective !== "object" ||
          Array.isArray(objective)
        ) {
          errors.push(
            `Quest "${quest.id}" contains an invalid objective`
          );
          continue;
        }

        if (
          typeof objective.id !== "string" ||
          !objective.id.trim()
        ) {
          errors.push(
            `Quest "${quest.id}" contains an invalid objective ID`
          );
        } else if (objectiveIds.has(objective.id)) {
          errors.push(
            `Quest "${quest.id}" has duplicate objective ID "${objective.id}"`
          );
        }

        if (typeof objective.id === "string") {
          objectiveIds.add(objective.id);
        }

        if (!isValidObjectiveType(objective.type)) {
          errors.push(
            `Quest "${quest.id}" has an invalid objective type`
          );
          continue;
        }

        if (
          typeof objective.targetId !== "string" ||
          !objective.targetId.trim()
        ) {
          errors.push(
            `Quest "${quest.id}" has an invalid objective target`
          );
        } else if (
          !isValidObjectiveTarget(
            objective.type,
            objective.targetId
          )
        ) {
          errors.push(
            `Quest "${quest.id}" references an unknown target "${objective.targetId}"`
          );
        }

        if (!isPositiveSafeInteger(objective.requiredAmount)) {
          errors.push(
            `Quest "${quest.id}" has an invalid objective amount`
          );
        }
      }
    }

    if (
      !quest.rewards ||
      typeof quest.rewards !== "object" ||
      Array.isArray(quest.rewards)
    ) {
      errors.push(
        `Quest "${quest.id}" has invalid rewards`
      );
      continue;
    }

    if (!isNonNegativeSafeInteger(quest.rewards.experience)) {
      errors.push(
        `Quest "${quest.id}" has invalid experience reward`
      );
    }

    if (!Array.isArray(quest.rewards.items)) {
      errors.push(
        `Quest "${quest.id}" has invalid item rewards`
      );
      continue;
    }

    for (const reward of quest.rewards.items) {
      if (
        !reward ||
        typeof reward !== "object" ||
        Array.isArray(reward)
      ) {
        errors.push(
          `Quest "${quest.id}" contains an invalid item reward`
        );
        continue;
      }

      if (
        typeof reward.itemId !== "string" ||
        !reward.itemId.trim() ||
        !ITEM_IDS.has(reward.itemId)
      ) {
        errors.push(
          `Quest "${quest.id}" references an unknown reward item`
        );
      }

      if (!isPositiveSafeInteger(reward.quantity)) {
        errors.push(
          `Quest "${quest.id}" has an invalid reward quantity`
        );
      }
    }
  }

  return errors;
}

const QUEST_CATALOG_ERRORS = validateQuestCatalog();

if (QUEST_CATALOG_ERRORS.length > 0) {
  throw new Error(
    `Invalid quest catalog:\n${QUEST_CATALOG_ERRORS.join("\n")}`
  );
}

export function getQuestById(
  questId: string
): QuestDefinition | undefined {
  if (
    typeof questId !== "string" ||
    !questId.trim()
  ) {
    return undefined;
  }

  const quest = QUEST_CATALOG.find(
    (entry) => entry.id === questId
  );

  return quest ? cloneQuest(quest) : undefined;
}

export function getQuestsByType(
  type: QuestType
): QuestDefinition[] {
  if (!isValidQuestType(type)) {
    return [];
  }

  return QUEST_CATALOG
    .filter((quest) => quest.type === type)
    .map(cloneQuest);
}

export function getAvailableQuests(
  characterLevel: number
): QuestDefinition[] {
  if (
    !Number.isSafeInteger(characterLevel) ||
    characterLevel < 1
  ) {
    return [];
  }

  return QUEST_CATALOG
    .filter((quest) => characterLevel >= quest.requiredLevel)
    .map(cloneQuest);
}

export function createQuestProgress(
  questId: string
): QuestProgress {
  const quest = getQuestById(questId);

  if (!quest) {
    throw new Error("Unknown quest");
  }

  return {
    questId,
    completedObjectives: {},
    completed: false,
    claimed: false
  };
}
