
export type PlayerSession = {
  id: string;
  token: string;
  expiresAt: number;
};

type SessionListener = (session: PlayerSession | null) => void;

let currentSession: PlayerSession | null = null;

const listeners = new Set<SessionListener>();

function isValidSession(value: PlayerSession): boolean {
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.token === "string" &&
    /^[a-f0-9]{64}$/.test(value.token) &&
    Number.isSafeInteger(value.expiresAt) &&
    value.expiresAt > Math.floor(Date.now() / 1000)
  );
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

  currentSession = { ...session };
  notifyListeners();

  return true;
}

export function getPlayerSession(): PlayerSession | null {
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
  if (!currentSession) {
    return;
  }

  currentSession = null;
  notifyListeners();
}

export function subscribeToPlayerSession(
  listener: SessionListener
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
