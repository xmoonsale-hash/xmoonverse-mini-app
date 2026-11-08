export type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
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