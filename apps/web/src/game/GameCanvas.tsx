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

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      backgroundColor: "#101026",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 900,
        height: 520
      },
      scene: [MeadowScene],
      render: {
        antialias: false,
        pixelArt: true
      }
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="game-canvas"
      style={{
        width: "100%",
        height: "min(65vh, 560px)",
        minHeight: "360px",
        overflow: "hidden",
        border: "1px solid rgba(196, 167, 255, 0.2)",
        borderRadius: "20px",
        background: "#101026"
      }}
    />
  );
}