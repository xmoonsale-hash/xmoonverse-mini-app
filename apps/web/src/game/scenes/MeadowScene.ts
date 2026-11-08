import Phaser from "phaser";

export default class MeadowScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private movementTarget: Phaser.Math.Vector2 | null = null;

  private readonly worldWidth = 2400;
  private readonly worldHeight = 1600;
  private readonly playerSpeed = 190;

  constructor() {
    super("MeadowScene");
  }

  create() {
    this.movementTarget = null;

    this.cameras.main.setBackgroundColor("#142b35");

    // World ground
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

      // Keep the starting area clear
      const distanceFromSpawn = Phaser.Math.Distance.Between(
        x,
        y,
        this.worldWidth / 2,
        this.worldHeight / 2
      );

      if (distanceFromSpawn < 150) {
        continue;
      }

      this.add.circle(x, y + 10, 12, 0x183b32)
        .setDepth(y);

      this.add.circle(x, y, 16, 0x39744b)
        .setDepth(y + 1);

      this.add.circle(x - 5, y - 5, 7, 0x55935c)
        .setDepth(y + 2);
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

    // Movement hint
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

    // Keyboard controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // Mobile and mouse movement
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      this.handlePointerDown,
      this
    );

    // Camera follows the player
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
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.player) {
      return;
    }

    const targetX = Phaser.Math.Clamp(
      pointer.worldX,
      20,
      this.worldWidth - 20
    );

    const targetY = Phaser.Math.Clamp(
      pointer.worldY,
      20,
      this.worldHeight - 20
    );

    this.movementTarget = new Phaser.Math.Vector2(
      targetX,
      targetY
    );
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
      }
    } else if (direction.lengthSq() > 0) {
      // Keyboard input cancels the current destination
      this.movementTarget = null;
    }

    if (direction.lengthSq() === 0) {
      return;
    }

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
}