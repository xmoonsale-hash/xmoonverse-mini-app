import type { QuestProgress } from "./quests";
import {
  QUEST_CATALOG,
  createQuestProgress
} from "./quests";

export interface DailyQuestState {
  date: string;
  quests: QuestProgress[];
}

export function getUtcDateKey(timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    throw new Error("Invalid timestamp");
  }

  return new Date(timestamp).toISOString().slice(0, 10);
}

export function createDailyQuestState(
  timestamp: number = Date.now()
): DailyQuestState {
  const dailyQuests = QUEST_CATALOG.filter(
    (quest) => quest.type === "daily"
  );

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
  return state.date !== getUtcDateKey(timestamp);
}

export function refreshDailyQuestState(
  state: DailyQuestState,
  timestamp: number = Date.now()
): DailyQuestState {
  if (!isDailyQuestStateExpired(state, timestamp)) {
    return {
      ...state,
      quests: state.quests.map((quest) => ({
        ...quest,
        completedObjectives: {
          ...quest.completedObjectives
        }
      }))
    };
  }

  return createDailyQuestState(timestamp);
}