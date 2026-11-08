
import { useCallback, useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import MeadowScene from "./scenes/MeadowScene";

type GraphicsMode = "performance" | "standard";

const COLORS = {
  background: "#101026",
  panel: "rgba(19, 18, 43, 0.96)",
  border: "rgba(196, 167, 255, 0.25)",
  accent: "#b99aff",
  text: "#ffffff",
  muted: "#b8b2d0",
  danger: "#ff7777",
};

const buttonStyle: React.CSSProperties = {
  minHeight: "42px",
  padding: "0 13px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "11px",
  background: "rgba(255,255,255,0.07)",
  color: COLORS.text,
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
};

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const fallbackFullscreenRef = useRef(false);
  const userPausedRef = useRef(false);
  const lifecyclePausedRef = useRef(false);
  const destroyedRef = useRef(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [muted, setMuted] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [graphicsMode, setGraphicsMode] =
    useState<GraphicsMode>("standard");
  const [fps, setFps] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;

    if (!container) return;

    if (isFullscreen) {
      if (document.fullscreenElement === container) {
        try {
          await document.exitFullscreen();
        } catch {
          fallbackFullscreenRef.current = false;
          setIsFullscreen(false);
        }
      } else {
        fallbackFullscreenRef.current = false;
        setIsFullscreen(false);
      }

      return;
    }

    if (container.requestFullscreen) {
      try {
        await container.requestFullscreen();
        fallbackFullscreenRef.current = false;
        setIsFullscreen(true);
        return;
      } catch {
        // Некоторые мобильные браузеры не поддерживают fullscreen API.
      }
    }

    fallbackFullscreenRef.current = true;
    setIsFullscreen(true);
  }, [isFullscreen]);

  const pauseGame = useCallback((source: "user" | "lifecycle") => {
    const game = gameRef.current;

    if (!game || destroyedRef.current) return;

    if (source === "user") {
      userPausedRef.current = true;
    } else {
      lifecyclePausedRef.current = true;
    }

    game.loop.sleep();
    setIsPaused(true);
  }, []);

  const resumeGame = useCallback((source: "user" | "lifecycle") => {
    const game = gameRef.current;

    if (!game || destroyedRef.current) return;

    if (source === "user") {
      userPausedRef.current = false;
    } else {
      lifecyclePausedRef.current = false;
    }

    if (userPausedRef.current || lifecyclePausedRef.current) {
      return;
    }

    game.loop.wake();
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    if (userPausedRef.current) {
      resumeGame("user");
    } else {
      pauseGame("user");
    }
  }, [pauseGame, resumeGame]);

  const toggleMute = useCallback(() => {
    const nextMuted = !muted;
    setMuted(nextMuted);

    const game = gameRef.current;

    if (game) {
      game.sound.mute = nextMuted;
    }
  }, [muted]);

  const toggleVibration = useCallback(() => {
    setVibrationEnabled((value) => !value);
  }, []);

  const toggleGraphics = useCallback(() => {
    const nextMode: GraphicsMode =
      graphicsMode === "standard" ? "performance" : "standard";

    setGraphicsMode(nextMode);

    const game = gameRef.current;

    if (game) {
      game.loop.targetFps = nextMode === "performance" ? 30 : 60;
    }
  }, [graphicsMode]);

  const vibrate = useCallback(
    (pattern: number | number[] = 20) => {
      if (!vibrationEnabled) return;

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    },
    [vibrationEnabled]
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    destroyedRef.current = false;

    let game: Phaser.Game | null = null;
    let fpsInterval: ReturnType<typeof setInterval> | undefined;
    let resizeObserver: ResizeObserver | undefined;

    const preventBrowserAction = (event: Event) => {
      const target = event.target;

      if (
        target instanceof Element &&
        target.closest("[data-game-control]")
      ) {
        return;
      }

      event.preventDefault();
    };

    const blockedEvents = [
      "touchstart",
      "touchmove",
      "touchend",
      "gesturestart",
      "gesturechange",
      "gestureend",
      "contextmenu",
      "dragstart",
    ];

    blockedEvents.forEach((eventName) => {
      container.addEventListener(
        eventName,
        preventBrowserAction,
        { passive: false }
      );
    });

    const updateOrientation = () => {
      setIsPortrait(
        window.matchMedia("(orientation: portrait)").matches
      );
    };

    const handleFullscreenChange = () => {
      const nativeFullscreen =
        document.fullscreenElement === container;

      setIsFullscreen(
        nativeFullscreen || fallbackFullscreenRef.current
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        fallbackFullscreenRef.current
      ) {
        fallbackFullscreenRef.current = false;
        setIsFullscreen(false);
      }

      if (event.key === "Escape") {
        setShowSettings(false);
      }
    };

    const handleLifecyclePause = () => {
      if (!userPausedRef.current) {
        lifecyclePausedRef.current = true;
        game?.loop.sleep();
        setIsPaused(true);
      }
    };

    const handleLifecycleResume = () => {
      if (
        lifecyclePausedRef.current &&
        !userPausedRef.current
      ) {
        lifecyclePausedRef.current = false;
        game?.loop.wake();
        setIsPaused(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleLifecyclePause();
      } else {
        handleLifecycleResume();
      }
    };

    const handleWebGLContextLost = (event: Event) => {
      event.preventDefault();
      setContextLost(true);
      setLoadingError(
        "Графический контекст потерян. Ожидаем восстановления..."
      );
      game?.loop.sleep();
    };

    const handleWebGLContextRestored = () => {
      setContextLost(false);
      setLoadingError("");
      game?.loop.wake();
    };

    const handleResize = () => {
      updateOrientation();

      if (game && !destroyedRef.current) {
        game.scale.refresh();
      }
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener("blur", handleLifecyclePause);
    window.addEventListener("focus", handleLifecycleResume);
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    updateOrientation();

    try {
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: container,
        backgroundColor: COLORS.background,

        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 900,
          height: 520,
        },

        input: {
          activePointers: 5,
          touch: {
            capture: true,
          },
        },

        disableContextMenu: true,

        scene: [MeadowScene],

        render: {
          antialias: false,
          pixelArt: true,
          roundPixels: true,
          powerPreference: "high-performance",
        },

        fps: {
          target: 60,
          forceSetTimeOut: false,
        },
      });

      gameRef.current = game;

      const canvas = game.canvas;

      if (canvas) {
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.touchAction = "none";
        canvas.style.userSelect = "none";
        canvas.style.webkitUserSelect = "none";
        canvas.style.setProperty(
          "-webkit-tap-highlight-color",
          "transparent"
        );

        canvas.addEventListener(
          "webglcontextlost",
          handleWebGLContextLost
        );

        canvas.addEventListener(
          "webglcontextrestored",
          handleWebGLContextRestored
        );
      }

      game.events.once("ready", () => {
        if (destroyedRef.current) return;

        setIsLoading(false);
        setLoadingError("");
      });

      fpsInterval = setInterval(() => {
        if (
          game &&
          !destroyedRef.current &&
          !isPaused
        ) {
          const actualFps = Math.round(game.loop.actualFps);
          setFps(Number.isFinite(actualFps) ? actualFps : 0);
        }
      }, 1000);

      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(() => {
          if (game && !destroyedRef.current) {
            game.scale.refresh();
          }
        });

        resizeObserver.observe(container);
      }
    } catch (error) {
      console.error("xMoonVerse game initialization failed:", error);

      setIsLoading(false);
      setLoadingError(
        "Не удалось запустить игру. Попробуйте обновить страницу."
      );
    }

    return () => {
      destroyedRef.current = true;

      if (fpsInterval) {
        clearInterval(fpsInterval);
      }

      resizeObserver?.disconnect();

      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener("blur", handleLifecyclePause);
      window.removeEventListener("focus", handleLifecycleResume);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(
        "orientationchange",
        handleResize
      );

      blockedEvents.forEach((eventName) => {
        container.removeEventListener(
          eventName,
          preventBrowserAction
        );
      });

      const canvas = game?.canvas;

      if (canvas) {
        canvas.removeEventListener(
          "webglcontextlost",
          handleWebGLContextLost
        );

        canvas.removeEventListener(
          "webglcontextrestored",
          handleWebGLContextRestored
        );
      }

      fallbackFullscreenRef.current = false;
      userPausedRef.current = false;
      lifecyclePausedRef.current = false;

      game?.destroy(true);

      gameRef.current = null;
    };

    // Game is intentionally initialized only once per component mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const controlClick = (
    callback: () => void
  ) => ({
    "data-game-control": true,
    onPointerDown: (event: React.PointerEvent) => {
      event.stopPropagation();
    },
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      callback();
    },
  });

  return (
    <div
      ref={containerRef}
      className="game-canvas"
      style={{
        position: isFullscreen ? "fixed" : "relative",
        inset: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 9999 : "auto",
        display: "block",
        width: isFullscreen ? "100vw" : "100%",
        maxWidth: isFullscreen ? "none" : "100%",
        height: isFullscreen ? "100dvh" : "min(65vh, 560px)",
        minHeight: isFullscreen ? "0" : "360px",
        overflow: "hidden",
        border: isFullscreen ? "0" : `1px solid ${COLORS.border}`,
        borderRadius: isFullscreen ? "0" : "20px",
        background: COLORS.background,
        touchAction: "none",
        overscrollBehavior: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        isolation: "isolate",
      }}
    >
      {/* Loading screen */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            background: COLORS.background,
            color: COLORS.text,
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              border: `3px solid ${COLORS.border}`,
              borderTopColor: COLORS.accent,
              borderRadius: "50%",
              animation: "xmoon-spin 0.9s linear infinite",
            }}
          />
          <strong style={{ fontSize: "16px" }}>
            xMoonVerse
          </strong>
          <span style={{ color: COLORS.muted, fontSize: "13px" }}>
            Запускаем игровой мир...
          </span>
          <style>
            {`
              @keyframes xmoon-spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      {/* Error screen */}
      {loadingError && !contextLost && (
        <div
          data-game-control
          role="alert"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            padding: "24px",
            background: "rgba(16,16,38,0.96)",
            color: COLORS.text,
            textAlign: "center",
            pointerEvents: "auto",
          }}
        >
          <span style={{ fontSize: "30px" }}>⚠</span>
          <strong>Проблема с игрой</strong>
          <span style={{ color: COLORS.muted, fontSize: "13px" }}>
            {loadingError}
          </span>
          <button
            type="button"
            style={buttonStyle}
            {...controlClick(() => window.location.reload())}
          >
            Перезагрузить игру
          </button>
        </div>
      )}

      {/* Top control bar */}
      <div
        data-game-control
        style={{
          position: "absolute",
          top: "max(12px, env(safe-area-inset-top))",
          left: "max(12px, env(safe-area-inset-left))",
          right: "max(12px, env(safe-area-inset-right))",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "7px",
            pointerEvents: "auto",
          }}
        >
          <button
            type="button"
            aria-label={isPaused ? "Продолжить игру" : "Пауза"}
            style={buttonStyle}
            {...controlClick(() => {
              vibrate();
              togglePause();
            })}
          >
            {isPaused ? "▶ Продолжить" : "Ⅱ Пауза"}
          </button>

          <button
            type="button"
            aria-label="Настройки игры"
            style={buttonStyle}
            {...controlClick(() => {
              vibrate();
              setShowSettings((value) => !value);
            })}
          >
            ⚙
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            pointerEvents: "auto",
          }}
        >
          <span
            style={{
              padding: "7px 9px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "9px",
              background: "rgba(16,16,38,0.8)",
              color: COLORS.muted,
              fontSize: "11px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fps} FPS
          </span>

          <button
            type="button"
            aria-label={
              isFullscreen ? "Выйти из fullscreen" : "На весь экран"
            }
            style={buttonStyle}
            {...controlClick(() => {
              vibrate();
              void toggleFullscreen();
            })}
          >
            {isFullscreen ? "× Выйти" : "⛶"}
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div
          data-game-control
          style={{
            position: "absolute",
            top: "68px",
            left: "max(12px, env(safe-area-inset-left))",
            zIndex: 25,
            width: "min(280px, calc(100% - 24px))",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            padding: "16px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "16px",
            background: COLORS.panel,
            color: COLORS.text,
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            backdropFilter: "blur(16px)",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <strong style={{ fontSize: "15px" }}>
              Настройки
            </strong>
            <button
              type="button"
              aria-label="Закрыть настройки"
              style={{ ...buttonStyle, minHeight: "34px" }}
              {...controlClick(() => setShowSettings(false))}
            >
              ×
            </button>
          </div>

          <div style={settingRowStyle}>
            <span>Звук</span>
            <button
              type="button"
              style={buttonStyle}
              {...controlClick(toggleMute)}
            >
              {muted ? "Выключен" : "Включён"}
            </button>
          </div>

          <div style={settingRowStyle}>
            <span>Вибрация</span>
            <button
              type="button"
              style={buttonStyle}
              {...controlClick(toggleVibration)}
            >
              {vibrationEnabled ? "Включена" : "Выключена"}
            </button>
          </div>

          <div style={settingRowStyle}>
            <span>Графика</span>
            <button
              type="button"
              style={buttonStyle}
              {...controlClick(toggleGraphics)}
            >
              {graphicsMode === "standard"
                ? "Стандартная"
                : "Экономичная"}
            </button>
          </div>

          <div
            style={{
              paddingTop: "8px",
              borderTop: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
              fontSize: "11px",
              lineHeight: 1.5,
            }}
          >
            Экономичный режим ограничивает частоту обновления
            до 30 FPS для снижения нагрузки на устройство.
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {isPaused && !loadingError && (
        <div
          data-game-control
          role="status"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 15,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            background: "rgba(10, 9, 28, 0.72)",
            color: COLORS.text,
            backdropFilter: "blur(5px)",
            pointerEvents: "auto",
          }}
        >
          <strong style={{ fontSize: "24px" }}>
            Пауза
          </strong>
          <span style={{ color: COLORS.muted, fontSize: "13px" }}>
            Игровой процесс приостановлен
          </span>
          <button
            type="button"
            style={{
              ...buttonStyle,
              background: "rgba(185,154,255,0.2)",
              borderColor: COLORS.accent,
            }}
            {...controlClick(() => resumeGame("user"))}
          >
            ▶ Продолжить игру
          </button>
        </div>
      )}

      {/* WebGL recovery overlay */}
      {contextLost && (
        <div
          role="status"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 45,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "24px",
            background: COLORS.background,
            color: COLORS.text,
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "30px" }}>⟳</span>
          <strong>Восстанавливаем графику</strong>
          <span style={{ color: COLORS.muted, fontSize: "13px" }}>
            Не закрывайте игру. Это может занять несколько секунд.
          </span>
        </div>
      )}

      {/* Orientation hint */}
      {isFullscreen && isPortrait && (
        <div
          data-game-control
          style={{
            position: "absolute",
            bottom: "max(12px, env(safe-area-inset-bottom))",
            left: "50%",
            zIndex: 12,
            transform: "translateX(-50%)",
            padding: "9px 13px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "10px",
            background: "rgba(16,16,38,0.88)",
            color: COLORS.muted,
            fontSize: "11px",
            textAlign: "center",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          Для удобства игры поверните устройство горизонтально
        </div>
      )}
    </div>
  );
}

const settingRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  fontSize: "13px",
};
