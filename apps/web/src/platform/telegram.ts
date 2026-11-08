
export type TelegramColorScheme = "light" | "dark";

export type TelegramThemeParams = {
  bg_color?: string;
  secondary_bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  header_bg_color?: string;
  bottom_bar_bg_color?: string;
};

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
  themeParams: TelegramThemeParams;
  onEvent: (eventType: "themeChanged", callback: () => void) => void;
  offEvent: (eventType: "themeChanged", callback: () => void) => void;
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
  themeParams: TelegramThemeParams;
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

export function applyTelegramTheme(): void {
  if (typeof document === "undefined") {
    return;
  }

  const environment = getTelegramEnvironment();
  const root = document.documentElement;
  const theme = environment.themeParams;

  root.dataset.colorScheme = environment.colorScheme;

  const colors: Record<string, string | undefined> = {
    "--background": theme.bg_color,
    "--panel": theme.secondary_bg_color,
    "--panel-light": theme.header_bg_color,
    "--text": theme.text_color,
    "--muted": theme.hint_color,
    "--accent": theme.link_color,
    "--accent-bright": theme.button_color,
    "--button-text": theme.button_text_color,
    "--navigation-background": theme.bottom_bar_bg_color,
  };

  Object.entries(colors).forEach(([property, value]) => {
    if (value) {
      root.style.setProperty(property, value);
    } else {
      root.style.removeProperty(property);
    }
  });
}

export function subscribeTelegramTheme(): () => void {
  const webApp = getTelegramWebApp();

  if (!webApp) {
    return () => {};
  }

  const handleThemeChanged = () => {
    applyTelegramTheme();
  };

  webApp.onEvent("themeChanged", handleThemeChanged);

  return () => {
    webApp.offEvent("themeChanged", handleThemeChanged);
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
