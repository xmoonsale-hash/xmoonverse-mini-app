import Phaser from "phaser";

type InteractableType = "npc" | "resource" | "camp";

interface InteractableObject {
  id: string;
  type: InteractableType;
  x: number;
  y: number;
  name: string;
  sprite: Phaser.GameObjects.Container;
  collected?: boolean;
  resourceType?: string;
}

export default class MeadowScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;

  private targetMarker!: Phaser.GameObjects.Graphics;
  private targetMarkerTween: Phaser.Tweens.Tween | null = null;

  private minimap!: Phaser.GameObjects.Container;
  private minimapPlayerMarker!: Phaser.GameObjects.Arc;

  private interactionPanel!: Phaser.GameObjects.Container;
  private interactionLabel!: Phaser.GameObjects.Text;
  private dialoguePanel!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private resourceCounter!: Phaser.GameObjects.Text;

  private mobileInteractButton!: Phaser.GameObjects.Container;

  private readonly treeLocations: Array<{ x: number; y: number }> = [];
  private readonly interactables: InteractableObject[] = [];
  private readonly ambientTweens: Phaser.Tweens.Tween[] = [];

  private movementTarget: Phaser.Math.Vector2 | null = null;
  private nearbyInteractable: InteractableObject | null = null;

  private dialogueOpen = false;
  private resourceCount = 0;

  private readonly worldWidth = 2400;
  private readonly worldHeight = 1600;
  private readonly playerSpeed = 190;
  private readonly interactionDistance = 85;

  private readonly campPosition = {
    x: 1320,
    y: 720,
  };

  private readonly spawnPosition = {
    x: 1200,
    y: 800,
  };

  constructor() {
    super("MeadowScene");
  }

  create() {
    this.movementTarget = null;
    this.nearbyInteractable = null;
    this.dialogueOpen = false;
    this.resourceCount = 0;

    this.treeLocations.length = 0;
    this.interactables.length = 0;
    this.ambientTweens.length = 0;

    this.cameras.main.setBackgroundColor("#142b35");

    this.createGround();
    this.createPaths();
    this.createNature();
    this.createTrees();
    this.createTravelerCamp();
    this.createNPC();
    this.createResources();
    this.createPlayer();
    this.createDestinationMarker();
    this.createWorldInterface();
    this.createMinimap();

    this.positionMinimap();
    this.positionMobileButton();

    this.setupControls();
    this.setupCamera();
    this.setupLifecycle();
  }

  // --------------------------------------------------
  // WORLD
  // --------------------------------------------------

  private createGround() {
    this.add.rectangle(
      this.worldWidth / 2,
      this.worldHeight / 2,
      this.worldWidth,
      this.worldHeight,
      0x294b43
    );

    const groundDetails = this.add.graphics();

    for (let i = 0; i < 650; i++) {
      const x = Phaser.Math.Between(0, this.worldWidth);
      const y = Phaser.Math.Between(0, this.worldHeight);

      groundDetails.fillStyle(
        Phaser.Utils.Array.GetRandom([
          0x426c50,
          0x527b55,
          0x345d49,
          0x63865a,
        ]),
        Phaser.Math.FloatBetween(0.35, 0.8)
      );

      groundDetails.fillCircle(
        x,
        y,
        Phaser.Math.Between(1, 3)
      );
    }

    groundDetails.setDepth(1);

    // Distant meadow patches
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(100, this.worldWidth - 100);
      const y = Phaser.Math.Between(100, this.worldHeight - 100);

      this.add.ellipse(
        x,
        y,
        Phaser.Math.Between(90, 180),
        Phaser.Math.Between(55, 110),
        0x63865a,
        0.08
      ).setDepth(2);
    }
  }

  private createPaths() {
    const paths = this.add.graphics();

    paths.fillStyle(0x8b7854, 0.65);

    // Main path from spawn to camp
    paths.fillPoints(
      [
        new Phaser.Math.Vector2(1120, 860),
        new Phaser.Math.Vector2(1170, 825),
        new Phaser.Math.Vector2(1250, 790),
        new Phaser.Math.Vector2(1310, 750),
        new Phaser.Math.Vector2(1370, 700),
        new Phaser.Math.Vector2(1410, 670),
        new Phaser.Math.Vector2(1390, 645),
        new Phaser.Math.Vector2(1340, 680),
        new Phaser.Math.Vector2(1280, 720),
        new Phaser.Math.Vector2(1210, 755),
        new Phaser.Math.Vector2(1150, 800),
      ],
      true
    );

    paths.setDepth(3);

    // Smaller path details
    const pathDetails = this.add.graphics();

    pathDetails.lineStyle(2, 0xc0a77b, 0.2);

    pathDetails.beginPath();
    pathDetails.moveTo(1130, 850);
    pathDetails.lineTo(1210, 790);
    pathDetails.lineTo(1300, 735);
    pathDetails.lineTo(1390, 665);
    pathDetails.strokePath();

    pathDetails.setDepth(4);
  }

  private createNature() {
    // Flowers
    for (let i = 0; i < 95; i++) {
      const x = Phaser.Math.Between(30, this.worldWidth - 30);
      const y = Phaser.Math.Between(30, this.worldHeight - 30);

      if (
        Phaser.Math.Distance.Between(
          x,
          y,
          this.campPosition.x,
          this.campPosition.y
        ) < 110
      ) {
        continue;
      }

      const flower = this.add.container(x, y);

      const colors = [
        0xe6c7ff,
        0xffd6a5,
        0xf6a8c8,
        0xf2e6a1,
      ];

      const color = Phaser.Utils.Array.GetRandom(colors);

      flower.add([
        this.add.circle(0, 0, 2, color),
        this.add.circle(3, -2, 2, color),
        this.add.circle(-3, -2, 2, color),
        this.add.circle(0, -4, 2, color),
        this.add.circle(0, -1, 1, 0xffe8a8),
      ]);

      flower.setDepth(y - 1);

      const sway = this.tweens.add({
        targets: flower,
        angle: Phaser.Math.Between(-4, 4),
        duration: Phaser.Math.Between(1400, 2400),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.ambientTweens.push(sway);
    }

    // Fireflies
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(100, this.worldWidth - 100);
      const y = Phaser.Math.Between(100, this.worldHeight - 100);

      const firefly = this.add.circle(
        x,
        y,
        2,
        0xd9f7a1,
        0.25
      ).setDepth(y + 20);

      const tween = this.tweens.add({
        targets: firefly,
        alpha: 0.95,
        y: y - Phaser.Math.Between(10, 30),
        duration: Phaser.Math.Between(1000, 2200),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.ambientTweens.push(tween);
    }
  }

  private createTrees() {
    for (let i = 0; i < 105; i++) {
      const x = Phaser.Math.Between(50, this.worldWidth - 50);
      const y = Phaser.Math.Between(70, this.worldHeight - 50);

      const distanceFromSpawn = Phaser.Math.Distance.Between(
        x,
        y,
        this.spawnPosition.x,
        this.spawnPosition.y
      );

      const distanceFromCamp = Phaser.Math.Distance.Between(
        x,
        y,
        this.campPosition.x,
        this.campPosition.y
      );

      if (distanceFromSpawn < 150 || distanceFromCamp < 125) {
        continue;
      }

      this.treeLocations.push({ x, y });

      this.add.circle(
        x,
        y + 10,
        12,
        0x183b32
      ).setDepth(y);

      this.add.circle(
        x,
        y,
        16,
        0x39744b
      ).setDepth(y + 1);

      this.add.circle(
        x - 5,
        y - 5,
        7,
        0x55935c
      ).setDepth(y + 2);
    }
  }

  // --------------------------------------------------
  // CAMP
  // --------------------------------------------------

  private createTravelerCamp() {
    const { x, y } = this.campPosition;

    this.add.ellipse(
      x,
      y + 5,
      150,
      100,
      0x203d30,
      0.65
    ).setDepth(y - 5);

    // Tent
    const tent = this.add.graphics();

    tent.fillStyle(0x8d6d9f, 1);
    tent.fillTriangle(
      x - 55,
      y - 20,
      x - 10,
      y - 70,
      x + 35,
      y - 20
    );

    tent.fillStyle(0x604b78, 1);
    tent.fillTriangle(
      x - 10,
      y - 20,
      x - 10,
      y - 70,
      x + 35,
      y - 20
    );

    tent.fillStyle(0x302b40, 1);
    tent.fillTriangle(
      x - 12,
      y - 20,
      x - 10,
      y - 48,
      x + 5,
      y - 20
    );

    tent.setDepth(y + 2);

    // Crates
    this.add.rectangle(
      x + 57,
      y - 10,
      22,
      20,
      0x8a633f
    ).setDepth(y + 3);

    this.add.rectangle(
      x + 57,
      y - 10,
      22,
      3,
      0xb38a5d
    ).setDepth(y + 4);

    // Barrel
    this.add.ellipse(
      x - 66,
      y + 5,
      19,
      23,
      0x795034
    ).setDepth(y + 4);

    this.add.rectangle(
      x - 66,
      y + 5,
      20,
      3,
      0xb38a5d
    ).setDepth(y + 5);

    // Campfire stones
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;

      this.add.circle(
        x + Math.cos(angle) * 19,
        y + Math.sin(angle) * 11,
        5,
        0x9a9b83
      ).setDepth(y + 5);
    }

    // Logs
    this.add.rectangle(
      x - 8,
      y + 13,
      34,
      6,
      0x795034
    ).setAngle(-18).setDepth(y + 9);

    this.add.rectangle(
      x + 8,
      y + 13,
      34,
      6,
      0x795034
    ).setAngle(18).setDepth(y + 10);

    // Fire glow
    const glow = this.add.circle(
      x,
      y - 2,
      28,
      0xffa044,
      0.12
    ).setDepth(y + 6);

    const glowTween = this.tweens.add({
      targets: glow,
      alpha: 0.25,
      scale: 1.2,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.ambientTweens.push(glowTween);

    // Fire
    const fire = this.add.triangle(
      x,
      y - 5,
      0,
      20,
      10,
      0,
      20,
      20,
      0xff9b42
    ).setDepth(y + 7);

    const fireTween = this.tweens.add({
      targets: fire,
      scaleY: 1.18,
      scaleX: 0.88,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.ambientTweens.push(fireTween);

    this.add.triangle(
      x,
      y - 3,
      0,
      13,
      6,
      2,
      12,
      13,
      0xffdf80
    ).setDepth(y + 8);

    // Smoke particles
    for (let i = 0; i < 3; i++) {
      const smoke = this.add.circle(
        x + Phaser.Math.Between(-4, 4),
        y - 28,
        4,
        0xc6c6c6,
        0.2
      ).setDepth(y + 12);

      const smokeTween = this.tweens.add({
        targets: smoke,
        y: y - 65 - i * 12,
        x: smoke.x + Phaser.Math.Between(-10, 10),
        alpha: 0,
        scale: 1.8,
        duration: 1800 + i * 300,
        repeat: -1,
        delay: i * 500,
        ease: "Sine.easeOut",
        onRepeat: () => {
          smoke.setPosition(
            x + Phaser.Math.Between(-4, 4),
            y - 28
          );
          smoke.setAlpha(0.2);
          smoke.setScale(1);
        },
      });

      this.ambientTweens.push(smokeTween);
    }

    this.add.text(
      x,
      y - 100,
      "ЛАГЕРЬ ПУТЕШЕСТВЕННИКОВ",
      {
        fontFamily: "Arial",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#ffe1aa",
        stroke: "#203528",
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(y + 15);

    const campObject = this.add.container(x, y);

    this.interactables.push({
      id: "traveler-camp",
      type: "camp",
      x,
      y,
      name: "Костёр",
      sprite: campObject,
    });
  }

  // --------------------------------------------------
  // NPC
  // --------------------------------------------------

  private createNPC() {
    const x = this.campPosition.x + 85;
    const y = this.campPosition.y + 15;

    const shadow = this.add.ellipse(
      0,
      12,
      23,
      8,
      0x10251e,
      0.45
    );

    const body = this.add.rectangle(
      0,
      0,
      17,
      23,
      0x7195a8
    );

    const head = this.add.circle(
      0,
      -16,
      8,
      0xe8c6a7
    );

    const hair = this.add.arc(
      0,
      -18,
      8,
      190,
      350,
      false,
      0x4a3528
    );

    hair.setStrokeStyle(5, 0x4a3528);

    const npc = this.add.container(
      x,
      y,
      [shadow, body, head, hair]
    );

    npc.setDepth(y);

    this.add.text(
      x,
      y - 42,
      "Элиан",
      {
        fontFamily: "Arial",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#fff0c9",
        stroke: "#203528",
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(y + 1);

    const idleTween = this.tweens.add({
      targets: npc,
      y: y - 2,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.ambientTweens.push(idleTween);

    this.interactables.push({
      id: "elian-traveler",
      type: "npc",
      x,
      y,
      name: "Элиан",
      sprite: npc,
    });
  }

  // --------------------------------------------------
  // RESOURCES
  // --------------------------------------------------

  private createResources() {
    const resources = [
      { id: "mushroom-1", x: 1030, y: 650, type: "Гриб" },
      { id: "mushroom-2", x: 970, y: 930, type: "Гриб" },
      { id: "berry-1", x: 1480, y: 890, type: "Ягоды" },
      { id: "berry-2", x: 1580, y: 600, type: "Ягоды" },
      { id: "stone-1", x: 900, y: 710, type: "Камень" },
      { id: "stone-2", x: 1650, y: 980, type: "Камень" },
    ];

    for (const resource of resources) {
      const container = this.add.container(
        resource.x,
        resource.y
      );

      if (resource.type === "Гриб") {
        container.add([
          this.add.ellipse(0, 5, 5, 10, 0xe6d4b6),
          this.add.ellipse(0, -1, 17, 10, 0xc56b85),
          this.add.circle(-4, -3, 1.5, 0xffe9dc),
          this.add.circle(4, -3, 1.5, 0xffe9dc),
        ]);
      } else if (resource.type === "Ягоды") {
        container.add([
          this.add.line(0, 0, 0, 5, 0, -10, 0x7c9c53)
            .setLineWidth(2),
          this.add.circle(-5, 0, 5, 0xc84d72),
          this.add.circle(5, 2, 5, 0xd95779),
          this.add.circle(0, 7, 5, 0xb73e66),
        ]);
      } else {
        container.add([
          this.add.triangle(
            0,
            0,
            -9,
            6,
            0,
            -9,
            10,
            6,
            0x9b9d9c
          ),
          this.add.line(
            0,
            0,
            -5,
            1,
            4,
            -4,
            0xd2d2ca
          ).setLineWidth(2),
        ]);
      }

      container.setDepth(resource.y);

      this.interactables.push({
        id: resource.id,
        type: "resource",
        x: resource.x,
        y: resource.y,
        name: resource.type,
        resourceType: resource.type,
        sprite: container,
        collected: false,
      });
    }
  }

  // --------------------------------------------------
  // PLAYER
  // --------------------------------------------------

  private createPlayer() {
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
      this.spawnPosition.x,
      this.spawnPosition.y,
      [shadow, body, head, hair]
    );

    this.player.setDepth(this.player.y);
  }

  private createDestinationMarker() {
    this.targetMarker = this.add.graphics();

    this.targetMarker.lineStyle(2, 0xd8c4ff, 0.95);
    this.targetMarker.strokeCircle(0, 0, 15);

    this.targetMarker.lineStyle(1, 0xb89aff, 0.75);
    this.targetMarker.strokeCircle(0, 0, 8);

    this.targetMarker.fillStyle(0xd8c4ff, 0.9);
    this.targetMarker.fillCircle(0, 0, 2.5);

    this.targetMarker.setVisible(false);
  }

  // --------------------------------------------------
  // INTERFACE
  // --------------------------------------------------

  private createWorldInterface() {
    // Location
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

    // Resource counter
    this.resourceCounter = this.add.text(
      18,
      65,
      "Собрано ресурсов: 0",
      {
        fontFamily: "Arial",
        fontSize: "10px",
        color: "#e3d5ff",
        backgroundColor: "#17342b",
        padding: {
          x: 7,
          y: 5,
        },
      }
    ).setScrollFactor(0).setDepth(1000);

    // Interaction hint
    const panel = this.add.rectangle(
      0,
      0,
      230,
      34,
      0x14271f,
      0.92
    );

    panel.setStrokeStyle(1, 0xb89aff, 0.65);

    this.interactionLabel = this.add.text(
      0,
      0,
      "",
      {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#ffffff",
        align: "center",
      }
    ).setOrigin(0.5);

    this.interactionPanel = this.add.container(
      this.scale.width / 2,
      this.scale.height - 72,
      [panel, this.interactionLabel]
    );

    this.interactionPanel.setScrollFactor(0);
    this.interactionPanel.setDepth(1200);
    this.interactionPanel.setVisible(false);

    // Dialogue
    const dialogueBackground = this.add.rectangle(
      0,
      0,
      320,
      112,
      0x111b20,
      0.96
    );

    dialogueBackground.setStrokeStyle(1, 0xb89aff, 0.8);

    const dialogueTitle = this.add.text(
      -145,
      -43,
      "ЭЛИАН",
      {
        fontFamily: "Arial",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#d8c4ff",
      }
    );

    this.dialogueText = this.add.text(
      -145,
      -18,
      "",
      {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#f0eee8",
        wordWrap: {
          width: 285,
        },
        lineSpacing: 4,
      }
    );

    const closeHint = this.add.text(
      145,
      43,
      "E — закрыть",
      {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#a9b8ae",
      }
    ).setOrigin(1, 0.5);

    this.dialoguePanel = this.add.container(
      this.scale.width / 2,
      this.scale.height - 155,
      [
        dialogueBackground,
        dialogueTitle,
        this.dialogueText,
        closeHint,
      ]
    );

    this.dialoguePanel.setScrollFactor(0);
    this.dialoguePanel.setDepth(1300);
    this.dialoguePanel.setVisible(false);

    // Mobile interaction button
    const buttonBackground = this.add.circle(
      0,
      0,
      30,
      0x5a447e,
      0.95
    );

    buttonBackground.setStrokeStyle(2, 0xd8c4ff, 0.9);

    const buttonText = this.add.text(
      0,
      0,
      "E",
      {
        fontFamily: "Arial",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#ffffff",
      }
    ).setOrigin(0.5);

    this.mobileInteractButton = this.add.container(
      this.scale.width - 55,
      this.scale.height - 65,
      [buttonBackground, buttonText]
    );

    this.mobileInteractButton.setScrollFactor(0);
    this.mobileInteractButton.setDepth(1250);
    this.mobileInteractButton.setSize(60, 60);
    this.mobileInteractButton.setInteractive(
      new Phaser.Geom.Circle(0, 0, 30),
      Phaser.Geom.Circle.Contains
    );

    this.mobileInteractButton.on(
      Phaser.Input.Events.POINTER_DOWN,
      () => this.interact()
    );

    this.mobileInteractButton.setVisible(false);
  }

  private createMinimap() {
    const panel = this.add.graphics();

    panel.fillStyle(0x101d19, 0.94);
    panel.fillRoundedRect(0, 0, 132, 94, 7);

    panel.lineStyle(1, 0xb89aff, 0.75);
    panel.strokeRoundedRect(0, 0, 132, 94, 7);

    const map = this.add.graphics();

    map.fillStyle(0x294b43, 1);
    map.fillRect(8, 20, 116, 65);

    map.lineStyle(1, 0x8ba98a, 0.45);
    map.strokeRect(8, 20, 116, 65);

    // Trees
    map.fillStyle(0x79a76e, 0.9);

    for (const tree of this.treeLocations) {
      const mapX = 8 + (tree.x / this.worldWidth) * 116;
      const mapY = 20 + (tree.y / this.worldHeight) * 65;

      map.fillCircle(mapX, mapY, 1.2);
    }

    // Spawn
    const spawnX =
      8 + (this.spawnPosition.x / this.worldWidth) * 116;

    const spawnY =
      20 + (this.spawnPosition.y / this.worldHeight) * 65;

    map.fillStyle(0xd8c4ff, 1);
    map.fillCircle(spawnX, spawnY, 3);

    // Camp
    const campX =
      8 + (this.campPosition.x / this.worldWidth) * 116;

    const campY =
      20 + (this.campPosition.y / this.worldHeight) * 65;

    map.fillStyle(0xffa044, 1);
    map.fillCircle(campX, campY, 3.5);
    map.lineStyle(1, 0xffe1aa, 0.9);
    map.strokeCircle(campX, campY, 5);

    // NPC
    const npc = this.interactables.find(
      (item) => item.type === "npc"
    );

    if (npc) {
      const npcX =
        8 + (npc.x / this.worldWidth) * 116;

      const npcY =
        20 + (npc.y / this.worldHeight) * 65;

      map.fillStyle(0x78c9e8, 1);
      map.fillCircle(npcX, npcY, 2.5);
    }

    const title = this.add.text(
      10,
      5,
      "КАРТА",
      {
        fontFamily: "Arial",
        fontSize: "9px",
        fontStyle: "bold",
        color: "#e3d5ff",
        letterSpacing: 1,
      }
    );

    this.minimapPlayerMarker = this.add.circle(
      8 + (this.spawnPosition.x / this.worldWidth) * 116,
      20 + (this.spawnPosition.y / this.worldHeight) * 65,
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
      Math.max(8, this.scale.width - 140),
      8
    );
  }

  private positionMobileButton() {
    if (!this.mobileInteractButton || !this.interactionPanel) {
      return;
    }

    this.mobileInteractButton.setPosition(
      this.scale.width - 55,
      this.scale.height - 65
    );

    this.interactionPanel.setPosition(
      this.scale.width / 2,
      this.scale.height - 72
    );

    if (this.dialoguePanel) {
      this.dialoguePanel.setPosition(
        this.scale.width / 2,
        this.scale.height - 155
      );
    }
  }

  private updateMinimap() {
    if (!this.player || !this.minimapPlayerMarker) {
      return;
    }

    const mapX =
      8 + (this.player.x / this.worldWidth) * 116;

    const mapY =
      20 + (this.player.y / this.worldHeight) * 65;

    this.minimapPlayerMarker.setPosition(mapX, mapY);
  }

  // --------------------------------------------------
  // INTERACTION SYSTEM
  // --------------------------------------------------

  private updateNearbyInteractable() {
    let nearest: InteractableObject | null = null;
    let nearestDistance = this.interactionDistance;

    for (const item of this.interactables) {
      if (item.collected) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        item.x,
        item.y
      );

      if (distance < nearestDistance) {
        nearest = item;
        nearestDistance = distance;
      }
    }

    this.nearbyInteractable = nearest;

    if (this.dialogueOpen) {
      this.interactionPanel.setVisible(false);
      this.mobileInteractButton.setVisible(false);
      return;
    }

    if (!nearest) {
      this.interactionPanel.setVisible(false);
      this.mobileInteractButton.setVisible(false);
      return;
    }

    let hint = "";

    if (nearest.type === "npc") {
      hint = `E — поговорить: ${nearest.name}`;
    } else if (nearest.type === "resource") {
      hint = `E — собрать: ${nearest.name}`;
    } else {
      hint = "E — осмотреть костёр";
    }

    this.interactionLabel.setText(hint);
    this.interactionPanel.setVisible(true);
    this.mobileInteractButton.setVisible(true);
  }

  private interact() {
    if (this.dialogueOpen) {
      this.closeDialogue();
      return;
    }

    const target = this.nearbyInteractable;

    if (!target || !this.player) {
      return;
    }

    if (
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        target.x,
        target.y
      ) > this.interactionDistance
    ) {
      return;
    }

    if (target.type === "npc") {
      this.openDialogue(
        "Добро пожаловать в Greenhaven! Я Элиан, путешественник. Здесь можно отдохнуть у костра перед дорогой. Впереди тебя ждёт целый мир."
      );

      return;
    }

    if (target.type === "camp") {
      this.openDialogue(
        "Тёплый костёр, палатка и припасы путешественников. Похоже, это безопасное место для отдыха."
      );

      return;
    }

    if (target.type === "resource") {
      this.collectResource(target);
    }
  }

  private collectResource(target: InteractableObject) {
    if (target.collected) {
      return;
    }

    target.collected = true;
    target.sprite.setVisible(false);

    this.resourceCount += 1;

    this.resourceCounter.setText(
      `Собрано ресурсов: ${this.resourceCount}`
    );

    this.openDialogue(
      `Ты собрал: ${target.resourceType}. Ресурс добавлен в счётчик находок.`
    );
  }

  private openDialogue(message: string) {
    this.dialogueOpen = true;

    this.movementTarget = null;
    this.hideTargetMarker();

    this.dialogueText.setText(message);
    this.dialoguePanel.setVisible(true);

    this.interactionPanel.setVisible(false);
    this.mobileInteractButton.setVisible(false);
  }

  private closeDialogue() {
    this.dialogueOpen = false;
    this.dialoguePanel.setVisible(false);

    this.updateNearbyInteractable();
  }

  // --------------------------------------------------
  // MOVEMENT
  // --------------------------------------------------

  private setMovementDestination(x: number, y: number) {
    if (!this.player || !this.targetMarker || this.dialogueOpen) {
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
    const mapTop = 20;
    const mapWidth = 116;
    const mapHeight = 65;

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

    this.setMovementDestination(
      normalizedX * this.worldWidth,
      normalizedY * this.worldHeight
    );

    return true;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.player || !this.targetMarker || this.dialogueOpen) {
      return;
    }

    // Ignore clicks on the mobile interaction button
    const buttonBounds = this.mobileInteractButton.getBounds();

    if (
      buttonBounds.contains(pointer.x, pointer.y)
    ) {
      return;
    }

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

  // --------------------------------------------------
  // CONTROLS AND CAMERA
  // --------------------------------------------------

  private setupControls() {
    if (!this.input.keyboard) {
      return;
    }

    this.cursors = this.input.keyboard.createCursorKeys();

    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );

    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      this.handlePointerDown,
      this
    );
  }

  private setupCamera() {
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

  private setupLifecycle() {
    this.scale.on(
      Phaser.Scale.Events.RESIZE,
      this.positionMinimap,
      this
    );

    this.scale.on(
      Phaser.Scale.Events.RESIZE,
      this.positionMobileButton,
      this
    );

    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.handleShutdown,
      this
    );
  }

  private handleShutdown() {
    this.targetMarkerTween?.stop();
    this.targetMarkerTween = null;

    for (const tween of this.ambientTweens) {
      tween.stop();
    }

    this.ambientTweens.length = 0;

    this.scale.off(
      Phaser.Scale.Events.RESIZE,
      this.positionMinimap,
      this
    );

    this.scale.off(
      Phaser.Scale.Events.RESIZE,
      this.positionMobileButton,
      this
    );

    this.input.off(
      Phaser.Input.Events.POINTER_DOWN,
      this.handlePointerDown,
      this
    );

    this.mobileInteractButton?.off(
      Phaser.Input.Events.POINTER_DOWN
    );
  }

  // --------------------------------------------------
  // UPDATE
  // --------------------------------------------------

  update(_time: number, delta: number) {
    if (!this.player) {
      return;
    }

    if (
      this.interactKey &&
      Phaser.Input.Keyboard.JustDown(this.interactKey)
    ) {
      this.interact();
    }

    if (this.dialogueOpen) {
      this.updateMinimap();
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

    // Tap-to-move
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

    this.updateNearbyInteractable();
    this.updateMinimap();
  }
}