
import type {
  QuestDefinition,
  QuestObjectiveType,
  QuestProgress
} from "./quests";

export interface QuestEvent {
  type: QuestObjectiveType;
  targetId: string;
  amount?: number;
}

const OBJECTIVE_TYPES = new Set<QuestObjectiveType>([
  "defeat_monsters",
  "collect_resources",
  "craft_items",
  "visit_region"
]);

function isValidQuestDefinition(
  quest: QuestDefinition
): boolean {
  if (
    typeof quest !== "object" ||
    quest === null ||
    typeof quest.id !== "string" ||
    quest.id.length === 0 ||
    !Array.isArray(quest.objectives)
  ) {
    return false;
  }

  const objectiveIds = new Set<string>();

  for (const objective of quest.objectives) {
    if (
      typeof objective !== "object" ||
      objective === null ||
      typeof objective.id !== "string" ||
      objective.id.length === 0 ||
      objectiveIds.has(objective.id) ||
      !OBJECTIVE_TYPES.has(objective.type) ||
      typeof objective.targetId !== "string" ||
      objective.targetId.length === 0 ||
      !Number.isSafeInteger(objective.requiredAmount) ||
      objective.requiredAmount <= 0
    ) {
      return false;
    }

    objectiveIds.add(objective.id);
  }

  return true;
}

function isValidQuestProgress(
  quest: QuestDefinition,
  progress: QuestProgress
): boolean {
  if (
    typeof progress !== "object" ||
    progress === null ||
    progress.questId !== quest.id ||
    typeof progress.completed !== "boolean" ||
    typeof progress.claimed !== "boolean" ||
    typeof progress.completedObjectives !== "object" ||
    progress.completedObjectives === null ||
    Array.isArray(progress.completedObjectives)
  ) {
    return false;
  }

  const validObjectiveIds = new Set(
    quest.objectives.map((objective) => objective.id)
  );

  for (const [objectiveId, amount] of Object.entries(
    progress.completedObjectives
  )) {
    const objective = quest.objectives.find(
      (entry) => entry.id === objectiveId
    );

    if (
      !validObjectiveIds.has(objectiveId) ||
      !objective ||
      !Number.isSafeInteger(amount) ||
      amount < 0 ||
      amount > objective.requiredAmount
    ) {
      return false;
    }
  }

  const actuallyCompleted = quest.objectives.every(
    (objective) =>
      (progress.completedObjectives[objective.id] ?? 0) >=
      objective.requiredAmount
  );

  if (progress.completed !== actuallyCompleted) {
    return false;
  }

  if (progress.claimed && !progress.completed) {
    return false;
  }

  return true;
}

function cloneQuestProgress(
  progress: QuestProgress
): QuestProgress {
  return {
    ...progress,
    completedObjectives: {
      ...progress.completedObjectives
    }
  };
}

export function updateQuestProgress(
  quest: QuestDefinition,
  progress: QuestProgress,
  event: QuestEvent
): QuestProgress {
  if (!isValidQuestDefinition(quest)) {
    throw new Error("Invalid quest definition");
  }

  if (progress.questId !== quest.id) {
    throw new Error("Quest progress does not match quest");
  }

  if (!isValidQuestProgress(quest, progress)) {
    throw new Error("Invalid quest progress");
  }

  if (
    typeof event !== "object" ||
    event === null ||
    !OBJECTIVE_TYPES.has(event.type) ||
    typeof event.targetId !== "string" ||
    event.targetId.length === 0
  ) {
    throw new Error("Invalid quest event");
  }

  const amount = event.amount ?? 1;

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Event amount must be a positive safe integer");
  }

  if (progress.claimed || progress.completed) {
    return cloneQuestProgress(progress);
  }

  const updatedObjectives = {
    ...progress.completedObjectives
  };

  for (const objective of quest.objectives) {
    if (
      objective.type !== event.type ||
      objective.targetId !== event.targetId
    ) {
      continue;
    }

    const currentAmount =
      updatedObjectives[objective.id] ?? 0;

    updatedObjectives[objective.id] = Math.min(
      objective.requiredAmount,
      currentAmount + amount
    );
  }

  const completed = quest.objectives.every(
    (objective) =>
      (updatedObjectives[objective.id] ?? 0) >=
      objective.requiredAmount
  );

  return {
    questId: quest.id,
    completedObjectives: updatedObjectives,
    completed,
    claimed: false
  };
}

export function isQuestCompleted(
  quest: QuestDefinition,
  progress: QuestProgress
): boolean {
  if (
    !isValidQuestDefinition(quest) ||
    !isValidQuestProgress(quest, progress)
  ) {
    return false;
  }

  return quest.objectives.every(
    (objective) =>
      (progress.completedObjectives[objective.id] ?? 0) >=
      objective.requiredAmount
  );
}

export function getQuestCompletionPercentage(
  quest: QuestDefinition,
  progress: QuestProgress
): number {
  if (
    !isValidQuestDefinition(quest) ||
    !isValidQuestProgress(quest, progress)
  ) {
    return 0;
  }

  const total = quest.objectives.reduce(
    (sum, objective) => sum + objective.requiredAmount,
    0
  );

  if (total === 0) {
    return 100;
  }

  const completed = quest.objectives.reduce(
    (sum, objective) =>
      sum +
      Math.min(
        objective.requiredAmount,
        progress.completedObjectives[objective.id] ?? 0
      ),
    0
  );

  return Math.floor((completed / total) * 100);
}
