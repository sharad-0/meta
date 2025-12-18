/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

/**
 * 🚀 Turbo Analytics: Turbo API for Horizon In-World Analytics (Welcome!!)
 * TODO: (Creator) IMPORTANT: Make sure to attach an Entity to the Analytics Manager or nothing will work!
 * TODO: (Creator) <--- Search for this to uncover attention items
 * TODO: (Creator) Don't forget to have fun!
 */

export const TURBO_IS_ENABLED = true; /* TODO (Creator): Turbo Killswitch */
export const TURBO_DEBUG =
  false; /** TODO (Creator): IMPORTANT!!! Set to False before Release **/

import * as hz from "horizon/core";
import {
  ITurboSettings,
  Turbo,
  TurboEvents,
  DiscoveryMadePayload,
  TurboDataService,
  CustomEventPayload,
  TurboDebug,
  EventData,
  Action,
} from "horizon/analytics";
import {
  AreaEnterPayload,
  AreaExitPayload,
  DeathByEnemyPayload,
  DeathByPlayerPayload,
  FrictionHitPayload,
  KOEnemyPayload,
  KOPlayerPayload,
  LevelUpPayload,
  PlayerReadyEnterPayload,
  PlayerReadyExitPayload,
  RewardsEarnedPayload,
  RoundEndPayload,
  SectionEndPayload,
  SectionStartPayload,
  StageEndPayload,
  StageStartPayload,
  WeaponEquipPayload,
  WeaponGrabPayload,
  WeaponReleasePayload,
  WearableEquipPayload,
  WearableReleasePayload,
} from "horizon/analytics";
import {
  FrictionCausedPayload,
  TaskStartPayload,
  TaskEndPayload,
  TaskStepStartPayload,
  TaskStepEndPayload,
  QuestCompletedPayload,
} from "horizon/analytics";
import { CustomAnalyticsEvents, Items } from "Enums_Game";
import { Npc } from "horizon/npc";
import { PlayerJoinedEvent } from "Manager_Events";

function getTurboSettings(): Partial<ITurboSettings> {
  return {
    debug: TURBO_DEBUG,
    // ...
  };
}

export function isTurboManagerReady(): boolean {
  return TURBO_IS_ENABLED && !!Turbo;
}

export function Analytics(): AnalyticsManager | undefined {
  return AnalyticsManager && AnalyticsManager.s_instance;
}

/** TODO (Creator): Turbo Analytics Manager: IMPORTANT -> This Must be Attached to an entity in the world */
export class AnalyticsManager extends hz.Component {
  static s_instance: AnalyticsManager;

  start() {
    AnalyticsManager.s_instance = this;
    if (!TURBO_IS_ENABLED) return;
    this.subscribeToEvents();
    Turbo.register(this, getTurboSettings());

    this.entity.visible.set(false);
    // // console.log.*$

    if (Turbo.getConfigs().debug) {
      this.async.setTimeout(() => {
        !Turbo.isReady() &&
          console.warn(
            "🚀 TURBO: Turbo Analytics is not ready yet.  Are you sure it's hooked up?"
          );
      }, 1000 * 3);
    }


    this.connectLocalBroadcastEvent(
      PlayerJoinedEvent,
      ({ player }) => {
        if (Npc.playerIsNpc(player)) return;
        const timeout = this.async.setTimeout(() => {
          this.sendWorldEnterEvent(player);
          this.async.clearTimeout(timeout);
        }, 3000)
      }
    );
  }

  /** TODO (Creator): Add Hooks here from Existing Broadcasts
   WARNING: DO NOT SEND TURBO EVENTS FOR WORLD ENTER/EXIT, AFK/ENTER EXIT or you'll have double logging!
   @example
   this.connectLocalBroadcastEvent(Events.onFoundFiveDollars, (player:hz.Player) => {
       this.sendDiscoveryMade(player, { discoveryItemKey: "found_five_dollars" });
   });
   **/
  subscribeToEvents() {
    if (TURBO_DEBUG) {
      this.connectLocalBroadcastEvent(
        TurboDebug.events.onDebugTurboPlayerEvent,
        (data: { player: hz.Player; eventData: EventData; action: Action }) => {
          if (Npc.playerIsNpc(data.player)) return;
          this.onDebugTurboPlayerEvent(
            data.player,
            data.eventData,
            data.action
          );
        }
      );
    }
  }

  /* Turbo Debugging - DO NOT USE IN PRODUCTION
  @remarks Note: You can delete this once debug is off, but it's needed during Debugging
    because without it, sometimes the first emmitted debug event from Turbo is dropped which can cause the event to stop emmitting including for other potential subscribers
    See @DebugTurbo for various starter tools for you to debug and you'll see what's up (What's up!?)
  */
  onDebugTurboPlayerEvent(
    _player: hz.Player,
    _eventData: EventData,
    _action: Action
  ): void {
    // return;
    // console.log.*$
    //   `🚀 TURBO: Debugging Turbo Player Event: ${_player.name.get()}: ${Action[
    //     _action
    //   ].toString()} : ${JSON.stringify(_eventData.actionCustom)}`
    // );
  }

  /** TURBO SEND EVENTS */
  sendWorldEnterEvent(player: hz.Player) {
    const payload: AreaEnterPayload = {
      actionArea: "PlayerEnteredWorld",
      player: player,
      actionAreaIsLobbySection: false,
      actionAreaIsPlayerReadyZone: false,
    };
    this.sendAreaEnter(payload);
  }
  sendAreaEnter(payload: AreaEnterPayload): boolean {
    console.log(`🚀 TURBO: Sending Area Enter Event: ${payload.actionArea}`);
    return Turbo.send(TurboEvents.OnAreaEnter, payload);
  }
  sendAreaExit(payload: AreaExitPayload): boolean {
    return Turbo.send(TurboEvents.OnAreaExit, payload);
  }
  sendCustomEvent(payload: CustomEventPayload): boolean {
    return Turbo.send(TurboEvents.OnCustomAction, payload);
  }
  sendDeathByEnemy(payload: DeathByEnemyPayload): boolean {
    return Turbo.send(TurboEvents.OnDeathByEnemy, payload);
  }
  sendDeathByPlayer(payload: DeathByPlayerPayload): boolean {
    return Turbo.send(TurboEvents.OnDeathByPlayer, payload);
  }
  sendKOPlayer(payload: KOPlayerPayload): boolean {
    return Turbo.send(TurboEvents.OnKOPlayer, payload);
  }
  sendKOEnemy(payload: KOEnemyPayload): boolean {
    return Turbo.send(TurboEvents.OnKOEnemy, payload);
  }
  sendLevelUp(payload: LevelUpPayload): boolean {
    return Turbo.send(TurboEvents.OnLevelUp, payload);
  }
  sendPlayerReadyEnter(payload: PlayerReadyEnterPayload): boolean {
    return Turbo.send(TurboEvents.OnPlayerReadyEnter, payload);
  }
  sendPlayerReadyExit(payload: PlayerReadyExitPayload): boolean {
    return Turbo.send(TurboEvents.OnPlayerReadyExit, payload);
  }
  sendRewardsEarned(payload: RewardsEarnedPayload): boolean {
    return Turbo.send(TurboEvents.OnRewardsEarned, payload);
  }
  sendStageStart(payload: StageStartPayload): boolean {
    return Turbo.send(TurboEvents.OnStageStart, payload);
  }
  sendStageEnd(payload: StageEndPayload): boolean {
    return Turbo.send(TurboEvents.OnStageEnd, payload);
  }
  sendSectionStart(payload: SectionStartPayload): boolean {
    return Turbo.send(TurboEvents.OnSectionStart, payload);
  }
  sendSectionEnd(payload: SectionEndPayload): boolean {
    return Turbo.send(TurboEvents.OnSectionEnd, payload);
  }
  sendTaskStart(payload: TaskStartPayload): boolean {
    return Turbo.send(TurboEvents.OnTaskStart, payload);
  }
  sendTaskStepStart(payload: TaskStepStartPayload): boolean {
    return Turbo.send(TurboEvents.OnTaskStepStart, payload);
  }
  sendTaskStepEnd(payload: TaskStepEndPayload): boolean {
    return Turbo.send(TurboEvents.OnTaskStepEnd, payload);
  }
  sendTaskEnd(payload: TaskEndPayload): boolean {
    return Turbo.send(TurboEvents.OnTaskEnd, payload);
  }
  sendWeaponEquip(payload: WeaponEquipPayload): boolean {
    return Turbo.send(TurboEvents.OnWeaponEquip, payload);
  }
  sendWeaponGrab(payload: WeaponGrabPayload): boolean {
    return Turbo.send(TurboEvents.OnWeaponGrab, payload);
  }
  sendWeaponRelease(payload: WeaponReleasePayload): boolean {
    return Turbo.send(TurboEvents.OnWeaponRelease, payload);
  }
  sendWearableEquip(payload: WearableEquipPayload): boolean {
    return Turbo.send(TurboEvents.OnWearableEquip, payload);
  }
  sendWearableRelease(payload: WearableReleasePayload): boolean {
    return Turbo.send(TurboEvents.OnWearableRelease, payload);
  }

  /** TODO (Creator): Round Start (All Players)
   * @remarks WARN: This is for ALL players and will send events for EACH affected player
   * @param playersInRound - Players that are in the game when the round starts
   */
  sendAllRoundStart(
    playersInRound: Array<hz.Player>,
    payload: { gameMode?: string; roundName?: string }
  ): boolean {
    return Turbo.send(TurboEvents.OnGameRoundStartForPlayers, {
      players: playersInRound,
      sendPlayerRoundStart: true,
      gameStartData: payload,
    });
  }

  /** TODO (Creator): Round End (All Players)
   * @remarks WARN: This is for ALL players and will send events for EACH affected player
   * @param playersLeftInRound - Players that are still in the game when the round ends
   */
  sendAllRoundEnd(
    playersLeftInRound: Array<hz.Player>,
    _payload: RoundEndPayload
  ): boolean {
    return Turbo.send(TurboEvents.OnGameRoundEndForPlayers, {
      players: playersLeftInRound,
      sendPlayerRoundEnd: true,
    });
  }

  sendDiscoveryMade(
    payload: DiscoveryMadePayload,
    firstTimeOnly = false
  ): boolean {
    if (
      firstTimeOnly &&
      TurboDataService.getDiscoveryItemSeenCount(
        payload.player,
        payload.discoveryItemKey
      ) > 0
    ) {
      return false;
    }
    return Turbo.send(TurboEvents.OnDiscoveryMade, payload);
  }

  sendFrictionCaused(
    payload: FrictionCausedPayload,
    firstTimeOnly = false
  ): boolean {
    if (
      firstTimeOnly &&
      TurboDataService.getFrictionCausedSeen(payload.player).has(
        payload.frictionItemKey
      )
    ) {
      return false;
    }
    return Turbo.send(TurboEvents.OnFrictionCaused, payload);
  }

  sendFrictionHit(payload: FrictionHitPayload, firstTimeOnly = false): boolean {
    if (
      firstTimeOnly &&
      TurboDataService.getFrictionItemSeenCount(
        payload.player,
        payload.frictionItemKey
      ) > 0
    ) {
      return false;
    }
    return Turbo.send(TurboEvents.OnFrictionHit, payload);
  }

  sendQuestCompleted(
    payload: QuestCompletedPayload,
    firstTimeOnly: boolean = true
  ): boolean {
    if (
      firstTimeOnly &&
      TurboDataService.getQuestsUnlocked(payload.player).includes(
        payload.achievementKey
      )
    ) {
      return false;
    }
    return Turbo.send(TurboEvents.OnQuestCompleted, payload);
  }

  ///////////////////////////////////////////////////////////////////////////

  /** Game_Tutorial_start */
  sendGameTutorialStart(player: hz.Player): boolean {
    if (Npc.playerIsNpc(player)) return false;
    return this.sendCustomEvent({
      player: player,
      actionCustom: CustomAnalyticsEvents.GameTutorialStarted,
    });
  }

  /** Game_Tutorial_end */
  sendGameTutorialEnd(player: hz.Player): boolean {
    if (Npc.playerIsNpc(player)) return false;
    return this.sendCustomEvent({
      player: player,
      actionCustom: CustomAnalyticsEvents.GameTutorialEnded,
    });
  }

  /** Role_tutorial_start (RoleName) */
  sendRoleTutorialStart(player: hz.Player, roleName: string): boolean {
    if (Npc.playerIsNpc(player)) return false;

    return this.sendCustomEvent({
      player: player,
      actionCustom: CustomAnalyticsEvents.RoleTutorialStarted + `_${roleName}`,
    });
  }

  /** Role_tutorial_end (RoleName) */
  sendRoleTutorialEnd(player: hz.Player, roleName: string): boolean {
    if (Npc.playerIsNpc(player)) return false;

    return this.sendCustomEvent({
      player: player,
      actionCustom: CustomAnalyticsEvents.RoleTutorialEnded + `_${roleName}`,
    });
  }

  /** Role_switch (RoleName) */
  sendRoleSwitch(player: hz.Player, roleName: string): boolean {
    if (Npc.playerIsNpc(player)) return false;

    return this.sendCustomEvent({
      player: player,
      actionCustom: CustomAnalyticsEvents.RoleSwitched + `_${roleName}`,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Fetcher events
  // ─────────────────────────────────────────────────────────────

  /** Fetcher_pickup (ObjectName, Count) */
  sendFetcherPickup(
    player: hz.Player,
    objectName: string,
    count: number
  ): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key =
      CustomAnalyticsEvents.FetcherFetchedItems +
      `_${objectName}` +
      `_${count}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  /** Fetcher_deposit (ObjectName, Count) */
  sendFetcherDeposit(
    player: hz.Player,
    objectName: string,
    count: number
  ): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key =
      CustomAnalyticsEvents.FetcherDepositedItems +
      `_${objectName}` +
      `_${count}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  sendFetcherTrash(player: hz.Player): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key = CustomAnalyticsEvents.FetcherTrashedItems;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Scooper events
  // ─────────────────────────────────────────────────────────────

  /** Scooper_pickup (ObjectName, Count) */
  sendScooperPickup(player: hz.Player, item: Items): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key = CustomAnalyticsEvents.ScooperPickedItem + `_${item}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  /** Scooper_deposit (ObjectName, Count) */
  sendScooperDeposit(player: hz.Player, objectName: string): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key = CustomAnalyticsEvents.ScooperDepositItem + `_${objectName}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  /** Scooper_trashed (ObjectName, Count) */
  sendScooperTrash(player: hz.Player): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key = CustomAnalyticsEvents.ScooperTrashedItems;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  sendScooperWrongDeposit(player: hz.Player): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key = CustomAnalyticsEvents.ScooperWrongDeposit;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  sendScooperCorrectIceCream(player: hz.Player, orderItems: Items[]): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key =
      CustomAnalyticsEvents.ScooperCorrectIceCream + `_${orderItems.join("-")}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Server events
  // ─────────────────────────────────────────────────────────────

  /** Server_order_start (Table No, OrderName) */
  sendServerOrderStart(
    player: hz.Player,
    tableNo: number | string,
    items: Items[]
  ): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key =
      CustomAnalyticsEvents.ServerOrderStarted +
      `_${tableNo}_${items.join("-")}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  /** Server_order_guess (Table No, OrderName, Status[Yes|No]) */
  sendServerOrderGuess(
    player: hz.Player,
    tableNo: number | string,
    items: Items[],
    status: "Yes" | "No"
  ): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key =
      CustomAnalyticsEvents.ServerOrderGuessed +
      `_${tableNo}_${items.join("-")}_${status}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  /** Server_order_deliver (Table No, OrderName, Status[Yes|No]) */
  sendServerOrderDeliver(
    player: hz.Player,
    tableNo: number | string,
    items: Items[]
  ): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key =
      CustomAnalyticsEvents.ServerOrderDelivered +
      `_${tableNo}_${items.join("-")}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  /** Server_clean_table (TableNo) */
  sendServerCleanTable(player: hz.Player, tableNo: number | string): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key = CustomAnalyticsEvents.ServerCleanedTable + `_${tableNo}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  sendServerTrash(player: hz.Player): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key = CustomAnalyticsEvents.ServerTrashedItems;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Economy / progression
  // ─────────────────────────────────────────────────────────────

  /** Cash_credit (Role, Amount) */
  sendCashCredit(player: hz.Player, role: string, amount: number): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key = CustomAnalyticsEvents.CashCredit + `_${role}_${amount}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  /** XP_credit (Role, Amount) */
  sendXPCredit(player: hz.Player, role: string, amount: number): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key = CustomAnalyticsEvents.XpCredit + `_${role}_${amount}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  /** Level Up (Role, New Level) */
  sendLevelUpCustom(
    player: hz.Player,
    role: string,
    newLevel: number
  ): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key = CustomAnalyticsEvents.LevelUp + `_${role}_${newLevel}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  /** UpgradeHome (HousePart, HouseObject, Amount) */
  sendUpgradeHome(
    player: hz.Player,
    housePart: string,
    amount: number
  ): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key =
      CustomAnalyticsEvents.TownUpgradeButtonClicked +
      `_${housePart}_${amount}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  /** Cash_debit (Amount, Balance) */
  sendCashDebit(player: hz.Player, amount: number): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key = CustomAnalyticsEvents.CashDebit + `_${amount}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Parlour / town sessions
  // ─────────────────────────────────────────────────────────────

  /** ParlourSessionEnd (LastParlourSessionNo) */
  sendParlourSessionEnd(
    player: hz.Player,
    lastParlourSessionNo: number
  ): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key =
      CustomAnalyticsEvents.ParlourSessionEnd + `_${lastParlourSessionNo}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }

  /** ParlourSessionStart (LastParlourSessionNo) */
  sendParlourSessionStart(
    player: hz.Player,
    lastParlourSessionNo: number
  ): boolean {
    if (Npc.playerIsNpc(player)) return false;

    const key =
      CustomAnalyticsEvents.ParlourSessionStart + `_${lastParlourSessionNo}`;
    return this.sendCustomEvent({
      player: player,
      actionCustom: key,
    });
  }
}
hz.Component.register(AnalyticsManager);
