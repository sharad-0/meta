import {
  Component,
  Color,
  Entity,
  Player,
  PropTypes,
  Vec3,
  CodeBlockEvents,
  TrailGizmo,
  TriggerGizmo,
} from "horizon/core";
import { playerManager, bagManager, hudManager } from "Managers_Instance";
import { NotificationTypes, parseItem, PlayerRoles } from "Enums_Game";
import { AssetBundleGizmo } from "horizon/unity_asset_bundles";

enum MonsterState {
  Idle,
  PulledIn,
  Respawning,
}

enum AnimParams {
  Idle = "idle",
  Walk = "walk",
  Shrink = "shrink",
}
export default class NavMeshMonsterLogicCheck extends Component<
  typeof NavMeshMonsterLogicCheck
> {
  static propsDefinition = {
    respawnDelay: { type: PropTypes.Number, default: 3.5 },
    itemKey: { type: PropTypes.String, default: "item1" },
    ingredientName: { type: PropTypes.String, default: "Ingredient" },
    amount: { type: PropTypes.Number, default: 1 },
    entityTrigger: { type: PropTypes.Entity },
    unityAsset: { type: PropTypes.Entity },
    spawnArea: { type: PropTypes.Entity },
  } as const;

  private state: MonsterState = MonsterState.Idle;
  private respawnTimer = 0;
  private initialSpawnPos?: Vec3;
  private hiddenPosition = new Vec3(-100, -100, -100);
  private waypoints: Vec3[] = [];
  private waypointIndex: number = 0;
  private fetchingZoneCenter?: Vec3;

  // Movement speeds and speed boost state
  private moveSpeedNormal = 1.5;
  private moveSpeedBoosted = 4.0;
  private isSpeedBoosted = false;
  async start() {
    this.initialSpawnPos = this.entity.position.get().clone();

    const tagName = `${this.props.ingredientName}FetchingTr`;
    const fetchingZoneEntity = this.world.getEntitiesWithTags([tagName])[0];

    if (fetchingZoneEntity) {
      this.fetchingZoneCenter = fetchingZoneEntity.position.get().clone();
      this.setupWaypoints();
      this.connectCodeBlockEvent(
        fetchingZoneEntity,
        CodeBlockEvents.OnPlayerEnterTrigger,
        () => {
          // console.log.*$
          //   `Ingredient Movement Walk for ${this.props.ingredientName}`
          // );
          this.isSpeedBoosted = true;
          // this.animateAsset(AnimParams.Walk, true);
        }
      );
      this.connectCodeBlockEvent(
        fetchingZoneEntity,
        CodeBlockEvents.OnPlayerExitTrigger,
        () => {
          // console.log.*$
          //   `Ingredient Movement Idle for ${this.props.ingredientName}`
          // );
          this.isSpeedBoosted = false;
          // this.animateAsset(AnimParams.Idle, true);
        }
      );
    }

    this.connectCodeBlockEvent(
      this.props.entityTrigger!,
      CodeBlockEvents.OnPlayerEnterTrigger,
      (player: Player) => this.tryPickup(player)
    );
    this.connectCodeBlockEvent(
      this.props.entityTrigger!,
      CodeBlockEvents.OnEntityEnterTrigger,
      (entity: Entity) => this.onEntityTouch(entity)
    );
    this.async.setInterval(() => this.updateAI(), 50);
  }

  private onEntityTouch(entity: Entity) {
    const player = entity.parent.get()?.owner.get();

    if (player) {
      this.tryPickup(player);
    }
  }
  private setupWaypoints() {
    // Pick 3 random points on a circle radius 5 centered on fetchingZoneCenter or initialSpawnPos
    this.waypoints = [];
    const center =
      this.fetchingZoneCenter ?? this.initialSpawnPos ?? new Vec3(0, 0, 0);
    const radius = 5;
    for (let i = 0; i < 3; ++i) {
      const angle = Math.random() * Math.PI * 2;
      this.waypoints.push(
        new Vec3(
          center.x + radius * Math.cos(angle),
          center.y, // keep Y consistent with center
          center.z + radius * Math.sin(angle)
        )
      );
    }
    this.waypointIndex = 0;
  }
  private getCurrentMoveSpeed(): number {
    return this.isSpeedBoosted ? this.moveSpeedBoosted : this.moveSpeedNormal;
  }

  moveEntity(dt: number) {
    if (this.state === MonsterState.Idle && this.waypoints.length === 3) {
      const currentPos = this.entity.position.get();
      const target = this.waypoints[this.waypointIndex];

      // Movement only in XZ plane, Y unchanged
      const dx = target.x - currentPos.x;
      const dz = target.z - currentPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const moveStep = this.getCurrentMoveSpeed() * dt;

      if (distance <= moveStep) {
        this.entity.position.set(new Vec3(target.x, currentPos.y, target.z));
        this.waypointIndex = (this.waypointIndex + 1) % 3;
      } else {
        const nx = dx / distance;
        const nz = dz / distance;
        this.entity.position.set(
          new Vec3(
            currentPos.x + nx * moveStep,
            currentPos.y,
            currentPos.z + nz * moveStep
          )
        );
      }
    }
  }

  private tryPickup(player: Player) {
    // Immediately return if already picked up
    if (this.state === MonsterState.PulledIn) return;

    // Verify role
    if (playerManager?.getRole(player) !== PlayerRoles.Fetcher) return;

    // Check bag capacity immediately
    const capacity = bagManager?.getBagCapacity(player) ?? 0;
    const totalItems = bagManager?.getTotalItemCount(player) ?? 0;

    if (capacity > 0 && totalItems >= capacity) {
      this.notifyBagFull(player);
      return;
    }

    this.animateAsset(AnimParams.Shrink, true);

    this.async.setTimeout(() => {
      // Set state immediately to prevent duplicate pickups
      this.state = MonsterState.PulledIn;

      // Add item instantly
      try {
        const item = parseItem(this.props.itemKey);
        if (item !== undefined) {
          bagManager?.increaseItem(player, item, this.props.amount);
        }
      } catch (err) {
        console.error("NavMeshMonsterLogicCheck: Error adding item", err);
      }
      this.waypoints = []; // Clear waypoints to stop movement
      // Teleport monster instantly out of view
      this.entity.position.set(this.hiddenPosition);
      this.props.entityTrigger!.as(TriggerGizmo).enabled.set(false);
      // Start respawn timer immediately
      this.respawnTimer = this.props.respawnDelay;
    }, 2000);
  }

  private notifyBagFull(player: Player) {
    // const popupOptions = {
    //   position: new Vec3(0, 0.3, 0),
    //   fontSize: 3.5,
    //   backgroundColor: Color.fromHex("#f06363"),
    // };
    // this.world.ui.showPopupForPlayer(player, `Bag is full`, 2, popupOptions);

    hudManager?.showPopupNotifToPlayer(NotificationTypes.bagFull, player, 3);
  }

  private updateAI() {
    const dt = 0.05;
    if (this.state === MonsterState.PulledIn) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.respawnMonster();
      }
    }

    // this.moveEntity(dt);
  }

  private respawnMonster() {
    if (this.initialSpawnPos) {
      this.state = MonsterState.Idle;
      // const spawnPos = this.fetchingZoneCenter?.componentMul(new Vec3(1,0,1));
      const spawnPos = this.props.spawnArea?.position.get();
      this.entity.position.set(spawnPos ?? this.initialSpawnPos);
      this.isSpeedBoosted = false; // reset speed
      this.animateAsset(AnimParams.Idle, true);
      this.async.setTimeout(() => {
        this.props.entityTrigger!.as(TriggerGizmo).enabled.set(true);
        this.setupWaypoints();
      }, 500);
    }
  }

  animateAsset(paramName: AnimParams, paramCondition: boolean) {
    switch (paramName) {
      case AnimParams.Idle:
        this.triggerIdleAnimation();
        break;
      case AnimParams.Walk:
        this.triggerWalkAnimation();
        break;
      case AnimParams.Shrink:
        this.triggerShrinkAnimation();
        break;
      default:
        console.warn(`Unknown animation parameter: ${paramName}`);
        break;
    }
  }

  triggerIdleAnimation() {
    const assetBundle = this.props.unityAsset?.as(AssetBundleGizmo);
    const assetRoot = assetBundle?.getRoot();
    if (assetRoot) {
      // console.log.*$
      //   `Ingredient Movement Idle Animation for ${this.props.ingredientName}`
      // );

      assetRoot.setAnimationParameterBool(AnimParams.Idle, true);
      assetRoot.setAnimationParameterBool(AnimParams.Walk, false);
      assetRoot.setAnimationParameterBool(AnimParams.Shrink, false);
    }
  }

  triggerWalkAnimation() {
    const assetBundle = this.props.unityAsset?.as(AssetBundleGizmo);
    const assetRoot = assetBundle?.getRoot();
    if (assetRoot) {
      // console.log.*$
      //   `Ingredient Movement Walk Animation for ${this.props.ingredientName}`
      // );
      assetRoot.setAnimationParameterBool(AnimParams.Idle, false);
      assetRoot.setAnimationParameterBool(AnimParams.Walk, true);
      assetRoot.setAnimationParameterBool(AnimParams.Shrink, false);
    }
  }

  triggerShrinkAnimation() {
    const assetBundle = this.props.unityAsset?.as(AssetBundleGizmo);
    const assetRoot = assetBundle?.getRoot();
    if (assetRoot) {
      // console.log.*$
      //   `Ingredient Movement Shrink Animation for ${this.props.ingredientName}`
      // );

      assetRoot.setAnimationParameterBool(AnimParams.Idle, false);
      assetRoot.setAnimationParameterBool(AnimParams.Walk, false);
      assetRoot.setAnimationParameterBool(AnimParams.Shrink, true);
    }
  }
}

Component.register(NavMeshMonsterLogicCheck);
