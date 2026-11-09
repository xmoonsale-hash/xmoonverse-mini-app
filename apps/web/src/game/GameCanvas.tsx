
import { useCallback, useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import MeadowScene from "./scenes/MeadowScene";

type GraphicsMode = "performance" | "standard";

const COLORS = {
  background: "#080319",
  panel: "rgba(18, 5, 43, 0.97)",
  border: "rgba(190, 104, 255, 0.85)",
  accent: "#c58aff",
  text: "#fff7ff",
  muted: "#c5addf",
  danger: "#ff7777",
  glow: "0 0 8px rgba(190,104,255,.9), 0 0 22px rgba(139,43,255,.55)",
};

const buttonStyle: React.CSSProperties = {
  display: "grid",
  width: "42px",
  height: "42px",
  minWidth: "42px",
  minHeight: "42px",
  padding: 0,
  placeItems: "center",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "13px",
  background: "linear-gradient(145deg, #351064, #13052f)",
  color: COLORS.text,
  fontSize: "19px",
  fontWeight: 700,
  cursor: "pointer",
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  boxShadow: COLORS.glow,
};

const panelStyle: React.CSSProperties = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: "17px",
  background:
    "linear-gradient(145deg, rgba(37,12,77,.98), rgba(11,3,31,.98))",
  color: COLORS.text,
  boxShadow: COLORS.glow,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
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
        // Используем визуальный fullscreen для мобильных браузеров.
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

    if (userPausedRef.current || lifecyclePausedRef.current) return;

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

    if (gameRef.current) {
      gameRef.current.sound.mute = nextMuted;
    }
  }, [muted]);

  const toggleVibration = useCallback(() => {
    setVibrationEnabled((value) => !value);
  }, []);

  const toggleGraphics = useCallback(() => {
    const nextMode: GraphicsMode =
      graphicsMode === "standard" ? "performance" : "standard";

    setGraphicsMode(nextMode);

    if (gameRef.current) {
      gameRef.current.loop.targetFps =
        nextMode === "performance" ? 30 : 60;
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
      setIsFullscreen(
        document.fullscreenElement === container ||
          fallbackFullscreenRef.current
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (fallbackFullscreenRef.current) {
          fallbackFullscreenRef.current = false;
          setIsFullscreen(false);
        }
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

    // Phaser is intentionally initialized once per component mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const controlClick = (callback: () => void) => ({
    "data-game-control": true,
    onPointerDown: (event: React.PointerEvent) => {
      event.stopPropagation();
    },
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      callback();
    },
  });

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 40,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    padding: "24px",
    background: "rgba(8, 3, 25, 0.94)",
    color: COLORS.text,
    textAlign: "center",
    pointerEvents: "auto",
  };

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
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          style={{
            ...overlayStyle,
            zIndex: 30,
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "3px solid rgba(190,104,255,.25)",
              borderTopColor: COLORS.accent,
              borderRadius: "50%",
              animation: "xmoon-spin .9s linear infinite",
              boxShadow: COLORS.glow,
            }}
          />
          <strong
            style={{
              fontSize: "21px",
              letterSpacing: "1px",
              textShadow: "0 0 15px #a84dff",
            }}
          >
            xMoonVerse
          </strong>
          <span style={{ color: COLORS.muted, fontSize: "13px" }}>
            Открываем врата игрового мира...
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

      {loadingError && !contextLost && (
        <div
          data-game-control
          role="alert"
          style={overlayStyle}
        >
          <span
            style={{
              fontSize: "36px",
              color: COLORS.accent,
              textShadow: "0 0 18px #a84dff",
            }}
          >
            ✧
          </span>
          <strong style={{ fontSize: "19px" }}>
            Игровой мир недоступен
          </strong>
          <span style={{ color: COLORS.muted, fontSize: "13px" }}>
            {loadingError}
          </span>
          <button
            type="button"
            style={{
              ...buttonStyle,
              width: "auto",
              padding: "0 20px",
              fontSize: "13px",
            }}
            {...controlClick(() => window.location.reload())}
          >
            Перезагрузить
          </button>
        </div>
      )}

      {/* Compact game controls */}
      <div
        data-game-control
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 20,
          display: "flex",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        <button
          type="button"
          aria-label={isPaused ? "Продолжить игру" : "Пауза"}
          style={{
            ...buttonStyle,
            pointerEvents: "auto",
          }}
          {...controlClick(() => {
            vibrate();
            togglePause();
          })}
        >
          {isPaused ? "▶" : "Ⅱ"}
        </button>

        <button
          type="button"
          aria-label="Настройки"
          style={{
            ...buttonStyle,
            pointerEvents: "auto",
          }}
          {...controlClick(() => {
            vibrate();
            setShowSettings((value) => !value);
          })}
        >
          ⚙
        </button>
      </div>

      {/* Fullscreen control */}
      <button
        type="button"
        aria-label={
          isFullscreen ? "Выйти из полноэкранного режима" : "На весь экран"
        }
        style={{
          ...buttonStyle,
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 20,
        }}
        {...controlClick(() => {
          vibrate();
          void toggleFullscreen();
        })}
      >
        {isFullscreen ? "×" : "⛶"}
      </button>

      {/* Settings */}
      {showSettings && (
        <div
          data-game-control
          style={{
            position: "absolute",
            top: "64px",
            left: "12px",
            zIndex: 25,
            width: "min(290px, calc(100% - 24px))",
            display: "flex",
            flexDirection: "column",
            gap: "13px",
            padding: "16px",
            ...panelStyle,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: "10px",
              borderBottom: "1px solid rgba(190,104,255,.25)",
            }}
          >
            <strong style={{ fontSize: "15px" }}>
              Настройки мира
            </strong>
            <button
              type="button"
              aria-label="Закрыть настройки"
              style={{
                ...buttonStyle,
                width: "34px",
                minWidth: "34px",
                height: "34px",
                minHeight: "34px",
              }}
              {...controlClick(() => setShowSettings(false))}
            >
              ×
            </button>
          </div>

          <div style={settingRowStyle}>
            <span>Звук</span>
            <button
              type="button"
              style={settingButtonStyle}
              {...controlClick(toggleMute)}
            >
              {muted ? "Выключен" : "Включён"}
            </button>
          </div>

          <div style={settingRowStyle}>
            <span>Вибрация</span>
            <button
              type="button"
              style={settingButtonStyle}
              {...controlClick(toggleVibration)}
            >
              {vibrationEnabled ? "Включена" : "Выключена"}
            </button>
          </div>

          <div style={settingRowStyle}>
            <span>Графика</span>
            <button
              type="button"
              style={settingButtonStyle}
              {...controlClick(toggleGraphics)}
            >
              {graphicsMode === "standard"
                ? "Стандартная"
                : "Экономичная"}
            </button>
          </div>

          <p
            style={{
              margin: "2px 0 0",
              paddingTop: "10px",
              borderTop: "1px solid rgba(190,104,255,.2)",
              color: COLORS.muted,
              fontSize: "11px",
              lineHeight: 1.55,
            }}
          >
            Экономичный режим ограничивает частоту обновления до 30 FPS
            для снижения нагрузки на устройство.
          </p>
        </div>
      )}

      {/* Pause overlay */}
      {isPaused && !loadingError && (
        <div
          data-game-control
          role="status"
          style={{
            ...overlayStyle,
            zIndex: 35,
            background: "rgba(8, 3, 25, .78)",
            backdropFilter: "blur(7px)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              display: "grid",
              placeItems: "center",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "23px",
              background: "rgba(92,31,158,.25)",
              color: COLORS.accent,
              fontSize: "31px",
              boxShadow: COLORS.glow,
            }}
          >
            Ⅱ
          </div>

          <strong
            style={{
              fontSize: "25px",
              textShadow: "0 0 15px #a84dff",
            }}
          >
            Пауза
          </strong>

          <span style={{ color: COLORS.muted, fontSize: "13px" }}>
            Игровой процесс приостановлен
          </span>

          <button
            type="button"
            style={{
              ...buttonStyle,
              display: "flex",
              width: "auto",
              minWidth: "170px",
              padding: "0 20px",
              gap: "9px",
              fontSize: "13px",
            }}
            {...controlClick(() => resumeGame("user"))}
          >
            ▶ Продолжить игру
          </button>
        </div>
      )}

      {/* WebGL recovery */}
      {contextLost && (
        <div
          role="status"
          style={{
            ...overlayStyle,
            zIndex: 45,
          }}
        >
          <span
            style={{
              fontSize: "36px",
              color: COLORS.accent,
              textShadow: "0 0 18px #a84dff",
            }}
          >
            ⟳
          </span>
          <strong style={{ fontSize: "19px" }}>
            Восстанавливаем графику
          </strong>
          <span style={{ color: COLORS.muted, fontSize: "13px" }}>
            Не закрывайте игру. Это может занять несколько секунд.
          </span>
        </div>
      )}

      {isFullscreen && isPortrait && (
        <div
          data-game-control
          style={{
            position: "absolute",
            bottom: "max(14px, env(safe-area-inset-bottom))",
            left: "50%",
            zIndex: 12,
            transform: "translateX(-50%)",
            padding: "9px 14px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "11px",
            background: "rgba(18,5,43,.94)",
            color: COLORS.muted,
            fontSize: "11px",
            textAlign: "center",
            whiteSpace: "nowrap",
            boxShadow: COLORS.glow,
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
  color: COLORS.text,
  fontSize: "13px",
};

const settingButtonStyle: React.CSSProperties = {
  minHeight: "36px",
  padding: "0 11px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "10px",
  background: "rgba(91,31,155,.35)",
  color: COLORS.text,
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
  touchAction: "manipulation",
};
