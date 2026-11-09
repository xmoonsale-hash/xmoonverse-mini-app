
import { getTelegramWebApp } from "./telegram";

export type AuthenticatedTelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
};

export type AuthenticatedPlayer = {
  id: string;
  telegram_user_id: string;
  username: string;
  avatar_url: string | null;
};

export type AuthenticatedSession = {
  id: string;
  token: string;
  expiresAt: number;
};

export type TelegramAuthResponse = {
  success: true;
  authenticated: true;
  user: AuthenticatedTelegramUser;
  player: AuthenticatedPlayer;
  session: AuthenticatedSession;
  authDate: number;
  expiresAt: number;
};

export type TelegramAuthError =
  | "not_in_telegram"
  | "missing_init_data"
  | "api_not_configured"
  | "network_error"
  | "authentication_failed"
  | "invalid_response";

export type TelegramAuthResult =
  | {
      ok: true;
      data: TelegramAuthResponse;
    }
  | {
      ok: false;
      error: TelegramAuthError;
      status?: number;
    };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

function isAuthenticatedPlayer(
  value: unknown
): value is AuthenticatedPlayer {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const player = value as Record<string, unknown>;

  return (
    typeof player.id === "string" &&
    player.id.length > 0 &&
    typeof player.telegram_user_id === "string" &&
    player.telegram_user_id.length > 0 &&
    typeof player.username === "string" &&
    (
      player.avatar_url === null ||
      typeof player.avatar_url === "string"
    )
  );
}

function isAuthenticatedSession(
  value: unknown
): value is AuthenticatedSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const session = value as Record<string, unknown>;

  return (
    typeof session.id === "string" &&
    session.id.length > 0 &&
    typeof session.token === "string" &&
    /^[a-f0-9]{64}$/.test(session.token) &&
    typeof session.expiresAt === "number" &&
    Number.isFinite(session.expiresAt)
  );
}

export async function authenticateTelegram(): Promise<TelegramAuthResult> {
  const webApp = getTelegramWebApp();

  if (!webApp) {
    return { ok: false, error: "not_in_telegram" };
  }

  if (!webApp.initData) {
    return { ok: false, error: "missing_init_data" };
  }

  if (!API_BASE_URL) {
    return { ok: false, error: "api_not_configured" };
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/auth/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: webApp.initData }),
      cache: "no-store",
      credentials: "omit",
    });
  } catch {
    return { ok: false, error: "network_error" };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: "authentication_failed",
      status: response.status,
    };
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    return { ok: false, error: "invalid_response" };
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("success" in data) ||
    data.success !== true ||
    !("authenticated" in data) ||
    data.authenticated !== true ||
    !("user" in data) ||
    typeof data.user !== "object" ||
    data.user === null ||
    !("id" in data.user) ||
    typeof data.user.id !== "number" ||
    !Number.isSafeInteger(data.user.id) ||
    !("first_name" in data.user) ||
    typeof data.user.first_name !== "string" ||
    !("player" in data) ||
    !isAuthenticatedPlayer(data.player) ||
    !("session" in data) ||
    !isAuthenticatedSession(data.session) ||
    !("authDate" in data) ||
    typeof data.authDate !== "number" ||
    !Number.isFinite(data.authDate) ||
    !("expiresAt" in data) ||
    typeof data.expiresAt !== "number" ||
    !Number.isFinite(data.expiresAt) ||
    data.session.expiresAt !== data.expiresAt
  ) {
    return { ok: false, error: "invalid_response" };
  }

  return {
    ok: true,
    data: data as TelegramAuthResponse,
  };
}
