
export const MAX_OFFLINE_HOURS = 8;

const MAX_TIMESTAMP = 8640000000000000;

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

function validateTimestamp(timestamp: number): void {
  if (
    !Number.isFinite(timestamp) ||
    timestamp < 0 ||
    timestamp > MAX_TIMESTAMP
  ) {
    throw new Error("Invalid timestamp");
  }
}

function validateRate(
  rate: number,
  label: string
): void {
  if (
    !Number.isFinite(rate) ||
    rate < 0
  ) {
    throw new Error(`Invalid ${label}`);
  }
}

function calculateGain(
  rate: number,
  hours: number,
  label: string
): number {
  const gain = Math.floor(rate * hours);

  if (
    !Number.isSafeInteger(gain) ||
    gain < 0
  ) {
    throw new Error(`${label} overflow`);
  }

  return gain;
}

export function calculateOfflineDuration(
  lastActiveAt: number,
  currentTime: number
): number {
  validateTimestamp(lastActiveAt);
  validateTimestamp(currentTime);

  if (currentTime < lastActiveAt) {
    throw new Error(
      "Current time cannot precede last activity"
    );
  }

  const elapsedSeconds = Math.floor(
    (currentTime - lastActiveAt) / 1000
  );

  if (!Number.isSafeInteger(elapsedSeconds)) {
    throw new Error("Offline duration overflow");
  }

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
    typeof activity !== "object" ||
    activity === null
  ) {
    throw new Error("Invalid offline activity");
  }

  validateRate(
    activity.experiencePerHour,
    "offline experience rate"
  );

  if (
    typeof activity.resourcesPerHour !== "object" ||
    activity.resourcesPerHour === null ||
    Array.isArray(activity.resourcesPerHour)
  ) {
    throw new Error("Invalid resource production rates");
  }

  const elapsedSeconds = calculateOfflineDuration(
    lastActiveAt,
    currentTime
  );

  const rawElapsedSeconds = Math.floor(
    (currentTime - lastActiveAt) / 1000
  );

  const hours = elapsedSeconds / 3600;

  const experienceGained = calculateGain(
    activity.experiencePerHour,
    hours,
    "Offline experience"
  );

  const resourcesGained: Record<string, number> = {};

  for (const [resourceId, rate] of Object.entries(
    activity.resourcesPerHour
  )) {
    if (
      typeof resourceId !== "string" ||
      !resourceId.trim()
    ) {
      throw new Error("Resource ID is required");
    }

    validateRate(
      rate,
      "resource production rate"
    );

    const quantity = calculateGain(
      rate,
      hours,
      `Resource production for ${resourceId}`
    );

    Object.defineProperty(resourcesGained, resourceId, {
      value: quantity,
      enumerable: true,
      configurable: true,
      writable: true
    });
  }

  return {
    elapsedSeconds: rawElapsedSeconds,
    creditedSeconds: elapsedSeconds,
    experienceGained,
    resourcesGained
  };
}
