
export type PlayerSession = {
  id: string;
  token: string;
  expiresAt: number;
};

type SessionListener = (session: PlayerSession | null) => void;

const SESSION_STORAGE_KEY = "xmoonverse.player-session";

let currentSession: PlayerSession | null = null;

const listeners = new Set<SessionListener>();

function isValidSession(value: unknown): value is PlayerSession {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const session = value as Record<string, unknown>;

  return (
    typeof session.id === "string" &&
    session.id.length > 0 &&
    typeof session.token === "string" &&
    /^[a-f0-9]{64}$/.test(session.token) &&
    typeof session.expiresAt === "number" &&
    Number.isSafeInteger(session.expiresAt) &&
    session.expiresAt > Math.floor(Date.now() / 1000)
  );
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readStoredSession(): PlayerSession | null {
  const storage = getSessionStorage();

  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(SESSION_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed: unknown = JSON.parse(rawValue);

    if (!isValidSession(parsed)) {
      storage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return { ...parsed };
  } catch {
    try {
      storage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Storage may be unavailable.
    }

    return null;
  }
}

function persistSession(session: PlayerSession): boolean {
  const storage = getSessionStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(session)
    );

    return true;
  } catch {
    return false;
  }
}

function removeStoredSession(): void {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Storage may be unavailable.
  }
}

function notifyListeners(): void {
  const session = currentSession
    ? { ...currentSession }
    : null;

  listeners.forEach((listener) => {
    listener(session);
  });
}

export function setPlayerSession(
  session: PlayerSession
): boolean {
  if (!isValidSession(session)) {
    clearPlayerSession();
    return false;
  }

  const nextSession = { ...session };

  currentSession = nextSession;

  persistSession(nextSession);

  notifyListeners();

  return true;
}

export function getPlayerSession(): PlayerSession | null {
  if (!currentSession) {
    currentSession = readStoredSession();
  }

  if (!currentSession) {
    return null;
  }

  if (!isValidSession(currentSession)) {
    clearPlayerSession();
    return null;
  }

  return { ...currentSession };
}

export function getPlayerSessionToken(): string | null {
  return getPlayerSession()?.token ?? null;
}

export function isPlayerSessionValid(): boolean {
  return getPlayerSession() !== null;
}

export function clearPlayerSession(): void {
  const hadSession = currentSession !== null;

  currentSession = null;

  removeStoredSession();

  if (hadSession) {
    notifyListeners();
  }
}

export function subscribeToPlayerSession(
  listener: SessionListener
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
