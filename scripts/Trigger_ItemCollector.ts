import {
  AudioGizmo,
  CodeBlockEvents,
  Color,
  Component,
  DefaultPopupOptions,
  Entity,
  Player,
  PropTypes,
  TextGizmo,
  Vec3,
  Quaternion,
  AvatarGripPose,
} from "horizon/core";
import SquarePlateProgress from "Component_CollectorProgressBar";
import TaskManager, { ActionType } from "TaskManager";
import {
  CustomAnalyticsEvents,
  getEnumKeyFromValue,
  Items,
  itemVsMachineAnimationName,
  NotificationTypes,
  parseItem,
  PlayerRoles,
} from "Enums_Game";
import {
  bagManager,
  gameManager,
  hapticsManager,
  hudManager,
  inventoryManager,
  playerManager,
  snowflakeManager,
  trainingManager,
} from "Managers_Instance";
import Trigger_ScooperInteraction from "Trigger_ScooperInteraction";
import {
  AssetBundleGizmo,
  AssetBundleInstanceReference,
} from "horizon/unity_asset_bundles";
import { ParlourClosedEvent } from "Manager_Events";
import BagPackAnimator from "BagPackAnimator";
import { CameraMode } from "horizon/camera";
import { PlayerCameraEvents } from "PlayerCamera";
import { Npc } from "horizon/npc";
import { AnalyticsManager } from "AnalyticsManager";

export default class ItemCollector extends Component<typeof ItemCollector> {
  static propsDefinition = {
    itemKey: { type: PropTypes.String, default: "item1" },
    progressBar: { type: PropTypes.Entity },

    itemAsset: { type: PropTypes.Asset },
    collector: { type: PropTypes.Entity },
    scooperTrigger: { type: PropTypes.Entity },

    parabolicHeight: { type: PropTypes.Number, default: 2 },
    travelTime: { type: PropTypes.Number, default: 0.5 },
    machineAsset: { type: PropTypes.Entity },
    bladeAsset: { type: PropTypes.Entity },
    machineAnimParameter: { type: PropTypes.String, default: "cone_machine" },
    cameraOffset: { type: PropTypes.Vec3, default: new Vec3(2, 0, 0) },
    translationSpeed: { type: PropTypes.Number, default: 4.0 },
    collisionsEnabled: { type: PropTypes.Boolean, default: false },
    keepCameraOnExit: { type: PropTypes.Boolean, default: false },
    liquidEntity: { type: PropTypes.Entity },
  } as const;

  private item: Items = Items.Cone;
  private itemCapacity: number = 5;

  private itemDepositSound: AudioGizmo | null = null;
  private colr2 = Color.fromHex("#76EC8C");
  private colr1 = Color.fromHex("#FFFFFF");
  private glowLoopTimer: number | undefined;
  private projectileTimer: number | null = null;

  private _projectiles: Array<{
    entity: Entity;
    start: Vec3;
    control: Vec3;
    end: Vec3;
    t: number;
  }> = [];

  private itemAsset1: Entity = new Entity(BigInt(0));
  private itemAsset2: Entity = new Entity(BigInt(0));
  private itemAsset3: Entity = new Entity(BigInt(0));
  private scooperInteractionTrigger: Trigger_ScooperInteraction | null = null;

  start(): void {
    // Update labels/progress bar every 0.5s
    // this.animateAsset();
    this.async.setInterval(() => {
      const currentItemCount = inventoryManager?.getAmount(this.item) ?? 0;
      this.updateProgressBar();
      this.animateAsset(currentItemCount);
    }, 500);
  }

  preStart(): void {
    this.item = parseItem(this.props.itemKey) ?? Items.Cone;

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.onPlayerEnter.bind(this)
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitTrigger,
      this.onPlayerExit.bind(this)
    );

    this.connectLocalBroadcastEvent(ParlourClosedEvent, () => {
      this.updateProgressBar();
    });

    // this.updateProgressBar();

    if (!this.props.scooperTrigger) {
      console.warn("Scooper trigger is missing for item: ", this.props.itemKey);
      return;
    }
    this.scooperInteractionTrigger = this.props.scooperTrigger.getComponents(
      Trigger_ScooperInteraction
    )[0];
  }

  private onPlayerEnter(player: Player): void {
    if (playerManager?.getRole(player) !== PlayerRoles.Fetcher) return;

    const itemName = getEnumKeyFromValue(this.props.itemKey as Items);
    const capacity = Math.max(0, this.itemCapacity);

    try {
      if (this.item !== undefined) {
        const available = bagManager?.getBag(player)[this.item] ?? 0;
        if (available <= 0) {
          return;
        }
        const toTake = Math.min(available, capacity);
        const actuallyTaken = inventoryManager?.add(this.item, toTake) ?? 0;
        // this.vacuumOut(player);

        // this.async.setTimeout(() => {
        // player.setAvatarGripPoseOverride(AvatarGripPose.Pistol);

        const currentItemCount = inventoryManager?.getAmount(this.item) ?? 0;
        // this.spawnAndMoveItem(player, actuallyTaken);
        this.markItemCollected(actuallyTaken, player, this.item, itemName!);
        hapticsManager?.playShortBuzz(player);
        if (!this.scooperInteractionTrigger) {
          console.warn(
            "[Scooper_Trigger] Scooper interaction trigger not found."
          );
          this.scooperInteractionTrigger =
            this.props.scooperTrigger!.getComponents(
              Trigger_ScooperInteraction
            )[0];
        }

        this.scooperInteractionTrigger?.handleTrigger();

        if (
          gameManager?.isThisTrainingSession() &&
          this.item === Items.Vanilla
        ) {
          trainingManager?.triggerNextFTUETask(player, 2, "Success");
        }
        // }, 1500);
      }
    } catch (err) {
      // console.log.*$
    }
  }

  vacuumOut(player: Player) {
    const vacuumEntity = playerManager?.getVacuumEntityByPlayer(player);

    if (vacuumEntity) {
      const bagPackComp = vacuumEntity.getComponents(BagPackAnimator)[0];
      bagPackComp.vacuumThrow(true);
    }
  }
  animateGunForItems(player: Player, itemCount: number) {
    const vacuumEntity = playerManager?.getVacuumEntityByPlayer(player);
    if (vacuumEntity) {
      const bagPackComp = vacuumEntity.getComponents(BagPackAnimator)[0];
      bagPackComp.animateGunForItems(itemCount);
    }
  }
  markItemCollected(
    actuallyTaken: number,
    player: Player,
    itemKey: Items,
    itemName: string
  ) {
    if (actuallyTaken > 0) {
      bagManager?.decreaseItem(player, itemKey, actuallyTaken);

      playerManager?.addFetcherAction(player, actuallyTaken);
      snowflakeManager?.addSnowflakeCurrencyToPlayer(player);
      const currentItemAmount = bagManager?.getTotalItemCount(player) ?? 0;
      this.animateGunForItems(player, currentItemAmount);
      // this.updateProgressBar();
      this.playSound();

      // TaskManager.recordAction(
      //   player,
      //   ActionType.DepositIngredient,
      //   actuallyTaken
      // );
      // switch (itemKey) {
      //   case Items.Cone:
      //     TaskManager.recordAction(
      //       player,
      //       ActionType.DepositCone,
      //       actuallyTaken
      //     );
      //     break;
      //   case Items.Vanilla:
      //     TaskManager.recordAction(
      //       player,
      //       ActionType.DepositVanilla,
      //       actuallyTaken
      //     );
      //     break;
      //   case Items.Strawberry:
      //     TaskManager.recordAction(
      //       player,
      //       ActionType.DepositStrawberry,
      //       actuallyTaken
      //     );
      //     break;
      //   case Items.Chocolate:
      //     TaskManager.recordAction(
      //       player,
      //       ActionType.DepositChocolate,
      //       actuallyTaken
      //     );
      //     break;
      // }

      if (!Npc.playerIsNpc(player)) {
        AnalyticsManager.s_instance.sendFetcherDeposit(
          player,
          itemKey,
          actuallyTaken
        );
      }
    } else {
      // let popupOptions = {
      //   ...DefaultPopupOptions,
      //   position: new Vec3(0, 0.3, 0),
      //   fontSize: 3,
      //   backgroundColor: Color.fromHex("#f06363"),
      // };
      // this.world.ui.showPopupForPlayer(
      //   player,
      //   `At max capacity for ${itemName}`,
      //   3,
      //   popupOptions
      // );
      hudManager?.showPopupNotifToPlayer(
        NotificationTypes.maxCapacity,
        player,
        3
      );

      // this.updateProgressBar();
    }

    this.async.setTimeout(() => {
      this.updateProgressBar();
    }, 0);
  }

  private currentDisplayed = 0;
  private animHandle: number | null = null;

  updateProgressBar() {
    const remaining = inventoryManager?.getRemaining(this.item) ?? 0;
    const progressBar =
      this.props.progressBar?.getComponents(SquarePlateProgress)[0];
    progressBar?.setProgress(
      (this.itemCapacity - remaining) / this.itemCapacity
    );
  }

  playSound() {
    if (this.itemDepositSound) this.itemDepositSound.play();
  }
  stopSound() {
    if (this.itemDepositSound) this.itemDepositSound.stop();
  }

  onPlayerExit(player: Player): void {
    this.stopSound();
    const vacuumEntity = playerManager?.getVacuumEntityByPlayer(player);

    if (vacuumEntity) {
      const bagPackComp = vacuumEntity.getComponents(BagPackAnimator)[0];
      bagPackComp.vacuumThrow(false);
    }
    // this.async.setTimeout(() => {
    //   player.clearAvatarGripPoseOverride();
    // }, 250);
    // this.sendNetworkEvent(player, PlayerCameraEvents.SetCameraMode, {
    //   mode: CameraMode.ThirdPerson,
    // });
  }

  spawnAndMoveItem(player: Player, count: number) {
    if (!this.props.collector) return;
    const pool: Entity[] = [
      this.itemAsset1,
      this.itemAsset2,
      this.itemAsset3,
    ].filter(<T>(e: T | undefined): e is T => !!e);
    if (pool.length === 0) return;

    const start = this.entity.position.get();
    const end = this.props.collector.position.get();
    const control = player.position
      .get()
      .add(new Vec3(0, this.props.parabolicHeight, 0));
    const launchDelay = 150; // ms

    for (let i = 0; i < count; i++) {
      const entity = pool[i % pool.length];
      this.async.setTimeout(() => {
        entity.position.set(start);
        entity.rotation.set(Quaternion.one);
        entity.scale.set(new Vec3(0.05, 0.05, 0.05));
        this._projectiles.push({ entity, start, control, end, t: 0 });
        this._ensureProjectileLoop();
      }, i * launchDelay);
    }
  }

  private _ensureProjectileLoop() {
    if (this.projectileTimer !== null) return;
    this.projectileTimer = this.async.setInterval(() => {
      this._updateProjectilesFixedStep();
    }, 30);
  }

  private _updateProjectilesFixedStep() {
    const dt = 0.05; // fixed time per step in seconds
    const duration = Math.max(0.01, this.props.travelTime);

    for (let i = this._projectiles.length - 1; i >= 0; i--) {
      const p = this._projectiles[i];

      // Progress t normally
      p.t = Math.min(1, p.t + dt / duration);

      // Apply smoothstep easing to t for smoother motion
      const easedT = p.t * p.t * (3 - 2 * p.t); // smoothstep(0, 1, t)

      // Get Bézier position with eased t
      const bezierPos = this._bezier(p.start, p.control, p.end, easedT);

      // Slight interpolation from current position to bezierPos
      const currentPos = p.entity.position.get();
      const smoothPos = Vec3.lerp(currentPos, bezierPos, 0.7);
      p.entity.position.set(smoothPos);

      // Scale animation with peak in the middle
      const scaleFactor = 0.5 + 0.5 * Math.sin(Math.PI * easedT); // smoother arc scaling
      p.entity.scale.set(new Vec3(scaleFactor, scaleFactor, scaleFactor));

      // Done with projectile?
      if (p.t >= 1) {
        p.entity.scale.set(new Vec3(0, 0, 0));
        this._projectiles.splice(i, 1);
      }
    }

    // Stop interval if no projectiles remain
    if (this._projectiles.length === 0 && this.projectileTimer !== null) {
      this.async.clearInterval(this.projectileTimer);
      this.projectileTimer = null;
    }
  }

  private _bezier(a: Vec3, b: Vec3, c: Vec3, t: number): Vec3 {
    const s = 1 - t;
    return new Vec3(
      s * s * a.x + 2 * s * t * b.x + t * t * c.x,
      s * s * a.y + 2 * s * t * b.y + t * t * c.y,
      s * s * a.z + 2 * s * t * b.z + t * t * c.z
    );
  }

  animateAsset(itemCount: number = 0) {
    // Get the AssetBundleGizmo from this entity.
    const assetBundle = this.props.machineAsset!.as(AssetBundleGizmo);
    const bladeAssetBundle = this.props.bladeAsset!.as(AssetBundleGizmo);
    const liquidAssetBundle = this.props.liquidEntity!.as(AssetBundleGizmo);
    // Get the root instance to control animation parameters.
    const assetRoot = assetBundle?.getRoot();
    const bladeRoot = bladeAssetBundle?.getRoot();
    const liquidRoot = liquidAssetBundle?.getRoot();

    // // console.log.*$
    //   `animation Blade parameters ${JSON.stringify(
    //     bladeRoot.getAnimationParameters()
    //   )}`
    // );
    // // console.log.*$
    //   `animation Machine parameters ${JSON.stringify(
    //     assetRoot.getAnimationParameters()
    //   )}`
    // );
    // this.setLiquidHeight(itemCount);
    if (itemCount > 0) {
      this.startAnimation(bladeRoot, assetRoot, liquidRoot);
    } else {
      this.stopAnimation(bladeRoot, assetRoot);
    }

    this.setLiquidHeight(itemCount);
  }

  startAnimation(
    bladeRoot: AssetBundleInstanceReference,
    assetRoot: AssetBundleInstanceReference,
    liquidRoot: AssetBundleInstanceReference
  ) {
    if (bladeRoot) {
      bladeRoot.setAnimationParameterBool("cone_machine", true);
    }
    if (assetRoot) {
      assetRoot.setAnimationParameterBool(
        itemVsMachineAnimationName[
        this.props.itemKey as keyof typeof itemVsMachineAnimationName
        ],
        true
      );
    }
    if (liquidRoot) {
      liquidRoot.setAnimationParameterBool("Slow", true);
    }
  }
  setLiquidHeight(itemCount: number) {
    if (this.props.liquidEntity) {
      // // return;
      // let idx = itemCount;
      // // if(itemCount >= 5) idx = 4;
      // const heights = [0, -0.4, -0.3, -0.2, -0.1, 0];
      // const maxHeight = 0;

      // const currentHeight = this.props.liquidEntity!.position.get().y;
      // const targetHeight = heights[idx];
      // // console.log.*$
      //   `Liquid Current Height: ${currentHeight}, Target Height: ${targetHeight}`
      // );
      // if (currentHeight === targetHeight) return;

      // this.props.liquidEntity!.position.set(new Vec3(0, targetHeight, 0));
      if (itemCount === 0) {
        this.props.liquidEntity!.visible.set(false);
      } else {
        this.props.liquidEntity!.visible.set(true);
      }
    }
  }

  stopAnimation(
    bladeRoot: AssetBundleInstanceReference,
    assetRoot: AssetBundleInstanceReference
  ) {
    if (bladeRoot) {
      bladeRoot.setAnimationParameterBool("cone_machine", false);
    }
    if (assetRoot) {
      assetRoot.setAnimationParameterBool(
        itemVsMachineAnimationName[
        this.props.itemKey as keyof typeof itemVsMachineAnimationName
        ],
        false
      );
    }
  }
}

Component.register(ItemCollector);
