import { Hono } from "hono";

type Env = {
  Bindings: {
    ENVIRONMENT: string;
    GAME_NAME: string;
  };
};

const app = new Hono<Env>();

app.get("/", (c) => {
  return c.json({
    name: c.env.GAME_NAME,
    message: "Welcome to xMoonVerse RPG API",
    environment: c.env.ENVIRONMENT,
    version: "0.1.0"
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "xmoonverse-rpg-api",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/v1/status", (c) => {
  return c.json({
    success: true,
    game: "xMoonVerse RPG",
    apiVersion: "v1",
    environment: c.env.ENVIRONMENT
  });
});

export default app;