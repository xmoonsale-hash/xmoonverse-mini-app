import type { ItemId } from "@xmoonverse/shared";

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

export function getQuestById(
  questId: string
): QuestDefinition | undefined {
  return QUEST_CATALOG.find(
    (quest) => quest.id === questId
  );
}

export function getQuestsByType(
  type: QuestType
): QuestDefinition[] {
  return QUEST_CATALOG.filter(
    (quest) => quest.type === type
  );
}

export function getAvailableQuests(
  characterLevel: number
): QuestDefinition[] {
  return QUEST_CATALOG.filter(
    (quest) => characterLevel >= quest.requiredLevel
  );
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