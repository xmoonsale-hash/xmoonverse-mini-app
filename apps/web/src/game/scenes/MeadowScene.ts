import Phaser from "phaser";

export default class MeadowScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private targetMarker!: Phaser.GameObjects.Graphics;
  private targetMarkerTween: Phaser.Tweens.Tween | null = null;

  private minimap!: Phaser.GameObjects.Container;
  private minimapPlayerMarker!: Phaser.GameObjects.Arc;
  private readonly treeLocations: Array<{ x: number; y: number }> = [];

  private movementTarget: Phaser.Math.Vector2 | null = null;

  private readonly worldWidth = 2400;
  private readonly worldHeight = 1600;
  private readonly playerSpeed = 190;

  constructor() {
    super("MeadowScene");
  }

  create() {
    this.movementTarget = null;
    this.treeLocations.length = 0;

    this.cameras.main.setBackgroundColor("#142b35");

    this.add.rectangle(
      this.worldWidth / 2,
      this.worldHeight / 2,
      this.worldWidth,
      this.worldHeight,
      0x294b43
    );

    // Grass details
    for (let i = 0; i < 650; i++) {
      const x = Phaser.Math.Between(0, this.worldWidth);
      const y = Phaser.Math.Between(0, this.worldHeight);

      this.add.circle(
        x,
        y,
        Phaser.Math.Between(1, 3),
        Phaser.Utils.Array.GetRandom([
          0x426c50,
          0x527b55,
          0x345d49,
          0x63865a,
        ])
      ).setDepth(y - 1);
    }

    // Trees
    for (let i = 0; i < 105; i++) {
      const x = Phaser.Math.Between(50, this.worldWidth - 50);
      const y = Phaser.Math.Between(70, this.worldHeight - 50);

      const distanceFromSpawn = Phaser.Math.Distance.Between(
        x,
        y,
        this.worldWidth / 2,
        this.worldHeight / 2
      );

      if (distanceFromSpawn < 150) {
        continue;
      }

      this.treeLocations.push({ x, y });

      this.add.circle(x, y + 10, 12, 0x183b32).setDepth(y);
      this.add.circle(x, y, 16, 0x39744b).setDepth(y + 1);
      this.add.circle(x - 5, y - 5, 7, 0x55935c).setDepth(y + 2);
    }

    // Location label
    this.add.text(18, 18, "GREENHAVEN", {
      fontFamily: "Arial",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#e3f4d9",
      stroke: "#17342b",
      strokeThickness: 4,
    }).setScrollFactor(0).setDepth(1000);

    this.add.text(18, 40, "Стартовая долина", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#c5d9c4",
    }).setScrollFactor(0).setDepth(1000);

    this.add.text(
      18,
      62,
      "Нажмите на землю, чтобы переместиться",
      {
        fontFamily: "Arial",
        fontSize: "10px",
        color: "#d5e7d0",
        backgroundColor: "#17342b",
        padding: {
          x: 7,
          y: 5,
        },
      }
    ).setScrollFactor(0).setDepth(1000);

    // Player appearance
    const shadow = this.add.ellipse(
      0,
      12,
      25,
      9,
      0x10251e,
      0.45
    );

    const body = this.add.rectangle(
      0,
      0,
      18,
      24,
      0xb89aff
    );

    const head = this.add.circle(
      0,
      -17,
      9,
      0xf0d2bd
    );

    const hair = this.add.arc(
      0,
      -19,
      9,
      190,
      350,
      false,
      0x49356b
    );

    hair.setStrokeStyle(5, 0x49356b);

    this.player = this.add.container(
      this.worldWidth / 2,
      this.worldHeight / 2,
      [shadow, body, head, hair]
    );

    this.player.setDepth(this.player.y);

    // Destination marker
    this.targetMarker = this.add.graphics();
    this.targetMarker.lineStyle(2, 0xd8c4ff, 0.95);
    this.targetMarker.strokeCircle(0, 0, 15);
    this.targetMarker.lineStyle(1, 0xb89aff, 0.75);
    this.targetMarker.strokeCircle(0, 0, 8);
    this.targetMarker.fillStyle(0xd8c4ff, 0.9);
    this.targetMarker.fillCircle(0, 0, 2.5);
    this.targetMarker.setVisible(false);

    // Keyboard controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // Mouse, mobile and minimap navigation
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      this.handlePointerDown,
      this
    );

    // Camera
    this.cameras.main.setBounds(
      0,
      0,
      this.worldWidth,
      this.worldHeight
    );

    this.cameras.main.startFollow(
      this.player,
      true,
      0.08,
      0.08
    );

    this.cameras.main.setDeadzone(80, 60);

    // Minimap
    this.createMinimap();
    this.positionMinimap();

    this.scale.on(
      Phaser.Scale.Events.RESIZE,
      this.positionMinimap,
      this
    );

    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.handleShutdown,
      this
    );
  }

  private createMinimap() {
    const panel = this.add.graphics();

    panel.fillStyle(0x101d19, 0.92);
    panel.fillRect(0, 0, 112, 78);

    panel.lineStyle(1, 0xb89aff, 0.75);
    panel.strokeRect(0, 0, 112, 78);

    const map = this.add.graphics();

    map.fillStyle(0x294b43, 1);
    map.fillRect(8, 19, 96, 50);

    map.lineStyle(1, 0x8ba98a, 0.45);
    map.strokeRect(8, 19, 96, 50);

    // Tree markers
    map.fillStyle(0x79a76e, 0.9);

    for (const tree of this.treeLocations) {
      const mapX = 8 + (tree.x / this.worldWidth) * 96;
      const mapY = 19 + (tree.y / this.worldHeight) * 50;

      map.fillCircle(mapX, mapY, 1.2);
    }

    // Spawn marker
    map.fillStyle(0xd8c4ff, 0.9);
    map.fillCircle(56, 44, 3);

    const title = this.add.text(8, 5, "КАРТА", {
      fontFamily: "Arial",
      fontSize: "8px",
      fontStyle: "bold",
      color: "#e3d5ff",
      letterSpacing: 1,
    });

    this.minimapPlayerMarker = this.add.circle(
      56,
      44,
      3.5,
      0xffffff
    );

    this.minimapPlayerMarker.setStrokeStyle(1, 0x7651c7);

    this.minimap = this.add.container(
      0,
      0,
      [
        panel,
        map,
        title,
        this.minimapPlayerMarker,
      ]
    );

    this.minimap.setScrollFactor(0);
    this.minimap.setDepth(1100);
  }

  private positionMinimap() {
    if (!this.minimap) {
      return;
    }

    this.minimap.setPosition(
      Math.max(8, this.scale.width - 120),
      Math.max(8, this.scale.height - 86)
    );
  }

  private updateMinimap() {
    if (!this.player || !this.minimapPlayerMarker) {
      return;
    }

    const mapX = 8 + (this.player.x / this.worldWidth) * 96;
    const mapY = 19 + (this.player.y / this.worldHeight) * 50;

    this.minimapPlayerMarker.setPosition(mapX, mapY);
  }

  private handleShutdown() {
    this.targetMarkerTween?.stop();
    this.targetMarkerTween = null;

    this.scale.off(
      Phaser.Scale.Events.RESIZE,
      this.positionMinimap,
      this
    );

    this.input.off(
      Phaser.Input.Events.POINTER_DOWN,
      this.handlePointerDown,
      this
    );
  }

  private setMovementDestination(x: number, y: number) {
    if (!this.player || !this.targetMarker) {
      return;
    }

    const targetX = Phaser.Math.Clamp(
      x,
      20,
      this.worldWidth - 20
    );

    const targetY = Phaser.Math.Clamp(
      y,
      20,
      this.worldHeight - 20
    );

    this.movementTarget = new Phaser.Math.Vector2(
      targetX,
      targetY
    );

    this.targetMarkerTween?.stop();

    this.targetMarker
      .setPosition(targetX, targetY)
      .setDepth(targetY - 1)
      .setScale(1)
      .setAlpha(1)
      .setVisible(true);

    this.targetMarkerTween = this.tweens.add({
      targets: this.targetMarker,
      scale: 1.18,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private handleMinimapNavigation(
    pointer: Phaser.Input.Pointer
  ): boolean {
    if (!this.minimap) {
      return false;
    }

    const localX = pointer.x - this.minimap.x;
    const localY = pointer.y - this.minimap.y;

    const mapLeft = 8;
    const mapTop = 19;
    const mapWidth = 96;
    const mapHeight = 50;

    const insideMap =
      localX >= mapLeft &&
      localX <= mapLeft + mapWidth &&
      localY >= mapTop &&
      localY <= mapTop + mapHeight;

    if (!insideMap) {
      return false;
    }

    const normalizedX = (localX - mapLeft) / mapWidth;
    const normalizedY = (localY - mapTop) / mapHeight;

    const worldX = normalizedX * this.worldWidth;
    const worldY = normalizedY * this.worldHeight;

    this.setMovementDestination(worldX, worldY);

    return true;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.player || !this.targetMarker) {
      return;
    }

    // Minimap navigation takes priority over world navigation
    if (this.handleMinimapNavigation(pointer)) {
      return;
    }

    this.setMovementDestination(
      pointer.worldX,
      pointer.worldY
    );
  }

  private hideTargetMarker() {
    this.targetMarkerTween?.stop();
    this.targetMarkerTween = null;

    if (this.targetMarker) {
      this.targetMarker.setVisible(false);
    }
  }

  update(_time: number, delta: number) {
    if (!this.player) {
      return;
    }

    const direction = new Phaser.Math.Vector2(0, 0);

    // Keyboard movement
    if (this.cursors) {
      if (this.cursors.left.isDown) direction.x -= 1;
      if (this.cursors.right.isDown) direction.x += 1;
      if (this.cursors.up.isDown) direction.y -= 1;
      if (this.cursors.down.isDown) direction.y += 1;
    }

    // Tap-to-move movement
    if (
      direction.lengthSq() === 0 &&
      this.movementTarget
    ) {
      direction.set(
        this.movementTarget.x - this.player.x,
        this.movementTarget.y - this.player.y
      );

      if (direction.length() < 12) {
        this.player.setPosition(
          this.movementTarget.x,
          this.movementTarget.y
        );

        this.movementTarget = null;
        direction.set(0, 0);
        this.hideTargetMarker();
      }
    } else if (direction.lengthSq() > 0) {
      this.movementTarget = null;
      this.hideTargetMarker();
    }

    if (direction.lengthSq() > 0) {
      direction.normalize();

      const movementDistance =
        this.playerSpeed * Math.min(delta, 50) / 1000;

      this.player.x = Phaser.Math.Clamp(
        this.player.x + direction.x * movementDistance,
        20,
        this.worldWidth - 20
      );

      this.player.y = Phaser.Math.Clamp(
        this.player.y + direction.y * movementDistance,
        20,
        this.worldHeight - 20
      );

      this.player.setDepth(this.player.y);
    }

    this.updateMinimap();
  }
}