
export type TelegramColorScheme = "light" | "dark";

export type TelegramInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type TelegramHapticStyle =
  | "light"
  | "medium"
  | "heavy"
  | "rigid"
  | "soft";

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

export type TelegramEventType =
  | "themeChanged"
  | "viewportChanged"
  | "safeAreaChanged"
  | "contentSafeAreaChanged";

export type TelegramBackButton = {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
};

export type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  platform: string;
  version: string;
  colorScheme: TelegramColorScheme;
  isExpanded: boolean;
  isFullscreen?: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  safeAreaInset?: TelegramInsets;
  contentSafeAreaInset?: TelegramInsets;
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  themeParams: TelegramThemeParams;
  BackButton?: TelegramBackButton;
  hapticFeedback?: {
    impactOccurred: (style: TelegramHapticStyle) => void;
    notificationOccurred: (
      type: "error" | "success" | "warning"
    ) => void;
    selectionChanged: () => void;
  };
  onEvent: (eventType: TelegramEventType, callback: () => void) => void;
  offEvent: (eventType: TelegramEventType, callback: () => void) => void;
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

export function triggerTelegramHaptic(
  style: TelegramHapticStyle = "light"
): void {
  const webApp = getTelegramWebApp();

  webApp?.hapticFeedback?.impactOccurred(style);
}

export function triggerTelegramSelection(): void {
  const webApp = getTelegramWebApp();

  webApp?.hapticFeedback?.selectionChanged();
}

export function setTelegramBackButtonVisible(visible: boolean): void {
  const backButton = getTelegramWebApp()?.BackButton;

  if (!backButton) {
    return;
  }

  if (visible) {
    backButton.show();
  } else {
    backButton.hide();
  }
}

export function subscribeTelegramBackButton(
  callback: () => void
): () => void {
  const backButton = getTelegramWebApp()?.BackButton;

  if (!backButton) {
    return () => {};
  }

  backButton.onClick(callback);

  return () => {
    backButton.offClick(callback);
  };
}

function setCssVariable(name: string, value: string | number): void {
  document.documentElement.style.setProperty(name, String(value));
}

function applyInsets(prefix: string, insets?: TelegramInsets): void {
  const sides = ["top", "right", "bottom", "left"] as const;

  sides.forEach((side) => {
    setCssVariable(
      `--${prefix}-${side}`,
      `${insets?.[side] ?? 0}px`
    );
  });
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

export function applyTelegramViewport(): void {
  if (typeof document === "undefined") {
    return;
  }

  const webApp = getTelegramWebApp();
  const root = document.documentElement;

  if (!webApp) {
    [
      "--tg-viewport-height",
      "--tg-viewport-stable-height",
    ].forEach((property) => root.style.removeProperty(property));

    [
      "safe-area-inset",
      "content-safe-area-inset",
    ].forEach((prefix) => {
      ["top", "right", "bottom", "left"].forEach((side) => {
        root.style.removeProperty(`--${prefix}-${side}`);
      });
    });

    return;
  }

  const viewportHeight =
    webApp.viewportHeight || webApp.viewportStableHeight || 0;

  const stableHeight =
    webApp.viewportStableHeight || viewportHeight;

  setCssVariable("--tg-viewport-height", `${viewportHeight}px`);
  setCssVariable("--tg-viewport-stable-height", `${stableHeight}px`);

  applyInsets("safe-area-inset", webApp.safeAreaInset);
  applyInsets("content-safe-area-inset", webApp.contentSafeAreaInset);
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

export function subscribeTelegramViewport(): () => void {
  const webApp = getTelegramWebApp();

  if (!webApp) {
    return () => {};
  }

  const handleViewportChanged = () => {
    applyTelegramViewport();
  };

  const events: TelegramEventType[] = [
    "viewportChanged",
    "safeAreaChanged",
    "contentSafeAreaChanged",
  ];

  events.forEach((event) => {
    webApp.onEvent(event, handleViewportChanged);
  });

  return () => {
    events.forEach((event) => {
      webApp.offEvent(event, handleViewportChanged);
    });
  };
}

export function initializeTelegramWebApp(): boolean {
  const webApp = getTelegramWebApp();

  if (!webApp) {
    return false;
  }

  webApp.ready();
  webApp.expand();

  applyTelegramViewport();

  return true;
}
