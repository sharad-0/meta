import BagPackAnimator from "BagPackAnimator";
import { NotificationTypes, PlayerRoles } from "Enums_Game";
import { CameraMode } from "horizon/camera";
import * as hz from "horizon/core";
import { Color, SpawnPointGizmo, Vec3 } from "horizon/core";
import { Npc } from "horizon/npc";
import Manager_CashPool from "Manager_CashPool";
import {
  ParlourClosedEvent,
  ParlourOpenedEvent,
  PlayerJoinedEvent,
  PlayerSwitchedRoleEvent,
  RushHourBegins,
  RushHourEnds,
  SecondPassedEvent,
} from "Manager_Events";
import Manager_NavMesh from "Manager_NavMesh";
import Manager_NPC from "Manager_NPC";
import Manager_Town from "Manager_Town";
import Managers_Instance, {
  cashierUIManager,
  cashPoolManager,
  hudManager,
  inventoryManager,
  navMeshManager,
  npcManager,
  orderManager,
  playerManager,
  ringArrowManager,
  scooperHandManager,
  serverManager,
  tableManager,
  themeSessionManager,
} from "Managers_Instance";
import { PlayerCameraEvents } from "PlayerCamera";

export default class Manager_MainArena extends hz.Component<
  typeof Manager_MainArena
> {
  private static _instance: Manager_MainArena | null = null;
  static get(): Manager_MainArena | null {
    if (!Manager_MainArena._instance) {
      return null;
    }
    return Manager_MainArena._instance;
  }

  static propsDefinition = {
    TownManager: { type: hz.PropTypes.Entity },
    RoleSwitchPlatform: { type: hz.PropTypes.Entity },
    NPCManager: { type: hz.PropTypes.Entity },
    CashPoolManager: { type: hz.PropTypes.Entity },
    NavMeshManager: { type: hz.PropTypes.Entity },

    spawnPoint: { type: hz.PropTypes.Entity, required: true },
    mainDoor: { type: hz.PropTypes.Entity },
    mainDoor1Collision: { type: hz.PropTypes.Entity },
    mainDoor2Collision: { type: hz.PropTypes.Entity },
    timerUI: { type: hz.PropTypes.Entity },

    // Timings (in seconds)
    parlourOpenTime: { type: hz.PropTypes.Number, default: 10 }, // in seconds
    happyHourTime: { type: hz.PropTypes.Number, default: 30 }, // in seconds
    parlourCloseTime: { type: hz.PropTypes.Number, default: 300 }, // in seconds
    parlourBreakTime: { type: hz.PropTypes.Number, default: 30 }, // in seconds

    mainBGM: { type: hz.PropTypes.Entity },
    rushHourBGM: { type: hz.PropTypes.Entity },
  };

  private parlourOpen: boolean = false;
  private rushHour: boolean = false;
  private parlourOnBreak: boolean = false;

  private spawnPoint: hz.SpawnPointGizmo | null = null;

  private sessionTime: number = 0; // in seconds
  private parlourSessionTime: number = 0; // in seconds
  private parlourOpenTime: number = 10; // in seconds

  private updateEventSub?: hz.EventSubscription;
  private rushHourPopup: boolean = false;
  preStart(): void {
    // if (Manager_MainArena._instance) {
    //   console.error("Main Arena Manager is already initialised.");

    //   // delete this entity to avoid duplicate instances
    //   this.world.deleteAsset(this.entity);
    //   return;
    // }

    Manager_MainArena._instance = this;
    this.registerDisposeOperation(() => {
      Manager_MainArena._instance = null;
    });
  }

  start() {
    navMeshManager?.bakeNavMesh();
    this.setManagers();
    this.updateEventSub = this.connectLocalBroadcastEvent(
      hz.World.onUpdate,
      (data) => {
        this.update(data.deltaTime);
      }
    );

    this.parlourOpenTime = this.props.parlourOpenTime ?? 10;
  }

  private lastPassedSec = 0;

  update(deltaTime: number): void {
    this.sessionTime += deltaTime;
    this.parlourSessionTime += deltaTime;

    if (!this.parlourOpen && this.parlourSessionTime >= this.parlourOpenTime) {
      // console.log.*$
      this.RushHourEffectsOnBGM(false);

      this.onParlourOpen();
    }
    if (
      this.parlourOpen &&
      !this.rushHour &&
      Math.abs(this.parlourSessionTime - this.props.happyHourTime) <= 3
    ) {
      this.rushHourBeginPopup();
    }

    if (
      this.parlourOpen &&
      !this.rushHour &&
      this.parlourSessionTime >= this.props.happyHourTime
    ) {
      // console.log.*$
      this.rushHour = true;
      // playerManager?.getCurrentPlayers().forEach((player) => {
      //   hudManager?.showPopupNotifToPlayer(
      //     NotificationTypes.RushHourBegin,
      //     player,
      //     3
      //   );
      // });
      this.rushHourPopup = false;
      this.RushHourEffectsOnBGM(true);
      // this.RushHourEffectsOnPlayers();
      // Notify all players about rush hour
      cashPoolManager?.updateCashPoolUI();
      this.sendNetworkBroadcastEvent(RushHourBegins, {});
    }

    if (
      this.parlourOpen &&
      this.parlourSessionTime >= this.props.parlourCloseTime
    ) {
      // console.log.*$
      this.RushHourEffectsOnBGM(false);
      this.sendNetworkBroadcastEvent(RushHourEnds, {});

      // this.ClearRushHourEffectsOnPlayers();
      this.onParlourClosed();
    }

    if (Math.ceil(this.sessionTime) > this.lastPassedSec) {
      this.lastPassedSec = Math.ceil(this.sessionTime);
      this.sendLocalBroadcastEvent(SecondPassedEvent, {});
    }
  }
  rushHourBeginPopup() {
    if (this.rushHourPopup) return;
    this.rushHourPopup = true;
    const popupOptions = {
      position: new Vec3(0, 0.13, 0),
      fontSize: 2.5,
      backgroundColor: Color.fromHex("#FFF5E9"),
      showTimer: true,
      fontColor: Color.fromHex("#8A5008"),
    };
    this.world.ui.showPopupForEveryone(
      `Rush hour starting in...`,
      3,
      popupOptions
    );
  }
  RushHourEffectsOnBGM(isRushHour?: boolean): void {
    if (isRushHour) {
      if (themeSessionManager?.isChristmasSessionActive()) {
        themeSessionManager?.stopChristmasBg();
      } else {
        this.props.mainBGM!.as(hz.AudioGizmo).stop({
          fade: 1,
        });
      }
      this.props.rushHourBGM!.as(hz.AudioGizmo).play({ fade: 1 });
    } else {
      this.props.rushHourBGM!.as(hz.AudioGizmo).stop({
        fade: 1,
      });
      if (themeSessionManager?.isChristmasSessionActive()) {
        themeSessionManager?.playChristmasBg();
      } else {
        this.props.mainBGM!.as(hz.AudioGizmo).play();
      }
    }
  }

  // RushHourEffectsOnPlayers(): void {
  //   this.world.getPlayers().forEach((player) => {
  //     if (Npc.playerIsNpc(player)) {
  //       const currentSpeed = player.locomotionSpeed.get();
  //       player.locomotionSpeed.set(currentSpeed * 1.5);
  //     } else {
  //       const currentSpeed = player.locomotionSpeed.get();
  //       player.locomotionSpeed.set(currentSpeed * 2);
  //     }
  //   });
  // }

  // ClearRushHourEffectsOnPlayers(): void {
  //   this.world.getPlayers().forEach((player) => {
  //     if (Npc.playerIsNpc(player)) {
  //       const currentSpeed = player.locomotionSpeed.get();
  //       player.locomotionSpeed.set(currentSpeed / 1.5);
  //     } else {
  //       const currentSpeed = player.locomotionSpeed.get();
  //       player.locomotionSpeed.set(currentSpeed / 2);
  //     }
  //   });
  // }

  TeleportPlayerToSpawnPoint(player: hz.Player): boolean {
    // Teleport the player to the spawn point.
    // console.log.*$
    //   `[SpawnPoint] Teleporting player ${player.name.get()} to spawn point.`
    // );
    if (!this.props.spawnPoint) {
      console.error(`[SpawnPoint] Spawn point is not defined.`);
      return false;
    }
    const inGamePlayer = this.world
      .getPlayers()
      ?.find((p) => p.id === player.id);
    if (!inGamePlayer) {
      console.error(
        `[SpawnPoint] Player ${player.name.get()} is not in the game world.`
      );
      return false;
    }
    this.world.matchmaking.allowPlayerJoin(true); // allow other players to join again

    this.props.spawnPoint.as(SpawnPointGizmo).teleportPlayer(inGamePlayer);

    return true;
  }
  GetSpawnPointLocation(): hz.Vec3 {
    if (!this.props.spawnPoint) {
      console.error(`[SpawnPoint] Spawn point is not defined.`);
      return new hz.Vec3(0, 0, 0);
    }
    return this.props.spawnPoint.as(SpawnPointGizmo).position.get();
  }
  setManagers() {
    const instanceManager = Managers_Instance.get();
    instanceManager.setMainArenaManager(this);
    instanceManager.setTownManager(
      this.props.TownManager!.getComponents(Manager_Town)[0] ?? null
    );
    instanceManager.setNpcManager(
      this.props.NPCManager!.getComponents(Manager_NPC)[0] ?? null
    );
    instanceManager.setCashPoolManager(
      this.props.CashPoolManager!.getComponents(Manager_CashPool)[0] ?? null
    );
    instanceManager.setNavMeshManager(
      this.props.NavMeshManager!.getComponents(Manager_NavMesh)[0] ?? null
    );
  }

  onParlourOpen() {
    this.parlourOpen = true;
    this.rushHour = false;
    this.parlourOnBreak = false;
    this.parlourSessionTime = 0;
    this.props.mainDoor1Collision!.collidable.set(false);
    this.props.mainDoor2Collision!.collidable.set(false);
    this.props.timerUI!.visible.set(false);
    if (this.props.timerUI) {
      this.props.timerUI!.visible.set(false);
    } else {
      console.warn("Timer UI entity is not set in Manager_MainArena.");
    }
    this.setRoleSwitchPlatform(true);

    npcManager?.onParlourOpen();
    cashPoolManager?.onParlourOpened();
    playerManager?.onParlourOpened();
    orderManager?.onParlourOpened();
    tableManager?.resetAllTables();
    ringArrowManager?.onParlourOpened(this.props.mainDoor!);
    playerManager?.getCurrentPlayers().forEach((player) => {
      hudManager?.showPopupNotifToPlayer(
        NotificationTypes.ParlorOpen,
        player,
        3
      );
    });

    this.sendLocalBroadcastEvent(ParlourOpenedEvent, {});
  }

  onParlourClosed() {
    this.parlourSessionTime = 0;
    this.parlourOpen = false;
    this.rushHour = false;
    this.parlourOnBreak = true;

    const players = this.world.getPlayers() ?? [];
    players.forEach((player) => {
      this.props.spawnPoint!.as(SpawnPointGizmo).teleportPlayer(player);
      hudManager?.showPopupNotifToPlayer(
        NotificationTypes.ShiftEnded,
        player,
        3
      );
      cashierUIManager?.hideHud(player);
      const playerRole = playerManager?.getRole(player);

      if (playerRole !== PlayerRoles.Fetcher) return;
      const vacuumEntity = playerManager?.getVacuumEntityByPlayer(player);
      if (vacuumEntity) {
        const bagPackComp = vacuumEntity.getComponents(BagPackAnimator)[0];
        bagPackComp.vacuumOut(false);
      }
      // this.async.setTimeout(() => {
      //   player.clearAvatarGripPoseOverride();
      //   this.sendNetworkEvent(player, PlayerCameraEvents.SetCameraMode, {
      //     mode: CameraMode.ThirdPerson,
      //   });
      // }, 450);
    });

    this.parlourOpenTime = this.props.parlourBreakTime; // increase the open time to 1 minute after the first round
    // this.props.mainDoor!.visible.set(true);
    this.props.mainDoor1Collision!.collidable.set(true);
    this.props.mainDoor2Collision!.collidable.set(true);
    this.props.timerUI!.visible.set(true);
    this.setRoleSwitchPlatform(false);
    npcManager?.onParlourClose();
    cashPoolManager?.onParlourClosed();
    playerManager?.onParlourClosed();
    orderManager?.onParlourClosed();
    tableManager?.resetAllTables();
    scooperHandManager?.resetAllHands();
    serverManager?.onParlourClosed();
    inventoryManager?.onParlourClosed();
    this.deleteAllIceCreams();
    this.sendLocalBroadcastEvent(ParlourClosedEvent, {});
  }

  isParlourOpen(): boolean {
    return this.parlourOpen;
  }

  isHappyHour(): boolean {
    return this.rushHour; // after 30 seconds, happy hour starts
  }

  isParlourOnBreak(): boolean {
    return this.parlourOnBreak;
  }

  getTimeToOpenParlour(): number {
    if (this.parlourOpen) return 0;
    return Math.max(
      0,
      Math.ceil(this.parlourOpenTime - this.parlourSessionTime)
    );
  }

  getTimeToCloseParlour(): number {
    if (!this.parlourOpen) return 0;
    return Math.max(
      0,
      Math.ceil(this.props.parlourCloseTime - this.parlourSessionTime)
    );
  }

  dispose(): void {
    this.updateEventSub?.disconnect();
  }

  setRoleSwitchPlatform(enable: boolean) {
    if (this.props.RoleSwitchPlatform) {
      this.props.RoleSwitchPlatform.as(hz.TriggerGizmo).enabled.set(enable);
    }
  }

  async deleteAllIceCreams() {
    const entities = this.world.getEntitiesWithTags(["IceCreamCone"]);
    entities.forEach(async (cone) => {
      if (cone.exists()) {
        cone.visible.set(false);
        await this.world.deleteAsset(cone, true);
      }
    });
  }
}
hz.Component.register(Manager_MainArena);
