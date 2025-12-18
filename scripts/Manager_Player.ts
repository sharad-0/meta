// PlayerManager.ts

import CustomControls from "CustomControls";
import {
  ColorCombinations,
  EntryTypes,
  LeaderBoardNames,
  NotificationTypes,
  PlayerHouseConfig,
  PlayerRoles,
  Role,
  xpCumulativeCaps,
} from "Enums_Game";
import {
  CodeBlockEvents,
  Component,
  Player,
  Asset,
  PropTypes,
  Entity,
  AttachableEntity,
  Vec3,
  AttachablePlayerAnchor,
  AvatarGripPose,
  SpawnController,
  PlayerVisibilityMode,
  Quaternion,
  GrabbableEntity,
  Handedness,
} from "horizon/core";
import {
  PlayerCashUpdatedEvent,
  PlayerExpUpdatedEvent,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  PlayerNameStatsUpdatedEvent,
  PlayerSwitchedRoleEvent,
} from "Manager_Events";
import {
  bagManager,
  botManager,
  cashPoolManager,
  gameManager,
  hudManager,
  objectPoolManager,
  playerAnimations,
  propsManager,
  utilityManager,
  vacuumController,
} from "Managers_Instance";
import { AvatarAIAgent } from "horizon/avatar_ai_agent";
import {
  AreaEnterPayload,
  LevelUpPayload,
  Turbo,
  TurboEvents,
} from "horizon/analytics";
import { Npc, NpcGrabActionResult } from "horizon/npc";
import { Analytics, AnalyticsManager } from "AnalyticsManager";
import BagPackAnimator from "BagPackAnimator";
import Component_Bot from "Component_Bot";

export type Serializable =
  | string
  | number
  | boolean
  | bigint
  | null
  | Serializable[]
  | { [key: string]: Serializable };

/** Shape written to persistent storage (primitives only, with index signature). */
export interface PlayerPersistedData {
  cash: number;
  cashLastSession: number;
  // lastSessionId: string | null;
  exp: number;
  snowflake: number;

  firstTimeUseExp: boolean;
  completedFTUE: boolean;
  /** Completed tasks by role → list of task ids */
  completedTasks: { [role: string]: number[] };

  serverActions: number;
  scooperActions: number;
  fetcherActions: number;
  allRounderActions: number;

  [key: string]: Serializable;
}

export interface HouseUpgradeData {
  houseUpgrade: string; // JSON string of PlayerHouseConfig
  [key: string]: Serializable;
}

/** Info we expose to the rest of the world about connected players. */
export interface PlayerRecord {
  player: Player;
  id: number;
  name: string;
  role: PlayerRoles;
  exp: number;
  cash: number;
  cashEarnedInSession: number;

  // sessionId: string | null;
  sessionStartTime?: number;

  customControl: Entity | null;
  /** Runtime mirror of persisted completed tasks */
  houseUpgrade: PlayerHouseConfig;

  firstTimeUseExp: boolean;
  completedFTUE: boolean;
  replayFTUE: boolean;

  completedTasks: { [role: string]: number[] };

  fetcherActions?: number;
  scooperActions?: number;
  serverActions?: number;
  allRounderActions?: number;

  ftueData: ftueData;
  parlourSessionCount?: number;

  snowflake: number;
  isSnowmanCompleted?: boolean;
}

interface ftueData {
  mainEntry: boolean;
  serverEntry: boolean;
  fetcherEntry: boolean;
  scooperEntry: boolean;
  [key: string]: Serializable;
}

// Prefix with variable‑group name (CJK) ↴
const PV_KEY = "PlayerPersistedData:PlayerStorageData";
const EXP_KEY = "PlayerPersistedData:PlayerExp";
const HU_KEY = "PlayerPersistedData:HouseData";
const FTUE_KEY = "PlayerPersistedData:FTUEData";
const SNOWFLAKE_KEY = "PlayerPersistedData:Snowflake";

const defaultHouseUpgrade: PlayerHouseConfig = {
  waffles: [
    {
      assetId: "waffle1",
      yRotation: 0,
      color: ColorCombinations.Blue,
      decoration: undefined,
    },
  ],
  scoops: [
    {
      assetId: "scoop1",
      yRotation: 0,
      color: ColorCombinations.Pink,
      decoration: undefined,
    },
  ],
};

export default class Manager_Player extends Component<typeof Manager_Player> {
  private static _instance: Manager_Player | null = null;
  static get(): Manager_Player {
    if (!Manager_Player._instance) {
      throw new Error(
        "PlayerManager not initialised – attach it to an always‑loaded entity."
      );
    }
    return Manager_Player._instance;
  }

  static propsDefinition = {
    CustomControlScript: { type: PropTypes.Asset },
    vacuum1: { type: PropTypes.Entity },
    vacuum2: { type: PropTypes.Entity },
    vacuum3: { type: PropTypes.Entity },
    vacuum4: { type: PropTypes.Entity },
    vacuum5: { type: PropTypes.Entity },
    vacuum6: { type: PropTypes.Entity },
    vacuum7: { type: PropTypes.Entity },
    vacuum8: { type: PropTypes.Entity },
    vacuum9: { type: PropTypes.Entity },
    vacuumBot: { type: PropTypes.Entity },
    // loadingScreenAsset: { type: PropTypes.Asset },
  };

  /** List of players currently in world (id → record) */
  private playersInWorld = new Map<Player, PlayerRecord>();
  private npcCustomers: Player[] = []; // List of NPC customers
  private readonly _vacuumByPlayer = new Map<Player, Entity>();
  private playersLoadingScreen = new Map<Player, Entity>();
  public playerCustomControls = new Map<Player, Entity>();
  // Add this utility getter to handle all 7 vacuums
  private get vacuumEntities(): Entity[] {
    return [
      this.props.vacuum1!,
      this.props.vacuum2!,
      this.props.vacuum3!,
      this.props.vacuum4!,
      this.props.vacuum5!,
      this.props.vacuum6!,
      this.props.vacuum7!,
      this.props.vacuum8!,
      this.props.vacuum9!,
    ].filter(Boolean); // Remove any undefined if props weren't set
  }

  // -------------------------------------------------------------------------
  // Horizon lifecycle
  // -------------------------------------------------------------------------
  preStart(): void {
    Manager_Player._instance = this;

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterWorld,
      (player) => {
        this.onPlayerJoin(player);
      }
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitWorld,
      this.onPlayerLeave.bind(this)
    );
  }

  start(): void {
    // this.world.getPlayers().forEach((p) => this.onPlayerJoin(p));
  }

  addNpcCustomer(player: Player): void {
    if (!this.npcCustomers.includes(player)) {
      this.npcCustomers.push(player);
      // // console.log.*$
    } else {
      console.warn(`NPC customer already exists: ${player.name.get()}`);
    }
  }

  removeNpcCustomer(player: Player): void {
    const index = this.npcCustomers.indexOf(player);
    if (index !== -1) {
      this.npcCustomers.splice(index, 1);
      // // console.log.*$
    } else {
      console.warn(`NPC customer not found: ${player.name.get()}`);
    }
  }

  getNpcCustomers(): Player[] {
    return this.npcCustomers;
  }

  // -------------------------------------------------------------------------
  // Public helpers
  // -------------------------------------------------------------------------
  getCurrentPlayerRecs(): PlayerRecord[] {
    return Array.from(this.playersInWorld.values()).map((rec) => ({ ...rec }));
  }

  getCurrentPlayers(): Player[] {
    return Array.from(this.playersInWorld.keys());
  }

  getRolesForPlayers(players: Player[] | undefined): PlayerRoles[] {
    if (!players) return [];
    return players.map((player) => this.getRole(player));
  }

  getFTUEPlayers(): Player[] {
    return Array.from(this.playersInWorld.entries())
      .filter(([_, record]) => !record.completedFTUE)
      .map(([player, _]) => player);
  }

  getNonFtuePlayers(): Player[] {
    return Array.from(this.playersInWorld.keys());
  }

  /** Get a single player record by id (or null if not present). */
  getPlayerRecord(player: Player): PlayerRecord | null {
    const rec = this.playersInWorld.get(player);
    return rec ? { ...rec } : null;
  }

  getRolePlayers(role: PlayerRoles, withFTUEPlayer: boolean = true): Player[] {
    return this.world
      .getPlayers()
      .filter((p) => this.playersInWorld.get(p)?.role === role);
  }

  getPlayersWithoutRole(role: PlayerRoles): Player[] {
    return this.world
      .getPlayers()
      .filter((p) => this.playersInWorld.get(p)?.role !== role);
  }

  /** Assign / change a role for the given player id. */
  setRole(player: Player, role: PlayerRoles): void {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;
    rec.role = role;
    this.save(player); // persist role change immediately
    this.sendNetworkEvent(player, PlayerNameStatsUpdatedEvent, {
      player,
      newRole: role,
    });
    this.sendLocalBroadcastEvent(PlayerSwitchedRoleEvent, {
      player,
      newRole: role,
    });
  }

  /** Get the role of a player, or Unknown if unassigned. */
  getRole(player: Player): PlayerRoles {
    const rec = this.playersInWorld.get(player);
    if (!rec) return PlayerRoles.Unknown;
    return rec.role;
  }

  /** Get the ftue status of a player for the given role **/
  public getFTUECompletion(player: Player): boolean {
    const rec = this.playersInWorld.get(player);
    return rec?.completedFTUE ?? false;
  }

  public setFTUECompletion(player: Player) {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    rec.firstTimeUseExp = true;
    rec.completedFTUE = true;
    this.save(player); // persist ftue completion immediately
  }

  public replayFTUE(player: Player) {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    rec.replayFTUE = true;
    rec.completedFTUE = false; // Reset FTUE status
    this.save(player); // persist reset immediately
    this.setRole(player, PlayerRoles.Unknown);

    // gameManager?.throwPlayerInAnotherInstance(player);
  }

  /** Add coins to the given player id and persist. */
  public addCash(player: Player, amount: number): void {
    if (!player || amount <= 0) return;
    // console.log.*$
    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    // rec.cash += amount;
    rec.cashEarnedInSession =
      (Math.ceil(rec.cashEarnedInSession) || 0) + amount;

    this.save(rec.player);
    AnalyticsManager.s_instance.sendCashCredit(player, rec.role, amount);
  }

  public addExp(player: Player, amount: number): void {
    if (!player || amount <= 0) return;

    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    rec.exp += amount;
    // console.log.*$
    this.save(rec.player);
    AnalyticsManager.s_instance.sendXPCredit(player, rec.role, amount);
  }

  public addCashAndExp(player: Player, amount: number): void {
    if (!player || amount <= 0) return;

    const rec = this.playersInWorld.get(player);
    if (!rec) return;
    const currentLevel = this.getLevel(rec.exp);
    rec.exp += amount;
    rec.cash += amount;
    // console.log.*$
    const newLevel = this.getLevel(rec.exp);

    if (newLevel > currentLevel) {
      hudManager?.showPopupNotifToPlayer(
        NotificationTypes.LevelUpgraded,
        player,
        3
      );
      AnalyticsManager.s_instance.sendLevelUp({
        player: player,
        playerLevel: newLevel,
        playerTitle: `Level ${newLevel}`,
      });
    }
    this.save(rec.player);
    AnalyticsManager.s_instance.sendXPCredit(player, rec.role, amount);
    AnalyticsManager.s_instance.sendCashCredit(player, rec.role, amount);
  }
  public addBonusCash(player: Player, cashAmount: number): void {
    if (!player || cashAmount <= 0) return;

    const rec = this.playersInWorld.get(player);
    if (!rec) return;
    rec.cashEarnedInSession += cashAmount;
    // console.log.*$
    //   `[PlayerManagerExp] +${cashAmount},  (total ${rec.cashEarnedInSession})`
    // );
    this.save(rec.player);
  }

  public deductCash(player: Player, amount: number): void {
    if (!player || amount <= 0) return;

    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    rec.cash -= amount;
    this.save(rec.player);
    AnalyticsManager.s_instance.sendCashDebit(player, amount);
  }

  public deductExp(player: Player, amount: number): void {
    if (!player || amount <= 0) return;

    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    rec.exp -= amount;
    this.save(rec.player);
  }
  public addSnowflake(player: Player, amount: number): void {
    if (!player || amount <= 0) return;

    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    rec.snowflake += amount;
    // console.log.*$
    this.saveSnowflakeData(rec.player);
  }

  public getSnowflake(player: Player): number {
    const rec = this.playersInWorld.get(player);
    return rec ? rec.snowflake : 0;
  }

  deductSnowflake(player: Player, amount: number): void {
    if (!player || amount <= 0) return;

    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    rec.snowflake -= amount;
    if (rec.snowflake < 0) {
      rec.snowflake = 0;
    }
    this.saveSnowflakeData(rec.player);
  }

  private saveSnowflakeData(player: Player): void {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;
    this.world.persistentStorage.setPlayerVariable(
      player,
      SNOWFLAKE_KEY,
      rec.snowflake
    );
  }
  /** Mark a task as completed for persistence (role → [taskId]). */
  public addCompletedTask(
    player: Player,
    role: PlayerRoles,
    taskId: number
  ): void {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    if (!rec.completedTasks[role]) rec.completedTasks[role] = [];
    if (!rec.completedTasks[role].includes(taskId)) {
      rec.completedTasks[role].push(taskId);
      // // console.log.*$
      //   `[PlayerManager] Task ${taskId} for role ${role} stored for ${rec.name}`
      // );
      this.save(player);
    }
  }

  /** Retrieve coins */
  public getCash(player: Player): number {
    const rec = this.playersInWorld.get(player);
    return rec ? rec.cash : 0;
  }

  public getSessionCashEarned(player: Player): number {
    const rec = this.playersInWorld.get(player);
    return rec ? Math.ceil(rec.cashEarnedInSession) : 0;
  }

  public getExp(player: Player): number {
    const rec = this.playersInWorld.get(player);
    return rec ? rec.exp : 0;
  }

  public getLevel(xp: number): number {
    if (xp <= 0) return 1;
    const caps = xpCumulativeCaps;
    let lo = 0,
      hi = caps.length - 1,
      ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (xp >= caps[mid]) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans + 1; // index -> level
  }

  public getHouseLevel(player: Player): number {
    const rec = this.playersInWorld.get(player);
    return rec
      ? rec.houseUpgrade.waffles.length + rec.houseUpgrade.scoops.length
      : 1;
  }

  public getHouseUpgrade(player: Player): PlayerHouseConfig | null {
    const rec = this.playersInWorld.get(player);
    return rec ? rec.houseUpgrade : null;
  }

  public setHouseUpgrade(player: Player, upgrade: PlayerHouseConfig): void {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    rec.houseUpgrade = upgrade;
    this.save(player);
  }

  public getLevelCap(level: number): number {
    // Total cumulative XP required to be at 'level'
    if (level <= 1) return 0;
    const caps = xpCumulativeCaps; // cumulative totals
    if (level >= caps.length) return caps[caps.length - 1];
    return caps[level - 1];
  }

  public xpToNextLevel(xp: number, level: number): number {
    const caps = xpCumulativeCaps;
    const lastLevel = caps.length;

    // If at or beyond max level, there is no "next" level
    if (level >= lastLevel) return 0;

    const prevCap = this.getLevelCap(level); // cumulative at current level start
    const nextCap = this.getLevelCap(level + 1); // cumulative at next level
    const segment = Math.max(1, nextCap - prevCap); // per-level cost (avoid 0)
    const remaining = Math.max(0, nextCap - xp); // how much more to hit nextCap

    // Clamp to segment to avoid returning more than the level’s cost
    return Math.min(remaining, segment);
  }

  public canAffordUpgrade(
    player: Player,
    lvlReq: number,
    cashReq: number
  ): boolean {
    const rec = this.playersInWorld.get(player);
    if (!rec) return false;

    const level = this.getLevel(rec.exp);
    // console.log.*$
    //   `Afford check: L${level} (need ${lvlReq}), $${rec.cash} (need $${cashReq})`
    // );
    return level >= lvlReq && rec.cash >= cashReq;
  }

  public houseLevelLocked(player: Player, lvlReq: number): boolean {
    const rec = this.playersInWorld.get(player);
    if (!rec) return false;

    const level = this.getLevel(rec.exp);
    return level < lvlReq;
  }

  public houseCashLocked(player: Player, cashReq: number): boolean {
    const rec = this.playersInWorld.get(player);
    if (!rec) return false;
    return rec.cash < cashReq;
  }

  // -------------------------------------------------------------------------
  // Event callbacks
  // -------------------------------------------------------------------------
  private safePlayerName(p: Player): string | null {
    try {
      return p.name.get(); // bridge call
    } catch {
      return null; // invalid / NPC / server player
    }
  }

  /** True for real human players, false for NPCs & placeholders. */
  public isRealPlayer(p: Player): boolean {
    const isBot = Npc.playerIsNpc(p);
    return !isBot;
  }

  public isFtueUiRequired(player: Player): boolean {
    const rec = this.playersInWorld.get(player);
    if (!rec) return true;

    // Normalize to ensure all required keys exist (default false)
    const data: ftueData = {
      mainEntry: rec.ftueData?.mainEntry ?? false,
      serverEntry: rec.ftueData?.serverEntry ?? false,
      fetcherEntry: rec.ftueData?.fetcherEntry ?? false,
      scooperEntry: rec.ftueData?.scooperEntry ?? false,
    };

    // FTUE is NOT required only if all are true; otherwise required
    const allTrue = Object.values(data).every((v) => v === true);
    return !allTrue;
  }
  private saveFtueData(player: Player): void {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;
    this.world.persistentStorage.setPlayerVariable(
      player,
      FTUE_KEY,
      rec.ftueData
    );
  }

  public updateFtueKey(player: Player, key: EntryTypes) {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    switch (key) {
      case EntryTypes.main:
        rec.ftueData.mainEntry = true;
        break;
      case EntryTypes.server:
        rec.ftueData.serverEntry = true;
        break;
      case EntryTypes.fetcher:
        rec.ftueData.fetcherEntry = true;
        break;
      case EntryTypes.scooper:
        rec.ftueData.scooperEntry = true;
        break;
      default:
        break;
    }
    this.saveFtueData(player);
  }

  public getFTUEData(player: Player): ftueData | null {
    const rec = this.playersInWorld.get(player);
    if (!rec) return null;
    return rec.ftueData;
  }

  private onPlayerJoin(player: Player): void {
    // if (!this.isRealPlayer(player)) return; // <- ignore NPCs / server
    const name = this.safePlayerName(player)!; // now guaranteed non‑null
    // if (name === "Customer") return; // Skip customers
    player.clearAvatarGripPoseOverride();
    playerAnimations?.stopAvatarAnimation(player);
    // Load any saved data ---------------------------------------------------

    const stored = this.loadStoredPlayerData(player);
    const storedHouseUpgrade = this.loadStoredHouseUpgrade(player);
    const ftueData = this.loadFTUEData(player);

    // console.log.*$
    // console.log.*$
    let customControl = null;
    if (!Npc.playerIsNpc(player)) {
      customControl = this.spawnCustomControlsForPlayer(player);
    }
    const record: PlayerRecord = {
      player,
      id: player.id,
      name,
      role: PlayerRoles.Unknown,
      cash: (stored?.cash ?? 100) + Math.ceil(stored?.cashLastSession ?? 0),
      exp: stored?.exp ?? 0,
      houseUpgrade: storedHouseUpgrade ?? defaultHouseUpgrade,

      customControl: customControl,
      cashEarnedInSession: 0,

      // sessionId: this.world.
      sessionStartTime: Date.now(), // Start time for the session

      firstTimeUseExp: stored?.firstTimeUseExp ?? true,
      completedFTUE: stored?.completedFTUE ?? false,
      replayFTUE: false,

      completedTasks: stored?.completedTasks ?? {},
      fetcherActions: stored?.fetcherActions ?? 0,
      scooperActions: stored?.scooperActions ?? 0,
      serverActions: stored?.serverActions ?? 0,
      allRounderActions: stored?.allRounderActions ?? 0,
      // ftueData: ftueData ?? {
      //   mainEntry: false,
      //   serverEntry: false,
      //   fetcherEntry: false,
      //   scooperEntry: false,
      // },
      ftueData: {
        mainEntry: ftueData?.mainEntry ?? false,
        serverEntry: ftueData?.serverEntry ?? false,
        fetcherEntry: ftueData?.fetcherEntry ?? false,
        scooperEntry: ftueData?.scooperEntry ?? false,
      },

      parlourSessionCount: 0,
      snowflake: stored?.snowflake ?? 0,
    };
    this.playersInWorld.set(player, record);
    // console.log.*$
    //   `PlayerManager: Player ${name} (${player.id}) joined; record created.`
    // );
    this.save(player); // persist initial state
    // console.log.*$
    //   `PlayerManager: Player ${name} (${player.id}) initial state saved.`
    // );

    this.async.setTimeout(() => {
      this.sendLocalBroadcastEvent(PlayerJoinedEvent, { player });
    }, 500); // delay to ensure other managers are ready

    this.updateAllLeaderboards(
      player,
      stored?.fetcherActions ?? 0,
      stored?.scooperActions ?? 0,
      stored?.serverActions ?? 0
    );

    hudManager?.refreshHUD();
    // this.showLoadingScreenToPlayer(player);
  }

  IncreaseParlourSessionCount(player: Player): void {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;
    rec.parlourSessionCount = (rec.parlourSessionCount || 0) + 1;
  }

  private onPlayerLeave(player: Player): void {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;
    if (player.name.get() === "Customer") return; // Skip customers

    this.removeVacuumForFetcher(player);
    // Persist final state ---------------------------------------------------
    this.save(player);

    if (rec.customControl) {
      this.world.deleteAsset(rec.customControl!.as(Entity), true);
    }

    if (!rec.completedFTUE && !rec.replayFTUE && rec.firstTimeUseExp) {
      rec.completedFTUE = true;
    }

    // Remove from player registry ------------------------------------------
    if (this.playersInWorld.delete(player)) {
      // // console.log.*$
    }
    playerAnimations?.stopAvatarAnimation(player);
    if (this.playersLoadingScreen.has(player)) {
      this.playersLoadingScreen.delete(player);
    }
    this.sendLocalBroadcastEvent(PlayerLeftEvent, { player });
    cashPoolManager?.updateCashPoolUI();
  }

  onParlourClosed(): void {
    this.playersInWorld.forEach((rec) => {
      propsManager?.detachRoleProps(rec.player, rec.role);
      rec.cash += Math.ceil(rec.cashEarnedInSession);
      this.setRole(rec.player, PlayerRoles.Unknown);
      hudManager?.refreshHUD();
      AnalyticsManager.s_instance.sendParlourSessionEnd(
        rec.player,
        rec.parlourSessionCount || 0
      );
    });
  }

  onParlourOpened(): void {
    this.playersInWorld.forEach((rec) => {
      rec.cashEarnedInSession = 0;
      rec.parlourSessionCount = (rec.parlourSessionCount || 0) + 1;
      this.save(rec.player);
      AnalyticsManager.s_instance.sendParlourSessionStart(
        rec.player,
        rec.parlourSessionCount
      );
    });
  }

  // -------------------------------------------------------------------------
  // Persistence helpers
  // -------------------------------------------------------------------------
  private loadStoredPlayerData(player: Player): PlayerPersistedData | null {
    if (Npc.playerIsNpc(player)) return null;

    const storedJson = this.world.persistentStorage.getPlayerVariable(
      player,
      PV_KEY
    ) as PlayerPersistedData | null;
    if (!storedJson) return null;
    const storedExp = this.world.persistentStorage.getPlayerVariable(
      player,
      EXP_KEY
    );
    const storedSnowflake = this.world.persistentStorage.getPlayerVariable(
      player,
      SNOWFLAKE_KEY
    );
    storedJson.snowflake = storedSnowflake ?? 0;
    storedJson.exp = storedExp ?? storedJson.exp ?? 0;
    return storedJson;
  }

  private loadFTUEData(player: Player): ftueData | null {
    if (Npc.playerIsNpc(player)) return null;
    const ftueJson = this.world.persistentStorage.getPlayerVariable(
      player,
      FTUE_KEY
    ) as ftueData | null;

    if (ftueJson) {
      // console.log.*$
    }
    return ftueJson;
  }

  private loadStoredHouseUpgrade(player: Player): PlayerHouseConfig | null {
    if (Npc.playerIsNpc(player)) return null;
    const storedJson = this.world.persistentStorage.getPlayerVariable(
      player,
      HU_KEY
    ) as HouseUpgradeData | null;
    if (!storedJson || storedJson.houseUpgrade === undefined) return null;

    // console.log.*$
    const parsed = JSON.parse(storedJson.houseUpgrade) as PlayerHouseConfig;
    return parsed;
  }

  private save(player: Player): void {
    if (Npc.playerIsNpc(player)) return;
    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    const houseUpgradeData: HouseUpgradeData = {
      houseUpgrade: JSON.stringify(rec.houseUpgrade),
    };

    const data: PlayerPersistedData = {
      cash: rec.cash,
      cashLastSession: Math.ceil(rec.cashEarnedInSession ?? 0),
      exp: rec.exp,
      firstTimeUseExp: rec.firstTimeUseExp,
      completedFTUE: rec.completedFTUE,
      completedTasks: rec.completedTasks,
      snowflake: rec.snowflake,

      serverActions: rec.serverActions ?? 0,
      scooperActions: rec.scooperActions ?? 0,
      fetcherActions: rec.fetcherActions ?? 0,
      allRounderActions: rec.allRounderActions ?? 0,
      // lastSessionId: rec.lastSessionId,
    };

    this.updateAllLeaderboards(
      player,
      rec.fetcherActions ?? 0,
      rec.scooperActions ?? 0,
      rec.serverActions ?? 0
    );

    this.world.persistentStorage.setPlayerVariable(player, PV_KEY, data);
    this.world.persistentStorage.setPlayerVariable(player, EXP_KEY, rec.exp);
    this.world.persistentStorage.setPlayerVariable(
      player,
      HU_KEY,
      houseUpgradeData
    );
    this.saveFtueData(player);
    this.saveSnowflakeData(player);
    this.sendNetworkEventsToHuds(player, rec);
  }
  sendNetworkEventsToHuds(player: Player, rec: PlayerRecord) {
    this.sendNetworkEvent(player, PlayerCashUpdatedEvent, {
      player,
      newCash: rec.cash,
    });
    const exp = rec.exp;
    const level = this.getLevel(exp);

    const prevCap = this.getLevelCap(level);
    const nextCap = this.getLevelCap(level + 1);
    this.sendNetworkEvent(player, PlayerExpUpdatedEvent, {
      player,
      newExp: rec.exp,
      prevCap,
      nextCap,
      level,
    });
  }
  // custom controls
  private spawnCustomControlsForPlayer(player: Player): Entity | null {
    if (this.playersInWorld.get(player)?.customControl) {
      console.warn("player already has a custom control");
      return this.playersInWorld.get(player)!.customControl;
    }

    this.world
      .spawnAsset(
        this.props.CustomControlScript as Asset,
        this.entity.position.get(),
        this.entity.rotation.get()
      )
      .then((entities) => {
        const entity = entities[0];
        if (!entity) {
          console.error("Failed to spawn custom control entity");
          return null;
        }
        entity.owner.set(player);
        this.playerCustomControls.set(player, entity);
        if (vacuumController) {
          vacuumController.registerPlayerCustomControls(player, entity);
        } else {
          console.warn("vacuumController not ready");
        }
        return entity;
      });

    return null;
  }

  loadVacuumAsset() { }

  public equipVacuumForFetcher(player: Player, role: Role): void {
    const vacuums = this.vacuumEntities;
    if (vacuums.length === 0) return; // props not wired
    if (Npc.playerIsNpc(player)) return;
    if (role === PlayerRoles.Fetcher) {
      if (this._vacuumByPlayer.has(player)) return;

      // Find an available vacuum
      let freeVacuum = this._findFreeVacuum(...vacuums);

      if (!freeVacuum) return; // All in use - show a warning if desired
      freeVacuum.visible.set(true);
      freeVacuum.as(GrabbableEntity).forceHold(player, Handedness.Right, false);
      freeVacuum.as(GrabbableEntity).setWhoCanGrab([]);
      freeVacuum.getComponents(BagPackAnimator)[0].setPlayer(player);
      // freeVacuum.simulated.set(false);
      this._vacuumByPlayer.set(player, freeVacuum);
      bagManager?.assignBagEntityToPlayer(player);
      // if (!gameManager?.isThisTrainingSession()) {
      hudManager?.showFetcherButtonUiToPlayer(player);
      // }

      // this.sendNetworkBroadcastEvent(ActivateFetcherControls, {
      //   fetcherPlayer: player,
      // });
      return;
    }

    this.removeVacuumForFetcher(player);
  }

  async equipVacuumForBot(player: Player): Promise<boolean> {
    if (!Npc.playerIsNpc(player)) {
      return false;
    }

    const freeVacuum = this.props.vacuumBot;
    if (!freeVacuum) {
      console.warn("[VacuumEquip] No vacuum available");
      return false;
    }

    try {
      // Configure vacuum for this bot
      const grabbable = freeVacuum.as(GrabbableEntity);
      grabbable.setWhoCanGrab([player]);
      const botComponent = botManager?.getBotComponentFromRole(PlayerRoles.Fetcher);
      if (!botComponent) {
        console.error("[VacuumEquip] No bot component found");
        return false;
      }
      // Attempt grab with configurable retries + timeout
      const result = await this.attemptBotGrab(
        botComponent,
        freeVacuum,
        { maxRetries: 3, retryDelayMs: 1500, timeoutMs: 10000 }
      );

      if (result.success) {
        this.completeVacuumEquip(freeVacuum, player);
        return true;
      }

      console.error(`[VacuumEquip] Failed after ${result.attempt} attempts: ${result.lastError}`);
      return false;

    } catch (error) {
      console.error("[VacuumEquip] Exception during equip:", error);
      // Cleanup partial state
      freeVacuum.as(GrabbableEntity)?.setWhoCanGrab([]);
      return false;
    }
  }

  private async attemptBotGrab(
    botComponent: Component_Bot,
    vacuum: Entity,
    options: { maxRetries: number; retryDelayMs: number; timeoutMs: number }
  ): Promise<{ success: boolean; attempt: number; lastError?: string }> {
    if (!botComponent) {
      return { success: false, attempt: 0, lastError: "No bot component" };
    }

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        console.log(`[VacuumEquip] Grab attempt ${attempt}/${options.maxRetries}`);

        const result = await botComponent.grabObject(vacuum);

        if (result === NpcGrabActionResult.Success) {
          return { success: true, attempt };
        }

        // Wait before retry (progressive backoff)
        if (attempt < options.maxRetries) {
          await utilityManager?.sleep(options.retryDelayMs * attempt);
        }

      } catch (error) {
        console.warn(`[VacuumEquip] Attempt ${attempt} failed:`, error);
      }
    }

    return {
      success: false,
      attempt: options.maxRetries,
      lastError: "Max retries exceeded"
    };
  }

  private completeVacuumEquip(vacuum: Entity, player: Player): void {
    // Extract first BagPackAnimator safely
    const animators = vacuum.getComponents(BagPackAnimator);
    if (animators.length > 0) {
      animators[0].setPlayer(player);
    }
    vacuum.visible.set(true);
    this._vacuumByPlayer.set(player, vacuum);
    bagManager?.assignBagEntityToPlayer(player);

    console.log(`[VacuumEquip] Successfully equipped vacuum for bot ${player.name}`);
  }


  public getVacuumEntityByPlayer(player: Player): Entity | undefined {
    return this._vacuumByPlayer.get(player);
  }

  public getPlayerFromVacuumEntity(vacuum: Entity): Player | null {
    const entry = Array.from(this._vacuumByPlayer.entries()).find(
      ([, vac]) => vac === vacuum
    );
    return entry ? entry[0] : null;
  }

  public removeVacuumForFetcher(player: Player): void {
    const ownedVacuum = this._vacuumByPlayer.get(player);
    if (!ownedVacuum) return; // nothing to clean up

    ownedVacuum.as(GrabbableEntity).forceRelease();
    ownedVacuum.visible.set(false);
    ownedVacuum.position.set(new Vec3(-1000, -1000, -1000)); // reset to origin if desired

    hudManager?.hideFetcherButtonUiFromPlayer(player);
    bagManager?.removeBagEntityFromPlayer(player);
    this._vacuumByPlayer.delete(player);
    // playerAnimations?.stopAvatarAnimation(player);
  }

  private _findFreeVacuum(...vacuums: Entity[]): Entity | undefined {
    const taken = new Set<Entity>();
    this._vacuumByPlayer.forEach((vac) => {
      taken.add(vac);
    });

    for (const vac of vacuums) {
      if (!taken.has(vac)) return vac;
    }
    return undefined;
  }

  public addFetcherAction(player: Player, itemQuantity: number = 1): void {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;
    const actionQuant = 3 * itemQuantity;
    rec.fetcherActions = (rec.fetcherActions ?? 0) + actionQuant;
    rec.allRounderActions = (rec.allRounderActions ?? 0) + actionQuant;
    this.save(player);

    this.updateLeaderboardData(
      player,
      LeaderBoardNames.TopFetchers,
      rec.fetcherActions,
      rec.allRounderActions
    );
  }

  public addScooperAction(player: Player): void {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    rec.scooperActions = (rec.scooperActions ?? 0) + 5;
    rec.allRounderActions = (rec.allRounderActions ?? 0) + 5;
    this.save(player);

    this.updateLeaderboardData(
      player,
      LeaderBoardNames.TopScoopers,
      rec.scooperActions,
      rec.allRounderActions
    );
  }

  public addServerAction(player: Player): void {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    rec.serverActions = (rec.serverActions ?? 0) + 5;
    rec.allRounderActions = (rec.allRounderActions ?? 0) + 5;
    this.save(player);

    this.updateLeaderboardData(
      player,
      LeaderBoardNames.TopServers,
      rec.serverActions,
      rec.allRounderActions
    );
  }

  async updateLeaderboardData(
    player: Player,
    leaderBoardName: LeaderBoardNames,
    score: number,
    allRounderScore: number
  ) {
    this.world.leaderboards.setScoreForPlayer(
      leaderBoardName,
      player,
      score,
      false
    );
    this.world.leaderboards.setScoreForPlayer(
      LeaderBoardNames.AllRounders,
      player,
      allRounderScore,
      false
    );
  }

  async updateAllLeaderboards(
    player: Player,
    fetcherActions: number,
    scooperActions: number,
    serverActions: number
  ) {
    const allRounderScore = fetcherActions + scooperActions + serverActions;
    this.world.leaderboards.setScoreForPlayer(
      LeaderBoardNames.TopFetchers,
      player,
      fetcherActions,
      false
    );
    this.world.leaderboards.setScoreForPlayer(
      LeaderBoardNames.TopScoopers,
      player,
      scooperActions,
      false
    );
    this.world.leaderboards.setScoreForPlayer(
      LeaderBoardNames.TopServers,
      player,
      serverActions,
      false
    );
    this.world.leaderboards.setScoreForPlayer(
      LeaderBoardNames.AllRounders,
      player,
      allRounderScore,
      false
    );
  }

  updateSnowmanState(player: Player, isCompleted: boolean): void {
    const rec = this.playersInWorld.get(player);
    if (!rec) return;

    rec.isSnowmanCompleted = isCompleted;
  }

  isAllSnowmanCompleted(): boolean {
    this.playersInWorld.forEach((rec, player) => {
      if (!Npc.playerIsNpc(player) && !rec.isSnowmanCompleted) {
        return false;
      }
    });
    return true;
  }

  isSnowmanCompleted(player: Player): boolean {
    const rec = this.playersInWorld.get(player);
    if (!rec) return false;

    return rec.isSnowmanCompleted ?? false;
  }
}

Component.register(Manager_Player);
