
import { useCallback, useEffect, useState } from "react";
import GameCanvas from "../game/GameCanvas";
import CharacterCreation from "../game/CharacterCreation";
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
  fetchCurrentPlayer,
  type PlayerMeResult,
  type TelegramAuthResult,
} from "../platform/auth";
import {
  clearPlayerSession,
  getPlayerSessionToken,
  setPlayerSession,
} from "../platform/session";
import {
  fetchGameState,
  type GameStateResult,
  type CreateCharacterResponse,
} from "../platform/game";

type Tab = "world" | "character" | "inventory" | "quests" | "social";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "world", label: "Мир", icon: "◉" },
  { id: "character", label: "Персонаж", icon: "♟" },
  { id: "inventory", label: "Инвентарь", icon: "▣" },
  { id: "quests", label: "Задания", icon: "▤" },
  { id: "social", label: "Сообщество", icon: "♧" },
];

function getAuthErrorLabel(
  error: Extract<TelegramAuthResult, { ok: false }>["error"]
): string {
  const labels: Record<typeof error, string> = {
    not_in_telegram: "Не в Telegram",
    missing_init_data: "Нет данных Telegram",
    api_not_configured: "API не настроен",
    network_error: "Нет соединения",
    authentication_failed: "Ошибка входа",
    invalid_response: "Ошибка ответа",
  };

  return labels[error];
}

function getPlayerErrorLabel(
  error: Extract<PlayerMeResult, { ok: false }>["error"]
): string {
  const labels: Record<typeof error, string> = {
    api_not_configured: "API не настроен",
    network_error: "Нет соединения",
    session_invalid: "Сессия недействительна",
    server_error: "Ошибка сервера",
    invalid_response: "Ошибка ответа",
  };

  return labels[error];
}

function getGameErrorLabel(
  error: Extract<GameStateResult, { ok: false }>["error"]
): string {
  const labels: Record<
    Extract<GameStateResult, { ok: false }>["error"],
    string
  > = {
    api_not_configured: "API не настроен",
    network_error: "Нет соединения",
    session_invalid: "Сессия недействительна",
    character_exists: "Персонаж уже существует",
    invalid_request: "Некорректный запрос",
    server_error: "Ошибка сервера",
    invalid_response: "Ошибка игрового состояния",
  };

  return labels[error];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("world");

  const [authResult, setAuthResult] =
    useState<TelegramAuthResult | null>(null);

  const [playerMeResult, setPlayerMeResult] =
    useState<PlayerMeResult | null>(null);

  const [gameStateResult, setGameStateResult] =
    useState<GameStateResult | null>(null);

  const [isGameLoading, setIsGameLoading] = useState(false);

  const telegram = getTelegramEnvironment();

  const sessionToken =
    authResult?.ok === true
      ? authResult.data.session.token
      : "";

  const loadGameState = useCallback(async (token: string) => {
    setIsGameLoading(true);
    setGameStateResult(null);

    const result = await fetchGameState(token);

    setGameStateResult(result);
    setIsGameLoading(false);

    if (!result.ok && result.error === "session_invalid") {
      clearPlayerSession();
    }

    return result;
  }, []);

  const handleCharacterCreated = (
    data: CreateCharacterResponse
  ) => {
    setGameStateResult({
      ok: true,
      data: {
        success: true,
        hasCharacter: true,
        character: data.character,
        location: data.location,
        inventory: [],
      },
    });

    setActiveTab("world");
    triggerTelegramSelection();
  };

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

    clearPlayerSession();
    setAuthResult(null);
    setPlayerMeResult(null);
    setGameStateResult(null);
    setIsGameLoading(false);

    if (!telegram.isTelegram) {
      return () => {
        cancelled = true;
      };
    }

    async function authenticateAndLoadPlayer() {
      const result = await authenticateTelegram();

      if (cancelled) return;

      if (!result.ok) {
        clearPlayerSession();
        setAuthResult(result);
        setPlayerMeResult(null);
        setGameStateResult(null);
        return;
      }

      const sessionAccepted = setPlayerSession(
        result.data.session
      );

      if (!sessionAccepted) {
        clearPlayerSession();

        setAuthResult({
          ok: false,
          error: "invalid_response",
        });

        setPlayerMeResult(null);
        setGameStateResult(null);
        return;
      }

      setAuthResult(result);

      const playerResult = await fetchCurrentPlayer(
        result.data.session.token
      );

      if (cancelled) return;

      setPlayerMeResult(playerResult);

      if (!playerResult.ok) {
        if (playerResult.error === "session_invalid") {
          clearPlayerSession();
        }

        return;
      }

      const gameResult = await fetchGameState(
        result.data.session.token
      );

      if (cancelled) return;

      setGameStateResult(gameResult);

      if (!gameResult.ok && gameResult.error === "session_invalid") {
        clearPlayerSession();
      }
    }

    void authenticateAndLoadPlayer();

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
    playerMeResult?.ok === true
      ? playerMeResult.data.player
      : null;

  const playerLabel = authenticatedPlayer
    ? authenticatedPlayer.username ||
      (authResult?.ok === true
        ? authResult.data.user.first_name
        : "Игрок")
    : "Путник";

  let playerStatusLabel = "Не авторизован";
  let playerStatusTitle = "Профиль игрока не подтверждён";

  if (!telegram.isTelegram) {
    playerStatusLabel = "Откройте в Telegram";
    playerStatusTitle =
      "Для авторизации откройте приложение через Telegram";
  } else if (authResult === null) {
    playerStatusLabel = "Подключение…";
    playerStatusTitle = "Выполняется авторизация через Telegram";
  } else if (!authResult.ok) {
    playerStatusLabel = getAuthErrorLabel(authResult.error);
    playerStatusTitle =
      `Не удалось выполнить авторизацию: ${authResult.error}`;
  } else if (playerMeResult === null) {
    playerStatusLabel = "Проверка…";
    playerStatusTitle = "Сервер проверяет игровую сессию";
  } else if (!playerMeResult.ok) {
    playerStatusLabel = getPlayerErrorLabel(playerMeResult.error);
    playerStatusTitle =
      `Не удалось подтвердить профиль: ${playerMeResult.error}`;
  } else if (isGameLoading) {
    playerStatusLabel = "Загрузка мира…";
    playerStatusTitle = "Загружается игровое состояние";
  } else if (gameStateResult?.ok === false) {
    playerStatusLabel = getGameErrorLabel(gameStateResult.error);
    playerStatusTitle =
      `Не удалось загрузить игру: ${gameStateResult.error}`;
  } else if (gameStateResult?.ok === true) {
    playerStatusLabel = gameStateResult.data.hasCharacter
      ? "В мире"
      : "Создание героя";

    playerStatusTitle = gameStateResult.data.hasCharacter
      ? "Игровое состояние загружено"
      : "Персонаж ещё не создан";
  } else {
    playerStatusLabel = "В сети";
    playerStatusTitle = "Игровой профиль подтверждён сервером";
  }

  const activeItem = tabs.find((tab) => tab.id === activeTab);

  const gameState = gameStateResult?.ok === true
    ? gameStateResult.data
    : null;

  const handleRetryGameLoad = async () => {
    const token = getPlayerSessionToken();

    if (!token) {
      clearPlayerSession();
      return;
    }

    await loadGameState(token);
  };

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

          <div
            className="player-status"
            title={playerStatusTitle}
            aria-live="polite"
          >
            <span className="player-status-dot" />
            <span>
              {playerMeResult?.ok === true
                ? playerLabel
                : playerStatusLabel}
            </span>
          </div>
        </header>

        <section className="game-content" aria-label="Игровая область">
          {activeTab === "world" ? (
            <>
              {isGameLoading ? (
                <div className="section-screen">
                  <div className="section-screen-glow" />
                  <div className="section-screen-content">
                    <p className="section-eyebrow">
                      XMOONVERSE REALM
                    </p>
                    <h1>Загрузка мира</h1>
                    <p className="section-description">
                      Подготавливаем игровое пространство…
                    </p>
                  </div>
                </div>
              ) : gameStateResult?.ok === false ? (
                <div className="section-screen">
                  <div className="section-screen-glow" />
                  <div className="section-screen-content">
                    <p className="section-eyebrow">
                      XMOONVERSE REALM
                    </p>
                    <h1>Не удалось загрузить мир</h1>
                    <p className="section-description">
                      {getGameErrorLabel(gameStateResult.error)}
                    </p>
                    <button
                      type="button"
                      className="nav-item active"
                      onClick={() => void handleRetryGameLoad()}
                    >
                      Повторить загрузку
                    </button>
                  </div>
                </div>
              ) : gameState?.hasCharacter ? (
                <GameCanvas
                  character={gameState.character}
                  location={gameState.location}
                />
              ) : gameState?.hasCharacter === false ? (
                <CharacterCreation
                  sessionToken={sessionToken}
                  onCreated={handleCharacterCreated}
                />
              ) : (
                <GameCanvas />
              )}
            </>
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
