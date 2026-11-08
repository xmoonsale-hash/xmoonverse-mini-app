export const MAX_OFFLINE_HOURS = 8;

export interface OfflineActivity {
  experiencePerHour: number;
  resourcesPerHour: Record<string, number>;
}

export interface OfflineProgressResult {
  elapsedSeconds: number;
  creditedSeconds: number;
  experienceGained: number;
  resourcesGained: Record<string, number>;
}

export function calculateOfflineDuration(
  lastActiveAt: number,
  currentTime: number
): number {
  if (
    !Number.isFinite(lastActiveAt) ||
    !Number.isFinite(currentTime)
  ) {
    throw new Error("Invalid timestamp");
  }

  if (lastActiveAt < 0 || currentTime < 0) {
    throw new Error("Timestamp cannot be negative");
  }

  if (currentTime < lastActiveAt) {
    throw new Error("Current time cannot precede last activity");
  }

  const elapsedSeconds = Math.floor(
    (currentTime - lastActiveAt) / 1000
  );

  return Math.min(
    elapsedSeconds,
    MAX_OFFLINE_HOURS * 60 * 60
  );
}

export function calculateOfflineProgress(
  lastActiveAt: number,
  currentTime: number,
  activity: OfflineActivity
): OfflineProgressResult {
  if (
    !Number.isFinite(activity.experiencePerHour) ||
    activity.experiencePerHour < 0
  ) {
    throw new Error("Invalid offline experience rate");
  }

  const elapsedSeconds = calculateOfflineDuration(
    lastActiveAt,
    currentTime
  );

  const hours = elapsedSeconds / 3600;

  const resourcesGained: Record<string, number> = {};

  for (const [resourceId, rate] of Object.entries(
    activity.resourcesPerHour
  )) {
    if (!resourceId.trim()) {
      throw new Error("Resource ID is required");
    }

    if (!Number.isFinite(rate) || rate < 0) {
      throw new Error("Invalid resource production rate");
    }

    resourcesGained[resourceId] = Math.floor(
      rate * hours
    );
  }

  return {
    elapsedSeconds: Math.floor(
      (currentTime - lastActiveAt) / 1000
    ),
    creditedSeconds: elapsedSeconds,
    experienceGained: Math.floor(
      activity.experiencePerHour * hours
    ),
    resourcesGained
  };
}