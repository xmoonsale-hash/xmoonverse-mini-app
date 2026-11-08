import Phaser from "phaser";

export default class MeadowScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed = 180;

  constructor() {
    super("MeadowScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#142b35");

    // Ground
    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x294b43
    );

    // Grass details
    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);

      this.add.circle(
        x,
        y,
        Phaser.Math.Between(1, 3),
        Phaser.Utils.Array.GetRandom([0x426c50, 0x527b55, 0x345d49])
      );
    }

    // Decorative trees
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(35, width - 35);
      const y = Phaser.Math.Between(35, height - 35);

      this.add.circle(x, y + 8, 10, 0x183b32);
      this.add.circle(x, y, 13, 0x39744b);
      this.add.circle(x - 4, y - 4, 5, 0x55935c);
    }

    // Location title
    this.add.text(18, 18, "GREENHAVEN", {
      fontFamily: "Arial",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#e3f4d9",
      stroke: "#17342b",
      strokeThickness: 4
    }).setScrollFactor(0);

    this.add.text(18, 40, "Стартовая долина", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#c5d9c4"
    }).setScrollFactor(0);

    // Player
    const shadow = this.add.ellipse(0, 12, 25, 9, 0x10251e, 0.45);
    const body = this.add.rectangle(0, 0, 18, 24, 0xb89aff);
    const head = this.add.circle(0, -17, 9, 0xf0d2bd);
    const hair = this.add.arc(0, -19, 9, 190, 350, false, 0x49356b);
    hair.setStrokeStyle(5, 0x49356b);

    this.player = this.add.container(width / 2, height / 2, [
      shadow,
      body,
      head,
      hair
    ]);

    this.player.setDepth(100);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  update(_time: number, delta: number) {
    if (!this.cursors || !this.player) {
      return;
    }

    const direction = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.left.isDown) direction.x -= 1;
    if (this.cursors.right.isDown) direction.x += 1;
    if (this.cursors.up.isDown) direction.y -= 1;
    if (this.cursors.down.isDown) direction.y += 1;

    if (direction.length() > 0) {
      direction.normalize();

      this.player.x += direction.x * this.speed * (delta / 1000);
      this.player.y += direction.y * this.speed * (delta / 1000);
    }
  }
}