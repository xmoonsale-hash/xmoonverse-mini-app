import { useEffect, useRef } from "react";
import Phaser from "phaser";
import MeadowScene from "./scenes/MeadowScene";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const preventDefault = (event: Event) => {
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
        "transparent",
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
      handleVisibilityChange,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      blockedEvents.forEach((eventName) => {
        container.removeEventListener(eventName, preventDefault);
      });

      game.destroy(true);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="game-canvas"
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        height: "min(65vh, 560px)",
        minHeight: "360px",
        overflow: "hidden",
        border: "1px solid rgba(196, 167, 255, 0.2)",
        borderRadius: "20px",
        background: "#101026",
        touchAction: "none",
        overscrollBehavior: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    />
  );
}