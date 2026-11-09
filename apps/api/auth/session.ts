
export type ValidatedPlayerSession = {
  sessionId: string;
  playerId: string;
  telegramUserId: string;
  username: string;
  avatarUrl: string | null;
};

type SessionDatabase = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T>(): Promise<T | null>;
    };
  };
};

type SessionRecord = {
  session_id: string;
  player_id: string;
  telegram_user_id: string;
  username: string;
  avatar_url: string | null;
};

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function validatePlayerSession(
  db: SessionDatabase,
  token: string
): Promise<ValidatedPlayerSession | null> {
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/.test(token)
  ) {
    return null;
  }

  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);

  const record = await db
    .prepare(
      `SELECT
         sessions.id AS session_id,
         players.id AS player_id,
         players.telegram_user_id AS telegram_user_id,
         players.username AS username,
         players.avatar_url AS avatar_url
       FROM player_sessions AS sessions
       INNER JOIN player_profiles AS players
         ON players.id = sessions.player_id
       WHERE sessions.token_hash = ?
         AND sessions.revoked_at IS NULL
         AND sessions.expires_at > ?
       LIMIT 1`
    )
    .bind(tokenHash, now)
    .first<SessionRecord>();

  if (!record) {
    return null;
  }

  return {
    sessionId: record.session_id,
    playerId: record.player_id,
    telegramUserId: record.telegram_user_id,
    username: record.username,
    avatarUrl: record.avatar_url,
  };
}
