
import type { QuestProgress } from "./quests";

import {
  QUEST_CATALOG,
  createQuestProgress
} from "./quests";

export interface DailyQuestState {
  date: string;
  quests: QuestProgress[];
}

function getDailyQuestDefinitions() {
  return QUEST_CATALOG.filter(
    (quest) => quest.type === "daily"
  );
}

function isValidDateKey(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function isValidQuestProgress(
  progress: unknown,
  expectedQuestId: string
): progress is QuestProgress {
  if (
    typeof progress !== "object" ||
    progress === null
  ) {
    return false;
  }

  const candidate = progress as Partial<QuestProgress>;

  if (
    candidate.questId !== expectedQuestId ||
    typeof candidate.completed !== "boolean" ||
    typeof candidate.claimed !== "boolean" ||
    typeof candidate.completedObjectives !== "object" ||
    candidate.completedObjectives === null ||
    Array.isArray(candidate.completedObjectives)
  ) {
    return false;
  }

  const quest = QUEST_CATALOG.find(
    (entry) => entry.id === expectedQuestId
  );

  if (!quest) {
    return false;
  }

  const validObjectiveIds = new Set(
    quest.objectives.map((objective) => objective.id)
  );

  for (const [objectiveId, amount] of Object.entries(
    candidate.completedObjectives
  )) {
    if (
      !validObjectiveIds.has(objectiveId) ||
      !Number.isInteger(amount) ||
      amount < 0
    ) {
      return false;
    }
  }

  if (candidate.claimed && !candidate.completed) {
    return false;
  }

  return true;
}

function isValidDailyQuestState(
  state: unknown
): state is DailyQuestState {
  if (
    typeof state !== "object" ||
    state === null
  ) {
    return false;
  }

  const candidate = state as Partial<DailyQuestState>;

  if (
    !isValidDateKey(candidate.date) ||
    !Array.isArray(candidate.quests)
  ) {
    return false;
  }

  const definitions = getDailyQuestDefinitions();

  if (candidate.quests.length !== definitions.length) {
    return false;
  }

  const seenQuestIds = new Set<string>();

  for (const progress of candidate.quests) {
    if (
      typeof progress !== "object" ||
      progress === null ||
      typeof progress.questId !== "string" ||
      seenQuestIds.has(progress.questId)
    ) {
      return false;
    }

    seenQuestIds.add(progress.questId);

    const definition = definitions.find(
      (quest) => quest.id === progress.questId
    );

    if (
      !definition ||
      !isValidQuestProgress(progress, definition.id)
    ) {
      return false;
    }
  }

  return definitions.every(
    (quest) => seenQuestIds.has(quest.id)
  );
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

export function getUtcDateKey(timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    throw new Error("Invalid timestamp");
  }

  const date = new Date(timestamp);

  if (!Number.isFinite(date.getTime())) {
    throw new Error("Timestamp is outside the supported date range");
  }

  return date.toISOString().slice(0, 10);
}

export function createDailyQuestState(
  timestamp: number = Date.now()
): DailyQuestState {
  const dailyQuests = getDailyQuestDefinitions();

  return {
    date: getUtcDateKey(timestamp),
    quests: dailyQuests.map((quest) =>
      createQuestProgress(quest.id)
    )
  };
}

export function isDailyQuestStateExpired(
  state: DailyQuestState,
  timestamp: number = Date.now()
): boolean {
  const currentDate = getUtcDateKey(timestamp);

  return (
    !isValidDailyQuestState(state) ||
    state.date !== currentDate
  );
}

export function refreshDailyQuestState(
  state: DailyQuestState,
  timestamp: number = Date.now()
): DailyQuestState {
  const currentDate = getUtcDateKey(timestamp);

  if (
    !isValidDailyQuestState(state) ||
    state.date !== currentDate
  ) {
    return createDailyQuestState(timestamp);
  }

  return {
    date: state.date,
    quests: state.quests.map(cloneQuestProgress)
  };
}
