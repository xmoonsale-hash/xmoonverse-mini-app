
export type TelegramColorScheme = "light" | "dark";

export type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  platform: string;
  version: string;
  colorScheme: TelegramColorScheme;
  isExpanded: boolean;
  isFullscreen?: boolean;
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  themeParams: Record<string, string>;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export type TelegramEnvironment = {
  isTelegram: boolean;
  platform: string;
  version: string;
  colorScheme: TelegramColorScheme;
  isExpanded: boolean;
  isFullscreen: boolean;
  themeParams: Record<string, string>;
};

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
}

export function getTelegramEnvironment(): TelegramEnvironment {
  const webApp = getTelegramWebApp();

  if (!webApp) {
    return {
      isTelegram: false,
      platform: "unknown",
      version: "unknown",
      colorScheme: "dark",
      isExpanded: false,
      isFullscreen: false,
      themeParams: {},
    };
  }

  return {
    isTelegram: true,
    platform: webApp.platform || "unknown",
    version: webApp.version || "unknown",
    colorScheme: webApp.colorScheme || "dark",
    isExpanded: webApp.isExpanded,
    isFullscreen: webApp.isFullscreen ?? false,
    themeParams: webApp.themeParams ?? {},
  };
}

export function initializeTelegramWebApp(): boolean {
  const webApp = getTelegramWebApp();

  if (!webApp) {
    return false;
  }

  webApp.ready();
  webApp.expand();

  return true;
}
