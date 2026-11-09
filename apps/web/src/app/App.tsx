
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
  { id: "world", label: "Мир", icon: "◉" },
  { id: "character", label: "Персонаж", icon: "♟" },
  { id: "inventory", label: "Инвентарь", icon: "▣" },
  { id: "quests", label: "Задания", icon: "▤" },
  { id: "social", label: "Сообщество", icon: "♧" },
];

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
    if (activeTab === tab) return;

    triggerTelegramSelection();
    setActiveTab(tab);
  };

  const authenticatedPlayer =
    authResult?.ok === true ? authResult.data.player : null;

  const playerLabel = authenticatedPlayer
    ? authenticatedPlayer.username ||
      (authResult?.ok === true
        ? authResult.data.user.first_name
        : "Игрок")
    : "Путник";

  const activeItem = tabs.find((tab) => tab.id === activeTab);

  return (
    <main className="app-shell">
      <section className="game-stage">
        <header className="world-brand">
          <div className="brand-emblem" aria-hidden="true">
            ☾
          </div>

          <div className="brand-copy">
            <strong>
              xMoon<span>Verse</span>
            </strong>
            <small>REALM</small>
          </div>

          <div className="player-status" title="Текущий профиль">
            <span className="player-status-dot" />
            <span>{playerLabel}</span>
          </div>
        </header>

        <section className="game-content" aria-label="Игровая область">
          {activeTab === "world" ? (
            <GameCanvas />
          ) : (
            <div className="section-screen">
              <div className="section-screen-glow" />

              <div className="section-screen-content">
                <div className="section-screen-icon" aria-hidden="true">
                  {activeItem?.icon}
                </div>

                <p className="section-eyebrow">XMOONVERSE REALM</p>
                <h1>{activeItem?.label}</h1>

                <p className="section-description">
                  Этот раздел будет подключён на соответствующем этапе
                  разработки. Его оформление будет выполнено в едином
                  стиле игрового мира.
                </p>
              </div>
            </div>
          )}
        </section>
      </section>

      <nav className="bottom-navigation" aria-label="Основная навигация">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={isActive ? "nav-item active" : "nav-item"}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="nav-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="nav-label">{tab.label}</span>
              {isActive && <span className="nav-active-indicator" />}
            </button>
          );
        })}
      </nav>
    </main>
  );
}
