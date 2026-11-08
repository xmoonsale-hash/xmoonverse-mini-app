
import { Hono } from "hono";
import { verifyTelegramInitData } from "./auth/telegram";

type Env = {
  Bindings: {
    ENVIRONMENT: string;
    GAME_NAME: string;
    TELEGRAM_BOT_TOKEN?: string;
  };
};

const app = new Hono<Env>();

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

  const contentLength = Number(
    c.req.header("content-length") ?? 0
  );

  if (contentLength > 16384) {
    return c.json(
      {
        success: false,
        error: "Request body is too large",
      },
      413
    );
  }

  let body: { initData?: unknown } | null;

  try {
    body = await c.req.json<{ initData?: unknown }>();
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
    !body ||
    typeof body.initData !== "string" ||
    body.initData.length === 0 ||
    body.initData.length > 12000
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
