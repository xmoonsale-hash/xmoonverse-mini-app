
export type TelegramAuthUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
};

export type TelegramAuthResult =
  | {
      ok: true;
      user: TelegramAuthUser;
      authDate: number;
      queryId?: string;
    }
  | {
      ok: false;
      reason:
        | "missing_init_data"
        | "missing_bot_token"
        | "invalid_hash"
        | "invalid_auth_date"
        | "auth_data_expired"
        | "auth_date_in_future"
        | "invalid_user";
    };

const encoder = new TextEncoder();

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }

  return bytes;
}

function constantTimeEqual(
  first: Uint8Array,
  second: Uint8Array
): boolean {
  if (first.length !== second.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < first.length; i++) {
    difference |= first[i] ^ second[i];
  }

  return difference === 0;
}

async function hmacSha256(
  key: Uint8Array,
  data: string
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(data)
  );

  return new Uint8Array(signature);
}

function isOptionalString(
  value: unknown
): boolean {
  return value === undefined || typeof value === "string";
}

function isTelegramAuthUser(
  value: unknown
): value is TelegramAuthUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === "number" &&
    Number.isSafeInteger(user.id) &&
    user.id > 0 &&
    typeof user.first_name === "string" &&
    user.first_name.length > 0 &&
    isOptionalString(user.last_name) &&
    isOptionalString(user.username) &&
    isOptionalString(user.language_code) &&
    isOptionalString(user.photo_url) &&
    (
      user.is_premium === undefined ||
      typeof user.is_premium === "boolean"
    )
  );
}

export async function verifyTelegramInitData(
  initData: string,
  botToken: string,
  options: {
    maxAgeSeconds?: number;
    futureSkewSeconds?: number;
    nowSeconds?: number;
  } = {}
): Promise<TelegramAuthResult> {
  if (!initData) {
    return {
      ok: false,
      reason: "missing_init_data",
    };
  }

  if (!botToken) {
    return {
      ok: false,
      reason: "missing_bot_token",
    };
  }

  const {
    maxAgeSeconds = 86400,
    futureSkewSeconds = 60,
    nowSeconds = Math.floor(Date.now() / 1000),
  } = options;

  const params = new URLSearchParams(initData);
  const entries = Array.from(params.entries());
  const seenKeys = new Set<string>();

  for (const [key] of entries) {
    if (seenKeys.has(key)) {
      return {
        ok: false,
        reason: "invalid_hash",
      };
    }

    seenKeys.add(key);
  }

  const receivedHash = params.get("hash");

  if (
    !receivedHash ||
    !/^[a-f0-9]{64}$/i.test(receivedHash)
  ) {
    return {
      ok: false,
      reason: "invalid_hash",
    };
  }

  const authDateValue = params.get("auth_date");

  if (!authDateValue || !/^\d+$/.test(authDateValue)) {
    return {
      ok: false,
      reason: "invalid_auth_date",
    };
  }

  const authDate = Number(authDateValue);

  if (!Number.isSafeInteger(authDate) || authDate <= 0) {
    return {
      ok: false,
      reason: "invalid_auth_date",
    };
  }

  if (authDate > nowSeconds + futureSkewSeconds) {
    return {
      ok: false,
      reason: "auth_date_in_future",
    };
  }

  if (nowSeconds - authDate > maxAgeSeconds) {
    return {
      ok: false,
      reason: "auth_data_expired",
    };
  }

  const dataCheckString = entries
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // Telegram WebApp signature algorithm:
  // secret_key = HMAC_SHA256("WebAppData", bot_token)
  const secretKey = await hmacSha256(
    encoder.encode("WebAppData"),
    botToken
  );

  const calculatedHash = await hmacSha256(
    secretKey,
    dataCheckString
  );

  const expectedHash = hexToBytes(receivedHash);

  if (!constantTimeEqual(calculatedHash, expectedHash)) {
    return {
      ok: false,
      reason: "invalid_hash",
    };
  }

  const userValue = params.get("user");

  if (!userValue) {
    return {
      ok: false,
      reason: "invalid_user",
    };
  }

  let parsedUser: unknown;

  try {
    parsedUser = JSON.parse(userValue);
  } catch {
    return {
      ok: false,
      reason: "invalid_user",
    };
  }

  if (!isTelegramAuthUser(parsedUser)) {
    return {
      ok: false,
      reason: "invalid_user",
    };
  }

  return {
    ok: true,
    user: parsedUser,
    authDate,
    queryId: params.get("query_id") ?? undefined,
  };
}
