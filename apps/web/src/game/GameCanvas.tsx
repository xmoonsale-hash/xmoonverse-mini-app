
import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import MeadowScene from "./scenes/MeadowScene";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackFullscreenRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenToggle = async () => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

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
        // Use the expanded layout when native fullscreen is unavailable.
      }
    }

    fallbackFullscreenRef.current = true;
    setIsFullscreen(true);
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const preventDefault = (event: Event) => {
      const target = event.target;

      // Keep custom game controls interactive on touch devices.
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
      container.addEventListener(eventName, preventDefault, {
        passive: false,
      });
    });

    const handleFullscreenChange = () => {
      const nativeFullscreen =
        document.fullscreenElement === container;

      setIsFullscreen(
        nativeFullscreen || fallbackFullscreenRef.current
      );

      if (!nativeFullscreen && !fallbackFullscreenRef.current) {
        setIsFullscreen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        fallbackFullscreenRef.current
      ) {
        fallbackFullscreenRef.current = false;
        setIsFullscreen(false);
      }
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    document.addEventListener("keydown", handleKeyDown);

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      backgroundColor: "#101026",

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
      },
    });

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
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        game.loop.sleep();
      } else {
        game.loop.wake();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      blockedEvents.forEach((eventName) => {
        container.removeEventListener(eventName, preventDefault);
      });

      fallbackFullscreenRef.current = false;

      game.destroy(true);
    };
  }, []);

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
        border: isFullscreen
          ? "0"
          : "1px solid rgba(196, 167, 255, 0.2)",
        borderRadius: isFullscreen ? "0" : "20px",
        background: "#101026",
        touchAction: "none",
        overscrollBehavior: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <button
        type="button"
        data-game-control
        aria-label={
          isFullscreen
            ? "Выйти из полноэкранного режима"
            : "Включить полноэкранный режим"
        }
        title={
          isFullscreen
            ? "Выйти из полноэкранного режима"
            : "На весь экран"
        }
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          void handleFullscreenToggle();
        }}
        style={{
          position: "absolute",
          top: "max(12px, env(safe-area-inset-top))",
          right: "max(12px, env(safe-area-inset-right))",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          minHeight: "42px",
          padding: "0 14px",
          border: "1px solid rgba(196, 167, 255, 0.35)",
          borderRadius: "12px",
          background: "rgba(16, 16, 38, 0.88)",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          backdropFilter: "blur(12px)",
        }}
      >
        <span style={{ fontSize: "18px" }}>
          {isFullscreen ? "×" : "⛶"}
        </span>
        <span>
          {isFullscreen ? "Выйти" : "На весь экран"}
        </span>
      </button>
    </div>
  );
}
