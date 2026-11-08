import Phaser from "phaser";

type InteractableType = "npc" | "resource" | "camp";
type ResourceType = "Гриб" | "Ягоды" | "Камень";
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
  private minimapResourceMarkers = new Map<string, Phaser.GameObjects.Arc>();

  private interactionPanel!: Phaser.GameObjects.Container;
  private interactionLabel!: Phaser.GameObjects.Text;

  private dialoguePanel!: Phaser.GameObjects.Container;
  private dialogueTitle!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;

  private mobileInteractButton!: Phaser.GameObjects.Container;
  private mobileButtonBackground!: Phaser.GameObjects.Arc;
  private mobileButtonText!: Phaser.GameObjects.Text;

  private resourceCounter!: Phaser.GameObjects.Text;
  private inventoryPanel!: Phaser.GameObjects.Container;
  private inventoryText!: Phaser.GameObjects.Text;

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
    y: 20,
    width: 116,
    height: 65,
  };

  constructor() {
    super("MeadowScene");
  }

  create() {
    this.resetSceneState();
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
    this.createDayNightSystem();

    this.positionInterface();
    this.positionMinimap();
    this.setupControls();
    this.setupCamera();
    this.setupLifecycle();

    this.updateNearbyInteractable();
    this.updateMinimap();
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
  }

  // WORLD

  private createGround() {
    this.add
      .rectangle(
        this.worldWidth / 2,
        this.worldHeight / 2,
        this.worldWidth,
        this.worldHeight,
        0x294b43
      )
      .setDepth(0);

    const graphics = this.add.graphics();
    let seed = 91731;

    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const colors = [0x426c50, 0x527b55, 0x345d49, 0x63865a];

    for (let i = 0; i < 850; i++) {
      const x = random() * this.worldWidth;
      const y = random() * this.worldHeight;
      const color = colors[Math.floor(random() * colors.length)];

      graphics.fillStyle(color, 0.35 + random() * 0.45);
      graphics.fillCircle(x, y, 1 + random() * 2);
    }

    graphics.setDepth(1);

    for (let i = 0; i < 22; i++) {
      const x = 100 + random() * (this.worldWidth - 200);
      const y = 100 + random() * (this.worldHeight - 200);

      this.add
        .ellipse(x, y, 90 + random() * 100, 55 + random() * 55, 0x63865a, 0.08)
        .setDepth(2);
    }

    const stones = this.add.graphics();

    for (let i = 0; i < 65; i++) {
      stones.fillStyle(0x9caa91, 0.15);
      stones.fillEllipse(
        random() * this.worldWidth,
        random() * this.worldHeight,
        5 + random() * 5,
        2 + random() * 3
      );
    }

    stones.setDepth(3);
  }

  private createPaths() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x8b7854, 0.65);
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

    graphics.setDepth(4);

    const details = this.add.graphics();
    details.lineStyle(2, 0xc0a77b, 0.22);
    details.beginPath();
    details.moveTo(1130, 850);
    details.lineTo(1210, 790);
    details.lineTo(1300, 735);
    details.lineTo(1390, 665);
    details.strokePath();
    details.setDepth(5);
  }

  private isNearImportantArea(x: number, y: number, distance: number) {
    const spawnDistance = Phaser.Math.Distance.Between(
      x, y, this.spawnPosition.x, this.spawnPosition.y
    );

    const campDistance = Phaser.Math.Distance.Between(
      x, y, this.campPosition.x, this.campPosition.y
    );

    return spawnDistance < distance || campDistance < distance;
  }

  private createNature() {
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(30, this.worldWidth - 30);
      const y = Phaser.Math.Between(30, this.worldHeight - 30);

      if (this.isNearImportantArea(x, y, 105)) continue;

      const flower = this.add.container(x, y);
      const color = Phaser.Utils.Array.GetRandom([
        0xe6c7ff,
        0xffd6a5,
        0xf6a8c8,
        0xf2e6a1,
      ]);

      flower.add([
        this.add.circle(0, 0, 2, color),
        this.add.circle(3, -2, 2, color),
        this.add.circle(-3, -2, 2, color),
        this.add.circle(0, -4, 2, color),
        this.add.circle(0, -1, 1, 0xffe8a8),
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

    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(100, this.worldWidth - 100);
      const y = Phaser.Math.Between(100, this.worldHeight - 100);

      const firefly = this.add
        .circle(x, y, 2, 0xd9f7a1, 0.25)
        .setDepth(y + 20);

      this.ambientTweens.push(
        this.tweens.add({
          targets: firefly,
          alpha: 0.9,
          y: y - Phaser.Math.Between(10, 30),
          duration: Phaser.Math.Between(1500, 2500),
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        })
      );
    }

    const grass = this.add.graphics();

    for (let i = 0; i < 150; i++) {
      const x = Phaser.Math.Between(20, this.worldWidth - 20);
      const y = Phaser.Math.Between(20, this.worldHeight - 20);

      grass.lineStyle(1, 0x8da96b, 0.28);
      grass.beginPath();
      grass.moveTo(x, y);
      grass.lineTo(x - 2, y - 5);
      grass.moveTo(x, y);
      grass.lineTo(x + 3, y - 6);
      grass.strokePath();
    }

    grass.setDepth(6);
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

      if (this.isNearImportantArea(x, y, 145)) continue;

      const overlaps = this.treeLocations.some(
        (tree) =>
          Phaser.Math.Distance.Between(x, y, tree.x, tree.y) < 55
      );

      if (overlaps) continue;

      this.treeLocations.push({ x, y });

      this.add.circle(x, y + 10, 12, 0x183b32).setDepth(y - 1);
      this.add.circle(x, y, 16, 0x39744b).setDepth(y);
      this.add.circle(x - 5, y - 5, 7, 0x55935c).setDepth(y + 1);

      this.obstacles.push({ x, y: y + 7, radius: 13 });
      created++;
    }
  }

  // CAMP

  private createTravelerCamp() {
    const { x, y } = this.campPosition;

    this.add.ellipse(x, y + 5, 150, 100, 0x203d30, 0.65).setDepth(y - 5);

    const tent = this.add.graphics();

    tent.fillStyle(0x8d6d9f, 1);
    tent.fillTriangle(x - 55, y - 20, x - 10, y - 70, x + 35, y - 20);

    tent.fillStyle(0x604b78, 1);
    tent.fillTriangle(x - 10, y - 20, x - 10, y - 70, x + 35, y - 20);

    tent.fillStyle(0x302b40, 1);
    tent.fillTriangle(x - 12, y - 20, x - 10, y - 48, x + 5, y - 20);

    tent.setDepth(y + 2);
    this.obstacles.push({ x: x - 10, y: y - 40, radius: 35 });

    this.add.rectangle(x + 57, y - 10, 22, 20, 0x8a633f).setDepth(y + 3);
    this.add.rectangle(x + 57, y - 10, 20, 3, 0xb38a5d).setDepth(y + 4);
    this.obstacles.push({ x: x + 57, y: y - 10, radius: 14 });

    this.add.ellipse(x - 66, y + 5, 19, 23, 0x795034).setDepth(y + 4);
    this.add.rectangle(x - 66, y + 5, 20, 3, 0xb38a5d).setDepth(y + 5);
    this.obstacles.push({ x: x - 66, y: y + 5, radius: 12 });

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.add.circle(
        x + Math.cos(angle) * 19,
        y + Math.sin(angle) * 11,
        5,
        0x9a9b83
      ).setDepth(y + 5);
    }

    this.add.rectangle(x - 8, y + 13, 34, 6, 0x795034).setAngle(-18).setDepth(y + 9);
    this.add.rectangle(x + 8, y + 13, 34, 6, 0x795034).setAngle(18).setDepth(y + 10);

    const glow = this.add.circle(x, y - 2, 28, 0xffa044, 0.12).setDepth(y + 6);

    this.ambientTweens.push(
      this.tweens.add({
        targets: glow,
        alpha: 0.25,
        scale: 1.2,
        duration: 850,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })
    );

    const fire = this.add.triangle(
      x, y - 5, 0, 20, 10, 0, 20, 20, 0xff9b42
    ).setDepth(y + 7);

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

    this.add.triangle(
      x, y - 3, 0, 13, 6, 2, 12, 13, 0xffdf80
    ).setDepth(y + 8);

    for (let i = 0; i < 3; i++) {
      const smoke = this.add.circle(
        x + Phaser.Math.Between(-4, 4),
        y - 28,
        4,
        0xc6c6c6,
        0.2
      ).setDepth(y + 12);

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
            smoke.setPosition(x + Phaser.Math.Between(-4, 4), y - 28);
            smoke.setAlpha(0.2);
            smoke.setScale(1);
          },
        })
      );
    }

    this.add.text(x, y - 100, "ЛАГЕРЬ ПУТЕШЕСТВЕННИКОВ", {
      fontFamily: "Arial",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#ffe1aa",
      stroke: "#203528",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(y + 15);

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

  // NPC

  private createNPC() {
    const x = this.campPosition.x + 85;
    const y = this.campPosition.y + 15;

    const shadow = this.add.ellipse(0, 12, 23, 8, 0x10251e, 0.45);
    const body = this.add.rectangle(0, 0, 17, 23, 0x7195a8);
    const head = this.add.circle(0, -16, 8, 0xe8c6a7);
    const hair = this.add.arc(0, -18, 8, 190, 350, false, 0x4a3528);

    hair.setStrokeStyle(5, 0x4a3528);

    const npc = this.add.container(x, y, [shadow, body, head, hair]);
    npc.setDepth(y);

    this.add.text(x, y - 42, "Элиан", {
      fontFamily: "Arial",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#fff0c9",
      stroke: "#203528",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(y + 1);

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

    this.obstacles.push({ x, y: y + 7, radius: 12 });
  }

  // RESOURCES

  private createResources() {
    const resources: ResourceDefinition[] = [
      { id: "mushroom-1", x: 1030, y: 650, type: "Гриб" },
      { id: "mushroom-2", x: 970, y: 930, type: "Гриб" },
      { id: "berry-1", x: 1480, y: 890, type: "Ягоды" },
      { id: "berry-2", x: 1580, y: 600, type: "Ягоды" },
      { id: "stone-1", x: 900, y: 710, type: "Камень" },
      { id: "stone-2", x: 1650, y: 980, type: "Камень" },
    ];

    for (const resource of resources) this.createResource(resource);
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
        this.add.line(0, 0, 0, 5, 0, -10, 0x7c9c53).setLineWidth(2),
        this.add.circle(-5, 0, 5, 0xc84d72),
        this.add.circle(5, 2, 5, 0xd95779),
        this.add.circle(0, 7, 5, 0xb73e66),
      ]);
    } else {
      container.add([
        this.add.triangle(0, 0, -9, 6, 0, -9, 10, 6, 0x9b9d9c),
        this.add.line(0, 0, -5, 1, 4, -4, 0xd2d2ca).setLineWidth(2),
      ]);
    }

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
    if (!target.sprite || !target.sprite.active) return;

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

  // PLAYER

  private createPlayer() {
    const shadow = this.add.ellipse(0, 12, 25, 9, 0x10251e, 0.45);
    const body = this.add.rectangle(0, 0, 18, 24, 0xb89aff);
    const head = this.add.circle(0, -17, 9, 0xf0d2bd);
    const hair = this.add.arc(0, -19, 9, 190, 350, false, 0x49356b);

    hair.setStrokeStyle(5, 0x49356b);

    this.player = this.add.container(
      this.spawnPosition.x,
      this.spawnPosition.y,
      [shadow, body, head, hair]
    );

    this.player.setDepth(this.player.y);

    this.playerBody = this.add.circle(
      this.spawnPosition.x,
      this.spawnPosition.y + 3,
      this.playerRadius,
      0xffffff,
      0
    ).setVisible(false);

    this.playerBody.setDepth(this.player.y + 1);
  }

  private updatePlayerAnimation(moving: boolean) {
    if (moving === this.playerMoving) return;

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
    if (Math.abs(directionX) < 0.01) return;

    this.facing = directionX > 0 ? 1 : -1;
    this.player.setScale(this.facing, 1);
  }

  // DESTINATION MARKER

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

    const targetX = Phaser.Math.Clamp(x, 20, this.worldWidth - 20);
    const targetY = Phaser.Math.Clamp(y, 20, this.worldHeight - 20);

    this.movementTarget = new Phaser.Math.Vector2(targetX, targetY);

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

    if (this.targetMarker) this.targetMarker.setVisible(false);
  }

  // MOVEMENT AND COLLISIONS

  private isBlocked(x: number, y: number) {
    for (const obstacle of this.obstacles) {
      const distance = Phaser.Math.Distance.Between(
        x, y, obstacle.x, obstacle.y
      );

      if (distance < obstacle.radius + this.playerRadius) return true;
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

    // Завершаем движение только после фактического достижения цели.
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

    // Не перелетаем через точку назначения на последнем шаге.
    const step = Math.min(
      distance,
      this.playerSpeed * Math.min(delta, 50) / 1000
    );

    return direction.scale(step);
  }

  private updateKeyboardMovement() {
    const direction = new Phaser.Math.Vector2(0, 0);

    if (!this.cursors) return direction;

    if (this.cursors.left.isDown) direction.x -= 1;
    if (this.cursors.right.isDown) direction.x += 1;
    if (this.cursors.up.isDown) direction.y -= 1;
    if (this.cursors.down.isDown) direction.y += 1;

    return direction;
  }

  // USER INTERFACE

  private createWorldInterface() {
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

    this.resourceCounter = this.add.text(
      18, 65, "Собрано ресурсов: 0", {
        fontFamily: "Arial",
        fontSize: "10px",
        color: "#e3d5ff",
        backgroundColor: "#17342b",
        padding: { x: 7, y: 5 },
      }
    ).setScrollFactor(0).setDepth(1000);

    const inventoryBackground = this.add.rectangle(
      0, 0, 150, 28, 0x17342b, 0.94
    );

    inventoryBackground.setStrokeStyle(1, 0xb89aff, 0.6);

    this.inventoryText = this.add.text(0, 0, "Рюкзак  ·  0", {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.inventoryPanel = this.add.container(
      0, 0, [inventoryBackground, this.inventoryText]
    );

    this.inventoryPanel.setScrollFactor(0);
    this.inventoryPanel.setDepth(1050);
    this.inventoryPanel.setSize(150, 28);
    this.inventoryPanel.setInteractive(
      new Phaser.Geom.Rectangle(-75, -14, 150, 28),
      Phaser.Geom.Rectangle.Contains
    );

    this.inventoryPanel.on(
      Phaser.Input.Events.POINTER_DOWN,
      () => this.toggleInventory()
    );

    const hintBackground = this.add.rectangle(
      0, 0, 250, 34, 0x14271f, 0.92
    );

    hintBackground.setStrokeStyle(1, 0xb89aff, 0.65);

    this.interactionLabel = this.add.text(0, 0, "", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 230 },
    }).setOrigin(0.5);

    this.interactionPanel = this.add.container(
      this.scale.width / 2,
      this.scale.height - 72,
      [hintBackground, this.interactionLabel]
    );

    this.interactionPanel.setScrollFactor(0);
    this.interactionPanel.setDepth(1200);
    this.interactionPanel.setVisible(false);

    const dialogueBackground = this.add.rectangle(
      0, 0, 320, 125, 0x111b20, 0.97
    );

    dialogueBackground.setStrokeStyle(1, 0xb89aff, 0.8);

    this.dialogueTitle = this.add.text(-145, -48, "ЭЛИАН", {
      fontFamily: "Arial",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#d8c4ff",
    });

    this.dialogueText = this.add.text(-145, -23, "", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#f0eee8",
      wordWrap: { width: 285 },
      lineSpacing: 4,
    });

    const closeHint = this.add.text(145, 48, "E / кнопка — закрыть", {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#a9b8ae",
    }).setOrigin(1, 0.5);

    this.dialoguePanel = this.add.container(
      this.scale.width / 2,
      this.scale.height - 160,
      [dialogueBackground, this.dialogueTitle, this.dialogueText, closeHint]
    );

    this.dialoguePanel.setScrollFactor(0);
    this.dialoguePanel.setDepth(1300);
    this.dialoguePanel.setVisible(false);

    this.mobileButtonBackground = this.add.circle(
      0, 0, 30, 0x5a447e, 0.95
    );

    this.mobileButtonBackground.setStrokeStyle(2, 0xd8c4ff, 0.9);

    this.mobileButtonText = this.add.text(0, 0, "E", {
      fontFamily: "Arial",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.mobileInteractButton = this.add.container(
      this.scale.width - 55,
      this.scale.height - 65,
      [this.mobileButtonBackground, this.mobileButtonText]
    );

    this.mobileInteractButton.setScrollFactor(0);
    this.mobileInteractButton.setDepth(1400);
    this.mobileInteractButton.setSize(60, 60);

    // ВАЖНО: здесь больше нет отдельного POINTER_DOWN.
    // Касание кнопки обрабатывается в handlePointerDown().
    this.mobileInteractButton.setVisible(false);

    const notificationBackground = this.add.rectangle(
      0, 0, 180, 32, 0x17342b, 0.95
    );

    notificationBackground.setStrokeStyle(1, 0xb89aff, 0.8);

    this.notificationText = this.add.text(0, 0, "", {
      fontFamily: "Arial",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.notificationContainer = this.add.container(
      this.scale.width / 2,
      this.scale.height - 115,
      [notificationBackground, this.notificationText]
    );

    this.notificationContainer.setScrollFactor(0);
    this.notificationContainer.setDepth(1500);
    this.notificationContainer.setAlpha(0);
  }

  private updateInventoryInterface() {
    const total =
      this.resourceCounts.Гриб +
      this.resourceCounts.Ягоды +
      this.resourceCounts.Камень;

    this.resourceCounter.setText(`Собрано ресурсов: ${total}`);
    this.inventoryText.setText(`Рюкзак  ·  ${total}`);

    if (this.inventoryOpen) this.refreshInventoryPanel();
  }

  private showNotification(message: string) {
    this.notificationTween?.stop();
    this.notificationText.setText(message);

    this.notificationContainer.setPosition(
      this.scale.width / 2,
      this.scale.height - 115
    );

    this.notificationContainer.setAlpha(0);
    this.notificationContainer.setScale(0.9);

    this.notificationTween = this.tweens.add({
      targets: this.notificationContainer,
      alpha: 1,
      scale: 1,
      duration: 180,
      yoyo: true,
      hold: 900,
      ease: "Sine.easeInOut",
    });
  }

  private toggleInventory() {
    if (this.dialogueOpen) return;

    if (this.inventoryOpen) {
      this.closeInventory();
      return;
    }

    this.inventoryOpen = true;
    this.movementTarget = null;
    this.hideTargetMarker();

    this.refreshInventoryPanel();
    this.updateNearbyInteractable();
    this.showNotification("Инвентарь открыт");
  }

  private refreshInventoryPanel() {
    const total =
      this.resourceCounts.Гриб +
      this.resourceCounts.Ягоды +
      this.resourceCounts.Камень;

    this.dialoguePanel.setVisible(this.inventoryOpen);
    this.dialogueTitle.setText("ИНВЕНТАРЬ");

    this.dialogueText.setText(
      "СОДЕРЖИМОЕ РЮКЗАКА\n\n" +
      `Грибы: ${this.resourceCounts.Гриб}\n` +
      `Ягоды: ${this.resourceCounts.Ягоды}\n` +
      `Камни: ${this.resourceCounts.Камень}\n\n` +
      `Всего предметов: ${total}`
    );
  }

  private closeInventory() {
    this.inventoryOpen = false;
    this.dialoguePanel.setVisible(false);
    this.dialogueTitle.setText("ЭЛИАН");
    this.updateNearbyInteractable();
  }

  private positionInterface() {
    if (!this.interactionPanel) return;

    const width = this.scale.width;
    const height = this.scale.height;

    this.interactionPanel.setPosition(width / 2, height - 72);
    this.dialoguePanel?.setPosition(width / 2, height - 155);
    this.mobileInteractButton?.setPosition(width - 55, height - 65);
    this.notificationContainer?.setPosition(width / 2, height - 115);
    this.inventoryPanel?.setPosition(95, 105);
  }

  // MINIMAP

  private createMinimap() {
    const panel = this.add.graphics();

    panel.fillStyle(0x101d19, 0.94);
    panel.fillRoundedRect(0, 0, 132, 94, 7);
    panel.lineStyle(1, 0xb89aff,