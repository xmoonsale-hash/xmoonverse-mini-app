
import { Hono } from "hono";
import { cors } from "hono/cors";
import { verifyTelegramInitData } from "../auth/telegram";

type Env = {
  Bindings: {
    ENVIRONMENT: string;
    GAME_NAME: string;
    TELEGRAM_BOT_TOKEN?: string;
    WEB_APP_ORIGIN?: string;
    DB: D1Database;
  };
};

const MAX_BODY_SIZE = 16_384;
const MAX_INIT_DATA_LENGTH = 12_000;
const TELEGRAM_AUTH_MAX_AGE = 86400;

const app = new Hono<Env>();

const LOCAL_WEB_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

app.use(
  "*",
  cors({
    origin: (origin, context) => {
      if (!origin) {
        return undefined;
      }

      const configuredOrigin = context.env.WEB_APP_ORIGIN;

      if (configuredOrigin && origin === configuredOrigin) {
        return configuredOrigin;
      }

      if (LOCAL_WEB_ORIGINS.has(origin)) {
        return origin;
      }

      return undefined;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 600,
  })
);

async function readBodyWithLimit(
  request: Request,
  maxBytes: number
): Promise<string | null> {
  const reader = request.body?.getReader();

  if (!reader) {
    return "";
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return null;
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(combined);
}

app.get("/", (c) => {
  return c.json({
    name: c.env.GAME_NAME,
    message: "Welcome to xMoonVerse RPG API",
    environment: c.env.ENVIRONMENT,
    version: "0.1.0",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "xmoonverse-rpg-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/status", (c) => {
  return c.json({
    success: true,
    game: "xMoonVerse RPG",
    apiVersion: "v1",
    environment: c.env.ENVIRONMENT,
  });
});

app.post("/api/v1/auth/telegram", async (c) => {
  c.header("Cache-Control", "no-store");

  if (!c.env.TELEGRAM_BOT_TOKEN) {
    return c.json(
      {
        success: false,
        error: "Authentication service is not configured",
      },
      503
    );
  }

  const contentLength = c.req.header("Content-Length");

  if (contentLength !== undefined) {
    const declaredSize = Number(contentLength);

    if (
      Number.isFinite(declaredSize) &&
      declaredSize > MAX_BODY_SIZE
    ) {
      return c.json(
        {
          success: false,
          error: "Request body is too large",
        },
        413
      );
    }
  }

  let rawBody: string | null;

  try {
    rawBody = await readBodyWithLimit(
      c.req.raw,
      MAX_BODY_SIZE
    );
  } catch {
    return c.json(
      {
        success: false,
        error: "Unable to read request body",
      },
      400
    );
  }

  if (rawBody === null) {
    return c.json(
      {
        success: false,
        error: "Request body is too large",
      },
      413
    );
  }

  let body: unknown;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return c.json(
      {
        success: false,
        error: "Invalid JSON body",
      },
      400
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("initData" in body) ||
    typeof body.initData !== "string" ||
    body.initData.length === 0 ||
    body.initData.length > MAX_INIT_DATA_LENGTH
  ) {
    return c.json(
      {
        success: false,
        error: "Valid Telegram initData is required",
      },
      400
    );
  }

  const result = await verifyTelegramInitData(
    body.initData,
    c.env.TELEGRAM_BOT_TOKEN,
    {
      maxAgeSeconds: TELEGRAM_AUTH_MAX_AGE,
      futureSkewSeconds: 60,
    }
  );

  if (!result.ok) {
    return c.json(
      {
        success: false,
        error: "Telegram authentication failed",
      },
      401
    );
  }

  const encoder = new TextEncoder();

  const initDataDigest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(body.initData)
  );

  const initDataHash = Array.from(
    new Uint8Array(initDataDigest)
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = result.authDate + TELEGRAM_AUTH_MAX_AGE;

  const telegramUser = result.user;
  const telegramUserId = String(telegramUser.id);

  const username =
    telegramUser.username ??
    [telegramUser.first_name, telegramUser.last_name]
      .filter(Boolean)
      .join(" ");

  const avatarUrl = telegramUser.photo_url ?? null;

  const playerId = crypto.randomUUID();

  try {
    const batchResults = await c.env.DB.batch([
      c.env.DB.prepare(
        `DELETE FROM telegram_auth_replays
         WHERE expires_at <= ?`
      ).bind(now),

      c.env.DB.prepare(
        `INSERT OR IGNORE INTO telegram_auth_replays
         (init_data_hash, expires_at, created_at)
         VALUES (?, ?, ?)`
      ).bind(initDataHash, expiresAt, now),

      c.env.DB.prepare(
        `INSERT INTO player_profiles (
          id,
          telegram_user_id,
          username,
          avatar_url,
          created_at,
          updated_at
        )
        SELECT ?, ?, ?, ?, ?, ?
        WHERE changes() = 1
        ON CONFLICT(telegram_user_id)
        DO UPDATE SET
          username = excluded.username,
          avatar_url = excluded.avatar_url,
          updated_at = excluded.updated_at`
      ).bind(
        playerId,
        telegramUserId,
        username,
        avatarUrl,
        now,
        now
      ),
    ]);

    const replayResult = batchResults[1];

    if (replayResult.meta.changes !== 1) {
      return c.json(
        {
          success: false,
          error: "Telegram authentication data has already been used",
        },
        409
      );
    }
  } catch {
    return c.json(
      {
        success: false,
        error: "Authentication storage is unavailable",
      },
      503
    );
  }

  let player: {
    id: string;
    telegram_user_id: string;
    username: string;
    avatar_url: string | null;
  } | null;

  try {
    player = await c.env.DB.prepare(
      `SELECT id, telegram_user_id, username, avatar_url
       FROM player_profiles
       WHERE telegram_user_id = ?
       LIMIT 1`
    )
      .bind(telegramUserId)
      .first();

    if (!player) {
      throw new Error("Player profile was not found");
    }
  } catch {
    return c.json(
      {
        success: false,
        error: "Unable to load player profile",
      },
      503
    );
  }

  return c.json({
    success: true,
    authenticated: true,
    user: result.user,
    player,
    authDate: result.authDate,
    expiresAt,
  });
});

export default app;
