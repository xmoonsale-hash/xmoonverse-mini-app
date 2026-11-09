import Phaser from "phaser";
import type {
  GameCharacter,
  GameLocation,
} from "../../platform/game";

type MeadowSceneData = {
  character?: GameCharacter | null;
  location?: GameLocation | null;
};

type InteractableType = "npc" | "resource" | "camp";
type ResourceType =
  | "Гриб"
  | "Ягоды"
  | "Камень"
  | "Древесина"
  | "Волокна"
  | "Руда";
type ResourceState = "available" | "collected" | "regrowing";

interface InteractableObject {
  id: string;
  type: InteractableType;
  x: number;
  y: number;
  name: string;
  sprite: Phaser.GameObjects.Container;
  resourceType?: ResourceType;
  state?: ResourceState;
  collected?: boolean;
  respawnEvent?: Phaser.Time.TimerEvent;
  dialogueIndex?: number;
}

interface ResourceDefinition {
  id: string;
  x: number;
  y: number;
  type: ResourceType;
}

interface Obstacle {
  x: number;
  y: number;
  radius: number;
}

export default class MeadowScene extends Phaser.Scene {
  private characterData: GameCharacter | null = null;
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Arc;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey?: Phaser.Input.Keyboard.Key;
  private inventoryKey?: Phaser.Input.Keyboard.Key;
  private escapeKey?: Phaser.Input.Keyboard.Key;

  private targetMarker!: Phaser.GameObjects.Graphics;
  private targetMarkerTween: Phaser.Tweens.Tween | null = null;

  private minimap!: Phaser.GameObjects.Container;
  private minimapPlayerMarker!: Phaser.GameObjects.Arc;
  private minimapResourceMarkers = new Map<
    string,
    Phaser.GameObjects.Arc
  >();

  private interactionPanel!: Phaser.GameObjects.Container;
  private interactionLabel!: Phaser.GameObjects.Text;

  private dialoguePanel!: Phaser.GameObjects.Container;
  private dialogueTitle!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;

  private mobileInteractButton!: Phaser.GameObjects.Container;
  private mobileButtonBackground!: Phaser.GameObjects.Arc;
  private mobileButtonText!: Phaser.GameObjects.Text;

  private resourceCounter!: Phaser.GameObjects.Text;

  private inventoryWindow!: Phaser.GameObjects.Container;
  private inventoryWindowText!: Phaser.GameObjects.Text;
  private inventoryCloseText!: Phaser.GameObjects.Text;

  private notificationContainer!: Phaser.GameObjects.Container;
  private notificationText!: Phaser.GameObjects.Text;
  private notificationTween: Phaser.Tweens.Tween | null = null;

  private dayNightOverlay!: Phaser.GameObjects.Rectangle;
  private timeLabel!: Phaser.GameObjects.Text;

  private readonly interactables: InteractableObject[] = [];
  private readonly obstacles: Obstacle[] = [];
  private readonly treeLocations: Array<{ x: number; y: number }> = [];
  private readonly ambientTweens: Phaser.Tweens.Tween[] = [];

  private readonly resourceCounts: Record<ResourceType, number> = {
    Гриб: 0,
    Ягоды: 0,
    Камень: 0,
    Древесина: 0,
    Волокна: 0,
    Руда: 0,
  };

  private movementTarget: Phaser.Math.Vector2 | null = null;
  private nearbyInteractable: InteractableObject | null = null;

  private dialogueOpen = false;
  private inventoryOpen = false;
  private playerMoving = false;

  private facing = 1;
  private worldTime = 0.35;
  private elapsedTime = 0;

  private readonly worldWidth = 2400;
  private readonly worldHeight = 1600;

  private readonly playerSpeed = 190;
  private readonly interactionDistance = 85;
  private readonly playerRadius = 9;

  private readonly campPosition = { x: 1320, y: 720 };
  private readonly spawnPosition = { x: 1200, y: 800 };

  private readonly minimapBounds = {
    x: 8,
    y: 23,
    width: 116,
    height: 65,
  };

  constructor() {
    super("MeadowScene");
  }

  init(data: MeadowSceneData = {}) {
    this.characterData = data.character ?? null;

    const location = data.location;

    if (
      location &&
      location.regionId === "greenhaven" &&
      Number.isFinite(location.x) &&
      Number.isFinite(location.y)
    ) {
      this.spawnPosition.x = Phaser.Math.Clamp(
        location.x,
        this.playerRadius,
        this.worldWidth - this.playerRadius
      );

      this.spawnPosition.y = Phaser.Math.Clamp(
        location.y,
        this.playerRadius,
        this.worldHeight - this.playerRadius
      );
    }
  }

  create() {
    this.resetSceneState();

    this.cameras.main.setBackgroundColor("#09051d");

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
    this.createDayNightSystem();

    this.positionInterface();
    this.positionMinimap();
    this.setupControls();
    this.setupCamera();
    this.setupLifecycle();

    this.updateNearbyInteractable();
    this.updateMinimap();
    this.updateInventoryInterface();
  }

  private resetSceneState() {
    this.movementTarget = null;
    this.nearbyInteractable = null;

    this.dialogueOpen = false;
    this.inventoryOpen = false;
    this.playerMoving = false;

    this.facing = 1;
    this.worldTime = 0.35;
    this.elapsedTime = 0;

    this.treeLocations.length = 0;
    this.interactables.length = 0;
    this.obstacles.length = 0;
    this.ambientTweens.length = 0;
    this.minimapResourceMarkers.clear();

    this.resourceCounts.Гриб = 0;
    this.resourceCounts.Ягоды = 0;
    this.resourceCounts.Камень = 0;
    this.resourceCounts.Древесина = 0;
    this.resourceCounts.Волокна = 0;
    this.resourceCounts.Руда = 0;
  }

  // --------------------------------------------------
  // WORLD
  // --------------------------------------------------

  private createGround() {
    this.add
      .rectangle(
        this.worldWidth / 2,
        this.worldHeight / 2,
        this.worldWidth,
        this.worldHeight,
        0x17102e
      )
      .setDepth(0);

    const graphics = this.add.graphics();
    let seed = 91731;

    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const colors = [
      0x30204f,
      0x3d2862,
      0x24183f,
      0x51336f,
      0x62427e,
    ];

    for (let i = 0; i < 1100; i++) {
      const x = random() * this.worldWidth;
      const y = random() * this.worldHeight;
      const color = colors[Math.floor(random() * colors.length)];

      graphics.fillStyle(color, 0.25 + random() * 0.45);
      graphics.fillCircle(x, y, 1 + random() * 2.2);
    }

    graphics.setDepth(1);

    for (let i = 0; i < 30; i++) {
      const x = 100 + random() * (this.worldWidth - 200);
      const y = 100 + random() * (this.worldHeight - 200);

      this.add
        .ellipse(
          x,
          y,
          100 + random() * 110,
          60 + random() * 60,
          0x7650a5,
          0.09
        )
        .setDepth(2);
    }

    const stones = this.add.graphics();

    for (let i = 0; i < 85; i++) {
      stones.fillStyle(0x9b85b6, 0.18);
      stones.fillEllipse(
        random() * this.worldWidth,
        random() * this.worldHeight,
        5 + random() * 6,
        2 + random() * 4
      );
    }

    stones.setDepth(3);

    const glimmers = this.add.graphics();

    for (let i = 0; i < 45; i++) {
      const x = random() * this.worldWidth;
      const y = random() * this.worldHeight;

      glimmers.fillStyle(0xc38aff, 0.18 + random() * 0.2);
      glimmers.fillCircle(x, y, 1 + random() * 2);
    }

    glimmers.setDepth(4);
  }

  private createPaths() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x58416f, 0.78);
    graphics.fillPoints(
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

    graphics.setDepth(5);

    const details = this.add.graphics();
    details.lineStyle(2, 0xc39aff, 0.2);
    details.beginPath();
    details.moveTo(1130, 850);
    details.lineTo(1210, 790);
    details.lineTo(1300, 735);
    details.lineTo(1390, 665);
    details.strokePath();
    details.setDepth(6);
  }

  private isNearImportantArea(
    x: number,
    y: number,
    distance: number
  ) {
    const spawnDistance = Phaser.Math.Distance.Between(
      x,
      y,
      this.spawnPosition.x,
      this.spawnPosition.y
    );

    const campDistance = Phaser.Math.Distance.Between(
      x,
      y,
      this.campPosition.x,
      this.campPosition.y
    );

    return (
      spawnDistance < distance ||
      campDistance < distance
    );
  }

  private createNature() {
    for (let i = 0; i < 125; i++) {
      const x = Phaser.Math.Between(30, this.worldWidth - 30);
      const y = Phaser.Math.Between(30, this.worldHeight - 30);

      if (this.isNearImportantArea(x, y, 105)) {
        continue;
      }

      const flower = this.add.container(x, y);
      const color = Phaser.Utils.Array.GetRandom([
        0xd7a5ff,
        0xa77bff,
        0xffc2ec,
        0xb7a6ff,
      ]);

      flower.add([
        this.add.circle(0, 0, 2, color),
        this.add.circle(3, -2, 2, color),
        this.add.circle(-3, -2, 2, color),
        this.add.circle(0, -4, 2, color),
        this.add.circle(0, -1, 1, 0xffeaff),
      ]);

      flower.setDepth(y - 1);

      if (i % 3 === 0) {
        this.ambientTweens.push(
          this.tweens.add({
            targets: flower,
            angle: Phaser.Math.Between(-4, 4),
            duration: Phaser.Math.Between(1600, 2600),
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          })
        );
      }
    }

    for (let i = 0; i < 22; i++) {
      const x = Phaser.Math.Between(100, this.worldWidth - 100);
      const y = Phaser.Math.Between(100, this.worldHeight - 100);

      const firefly = this.add
        .circle(x, y, 2, 0xdcb7ff, 0.35)
        .setDepth(y + 20);

      this.ambientTweens.push(
        this.tweens.add({
          targets: firefly,
          alpha: 0.95,
          y: y - Phaser.Math.Between(10, 30),
          duration: Phaser.Math.Between(1500, 2500),
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        })
      );
    }

    const grass = this.add.graphics();

    for (let i = 0; i < 180; i++) {
      const x = Phaser.Math.Between(20, this.worldWidth - 20);
      const y = Phaser.Math.Between(20, this.worldHeight - 20);

      grass.lineStyle(1, 0x9e7fc0, 0.35);
      grass.beginPath();
      grass.moveTo(x, y);
      grass.lineTo(x - 2, y - 5);
      grass.moveTo(x, y);
      grass.lineTo(x + 3, y - 6);
      grass.strokePath();
    }

    grass.setDepth(7);

    for (let i = 0; i < 26; i++) {
      const x = Phaser.Math.Between(80, this.worldWidth - 80);
      const y = Phaser.Math.Between(80, this.worldHeight - 80);

      if (this.isNearImportantArea(x, y, 95)) continue;

      const crystal = this.add.container(x, y);

      const glow = this.add.circle(0, 0, 15, 0x9d48ff, 0.12);
      const shard = this.add.triangle(
        0, 0,
        0, -13,
        -7, 5,
        7, 5,
        0xb987ff
      );
      const highlight = this.add.line(
        0, 0,
        0, -10,
        0, 1,
        0xf0d8ff,
        0.8
      ).setLineWidth(1.5);

      crystal.add([glow, shard, highlight]);
      crystal.setDepth(y);

      this.ambientTweens.push(
        this.tweens.add({
          targets: glow,
          alpha: 0.28,
          scale: 1.35,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        })
      );
    }
  }

  private createTrees() {
    let seed = 48271;

    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    let created = 0;
    let attempts = 0;

    while (created < 105 && attempts < 500) {
      attempts++;

      const x = 50 + random() * (this.worldWidth - 100);
      const y = 70 + random() * (this.worldHeight - 120);

      if (this.isNearImportantArea(x, y, 145)) {
        continue;
      }

      const overlaps = this.treeLocations.some(
        (tree) =>
          Phaser.Math.Distance.Between(
            x,
            y,
            tree.x,
            tree.y
          ) < 55
      );

      if (overlaps) {
        continue;
      }

      this.treeLocations.push({ x, y });

      const tree = this.add.container(x, y);

      const shadow = this.add.ellipse(
        0, 13, 36, 15, 0x09051b, 0.5
      );
      const trunk = this.add.rectangle(
        0, 11, 9, 25, 0x49305d
      );
      const crownBack = this.add.circle(
        0, -5, 20, 0x35204f
      );
      const crown = this.add.circle(
        -3, -12, 16, 0x583778
      );
      const crownLight = this.add.circle(
        -8, -16, 7, 0x8954ae, 0.9
      );
      const crownGlow = this.add.circle(
        0, -7, 25, 0x9c4de8, 0.1
      );

      tree.add([
        shadow,
        trunk,
        crownBack,
        crown,
        crownLight,
        crownGlow,
      ]);

      tree.setDepth(y);

      this.ambientTweens.push(
        this.tweens.add({
          targets: crownGlow,
          alpha: 0.22,
          scale: 1.12,
          duration: 1900,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        })
      );

      this.obstacles.push({
        x,
        y: y + 7,
        radius: 13,
      });

      created++;
    }
  }

  // --------------------------------------------------
  // CAMP
  // --------------------------------------------------

  private createTravelerCamp() {
    const { x, y } = this.campPosition;

    this.add
      .ellipse(x, y + 5, 150, 100, 0x110923, 0.72)
      .setDepth(y - 5);

    const tent = this.add.graphics();

    tent.fillStyle(0x76528e, 1);
    tent.fillTriangle(
      x - 55, y - 20,
      x - 10, y - 70,
      x + 35, y - 20
    );

    tent.fillStyle(0x4d356d, 1);
    tent.fillTriangle(
      x - 10, y - 20,
      x - 10, y - 70,
      x + 35, y - 20
    );

    tent.fillStyle(0x241738, 1);
    tent.fillTriangle(
      x - 12, y - 20,
      x - 10, y - 48,
      x + 5, y - 20
    );

    tent.lineStyle(2, 0xc99aff, 0.55);
    tent.strokeTriangle(
      x - 55, y - 20,
      x - 10, y - 70,
      x + 35, y - 20
    );

    tent.setDepth(y + 2);

    this.obstacles.push({
      x: x - 10,
      y: y - 40,
      radius: 35,
    });

    this.add
      .rectangle(x + 57, y - 10, 22, 20, 0x49305d)
      .setDepth(y + 3);

    this.add
      .rectangle(x + 57, y - 10, 20, 3, 0xb58ad7)
      .setDepth(y + 4);

    this.obstacles.push({
      x: x + 57,
      y: y - 10,
      radius: 14,
    });

    this.add
      .ellipse(x - 66, y + 5, 19, 23, 0x54375e)
      .setDepth(y + 4);

    this.add
      .rectangle(x - 66, y + 5, 20, 3, 0xb58ad7)
      .setDepth(y + 5);

    this.obstacles.push({
      x: x - 66,
      y: y + 5,
      radius: 12,
    });

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;

      this.add
        .circle(
          x + Math.cos(angle) * 19,
          y + Math.sin(angle) * 11,
          5,
          0x8c789f
        )
        .setDepth(y + 5);
    }

    this.add
      .rectangle(x - 8, y + 13, 34, 6, 0x54375e)
      .setAngle(-18)
      .setDepth(y + 9);

    this.add
      .rectangle(x + 8, y + 13, 34, 6, 0x54375e)
      .setAngle(18)
      .setDepth(y + 10);

    const glow = this.add
      .circle(x, y - 2, 38, 0xa64cff, 0.17)
      .setDepth(y + 6);

    this.ambientTweens.push(
      this.tweens.add({
        targets: glow,
        alpha: 0.32,
        scale: 1.25,
        duration: 850,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })
    );

    const fire = this.add
      .triangle(
        x, y - 5,
        0, 20,
        10, 0,
        20, 20,
        0xc47aff
      )
      .setDepth(y + 7);

    this.ambientTweens.push(
      this.tweens.add({
        targets: fire,
        scaleY: 1.18,
        scaleX: 0.88,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })
    );

    this.add
      .triangle(
        x, y - 3,
        0, 13,
        6, 2,
        12, 13,
        0xf0d6ff
      )
      .setDepth(y + 8);

    for (let i = 0; i < 3; i++) {
      const smoke = this.add
        .circle(
          x + Phaser.Math.Between(-4, 4),
          y - 28,
          4,
          0xc6b0e2,
          0.2
        )
        .setDepth(y + 12);

      this.ambientTweens.push(
        this.tweens.add({
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
        })
      );
    }

    this.add
      .text(x, y - 100, "ЛАГЕРЬ ПУТЕШЕСТВЕННИКОВ", {
        fontFamily: "Arial",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#e4caff",
        stroke: "#1b0d2e",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(y + 15);

    this.interactables.push({
      id: "traveler-camp",
      type: "camp",
      x,
      y: y + 55,
      name: "Костёр",
      sprite: this.add.container(x, y),
    });

    this.interactables.push({
      id: "camp-tent",
      type: "camp",
      x: x - 10,
      y: y - 35,
      name: "Палатка",
      sprite: this.add.container(x - 10, y - 35),
    });

    this.interactables.push({
      id: "camp-supplies",
      type: "camp",
      x: x + 57,
      y: y - 10,
      name: "Припасы",
      sprite: this.add.container(x + 57, y - 10),
    });
  }

  // --------------------------------------------------
  // NPC
  // --------------------------------------------------

  private createNPC() {
    const x = this.campPosition.x + 85;
    const y = this.campPosition.y + 15;

    const shadow = this.add.ellipse(0, 12, 23, 8, 0x10091e, 0.55);
    const body = this.add.rectangle(0, 0, 17, 23, 0x9274bd);
    const head = this.add.circle(0, -16, 8, 0xe8c6d9);
    const hair = this.add.arc(0, -18, 8, 190, 350, false, 0x30203f);

    hair.setStrokeStyle(5, 0x30203f);

    const npc = this.add.container(x, y, [
      shadow,
      body,
      head,
      hair,
    ]);

    npc.setDepth(y);

    this.add
      .text(x, y - 42, "Элиан", {
        fontFamily: "Arial",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#f2dcff",
        stroke: "#1b0d2e",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(y + 1);

    this.ambientTweens.push(
      this.tweens.add({
        targets: npc,
        y: y - 2,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })
    );

    this.interactables.push({
      id: "elian-traveler",
      type: "npc",
      x,
      y,
      name: "Элиан",
      sprite: npc,
      dialogueIndex: 0,
    });

    this.obstacles.push({
      x,
      y: y + 7,
      radius: 12,
    });
  }

  // --------------------------------------------------
  // RESOURCES
  // --------------------------------------------------

  private createResources() {
    const resources: ResourceDefinition[] = [
      { id: "mushroom-1", x: 1030, y: 650, type: "Гриб" },
      { id: "mushroom-2", x: 970, y: 930, type: "Гриб" },
      { id: "berry-1", x: 1480, y: 890, type: "Ягоды" },
      { id: "berry-2", x: 1580, y: 600, type: "Ягоды" },
      { id: "stone-1", x: 900, y: 710, type: "Камень" },
      { id: "stone-2", x: 1650, y: 980, type: "Камень" },
      { id: "wood-1", x: 1080, y: 1050, type: "Древесина" },
      { id: "wood-2", x: 1740, y: 780, type: "Древесина" },
      { id: "fiber-1", x: 850, y: 1080, type: "Волокна" },
      { id: "fiber-2", x: 1510, y: 1100, type: "Волокна" },
      { id: "ore-1", x: 780, y: 560, type: "Руда" },
      { id: "ore-2", x: 1840, y: 1030, type: "Руда" },
    ];

    for (const resource of resources) {
      this.createResource(resource);
    }
  }

  private createResource(resource: ResourceDefinition) {
    const container = this.add.container(resource.x, resource.y);

    if (resource.type === "Гриб") {
      container.add([
        this.add.ellipse(0, 5, 5, 10, 0xe6d4b6),
        this.add.ellipse(0, -1, 17, 10, 0xc56b85),
        this.add.circle(-4, -3, 1.5, 0xffe9dc),
        this.add.circle(4, -3, 1.5, 0xffe9dc),
      ]);
    } else if (resource.type === "Ягоды") {
      container.add([
        this.add.line(0, 0, 0, 5, 0, -10, 0x9b78c4).setLineWidth(2),
        this.add.circle(-5, 0, 5, 0xc84d9b),
        this.add.circle(5, 2, 5, 0xd957b5),
        this.add.circle(0, 7, 5, 0xb73e91),
      ]);
    } else if (resource.type === "Камень") {
      container.add([
        this.add.triangle(
          0, 0,
          -9, 6,
          0, -9,
          10, 6,
          0x9b9dba
        ),
        this.add.line(0, 0, -5, 1, 4, -4, 0xd2c4ea).setLineWidth(2),
      ]);
    } else if (resource.type === "Древесина") {
      container.add([
        this.add.rectangle(0, 0, 20, 8, 0x76508e).setAngle(-28),
        this.add.circle(-8, 4, 4, 0xb58ad7),
        this.add.circle(8, -4, 4, 0xb58ad7),
      ]);
    } else if (resource.type === "Волокна") {
      const fibers = this.add.graphics();
      fibers.lineStyle(3, 0xb99bff, 1);
      fibers.beginPath();
      fibers.moveTo(-7, 8);
      fibers.lineTo(-3, -7);
      fibers.lineTo(1, 6);
      fibers.lineTo(6, -8);
      fibers.strokePath();
      container.add(fibers);
      container.add(this.add.circle(0, 0, 3, 0xe0ccff));
    } else {
      container.add([
        this.add.triangle(
          0, 0,
          -10, 7,
          -2, -10,
          11, 4,
          0x9b78c9
        ),
        this.add.line(0, 0, -4, 3, 4, -5, 0xe2caff).setLineWidth(2),
      ]);
    }

    const aura = this.add.circle(0, 0, 17, 0xa95cff, 0.12);
    container.addAt(aura, 0);

    container.setDepth(resource.y);

    const interactable: InteractableObject = {
      id: resource.id,
      type: "resource",
      x: resource.x,
      y: resource.y,
      name: resource.type,
      resourceType: resource.type,
      sprite: container,
      state: "available",
      collected: false,
    };

    this.interactables.push(interactable);

    this.ambientTweens.push(
      this.tweens.add({
        targets: container,
        scale: { from: 0.95, to: 1.05 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })
    );
  }

  private collectResource(target: InteractableObject) {
    if (
      target.type !== "resource" ||
      target.state !== "available" ||
      !target.resourceType
    ) {
      return;
    }

    target.state = "collected";
    target.collected = true;

    this.resourceCounts[target.resourceType]++;

    this.updateInventoryInterface();
    this.updateResourceMinimapMarker(target);

    this.tweens.killTweensOf(target.sprite);

    this.tweens.add({
      targets: target.sprite,
      y: target.sprite.y - 22,
      alpha: 0,
      scale: 0.45,
      duration: 260,
      ease: "Back.easeIn",
      onComplete: () => {
        target.sprite.setVisible(false);
        target.sprite.setAlpha(1);
        target.sprite.setScale(1);
        target.sprite.setY(target.y);
      },
    });

    this.showNotification(`+1 ${target.resourceType}`);
    this.nearbyInteractable = null;

    target.state = "regrowing";

    target.respawnEvent = this.time.delayedCall(
      60000,
      () => this.regrowResource(target)
    );

    this.updateNearbyInteractable();
  }

  private regrowResource(target: InteractableObject) {
    if (!target.sprite || !target.sprite.active) {
      return;
    }

    target.state = "available";
    target.collected = false;

    target.sprite.setPosition(target.x, target.y);
    target.sprite.setAlpha(0);
    target.sprite.setScale(0.65);
    target.sprite.setVisible(true);

    this.tweens.add({
      targets: target.sprite,
      alpha: 1,
      scale: 1,
      duration: 450,
      ease: "Back.easeOut",
    });

    this.updateResourceMinimapMarker(target);
    this.updateNearbyInteractable();
  }

  // --------------------------------------------------
  // PLAYER
  // --------------------------------------------------

  private createPlayer() {
    const classColors: Record<
      GameCharacter["characterClass"],
      number
    > = {
      warrior: 0xd982a4,
      ranger: 0x79c99b,
      mage: 0x9a8aff,
      adventurer: 0xb89aff,
    };

    const characterClass =
      this.characterData?.characterClass ?? "adventurer";

    const bodyColor = classColors[characterClass];

    const aura = this.add.circle(0, 0, 25, 0xa44dff, 0.14);
    const shadow = this.add.ellipse(0, 12, 25, 9, 0x10091e, 0.55);
    const body = this.add.rectangle(0, 0, 18, 24, bodyColor);
    const head = this.add.circle(0, -17, 9, 0xf0d2e4);
    const hair = this.add.arc(0, -19, 9, 190, 350, false, 0x49356b);

    hair.setStrokeStyle(5, 0x49356b);

    const nameLabel = this.add
      .text(
        0,
        -43,
        this.characterData?.name ?? "Путник",
        {
          fontFamily: "Arial",
          fontSize: "10px",
          fontStyle: "bold",
          color: "#f0e4ff",
          stroke: "#1b0d2e",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5);

    this.player = this.add.container(
      this.spawnPosition.x,
      this.spawnPosition.y,
      [aura, shadow, body, head, hair, nameLabel]
    );

    this.player.setDepth(this.player.y);

    this.playerBody = this.add
      .circle(
        this.spawnPosition.x,
        this.spawnPosition.y + 3,
        this.playerRadius,
        0xffffff,
        0
      )
      .setVisible(false);

    this.playerBody.setDepth(this.player.y + 1);
  }

  private updatePlayerAnimation(moving: boolean) {
    if (moving === this.playerMoving) {
      return;
    }

    this.playerMoving = moving;

    if (moving) {
      this.tweens.add({
        targets: this.player,
        scaleY: 0.96,
        duration: 180,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else {
      this.tweens.killTweensOf(this.player);
      this.player.setScale(1, 1);
    }
  }

  private updatePlayerFacing(directionX: number) {
    if (Math.abs(directionX) < 0.01) {
      return;
    }

    this.facing = directionX > 0 ? 1 : -1;
    this.player.setScale(this.facing, 1);
  }

  // --------------------------------------------------
  // DESTINATION MARKER
  // --------------------------------------------------

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

  private setMovementDestination(x: number, y: number) {
    if (
      !this.player ||
      !this.targetMarker ||
      this.dialogueOpen ||
      this.inventoryOpen
    ) {
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

  private hideTargetMarker() {
    this.targetMarkerTween?.stop();
    this.targetMarkerTween = null;

    if (this.targetMarker) {
      this.targetMarker.setVisible(false);
    }
  }

  // --------------------------------------------------
  // MOVEMENT AND COLLISIONS
  // --------------------------------------------------

  private isBlocked(x: number, y: number) {
    for (const obstacle of this.obstacles) {
      const distance = Phaser.Math.Distance.Between(
        x,
        y,
        obstacle.x,
        obstacle.y
      );

      if (distance < obstacle.radius + this.playerRadius) {
        return true;
      }
    }

    return false;
  }

  private movePlayer(dx: number, dy: number) {
    const nextX = Phaser.Math.Clamp(
      this.player.x + dx,
      20,
      this.worldWidth - 20
    );

    const nextY = Phaser.Math.Clamp(
      this.player.y + dy,
      20,
      this.worldHeight - 20
    );

    if (!this.isBlocked(nextX, this.player.y)) {
      this.player.x = nextX;
    }

    if (!this.isBlocked(this.player.x, nextY)) {
      this.player.y = nextY;
    }

    this.player.setDepth(this.player.y);

    this.playerBody.setPosition(
      this.player.x,
      this.player.y + 3
    );

    if (
      this.movementTarget &&
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.movementTarget.x,
        this.movementTarget.y
      ) <= 1
    ) {
      this.movementTarget = null;
      this.hideTargetMarker();
    }
  }

  private updateTapMovement(delta: number) {
    if (!this.movementTarget) {
      return new Phaser.Math.Vector2(0, 0);
    }

    const direction = new Phaser.Math.Vector2(
      this.movementTarget.x - this.player.x,
      this.movementTarget.y - this.player.y
    );

    const distance = direction.length();

    if (distance <= 1) {
      this.movementTarget = null;
      this.hideTargetMarker();
      return new Phaser.Math.Vector2(0, 0);
    }

    direction.normalize();

    const step = Math.min(
      distance,
      this.playerSpeed * Math.min(delta, 50) / 1000
    );

    return direction.scale(step);
  }

  private updateKeyboardMovement() {
    const direction = new Phaser.Math.Vector2(0, 0);

    if (!this.cursors) {
      return direction;
    }

    if (this.cursors.left.isDown) direction.x -= 1;
    if (this.cursors.right.isDown) direction.x += 1;
    if (this.cursors.up.isDown) direction.y -= 1;
    if (this.cursors.down.isDown) direction.y += 1;

    return direction;
  }

  // --------------------------------------------------
  // USER INTERFACE
  // --------------------------------------------------

  private createWorldInterface() {
    this.resourceCounter = this.add
      .text(12, 12, "", {
        fontFamily: "Arial",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#f2eaff",
        backgroundColor: "#211633",
        padding: { x: 9, y: 7 },
      })
      .setScrollFactor(0)
      .setDepth(1100);

    const interactionBackground = this.add.rectangle(
      0,
      0,
      250,
      38,
      0x211633,
      0.96
    );
    interactionBackground.setStrokeStyle(1, 0xb89aff, 0.85);

    this.interactionLabel = this.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 225 },
      })
      .setOrigin(0.5);

    this.interactionPanel = this.add.container(
      this.scale.width / 2,
      this.scale.height - 75,
      [interactionBackground, this.interactionLabel]
    );

    this.interactionPanel.setScrollFactor(0);
    this.interactionPanel.setDepth(1200);
    this.interactionPanel.setVisible(false);

    const dialogueBackground = this.add.rectangle(
      0,
      0,
      320,
      132,
      0x171126,
      0.98
    );
    dialogueBackground.setStrokeStyle(1.5, 0xb89aff, 0.95);

    this.dialogueTitle = this.add.text(
      -145,
      -51,
      "ЭЛИАН",
      {
        fontFamily: "Arial",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#dfcaff",
      }
    );

    this.dialogueText = this.add.text(
      -145,
      -25,
      "",
      {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#f0eaff",
        wordWrap: { width: 285 },
        lineSpacing: 4,
      }
    );

    const dialogueHint = this.add
      .text(145, 52, "Нажми E или ×, чтобы закрыть", {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#bcaad7",
      })
      .setOrigin(1, 0.5);

    this.dialoguePanel = this.add.container(
      this.scale.width / 2,
      this.scale.height - 155,
      [
        dialogueBackground,
        this.dialogueTitle,
        this.dialogueText,
        dialogueHint,
      ]
    );

    this.dialoguePanel.setScrollFactor(0);
    this.dialoguePanel.setDepth(1300);
    this.dialoguePanel.setVisible(false);

    // Окно инвентаря открывается через системную навигацию
    // приложения или клавишу I. Отдельной кнопки на поле нет.
    const inventoryBackground = this.add.rectangle(
      0,
      0,
      310,
      330,
      0x171126,
      0.98
    );
    inventoryBackground.setStrokeStyle(1.5, 0xb89aff, 0.95);

    const inventoryTitle = this.add.text(
      -130,
      -145,
      "ИНВЕНТАРЬ",
      {
        fontFamily: "Arial",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#eadfff",
      }
    );

    this.inventoryCloseText = this.add
      .text(132, -145, "×", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#e0ccff",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.inventoryCloseText.on(
      Phaser.Input.Events.POINTER_DOWN,
      () => this.closeInventory()
    );

    this.inventoryWindowText = this.add.text(
      -130,
      -110,
      "",
      {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#f0eaff",
        lineSpacing: 10,
        wordWrap: { width: 260 },
      }
    );

    this.inventoryWindow = this.add.container(
      this.scale.width / 2,
      this.scale.height / 2,
      [
        inventoryBackground,
        inventoryTitle,
        this.inventoryCloseText,
        this.inventoryWindowText,
      ]
    );

    this.inventoryWindow.setScrollFactor(0);
    this.inventoryWindow.setDepth(1400);
    this.inventoryWindow.setVisible(false);

    this.mobileButtonBackground = this.add
      .circle(0, 0, 29, 0x65458c, 0.98)
      .setStrokeStyle(2, 0xd8c4ff, 0.95);

    this.mobileButtonText = this.add
      .text(0, 0, "✧", {
        fontFamily: "Arial",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.mobileInteractButton = this.add.container(
      this.scale.width - 55,
      this.scale.height - 75,
      [
        this.mobileButtonBackground,
        this.mobileButtonText,
      ]
    );

    this.mobileInteractButton.setScrollFactor(0);
    this.mobileInteractButton.setDepth(1500);
    this.mobileInteractButton.setSize(60, 60);
    this.mobileInteractButton.setInteractive(
      new Phaser.Geom.Circle(0, 0, 30),
      Phaser.Geom.Circle.Contains
    );
    this.mobileInteractButton.setVisible(false);

    this.mobileInteractButton.on(
      Phaser.Input.Events.POINTER_DOWN,
      () => this.handleInteraction()
    );

    const notificationBackground = this.add.rectangle(
      0,
      0,
      190,
      34,
      0x211633,
      0.97
    );
    notificationBackground.setStrokeStyle(1, 0xb89aff, 0.9);

    this.notificationText = this.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    this.notificationContainer = this.add.container(
      this.scale.width / 2,
      95,
      [
        notificationBackground,
        this.notificationText,
      ]
    );

    this.notificationContainer.setScrollFactor(0);
    this.notificationContainer.setDepth(1600);
    this.notificationContainer.setVisible(false);
  }

  // --------------------------------------------------
  // MINIMAP
  // --------------------------------------------------

  private createMinimap() {
    const panel = this.add.graphics();

    panel.fillStyle(0x171126, 0.97);
    panel.fillRoundedRect(0, 0, 132, 94, 7);
    panel.lineStyle(1, 0xb89aff, 0.9);
    panel.strokeRoundedRect(0, 0, 132, 94, 7);

    const map = this.add.graphics();

    map.fillStyle(0x30254b, 1);
    map.fillRect(
      this.minimapBounds.x,
      this.minimapBounds.y,
      this.minimapBounds.width,
      this.minimapBounds.height
    );

    map.lineStyle(1, 0x9b83c4, 0.55);
    map.strokeRect(
      this.minimapBounds.x,
      this.minimapBounds.y,
      this.minimapBounds.width,
      this.minimapBounds.height
    );

    map.fillStyle(0x8065a8, 0.55);

    for (const tree of this.treeLocations) {
      const point = this.worldToMinimap(tree.x, tree.y);
      map.fillCircle(point.x, point.y, 1.2);
    }

    const spawn = this.worldToMinimap(
      this.spawnPosition.x,
      this.spawnPosition.y
    );

    map.fillStyle(0xd8c4ff, 1);
    map.fillCircle(spawn.x, spawn.y, 2.5);

    const camp = this.worldToMinimap(
      this.campPosition.x,
      this.campPosition.y
    );

    map.fillStyle(0xffb36b, 1);
    map.fillCircle(camp.x, camp.y, 3);
    map.lineStyle(1, 0xffdfb3, 0.9);
    map.strokeCircle(camp.x, camp.y, 5);

    const npc = this.interactables.find(
      (item) => item.type === "npc"
    );

    if (npc) {
      const point = this.worldToMinimap(npc.x, npc.y);
      map.fillStyle(0x7ed7ed, 1);
      map.fillCircle(point.x, point.y, 2.5);
    }

    const markers: Phaser.GameObjects.GameObject[] = [];

    for (const item of this.interactables) {
      if (item.type !== "resource") continue;

      const point = this.worldToMinimap(item.x, item.y);

      const color =
        item.resourceType === "Гриб"
          ? 0xe68ca9
          : item.resourceType === "Ягоды"
            ? 0xd95779
            : item.resourceType === "Камень"
              ? 0xbfc8c6
              : item.resourceType === "Древесина"
                ? 0x93613e
                : item.resourceType === "Волокна"
                  ? 0x9dbb67
                  : 0x9b78c9;

      const marker = this.add
        .circle(
          point.x,
          point.y,
          2,
          color,
          item.state === "available" ? 1 : 0.2
        )
        .setStrokeStyle(0.5, 0xffffff, 0.65);

      this.minimapResourceMarkers.set(item.id, marker);
      markers.push(marker);
    }

    const title = this.add.text(10, 5, "МИНИ-КАРТА", {
      fontFamily: "Arial",
      fontSize: "9px",
      fontStyle: "bold",
      color: "#e7d9ff",
      letterSpacing: 1,
    });

    this.minimapPlayerMarker = this.add
      .circle(spawn.x, spawn.y, 3.5, 0xffffff)
      .setStrokeStyle(1, 0x7651c7);

    this.minimap = this.add.container(
      0,
      0,
      [
        panel,
        map,
        title,
        ...markers,
        this.minimapPlayerMarker,
      ]
    );

    this.minimap.setScrollFactor(0);
    this.minimap.setDepth(1150);
    this.minimap.setSize(132, 94);
    this.minimap.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 132, 94),
      Phaser.Geom.Rectangle.Contains
    );

    this.minimap.on(
      Phaser.Input.Events.POINTER_DOWN,
      (
        pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        this.handleMinimapNavigation(pointer);
        event.stopPropagation();
      }
    );
  }

  private worldToMinimap(x: number, y: number) {
    return {
      x:
        this.minimapBounds.x +
        (x / this.worldWidth) * this.minimapBounds.width,
      y:
        this.minimapBounds.y +
        (y / this.worldHeight) * this.minimapBounds.height,
    };
  }

  private updateResourceMinimapMarker(
    target: InteractableObject
  ) {
    const marker = this.minimapResourceMarkers.get(target.id);

    if (!marker) return;

    marker.setAlpha(
      target.state === "available" ? 1 : 0.2
    );
  }

  private updateMinimap() {
    if (!this.player || !this.minimapPlayerMarker) return;

    const point = this.worldToMinimap(
      this.player.x,
      this.player.y
    );

    this.minimapPlayerMarker.setPosition(
      point.x,
      point.y
    );
  }

  private positionMinimap() {
    if (!this.minimap || !this.scale) return;

    this.minimap.setPosition(
      Math.max(8, this.scale.width - 140),
      8
    );
  }

  private handleMinimapNavigation(
    pointer: Phaser.Input.Pointer
  ): boolean {
    if (
      !this.minimap ||
      this.dialogueOpen ||
      this.inventoryOpen
    ) {
      return false;
    }

    const localX = pointer.x - this.minimap.x;
    const localY = pointer.y - this.minimap.y;

    const { x, y, width, height } = this.minimapBounds;

    const insideMap =
      localX >= x &&
      localX <= x + width &&
      localY >= y &&
      localY <= y + height;

    if (!insideMap) return false;

    const normalizedX = (localX - x) / width;
    const normalizedY = (localY - y) / height;

    this.setMovementDestination(
      normalizedX * this.worldWidth,
      normalizedY * this.worldHeight
    );

    return true;
  }

  // --------------------------------------------------
  // DAY AND NIGHT
  // --------------------------------------------------

  private createDayNightSystem() {
    this.dayNightOverlay = this.add
      .rectangle(
        0,
        0,
        this.scale.width,
        this.scale.height,
        0x101b45,
        0
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(900);

    this.timeLabel = this.add
      .text(12, 65, "", {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#ded2f2",
        backgroundColor: "#211633",
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1100);

    this.updateDayNight(0);
  }

  private updateDayNight(delta = 0) {
    if (!this.dayNightOverlay || !this.timeLabel) return;

    this.elapsedTime += delta;

    // Полный игровой день длится 12 минут реального времени.
    this.worldTime = (
      0.35 + this.elapsedTime / 720000
    ) % 1;

    const hour = Math.floor(this.worldTime * 24);

    let alpha = 0;
    let label = "День";

    if (hour >= 5 && hour < 8) {
      alpha = 0.12;
      label = "Рассвет";
    } else if (hour >= 8 && hour < 17) {
      alpha = 0;
      label = "День";
    } else if (hour >= 17 && hour < 20) {
      alpha = 0.16;
      label = "Закат";
    } else {
      alpha = 0.38;
      label = "Ночь";
    }

    this.dayNightOverlay.setSize(
      this.scale.width,
      this.scale.height
    );
    this.dayNightOverlay.setAlpha(alpha);

    this.timeLabel.setText(
      `${String(hour).padStart(2, "0")}:00 · ${label}`
    );
  }

  // --------------------------------------------------
  // INTERACTION SYSTEM
  // --------------------------------------------------

  private updateNearbyInteractable() {
    if (
      !this.player ||
      !this.interactionPanel ||
      !this.mobileInteractButton
    ) {
      return;
    }

    let nearest: InteractableObject | null = null;
    let nearestDistance = this.interactionDistance;

    for (const item of this.interactables) {
      if (
        item.type === "resource" &&
        item.state !== "available"
      ) {
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
      this.mobileInteractButton.setVisible(true);
      this.mobileButtonText.setText("×");
      this.mobileButtonBackground.setFillStyle(
        0x795b65,
        0.98
      );
      return;
    }

    if (this.inventoryOpen) {
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
    let mobileIcon = "⌕";

    if (nearest.type === "npc") {
      hint = `E — поговорить: ${nearest.name}`;
      mobileIcon = "…";
    } else if (nearest.type === "resource") {
      hint = `E — собрать: ${nearest.name}`;
      mobileIcon = "+";
    } else {
      hint = `E — осмотреть: ${nearest.name}`;
      mobileIcon = "⌕";
    }

    this.interactionLabel.setText(hint);
    this.interactionPanel.setVisible(true);
    this.mobileInteractButton.setVisible(true);

    this.mobileButtonText.setText(mobileIcon);
    this.mobileButtonBackground.setFillStyle(
      0x65458c,
      0.98
    );
  }

  private handleInteraction() {
    if (this.dialogueOpen) {
      this.closeDialogue();
      return;
    }

    if (this.inventoryOpen) {
      this.closeInventory();
      return;
    }

    const target = this.nearbyInteractable;

    if (!target || !this.player) return;

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      target.x,
      target.y
    );

    if (distance > this.interactionDistance) return;

    if (target.type === "npc") {
      this.openNPCDialogue(target);
    } else if (target.type === "camp") {
      this.openCampDialogue(target);
    } else if (target.type === "resource") {
      this.collectResource(target);
    }
  }

  private openNPCDialogue(target: InteractableObject) {
    this.dialogueOpen = true;
    this.movementTarget = null;
    this.hideTargetMarker();

    const dialogues = [
      "Приветствую, путешественник. Эти земли хранят множество тайн. Осмотрись вокруг — здесь можно найти полезные ресурсы.",
      "В лесах неподалёку растут ягоды и грибы. А если отправишься дальше на восток, найдёшь залежи руды.",
      "Будь осторожен в своих странствиях. И возвращайся в лагерь, если понадобится помощь.",
    ];

    const index = target.dialogueIndex ?? 0;

    this.showDialogue(
      target.name,
      dialogues[index % dialogues.length]
    );

    target.dialogueIndex = index + 1;
  }

  private openCampDialogue(target: InteractableObject) {
    this.dialogueOpen = true;
    this.movementTarget = null;
    this.hideTargetMarker();

    const messages: Record<string, string> = {
      Костёр:
        "Тёплый костёр путешественников. Здесь можно передохнуть после долгой дороги.",
      Палатка:
        "Небольшая палатка. Похоже, здесь остановились исследователи этих земель.",
      Припасы:
        "Запасы лагеря. Возможно, в будущем здесь появится возможность обменивать и хранить предметы.",
    };

    this.showDialogue(
      target.name,
      messages[target.name] ?? "Здесь пока нечего исследовать."
    );
  }

  private showDialogue(title: string, message: string) {
    this.dialogueTitle.setText(title);
    this.dialogueText.setText(message);

    this.dialoguePanel.setVisible(true);
    this.positionDialogue();

    this.interactionPanel.setVisible(false);
    this.mobileInteractButton.setVisible(true);
    this.mobileButtonText.setText("×");
    this.mobileButtonBackground.setFillStyle(
      0x795b65,
      0.98
    );
  }

  private closeDialogue() {
    this.dialogueOpen = false;
    this.dialoguePanel.setVisible(false);
    this.dialogueTitle.setText("ЭЛИАН");

    this.updateNearbyInteractable();
  }

  // --------------------------------------------------
  // INVENTORY
  // --------------------------------------------------

  private updateInventoryInterface() {
    if (!this.resourceCounter || !this.inventoryWindowText) {
      return;
    }

    const total = Object.values(this.resourceCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    this.resourceCounter.setText(`✦ ${total} ресурсов`);

    this.inventoryWindowText.setText(
      [
        `🍄  Грибы: ${this.resourceCounts.Гриб}`,
        `🍓  Ягоды: ${this.resourceCounts.Ягоды}`,
        `◆  Камень: ${this.resourceCounts.Камень}`,
        `🪵  Древесина: ${this.resourceCounts.Древесина}`,
        `✧  Волокна: ${this.resourceCounts.Волокна}`,
        `♦  Руда: ${this.resourceCounts.Руда}`,
        "",
        `Всего предметов: ${total}`,
      ].join("\n")
    );
  }

  public openInventory() {
    if (this.dialogueOpen) return;

    this.inventoryOpen = true;
    this.movementTarget = null;
    this.hideTargetMarker();

    this.updateInventoryInterface();
    this.inventoryWindow.setVisible(true);

    this.interactionPanel.setVisible(false);
    this.mobileInteractButton.setVisible(false);

    this.positionInventory();
  }

  private closeInventory() {
    this.inventoryOpen = false;
    this.inventoryWindow.setVisible(false);

    this.updateNearbyInteractable();
  }

  // --------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------

  private showNotification(message: string) {
    if (!this.notificationContainer) return;

    this.notificationTween?.stop();
    this.notificationTween = null;

    this.notificationText.setText(message);

    this.notificationContainer.setVisible(true);
    this.notificationContainer.setAlpha(0);
    this.notificationContainer.setScale(0.9);

    this.notificationTween = this.tweens.add({
      targets: this.notificationContainer,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: "Back.easeOut",
      hold: 1500,
      yoyo: true,
      onComplete: () => {
        this.notificationContainer.setVisible(false);
      },
    });

    this.positionNotification();
  }

  // --------------------------------------------------
  // INTERFACE POSITIONING
  // --------------------------------------------------

  private positionInterface() {
    if (!this.scale) return;

    const width = this.scale.width;
    const height = this.scale.height;

    this.resourceCounter?.setPosition(12, 12);

    this.interactionPanel?.setPosition(
      width / 2,
      height - 75
    );

    this.mobileInteractButton?.setPosition(
      width - 55,
      height - 75
    );

    this.timeLabel?.setPosition(12, 65);

    this.positionDialogue();
    this.positionInventory();
    this.positionNotification();
  }

  private positionDialogue() {
    if (!this.dialoguePanel) return;

    const width = this.scale.width;
    const height = this.scale.height;

    this.dialoguePanel.setPosition(
      Math.max(8, (width - 320) / 2),
      Math.max(12, height - 155)
    );
  }

  private positionInventory() {
    if (!this.inventoryWindow) return;

    this.inventoryWindow.setPosition(
      (this.scale.width - 310) / 2,
      (this.scale.height - 330) / 2
    );
  }

  private positionNotification() {
    if (!this.notificationContainer) return;

    this.notificationContainer.setPosition(
      this.scale.width / 2,
      95
    );
  }

  // --------------------------------------------------
  // CONTROLS
  // --------------------------------------------------

  private setupControls() {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();

      this.interactKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.E
      );

      this.inventoryKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.I
      );

      this.escapeKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ESC
      );

      this.input.keyboard.on("keydown-ESC", () => {
        if (this.dialogueOpen) {
          this.closeDialogue();
        } else if (this.inventoryOpen) {
          this.closeInventory();
        }
      });
    }

    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (pointer: Phaser.Input.Pointer) => {
        if (
          this.dialogueOpen ||
          this.inventoryOpen ||
          !pointer.isDown
        ) {
          return;
        }

        if (this.handleMinimapNavigation(pointer)) {
          return;
        }

        const worldPoint = this.cameras.main.getWorldPoint(
          pointer.x,
          pointer.y
        );

        this.setMovementDestination(
          worldPoint.x,
          worldPoint.y
        );
      }
    );
  }

  // --------------------------------------------------
  // CAMERA
  // --------------------------------------------------

  private setupCamera() {
    const camera = this.cameras.main;

    camera.setBounds(
      0,
      0,
      this.worldWidth,
      this.worldHeight
    );

    camera.startFollow(
      this.player,
      true,
      0.08,
      0.08
    );

    camera.setZoom(
      Math.min(
        1,
        Math.max(0.75, this.scale.width / 900)
      )
    );
  }

  // --------------------------------------------------
  // LIFECYCLE
  // --------------------------------------------------

  private setupLifecycle() {
    this.scale.on(
      Phaser.Scale.Events.RESIZE,
      () => {
        this.positionInterface();
        this.positionMinimap();

        this.cameras.main.setZoom(
          Math.min(
            1,
            Math.max(0.75, this.scale.width / 900)
          )
        );
      }
    );

    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      () => {
        this.targetMarkerTween?.stop();
        this.notificationTween?.stop();

        for (const tween of this.ambientTweens) {
          tween.stop();
        }

        this.ambientTweens.length = 0;

        for (const target of this.interactables) {
          target.respawnEvent?.remove(false);
        }

        this.input.off(
          Phaser.Input.Events.POINTER_DOWN
        );

        this.scale.off(Phaser.Scale.Events.RESIZE);
      }
    );
  }

  // --------------------------------------------------
  // UPDATE
  // --------------------------------------------------

  update(
    _time: number,
    delta: number
  ) {
    if (!this.player || !this.player.active) return;

    if (this.dialogueOpen || this.inventoryOpen) {
      this.updatePlayerAnimation(false);
      this.updateDayNight(delta);
      return;
    }

    let movement = this.updateKeyboardMovement();

    if (movement.lengthSq() > 0) {
      movement.normalize();

      this.movementTarget = null;
      this.hideTargetMarker();

      movement.scale(
        this.playerSpeed * Math.min(delta, 50) / 1000
      );
    } else {
      movement = this.updateTapMovement(delta);
    }

    const moving = movement.lengthSq() > 0;

    this.updatePlayerAnimation(moving);

    if (moving) {
      this.updatePlayerFacing(movement.x);

      this.movePlayer(
        movement.x,
        movement.y
      );
    }

    if (
      this.interactKey &&
      Phaser.Input.Keyboard.JustDown(this.interactKey)
    ) {
      this.handleInteraction();
    }

    if (
      this.inventoryKey &&
      Phaser.Input.Keyboard.JustDown(this.inventoryKey)
    ) {
      this.openInventory();
    }

    if (
      this.escapeKey &&
      Phaser.Input.Keyboard.JustDown(this.escapeKey)
    ) {
      if (this.dialogueOpen) {
        this.closeDialogue();
      } else if (this.inventoryOpen) {
        this.closeInventory();
      }
    }

    this.updateNearbyInteractable();
    this.updateMinimap();
    this.updateDayNight(delta);
  }
}