import { Items, PlayerRoles } from "Enums_Game";
import * as hz from "horizon/core";
import { PlayerLeftEvent } from "Manager_Events";
import UI_FTUE_Prompt from "UI_FTUE_Prompt";
import {
  gameManager,
  inventoryManager,
  playerManager,
  utilityManager,
} from "Managers_Instance";
import UI_FTUE_Task, { taskType } from "UI_FTUE_Task";
import Trigger_ScooperInteraction from "Trigger_ScooperInteraction";
import NpcSpawnerManager from "Spawner_Npc";
import { Animation_Markers } from "Animation_Markers";
import ArrowFollower from "ArrowPointer";
import Manager_FTUEMarkers from "Manager_FTUEMarkers";

const defaultRoleCounts = {
  Fetcher: 0,
  Scooper: 0,
  Cashier: 0,
  Server: 0,
  Unknown: 0,
} as const;

export type ftueType = "Prompt" | "Task";

export default class Manager_FTUE extends hz.Component<typeof Manager_FTUE> {
  static propsDefinition = {
    switchFTUE: { type: hz.PropTypes.Boolean },
    ftuePromptUI: { type: hz.PropTypes.Entity },
    ftueTaskUI: { type: hz.PropTypes.Entity },
    ftueSpawnPoint: { type: hz.PropTypes.Entity },

    coneMachineTrigger: { type: hz.PropTypes.Entity },
    vanillaMachineTrigger: { type: hz.PropTypes.Entity },
    // strawberryScoopTrigger: { type: hz.PropTypes.Entity },

    fetcherSpawnPoint: { type: hz.PropTypes.Entity },
    scooperSpawnPoint: { type: hz.PropTypes.Entity },
    serverSpawnPoint: { type: hz.PropTypes.Entity },

    replayUI: { type: hz.PropTypes.Entity },
    skipUI: { type: hz.PropTypes.Entity },

    // spawnToServerMarker: { type: hz.PropTypes.Entity },
    // serverToTableMarker: { type: hz.PropTypes.Entity },
    // tableToScooperMarker: { type: hz.PropTypes.Entity },
    // machineToFetcherMarker: { type: hz.PropTypes.Entity },
    // fetcherToStrawberryMarker: { type: hz.PropTypes.Entity },
    // strawberryToCollectorMarker: { type: hz.PropTypes.Entity },
    // collectorToScooperMarker: { type: hz.PropTypes.Entity },
    // scooperToServerMarker: { type: hz.PropTypes.Entity },
    // scooperToIceCreamMarker: { type: hz.PropTypes.Entity },
    // iceCreamToTableMarker: { type: hz.PropTypes.Entity },

    managerMarker: { type: hz.PropTypes.Entity },
  };

  private activePlayersInFTUE = new Set<hz.Player>();
  private playerPromptStatusInFTUE = new Map<
    hz.Player,
    Record<PlayerRoles, number>
  >();
  private playerTaskStatusInFTUE = new Map<
    hz.Player,
    Record<PlayerRoles, number>
  >();

  private ftuePromptUI: UI_FTUE_Prompt | undefined;
  private ftueTaskUI: UI_FTUE_Task | undefined;
  private npcSpawner: NpcSpawnerManager | undefined;
  private markerManager: Manager_FTUEMarkers | undefined;

  preStart(): void {
    if (!this.props.switchFTUE) {
      // console.log.*$
      return;
    }

    this.connectLocalBroadcastEvent(PlayerLeftEvent, ({ player }) => {
      this.onPlayerExitsFTUE(player);
    });

    this.ftuePromptUI =
      this.props.ftuePromptUI?.getComponents(UI_FTUE_Prompt)[0];
    this.ftueTaskUI = this.props.ftueTaskUI?.getComponents(UI_FTUE_Task)[0];
  }

  start() {
    this.ftuePromptUI =
      this.props.ftuePromptUI?.getComponents(UI_FTUE_Prompt)[0];
    this.ftueTaskUI = this.props.ftueTaskUI?.getComponents(UI_FTUE_Task)[0];
    this.markerManager =
      this.props.managerMarker?.getComponents(Manager_FTUEMarkers)[0];
  }

  clearFTUEItems() {
    // this.world.deleteAsset(this.props.spawnToServerMarker!);
    // this.world.deleteAsset(this.props.serverToTableMarker!);
    // this.world.deleteAsset(this.props.tableToScooperMarker!);
    // this.world.deleteAsset(this.props.machineToFetcherMarker!);
    // this.world.deleteAsset(this.props.fetcherToStrawberryMarker!);
    // this.world.deleteAsset(this.props.strawberryToCollectorMarker!);
    // this.world.deleteAsset(this.props.collectorToScooperMarker!);
    // this.world.deleteAsset(this.props.scooperToServerMarker!);
    // this.world.deleteAsset(this.props.scooperToIceCreamMarker!);
    // this.world.deleteAsset(this.props.iceCreamToTableMarker!);

    this.world.deleteAsset(this.props.ftuePromptUI!);
    this.world.deleteAsset(this.props.ftueTaskUI!);
  }

  handlePrePopup(
    player: hz.Player,
    role: PlayerRoles,
    currStatus: number,
    type: ftueType
  ): number {
    let currentStatus = currStatus;

    const fetcherPromptHandlers: Record<number, () => void> = {
      1: () => {
        /* spawn cone */
      },
      2: () => {
        /* show directions */
      },
    };

    const fetcherTaskHandlers: Record<number, () => void> = {};

    const scooperPromptHandlers: Record<number, () => void> = {
      1: () => {
        this.addItemsToMachine(player);
      },
    };

    const scooperTaskHandlers: Record<number, () => void> = {};

    const serverPromptHandlers: Record<number, () => void> = {
      1: () => {
        // this.ftueTaskUI?.hideUI(player, "Success");
      },
    };

    const serverTaskHandlers: Record<number, () => void> = {};

    const unknownTaskHandlers: Record<number, () => void> = {};

    const unknownPromptHandlers: Record<number, () => void> = {};

    const typeRoleStatusHandlers: Map<
      ftueType,
      Record<PlayerRoles, Record<number, () => void>>
    > = new Map([
      [
        "Task",
        {
          Fetcher: fetcherTaskHandlers,
          Scooper: scooperTaskHandlers,
          Server: serverTaskHandlers,
          Unknown: unknownTaskHandlers,
        },
      ],
      [
        "Prompt",
        {
          Fetcher: fetcherPromptHandlers,
          Scooper: scooperPromptHandlers,
          Server: serverPromptHandlers,
          Unknown: unknownPromptHandlers,
        },
      ],
    ]);

    const handler = typeRoleStatusHandlers.get(type)?.[role]?.[currStatus];
    handler?.();

    return currentStatus;
  }

  handlePostPopup(
    player: hz.Player,
    role: PlayerRoles,
    currStatus: number,
    type: ftueType
  ): number {
    let currentStatus = currStatus;

    const fetcherTaskHandlers: Record<number, () => void> = {
      1: () => {
        this.triggerNextFTUETask(player, 2, "Assign");
        // this.props.strawberryToCollectorMarker!.visible.set(true);
        // this.showAndAnimateMarkers(this.props.strawberryToCollectorMarker!);
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setFetcherToVanillaMachineMarker();
      },
      2: () => {
        this.triggerNextFTUEPrompt(player, 2);
      },
    };

    const fetcherPromptHandlers: Record<number, () => void> = {
      1: () => {
        this.triggerNextFTUETask(player, 1, "Assign");
        // this.props.fetcherToStrawberryMarker!.visible.set(true);
        // this.showAndAnimateMarkers(this.props.fetcherToStrawberryMarker!);
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setFetcherToVanillaMonsterMarker();
      },
      2: () => {
        // this.props.collectorToScooperMarker!.visible.set(true);
        this.triggerNextFTUETask(player, 3, "Assign");
        // this.showAndAnimateMarkers(this.props.collectorToScooperMarker!);
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setFetcherToScooperMarker();
      },
    };

    const scooperTaskHandlers: Record<number, () => void> = {
      1: () => {
        this.triggerNextFTUETask(player, 2, "Assign");
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setScooperToScoopingTableMarker();
      },
      2: () => {
        this.triggerNextFTUETask(player, 3, "Assign");
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setScooperToVanillaMachineMarker();
      },
      3: () => {
        this.triggerNextFTUETask(player, 4, "Assign");
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setScooperToScoopingTableMarker();
      },
      4: () => {
        this.triggerNextFTUEPrompt(player, 2);
      },
      5: () => {
        // this.triggerNextFTUETask(player, 6, "Assign");
      },
      // 6: () => {
      //   this.triggerNextFTUEPrompt(player, 3);
      // },
    };

    const scooperPromptHandlers: Record<number, () => void> = {
      1: () => {
        this.triggerNextFTUETask(player, 1, "Assign");
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setScooperToConeMachineMarker();
      },
      2: () => {
        // this.props.machineToFetcherMarker!.visible.set(true);
        this.triggerNextFTUETask(player, 5, "Assign");
        // this.showAndAnimateMarkers(this.props.scooperToServerMarker!);
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setScooperToServerMarker();
      },
    };

    const serverTaskHandlers: Record<number, () => void> = {
      1: () => {
        this.triggerNextFTUEPrompt(player, 2);
      },
      2: () => {
        // playerManager?.setRole(player, PlayerRoles.Unknown);
        // this.triggerNextFTUEPrompt(player, 2);
      },
      3: () => {
        this.triggerNextFTUETask(player, 4, "Assign");
        // this.showAndAnimateMarkers(this.props.iceCreamToTableMarker!);
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setServerTableToTableMarker();
      },
      4: () => {
        playerManager?.setRole(player, PlayerRoles.Unknown);
        this.triggerNextFTUEPrompt(player, 2);
      },
    };

    const serverPromptHandlers: Record<number, () => void> = {
      1: () => {
        // console.log.*$
        this.triggerNextFTUETask(player, 1, "Assign");
        // this.showAndAnimateMarkers(this.props.serverToTableMarker!);
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setServerSpawnToTableMarker();
      },
      2: () => {
        // this.props.tableToScooperMarker!.visible.set(true);
        this.triggerNextFTUETask(player, 2, "Assign");
        // this.showAndAnimateMarkers(this.props.tableToScooperMarker!);
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setTableToFetcherMarker();
        inventoryManager?.add(Items.Cone, 5);
        this.props.coneMachineTrigger
          ?.getComponents(Trigger_ScooperInteraction)[0]
          ?.handleTrigger();
      },
      3: () => {
        this.triggerNextFTUETask(player, 3, "Assign");
        // this.showAndAnimateMarkers(this.props.scooperToIceCreamMarker!);
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setServerToServerTableMarker();
      },
    };

    const unknownPromptHandlers: Record<number, () => void> = {
      1: () => {
        this.triggerNextFTUETask(player, 1, "Assign");
        // this.showAndAnimateMarkers(this.props.spawnToServerMarker!);
        this.markerManager?.hideAllArrowMarkers();
        this.markerManager?.setSpawnToServerMarker();
      },
      2: () => {
        this.endFTUE(player);
      },
    };

    const typeRoleStatusHandlers: Map<
      ftueType,
      Record<PlayerRoles, Record<number, () => void>>
    > = new Map([
      [
        "Task",
        {
          Fetcher: fetcherTaskHandlers,
          Scooper: scooperTaskHandlers,
          Server: serverTaskHandlers,
          Unknown: {},
        },
      ],
      [
        "Prompt",
        {
          Fetcher: fetcherPromptHandlers,
          Scooper: scooperPromptHandlers,
          Server: serverPromptHandlers,
          Unknown: unknownPromptHandlers,
        },
      ],
    ]);

    const handler = typeRoleStatusHandlers.get(type)?.[role]?.[currStatus];
    handler?.();

    return currentStatus;
  }

  triggerNextFTUEPrompt(player: hz.Player, status: number) {
    if (!this.props.switchFTUE || playerManager?.getFTUECompletion(player)) {
      return;
    }

    const playerRole = playerManager?.getPlayerRecord(player)?.role;
    const currStatus = this.getPlayerPromptStatusPerRole(player, playerRole!);

    if (status !== currStatus + 1) {
      return;
    }
    this.markerManager?.hideAllArrowMarkers();

    // set role specific requirements here before each ftue trigger
    const nextStatus = this.handlePrePopup(
      player,
      playerRole!,
      status,
      "Prompt"
    );
    this.ftuePromptUI?.triggerPopup(player, playerRole!, nextStatus);
  }

  triggerNextFTUETask(player: hz.Player, status: number, taskType: taskType) {
    if (!this.props.switchFTUE || playerManager?.getFTUECompletion(player)) {
      // console.log.*$
      return;
    }

    const playerRole = playerManager?.getPlayerRecord(player)?.role;
    const currStatus = this.getPlayerTaskStatusPerRole(player, playerRole!);
    // console.log.*$
    if (status !== currStatus + 1) {
      return;
    }

    this.markerManager?.hideAllArrowMarkers();

    // set role specific requirements here before each ftue trigger
    const nextStatus = this.handlePrePopup(player, playerRole!, status, "Task");
    this.ftueTaskUI?.triggerPopup(player, playerRole!, nextStatus, taskType);
  }

  async onPlayerJoinsFTUE(player: hz.Player) {
    // console.log.*$
    const ftueCompleted = playerManager?.getFTUECompletion(player);
    if (ftueCompleted) {
      // console.log.*$
      return;
    }

    this.props.replayUI?.visible.set(false);
    this.props.skipUI?.visible.set(true);

    this.markerManager?.hideAllArrowMarkers();
    await utilityManager
      ?.delayUntil(() => this.npcSpawner !== null)
      .then(() => {
        this.npcSpawner?.updateSpawnDelay(500);
        this.npcSpawner?.spawnEntities(1);
      });

    await utilityManager?.sleep(5);

    this.onStartFTUE(player);
  }

  onStartFTUE(player: hz.Player) {
    this.activePlayersInFTUE.add(player);
    this.playerPromptStatusInFTUE.set(player, { ...defaultRoleCounts });
    this.playerTaskStatusInFTUE.set(player, { ...defaultRoleCounts });

    this.props.ftueSpawnPoint?.as(hz.SpawnPointGizmo)?.teleportPlayer(player);
    // playerManager?.hideLoadingScreenFromPlayer(player);
    this.triggerNextFTUEPrompt(player, 1);
    // this.sendLocalBroadcastEvent(teleportedToArena, { player });
  }

  onPlayerExitsFTUE(player: hz.Player) {
    this.playerPromptStatusInFTUE.delete(player);
    this.playerTaskStatusInFTUE.delete(player);
    this.activePlayersInFTUE.delete(player);
  }

  getIfPlayerInFTUE(player: hz.Player): boolean {
    return this.activePlayersInFTUE.has(player);
  }

  getPlayerTaskStatusPerRole(player: hz.Player, role: PlayerRoles): number {
    return this.playerTaskStatusInFTUE.get(player)?.[role] ?? 0;
  }

  getPlayerPromptStatusPerRole(player: hz.Player, role: PlayerRoles): number {
    return this.playerPromptStatusInFTUE.get(player)?.[role] ?? 0;
  }

  updatePlayerTaskStatus(player: hz.Player, status: number) {
    const current = this.playerTaskStatusInFTUE.get(player) ?? {
      ...defaultRoleCounts,
    };
    const playerRole =
      playerManager?.getPlayerRecord(player)?.role ?? PlayerRoles.Unknown;
    current[playerRole] =
      current[playerRole] < status ? status : current[playerRole];
    this.playerTaskStatusInFTUE.set(player, current);

    this.handlePostPopup(player, playerRole, status, "Task");
  }

  updatePlayerPromptStatus(player: hz.Player, status: number) {
    const current = this.playerPromptStatusInFTUE.get(player) ?? {
      ...defaultRoleCounts,
    };
    const playerRole =
      playerManager?.getPlayerRecord(player)?.role ?? PlayerRoles.Unknown;
    current[playerRole] =
      current[playerRole] < status ? status : current[playerRole];
    this.playerPromptStatusInFTUE.set(player, current);

    this.handlePostPopup(player, playerRole, status, "Prompt");
  }

  public endFTUE(player: hz.Player) {
    playerManager?.setFTUECompletion(player);

    // gameManager?.throwPlayerInAnotherInstance(player);
  }

  /* ------------------------------- Fetcher ---------------------------------------- */
  // use this space to create specific monsters for the specific player
  /* ------------------------------- Scooper ---------------------------------------- */
  addItemsToMachine(player: hz.Player) {
    inventoryManager?.add(Items.Cone, 5);
    this.props.coneMachineTrigger
      ?.getComponents(Trigger_ScooperInteraction)[0]
      ?.handleTrigger();
    inventoryManager?.add(Items.Vanilla, 5);
    this.props.vanillaMachineTrigger
      ?.getComponents(Trigger_ScooperInteraction)[0]
      ?.handleTrigger();
    // this.props.strawberryScoopTrigger
    //   ?.getComponents(Trigger_ScooperInteraction)[0]
    //   ?.overrideTriggerForPlayer(player);
  }
  /* ------------------------------- Server ---------------------------------------- */

  /* ------------------------------- Cashier ---------------------------------------- */

  /* ------------------------------- Markers ---------------------------------------- */
  // hideAllArrowMarkers() {
  //   // console.log.*$
  //   // this.props.spawnToServerMarker?.visible.set(false);
  //   // this.props.serverToTableMarker?.visible.set(false);
  //   // this.props.tableToScooperMarker?.visible.set(false);
  //   // this.props.machineToFetcherMarker?.visible.set(false);
  //   // this.props.fetcherToStrawberryMarker?.visible.set(false);
  //   // this.props.strawberryToCollectorMarker?.visible.set(false);
  //   // this.props.collectorToScooperMarker?.visible.set(false);
  //   // this.props.scooperToServerMarker?.visible.set(false);

  //   // this.hideAndStopAnimatingMarkers(this.props.spawnToServerMarker!);
  //   // this.hideAndStopAnimatingMarkers(this.props.serverToTableMarker!);
  //   // this.hideAndStopAnimatingMarkers(this.props.tableToScooperMarker!);
  //   // this.hideAndStopAnimatingMarkers(this.props.machineToFetcherMarker!);
  //   // this.hideAndStopAnimatingMarkers(this.props.fetcherToStrawberryMarker!);
  //   // this.hideAndStopAnimatingMarkers(this.props.strawberryToCollectorMarker!);
  //   // this.hideAndStopAnimatingMarkers(this.props.collectorToScooperMarker!);
  //   // this.hideAndStopAnimatingMarkers(this.props.scooperToServerMarker!);
  //   // this.hideAndStopAnimatingMarkers(this.props.scooperToIceCreamMarker!);
  //   // this.hideAndStopAnimatingMarkers(this.props.iceCreamToTableMarker!);
  // }

  // // showAndAnimateMarkers(marker: hz.Entity) {
  // //   marker.visible.set(true);
  // //   marker.getComponents(Animation_Markers)[0]?.startAnimation();
  // // }

  // // hideAndStopAnimatingMarkers(marker: hz.Entity) {
  // //   marker.visible.set(false);
  // //   marker.getComponents(Animation_Markers)[0]?.stopAnimation();
  // // }
}
hz.Component.register(Manager_FTUE);
