import {
  Component,
  Entity,
  Vec3,
  Player,
  Color,
  World,
  PropTypes,
  CodeBlockEvents,
  TriggerGizmo,
  AvatarGripPose,
} from "horizon/core";
import { Items, NotificationTypes, parseItem, PlayerRoles } from "Enums_Game";
import {
  bagManager,
  gameManager,
  hapticsManager,
  hudManager,
  playerAnimations,
  playerManager,
  trainingManager,
} from "Managers_Instance";
import MonsterMinimal from "Component_MonsterMinimal";
import { monsterPulledIn, setMonsterIndex } from "Manager_Events";
import BagPackAnimator from "BagPackAnimator";
import { PlayerCameraEvents } from "PlayerCamera";
import { CameraMode } from "horizon/camera";
import { Npc } from "horizon/npc";

enum State {
  Idle,
  Running,
  Pulled,
  Respawning,
  ScalingDown,
}

interface MonsterData {
  entity: Entity;
  index: number;
  state: State;
  waypointIdx: number;
  waypoints: Vec3[];
  respawnTimer: number;
  originalScale: Vec3;
  scaleLerpTime: number;
  scaleHidden: boolean;
  pulledTarget: Vec3 | null;
  pulledEntity: Entity | null;
  isProcessing: boolean; // Prevent race condition
  scaleDownTime: number;
  resetScale: Vec3;
}

export default class MonsterManager extends Component<typeof MonsterManager> {
  static propsDefinition = {
    respawnDelay: { type: PropTypes.Number, default: 3.0 },
    idleSpeed: { type: PropTypes.Number, default: 1.2 },
    runSpeed: { type: PropTypes.Number, default: 3.5 },
    pulledScaleTime: { type: PropTypes.Number, default: 10 },
    itemKeyStr: { type: PropTypes.String, default: "item1" },
    amount: { type: PropTypes.Number, default: 1 },
    spawnAsset: { type: PropTypes.Asset },
    spawnCount: { type: PropTypes.Number, default: 5 },
    spawnArea: { type: PropTypes.Entity },
    fetchingZoneTrigger: { type: PropTypes.Entity },
    monsterMovementArea: { type: PropTypes.Entity },
    fetchRadius: { type: PropTypes.Number, default: 5 },
  } as const;

  private monsters: MonsterData[] = [];
  private hiddenPos = new Vec3(-100, -100, -100);
  private itemKey?: Items;

  private spawnedEntities: Entity[] = [];
  private fetchingZoneWaypoints: Vec3[] = [];
  private readonly NUM_WAYPOINTS = 5;

  private playerInsideFetchingZone = false;
  private playersInArea: Player[] = [];

  start() {
    this.itemKey = parseItem(this.props.itemKeyStr);

    if (
      !this.props.spawnAsset ||
      !this.props.spawnArea ||
      !this.props.fetchingZoneTrigger
    ) {
      console.error(
        "Spawn asset, spawn area or fetching zone trigger is not set"
      );
      return;
    }

    this.generateFetchingZoneWaypoints();

    this.spawnEntities(this.props.spawnCount);

    this.connectLocalBroadcastEvent(World.onUpdate, (data) => {
      this.updateAllMonsters(data.deltaTime);
    });

    this.connectLocalBroadcastEvent(monsterPulledIn, (data) => {
      if (data.itemKey !== this.props.itemKeyStr) return;
      this.handleMonsterPulled(data.monsterIndex, data.targetEntity);
    });

    // Detect player enter fetching zone -> monsters run
    this.connectCodeBlockEvent(
      this.props.fetchingZoneTrigger!.as(TriggerGizmo),
      CodeBlockEvents.OnPlayerEnterTrigger,
      (player) => {
        this.onPlayerEnterRegion(player);
      }
    );

    // Detect player exit fetching zone -> monsters idle
    this.connectCodeBlockEvent(
      this.props.fetchingZoneTrigger!.as(TriggerGizmo),
      CodeBlockEvents.OnPlayerExitTrigger,
      (player) => {
        this.onPlayerExitRegion(player);
      }
    );
  }

  onPlayerEnterRegion(player: Player) {
    const role = playerManager?.getRole(player);
    if (role && role !== PlayerRoles.Fetcher) return;

    if (this.playersInArea.includes(player)) return;
    this.playersInArea.push(player);
    this.playerInsideFetchingZone = true;

    this.monsters.forEach((monster) => {
      if (monster.state === State.Idle) {
        monster.state = State.Running;
      }
    });
  }

  onPlayerExitRegion(player: Player) {
    const role = playerManager?.getRole(player);
    if (role && role !== PlayerRoles.Fetcher) return;

    this.playersInArea = this.playersInArea.filter((p) => p !== player);
    // console.log.*$

    this.playerInsideFetchingZone = false;
    this.monsters.forEach((monster) => {
      if (monster.state === State.Running) {
        monster.state = State.Idle;
      }
    });
  }

  private generateFetchingZoneWaypoints() {
    const fetchTrigger = this.props.monsterMovementArea;
    const radius = this.props.fetchRadius ?? 5;

    if (!fetchTrigger) {
      console.warn("Fetching zone trigger not set");
      this.fetchingZoneWaypoints = [];
      return;
    }

    const center = fetchTrigger.position.get();

    const waypoints: Vec3[] = [];

    for (let i = 0; i < this.NUM_WAYPOINTS; i++) {
      // Generate points uniformly around a circle of given radius centered at fetchTrigger
      const angle =
        (i / this.NUM_WAYPOINTS) * Math.PI * 2 + Math.random() * 0.5; // slightly randomized angle
      const x = center.x + radius * Math.cos(angle);
      const z = center.z + radius * Math.sin(angle);
      const y = center.y;
      waypoints.push(new Vec3(x, y, z));
    }

    this.fetchingZoneWaypoints = waypoints;
  }

  private spawnEntities(count: number) {
    for (let i = 0; i < count; i++) {
      this.async.setTimeout(() => {
        this.world
          .spawnAsset(
            this.props.spawnAsset!,
            this.getRandomPositionInSpawnArea(),
            this.entity.rotation.get()
          )
          .then((entities) => {
            if (entities.length === 0) {
              console.warn("No entities spawned");
              return;
            }
            const entity = entities[0];
            this.spawnedEntities.push(entity);

            const monsterIndex = this.monsters.length;

            const monster: MonsterData = {
              entity,
              index: monsterIndex,
              state: this.playerInsideFetchingZone ? State.Running : State.Idle,
              waypointIdx: 0,
              waypoints: [],
              respawnTimer: 0,
              originalScale: entity.scale.get().clone(),
              scaleLerpTime: 0,
              scaleHidden: false,
              pulledTarget: null,
              pulledEntity: null,
              isProcessing: false,
              scaleDownTime: 0,
              resetScale: entity.scale.get().clone(),
            };
            this.monsters.push(monster);

            this.sendLocalEvent(entity, setMonsterIndex, {
              index: monsterIndex,
            });

            this.createWaypoints(monster);
          });
      }, i * 1000);
    }
  }

  private getRandomPositionInSpawnArea(): Vec3 {
    const spawnArea = this.props.spawnArea;
    if (!spawnArea) return this.entity.position.get();

    const center = spawnArea.position.get();
    const radius = 5;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * radius;

    const x = center.x + distance * Math.cos(angle);
    const z = center.z + distance * Math.sin(angle);
    const y = center.y;
    return new Vec3(x, y, z);
  }

  private createWaypoints(monster: MonsterData) {
    if (this.fetchingZoneWaypoints.length === 0) {
      const fallbackPos = monster.entity.position.get();
      monster.waypoints = [fallbackPos, fallbackPos, fallbackPos];
      monster.waypointIdx = 0;
      return;
    }

    const selected: Vec3[] = [];
    const usedIndices = new Set<number>();

    while (
      selected.length < 3 &&
      usedIndices.size < this.fetchingZoneWaypoints.length
    ) {
      const idx = Math.floor(Math.random() * this.fetchingZoneWaypoints.length);
      if (!usedIndices.has(idx)) {
        selected.push(this.fetchingZoneWaypoints[idx]);
        usedIndices.add(idx);
      }
    }

    while (selected.length < 3) {
      selected.push(
        selected[selected.length - 1] ||
        this.props.spawnArea?.position.get() ||
        monster.entity.position.get()
      );
    }

    monster.waypoints = selected;
    monster.waypointIdx = 0;
  }

  private updateAllMonsters(dt: number) {
    for (const monster of this.monsters) {
      this.updateMonster(monster, dt);
    }
  }

  private updateMonster(monster: MonsterData, dt: number) {
    if (monster.state === State.ScalingDown) {
      monster.scaleDownTime += dt;
      const t = Math.min(monster.scaleDownTime / 1.0, 0.25); // 1 second for scaling down

      // Lerp from original scale to 0.5x
      const targetScale = new Vec3(
        monster.originalScale.x * 0.5,
        monster.originalScale.y * 0.5,
        monster.originalScale.z * 0.5
      );
      const scaleNow = this.lerpVec3(monster.originalScale, targetScale, t);
      monster.entity.scale.set(scaleNow);

      if (t >= 0.25) {
        monster.state = State.Pulled; // Start pulling in
        monster.scaleLerpTime = 0;
        // monster.originalScale = targetScale.clone(); // For the next lerp phase
      }
      return; // Prevent further movement until scaling is done
    }
    if (monster.state !== State.Pulled) {
      const curScale = monster.entity.scale.get();
      if (
        curScale.x !== monster.originalScale.x ||
        curScale.y !== monster.originalScale.y ||
        curScale.z !== monster.originalScale.z
      ) {
        monster.entity.scale.set(monster.originalScale);
      }
    }

    if (
      monster.state === State.Pulled &&
      !monster.scaleHidden &&
      monster.pulledTarget
    ) {
      monster.scaleLerpTime += dt;
      const t = Math.min(
        monster.scaleLerpTime / this.props.pulledScaleTime,
        1.0
      );

      if (monster.pulledEntity) {
        monster.pulledTarget = monster.pulledTarget;
      }

      const currentPos = monster.entity.position.get();
      const newPos = this.lerpVec3(currentPos, monster.pulledTarget, t);
      monster.entity.position.set(newPos);

      const scaleNow = this.lerpVec3(
        monster.originalScale,
        new Vec3(0, 0, 0),
        t
      );
      monster.entity.scale.set(scaleNow);

      if (t >= 1.0) {
        monster.entity.position.set(this.hiddenPos);
        monster.scaleHidden = true;
        monster.respawnTimer = this.props.respawnDelay;
      }
      return;
    }

    if (monster.state === State.Pulled && monster.scaleHidden) {
      if ((monster.respawnTimer -= dt) <= 0) {
        this.resetMonster(monster);
      }
      return;
    }

    if (monster.state === State.Idle || monster.state === State.Running) {
      if (monster.waypoints.length !== 3) this.createWaypoints(monster);

      const cur = monster.entity.position.get();
      const tgt = monster.waypoints[monster.waypointIdx];
      const dx = tgt.x - cur.x,
        dz = tgt.z - cur.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const speed =
        monster.state === State.Running
          ? this.props.runSpeed
          : this.props.idleSpeed;
      const step = speed * dt;

      if (dist <= step) {
        monster.entity.position.set(new Vec3(tgt.x, cur.y, tgt.z));
        monster.waypointIdx = (monster.waypointIdx + 1) % 3;
      } else {
        const nx = dx / dist,
          nz = dz / dist;
        monster.entity.position.set(
          new Vec3(cur.x + nx * step, cur.y, cur.z + nz * step)
        );
      }
    }
  }

  private lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
    return new Vec3(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t,
      a.z + (b.z - a.z) * t
    );
  }

  private async handleMonsterPulled(monsterIndex: number, entity: Entity) {
    // // console.log.*$
    if (monsterIndex < 0 || monsterIndex >= this.monsters.length) return;
    const monster = this.monsters[monsterIndex];
    if (monster.state === State.Pulled || monster.state === State.ScalingDown)
      return;

    if (monster.isProcessing) return;
    monster.isProcessing = true;
    // // console.log.*$

    let player = entity.parent.get()?.owner.get() as Player | undefined;
    if (player === this.world.getServerPlayer()) {
      player = playerManager?.getRolePlayers(PlayerRoles.Fetcher)[0];
    }
    if (!player) {
      monster.isProcessing = false;
      return;
    }
    // // console.log.*$

    if (playerManager?.getRole(player) !== PlayerRoles.Fetcher) {
      console.warn(
        `[MonsterManager] Player ${playerManager?.getRole(
          player
        )} is not a Fetcher. Ignoring monster pull.`
      );
      if (!Npc.playerIsNpc(player)) {
        // console.log.*$
        //   `[MonsterManager] step 3b Monster processing. ${Npc.playerIsNpc(
        //     player
        //   )}`
        // );

        monster.isProcessing = false;
        return;
      }
    }

    // // console.log.*$

    const vacuumComp = playerManager
      ?.getVacuumEntityByPlayer(player)
      ?.getComponents(BagPackAnimator)[0];

    if (!vacuumComp) {
      monster.isProcessing = false;
      return;
    }
    // // console.log.*$

    if (!vacuumComp.isVacuumActive) {
      monster.isProcessing = false;
      return;
    }
    // // console.log.*$

    const capacity = bagManager?.getBagCapacity(player) ?? 0;
    const totalItems = bagManager?.getTotalItemCount(player) ?? 0;

    if (capacity > 0 && totalItems >= capacity) {
      this.notifyBagFull(player);
      vacuumComp.playBagFullSound();
      monster.isProcessing = false;
      // hapticsManager?.playStrongRumble(player);
      return;
    } else if (capacity > 0) {
      hapticsManager?.playShortBuzz(player);
      vacuumComp.playCollectSound();
    }

    // console.log.*$

    const curScale = monster.entity.scale.get();
    const halfScale = new Vec3(
      curScale.x * 0.5,
      curScale.y * 0.5,
      curScale.z * 0.5
    );
    const playerPos = player.position.get();
    const playerLegPos = new Vec3(playerPos.x, playerPos.y * 0, playerPos.z);
    monster.entity.scale.set(halfScale);
    monster.state = State.ScalingDown;
    monster.scaleDownTime = 0;
    monster.scaleLerpTime = 0;
    monster.scaleHidden = false;
    monster.pulledEntity = entity;
    monster.pulledTarget = playerLegPos;
    monster.waypoints = [];
    const minimalComp = monster.entity.getComponents(MonsterMinimal)[0] as any;
    minimalComp?.triggerParticleEffect();
    try {
      if (this.itemKey !== undefined) {
        bagManager?.increaseItem(player, this.itemKey, this.props.amount);
        // console.log.*$
        //   `MonsterManager Added item ${this.itemKey} for monster ${monster.index}`
        // );

        if (
          totalItems >= capacity - 1 &&
          gameManager?.isThisTrainingSession() &&
          this.itemKey === Items.Vanilla
        ) {
          trainingManager?.triggerNextFTUETask(player, 1, "Success");
        }
      }
    } catch (err) {
      console.error("MonsterManager Error adding item", err);
      monster.isProcessing = false;
      return;
    }

    // monster.waypoints = [];
    monster.isProcessing = false;
  }

  private resetMonster(monster: MonsterData) {
    monster.state = this.playerInsideFetchingZone ? State.Running : State.Idle;
    monster.scaleLerpTime = 0;
    monster.scaleHidden = false;
    monster.entity.scale.set(monster.resetScale);
    monster.entity.position.set(this.getRandomPositionInSpawnArea());
    monster.pulledTarget = null;
    monster.pulledEntity = null;
    const minimalComp = monster.entity.getComponents(MonsterMinimal)[0] as any;
    monster.isProcessing = false;
  }

  private notifyBagFull(player: Player) {
    if (gameManager?.isThisTrainingSession()) {
      return;
    }
    hudManager?.showPopupNotifToPlayer(NotificationTypes.bagFull, player, 3);
  }
}

Component.register(MonsterManager);
