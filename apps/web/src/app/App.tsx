
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

type Tab = "world" | "character" | "inventory" | "quests" | "social";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "world", label: "Мир", icon: "🌌" },
  { id: "character", label: "Персонаж", icon: "🧙" },
  { id: "inventory", label: "Инвентарь", icon: "🎒" },
  { id: "quests", label: "Задания", icon: "📜" },
  { id: "social", label: "Сообщество", icon: "👥" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("world");

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
          <span className="online-dot" />
          <span>Игрок</span>
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
