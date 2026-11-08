
import { useEffect, useState } from "react";
import GameCanvas from "../game/GameCanvas";
import {
  applyTelegramTheme,
  applyTelegramViewport,
  getTelegramEnvironment,
  setTelegramBackButtonVisible,
  subscribeTelegramBackButton,
  subscribeTelegramTheme,
  subscribeTelegramViewport,
  triggerTelegramSelection,
} from "../platform/telegram";
import {
  authenticateTelegram,
  type TelegramAuthResult,
} from "../platform/auth";

type Tab = "world" | "character" | "inventory" | "quests" | "social";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "world", label: "Мир", icon: "🌌" },
  { id: "character", label: "Персонаж", icon: "🧙" },
  { id: "inventory", label: "Инвентарь", icon: "🎒" },
  { id: "quests", label: "Задания", icon: "📜" },
  { id: "social", label: "Сообщество", icon: "👥" },
];

function getAuthMessage(result: TelegramAuthResult | null): string {
  if (!result) {
    return "Проверка авторизации...";
  }

  if (result.ok) {
    return "Аккаунт Telegram подтверждён";
  }

  switch (result.error) {
    case "not_in_telegram":
      return "Откройте приложение через Telegram";
    case "missing_init_data":
      return "Telegram не предоставил данные авторизации";
    case "api_not_configured":
      return "Ожидается подключение API";
    case "network_error":
      return "Не удалось связаться с сервером";
    case "authentication_failed":
      return result.status
        ? `Ошибка авторизации · ${result.status}`
        : "Ошибка авторизации";
    case "invalid_response":
      return "Сервер вернул некорректный ответ";
    default:
      return "Статус авторизации неизвестен";
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("world");
  const [authResult, setAuthResult] =
    useState<TelegramAuthResult | null>(null);

  const telegram = getTelegramEnvironment();

  useEffect(() => {
    applyTelegramTheme();
    applyTelegramViewport();

    const unsubscribeTheme = subscribeTelegramTheme();
    const unsubscribeViewport = subscribeTelegramViewport();

    return () => {
      unsubscribeTheme();
      unsubscribeViewport();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!telegram.isTelegram) {
      setAuthResult(null);
      return;
    }

    authenticateTelegram().then((result) => {
      if (!cancelled) {
        setAuthResult(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [telegram.isTelegram]);

  useEffect(() => {
    const unsubscribeBackButton = subscribeTelegramBackButton(() => {
      setActiveTab((currentTab) => {
        if (currentTab === "world") {
          return currentTab;
        }

        triggerTelegramSelection();
        return "world";
      });
    });

    return unsubscribeBackButton;
  }, []);

  useEffect(() => {
    setTelegramBackButtonVisible(activeTab !== "world");

    return () => {
      setTelegramBackButtonVisible(false);
    };
  }, [activeTab]);

  const handleTabChange = (tab: Tab) => {
    if (activeTab === tab) {
      return;
    }

    triggerTelegramSelection();
    setActiveTab(tab);
  };

  const authenticatedUser =
    authResult?.ok === true ? authResult.data.user : null;

  const playerLabel = authenticatedUser
    ? authenticatedUser.first_name
    : telegram.isTelegram
      ? "Не авторизован"
      : "Гостевой режим";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <div>
            <strong>xMoonVerse</strong>
            <small>REALM ONLINE</small>
          </div>
        </div>

        <div className="player-status">
          <span
            className="online-dot"
            style={{
              opacity: authenticatedUser ? 1 : 0.45,
            }}
          />
          <span>{playerLabel}</span>
        </div>
      </header>

      <section className="game-header">
        <div>
          <p className="eyebrow">YOUR ADVENTURE BEGINS</p>
          <h1>Мир xMoonVerse</h1>
          <p className="subtitle">
            Исследуй мир, развивай персонажа и создавай собственную историю.
          </p>

          <div className="environment-status">
            {telegram.isTelegram
              ? `Telegram · ${telegram.platform} · ${telegram.version}`
              : "Browser mode"}
          </div>

          <div className="environment-status">
            {telegram.isTelegram
              ? getAuthMessage(authResult)
              : "Авторизация Telegram будет доступна при запуске через бота"}
          </div>
        </div>
      </section>

      <section className="game-content">
        {activeTab === "world" ? (
          <GameCanvas />
        ) : (
          <div className="placeholder-panel">
            <span className="placeholder-icon">
              {tabs.find((tab) => tab.id === activeTab)?.icon}
            </span>
            <h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
            <p>
              Этот раздел будет реализован на следующих этапах разработки.
            </p>
          </div>
        )}
      </section>

      <nav className="bottom-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "nav-item active" : "nav-item"}
            onClick={() => handleTabChange(tab.id)}
            type="button"
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
