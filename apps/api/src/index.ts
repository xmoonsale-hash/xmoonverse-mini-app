
import { Hono } from "hono";
import { verifyTelegramInitData } from "../auth/telegram";

type Env = {
  Bindings: {
    ENVIRONMENT: string;
    GAME_NAME: string;
    TELEGRAM_BOT_TOKEN?: string;
  };
};

const MAX_BODY_SIZE = 16_384;
const MAX_INIT_DATA_LENGTH = 12_000;

const app = new Hono<Env>();

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
      maxAgeSeconds: 86400,
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

  return c.json({
    success: true,
    authenticated: true,
    user: result.user,
    authDate: result.authDate,
    expiresAt: result.authDate + 86400,
  });
});

export default app;
