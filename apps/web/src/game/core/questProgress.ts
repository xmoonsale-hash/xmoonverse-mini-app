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

export function updateQuestProgress(
  quest: QuestDefinition,
  progress: QuestProgress,
  event: QuestEvent
): QuestProgress {
  if (progress.questId !== quest.id) {
    throw new Error("Quest progress does not match quest");
  }

  if (progress.claimed || progress.completed) {
    return {
      ...progress,
      completedObjectives: {
        ...progress.completedObjectives
      }
    };
  }

  const amount = event.amount ?? 1;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Event amount must be a positive integer");
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
  if (quest.id !== progress.questId) {
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
  if (quest.id !== progress.questId) {
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