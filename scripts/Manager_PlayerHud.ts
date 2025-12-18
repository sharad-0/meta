import ButtonControl_Fetcher from "ButtonControl_Fetcher";
import {
  AudioGizmoTags,
  DeliveryType,
  EntryTypes,
  NotificationTypes,
  PlayerRoles,
} from "Enums_Game";
import * as hz from "horizon/core";
import {
  PlayerCashUpdatedEvent,
  PlayerExpUpdatedEvent,
  PlayerJoinedEvent,
  PlayerNameStatsUpdatedEvent,
} from "Manager_Events";
import { Order } from "Manager_Order";
import {
  gameManager,
  hudManager,
  playerManager,
  themeSessionManager,
} from "Managers_Instance";
import UI_CashEarned from "UI_CashEarned";
import UI_CustomerGreeting from "UI_CustomerGreeting";
import UI_CustomerLeftNotif from "UI_CustomerLeftNotif";
import UI_FTUE from "UI_FtuePannel";
import UI_FTUERole from "UI_FtuePannel";
import UI_FtuePannel from "UI_FtuePannel";
import UI_OrderDelivered from "UI_OrderDelivered";
import UI_PopupNotifs from "UI_PopupNotifs";
import UI_TownUpgrade from "UI_TownUpgrade";
import { Npc } from "horizon/npc";
import UIButton_Snowfight from "UIButton_Snowfight";
import UIButton_DanceEmote from "UIButton_DanceEmote";
import HUD_PlayerTopStats from "HUD_PlayerTopStats";
import HUD_PlayerCashTop from "HUD_PlayerCashTop";
import HUD_PlayerExp from "HUD_PlayerExp";

// Define the HudManager component
export default class Manager_PlayerHud extends hz.Component<
  typeof Manager_PlayerHud
> {
  static propsDefinition = {
    FetcherHudNonVr: { type: hz.PropTypes.Entity, required: true },
    CashierHud: { type: hz.PropTypes.Entity, required: true },
    cashEarnedNotifUI: { type: hz.PropTypes.Entity, required: true },
    orderDeliveredNotifUI: { type: hz.PropTypes.Entity, required: true },
    customerLeftNotifUI: { type: hz.PropTypes.Entity, required: true },
    orderDeliveredAudio: { type: hz.PropTypes.Entity, required: true },
    popupNotifUI: { type: hz.PropTypes.Asset, required: true },
    townUpgradeUI: { type: hz.PropTypes.Asset, required: false },
    playerStatsTopHud: { type: hz.PropTypes.Asset, required: false },
    playerCashTopHud: { type: hz.PropTypes.Asset, required: false },
    playerExpTopHud: { type: hz.PropTypes.Asset, required: false },
    playerRolesHud: { type: hz.PropTypes.Entity, required: false },
    parlourTimerHud: { type: hz.PropTypes.Entity, required: false },
    greetingUI: { type: hz.PropTypes.Asset, required: true },
    replayFtueUi: { type: hz.PropTypes.Entity, required: false },
    fetcherButtonUi: { type: hz.PropTypes.Asset, required: false },
    fetcherButtonUiDesktop: { type: hz.PropTypes.Asset, required: false },
    ftuePanelUi: { type: hz.PropTypes.Asset, required: false },
    snowflakeHud: { type: hz.PropTypes.Asset, required: false },
    snowfightButtonUi: { type: hz.PropTypes.Asset, required: false },
    snowfightButtonUiDesktop: { type: hz.PropTypes.Asset, required: false },
    EmoteDanceButtonUi: { type: hz.PropTypes.Asset, required: false },
    EmoteDanceButtonUiDesktop: { type: hz.PropTypes.Asset, required: false },
  };

  private playersVsPopupNotifUi: Map<hz.Player, hz.Entity> = new Map();
  private playersVsTownUpgradeUi: Map<hz.Player, hz.Entity> = new Map();
  private playersVsGreetingUi: Map<hz.Player, hz.Entity> = new Map();
  private playersVsReplayFtueUi: hz.Player[] = [];
  private playerVsFetcherButtonUi: Map<hz.Player, hz.Entity> = new Map();
  private playersToHideLoadingScreen: hz.Player[] = [];
  private playersVsFTUEUi: Map<hz.Player, hz.Entity> = new Map();
  private playerVsSnowfightButtonUi: Map<hz.Player, hz.Entity> = new Map();
  private playerVsDanceEmoteButtonUi: Map<hz.Player, hz.Entity> = new Map();
  private playersVsTopStatsHud: Map<hz.Player, hz.Entity> = new Map();
  private playersVsPlayerCashHud: Map<hz.Player, hz.Entity> = new Map();
  private playersVsPlayerExpHud: Map<hz.Player, hz.Entity> = new Map();
  hideNotifUi() {
    const players = playerManager?.getCurrentPlayers() ?? [];

    this.props.cashEarnedNotifUI!.visible.set(false);
    this.props.cashEarnedNotifUI!.setVisibilityForPlayers(
      players,
      hz.PlayerVisibilityMode.HiddenFrom
    );

    this.props.customerLeftNotifUI!.visible.set(false);
    this.props.customerLeftNotifUI!.setVisibilityForPlayers(
      players,
      hz.PlayerVisibilityMode.HiddenFrom
    );
  }

  showCashEarnedNotifUi(orderAmountReceived: number, cash: number) {
    this.hideNotifUi(); // Hide the notification UI first
    if (gameManager?.isThisTrainingSession()) return;
    const players = playerManager?.getCurrentPlayers() ?? [];

    this.async.setTimeout(() => {
      this.props.cashEarnedNotifUI!.setVisibilityForPlayers(
        players,
        hz.PlayerVisibilityMode.HiddenFrom
      ); // Hide the notification UI after a delay
    }, 3000); // Adjust the delay as needed
    this.props.cashEarnedNotifUI!.visible.set(true);
    this.props
      .cashEarnedNotifUI!.getComponents(UI_CashEarned)[0]
      .setCashAmount(orderAmountReceived, cash);
    this.props.cashEarnedNotifUI!.setVisibilityForPlayers(
      playerManager?.getNonFtuePlayers() ?? [],
      hz.PlayerVisibilityMode.VisibleTo
    );
  }

  // showOrderAcceptedNotifUi(orderId: number) {
  //   this.hideNotifUi(); // Hide the notification UI first
  //   this.props.basicNotifUI!.visible.set(true);

  //   const players = playerManager?.getCurrentPlayers() ?? [];
  //   this.props
  //     .basicNotifUI!.getComponents(UI_BasicNotifications)[0]
  //     .setTextContent(`Order #${orderId} accepted!`, "rgba(19, 167, 34, 0.8)");
  //   this.props.basicNotifUI!.setVisibilityForPlayers(
  //     players,
  //     hz.PlayerVisibilityMode.VisibleTo
  //   );
  //   this.async.setTimeout(() => {
  //     this.props.basicNotifUI!.setVisibilityForPlayers(
  //       players,
  //       hz.PlayerVisibilityMode.HiddenFrom
  //     ); // Hide the notification UI after a delay
  //   }, 3000); // Adjust the delay as needed
  // }

  showOrderDeliveredNotifUi(deliveryType: DeliveryType, amount: number) {
    if (gameManager?.isThisTrainingSession()) return;
    this.props.orderDeliveredNotifUI!.visible.set(true);

    this.props
      .orderDeliveredNotifUI!.getComponents(UI_OrderDelivered)[0]
      .notifyDelivered(deliveryType, amount);
  }

  showCustomerLeftNotifUi(tableId: string, orderId: number) {
    this.hideNotifUi(); // Hide the notification UI first
    if (gameManager?.isThisTrainingSession()) return;

    this.async.setTimeout(() => {
      this.props.customerLeftNotifUI!.setVisibilityForPlayers(
        playerManager?.getCurrentPlayers() ?? [],
        hz.PlayerVisibilityMode.HiddenFrom
      ); // Hide the notification UI after a delay
    }, 3000); // Adjust the delay as needed
    this.props
      .customerLeftNotifUI!.getComponents(UI_CustomerLeftNotif)[0]
      .setTableNumber(tableId, orderId);
    this.props.customerLeftNotifUI!.visible.set(true);
    this.props.customerLeftNotifUI!.setVisibilityForPlayers(
      playerManager?.getNonFtuePlayers() ?? [],
      hz.PlayerVisibilityMode.VisibleTo
    );
  }

  // Function to hide all HUDs
  hideAllHuds(players: hz.Player[]) {
    this.props.FetcherHudNonVr!.setVisibilityForPlayers(
      players,
      hz.PlayerVisibilityMode.HiddenFrom
    );
    this.props.CashierHud!.setVisibilityForPlayers(
      players,
      hz.PlayerVisibilityMode.HiddenFrom
    );
    this.hideNotifUi(); // Hide notification UI
  }

  // Function to show HUD based on player role
  showHud(player: hz.Player) {
    const playerRole = playerManager?.getRole(player) ?? PlayerRoles.Unknown;
    const players = playerManager?.getRolePlayers(playerRole) ?? [];

    switch (playerRole) {
      case PlayerRoles.Fetcher:
        // if (!gameManager?.isThisTrainingSession()) {
        const nonVrPlayers = players.filter((p) =>
          p.isValidReference &&
          !Npc.playerIsNpc(p) &&
          p.deviceType.get() !== hz.PlayerDeviceType.VR
        ); console.log(`Fetcher players: ${players.length}`);
        this.props.FetcherHudNonVr!.visible.set(true);
        this.props.FetcherHudNonVr!.setVisibilityForPlayers(
          nonVrPlayers,
          hz.PlayerVisibilityMode.VisibleTo
        );

        break;
      case PlayerRoles.Scooper:
        break;
      case PlayerRoles.Server:
        this.props.CashierHud!.visible.set(true);
        this.props.CashierHud!.setVisibilityForPlayers(
          players,
          hz.PlayerVisibilityMode.VisibleTo
        );
        break;
      case PlayerRoles.Unknown:
        // console.log.*$
        break;
      default:
        console.error("No Role HUD found for player:", player.name.get());
        break;
    }
  }

  public syncHudVisibility(
    hudEntity: hz.Entity,
    playersToShow: hz.Player[],
    allPlayers: hz.Player[]
  ): void {
    const visibleIds = new Set(playersToShow.map((p) => p.id));
    const playersToHide = allPlayers.filter((p) => !visibleIds.has(p.id));

    hudEntity.visible?.set(true);
    hudEntity.setVisibilityForPlayers(
      playersToShow,
      hz.PlayerVisibilityMode.VisibleTo
    );
    hudEntity.setVisibilityForPlayers(
      playersToHide,
      hz.PlayerVisibilityMode.HiddenFrom
    );
  }

  public refreshHUD() {
    const livePlayers = playerManager?.getCurrentPlayers() ?? [];
    // Iterate through all players and show the appropriate HUD based on their role
    this.hideAllHuds(livePlayers); // Hide all HUDs first
    livePlayers.forEach((player) => {
      if (player && Npc.playerIsNpc(player)) return; // Skip bots
      this.showHud(player);
    });
  }

  preStart(): void {
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      (player) => {
        {
          if (!Npc.playerIsNpc(player)) {
            this.attachPopupNotifUiToPlayer(player);
            this.attachGreetingUiToPlayer(player);
            this.attachFetcherButtonUiToPlayer(player);
            // this.async.setTimeout(() => {
            //   this.attachTownUpgradeUiToPlayer(player);
            // }, 5000);
          }
        }
      }
    );

    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitWorld,
      (player) => {
        this.detachFetcherButtonUiFromPlayer(player);
        this.detachPopupNotifUiFromPlayer(player);
        this.detachGreetingUiFromPlayer(player);
        this.detachFTUEUiFromPlayer(player);
        this.detachTopHudsFromPlayer(player);
        // this.detachPlayerTopStatsFromPlayer(player);
      }
    );
  }

  // Start function to initialize the component
  start() {
    this.hideNotifUi(); // Ensure the notification UI is hidden at start
    // playerManager?.getCurrentPlayers().forEach((player) => {
    //   this.attachPopupNotifUiToPlayer(player);
    // });

    // this.connectLocalBroadcastEvent(mainArenaSessionStarted, (payload) => {
    //   this.markPlayerHudsVisible();
    //   // playerManager?.hideLoadingScreenFromPlayer(payload.player);
    // });

    this.connectLocalBroadcastEvent(PlayerJoinedEvent, ({ player }) => {
      if (!Npc.playerIsNpc(player)) {
        this.attachFTUEUiToPlayer(player);
        this.attachTopHudsToPlayer(player);
        this.async.setTimeout(() => {
          this.showPlayerTopHudsToPlayer(player);
        }, 5000);
      }
    });

    // const timer = this.async.setTimeout(() => {
    //   this.markPlayerHudsVisible();
    //   this.async.clearTimeout(timer);
    // }, 3000);

    // this.connectLocalBroadcastEvent(PlayerJoinedEvent, ({ player }) => {
    //   this.attachTopStatsHudToPlayer(player);
    // });
  }

  markPlayerHudsVisible() {
    // this.props.playerStatsTopHud?.visible.set(true);
    // this.props.playerCashTopHud?.visible.set(true);
    // this.props.playerExpTopHud?.visible.set(true);
    this.props.playerRolesHud?.visible.set(true);
    // this.props.parlourTimerHud?.visible.set(true);
  }

  showPopupNotifToPlayer(
    notifType: NotificationTypes,
    player: hz.Player,
    timeToHideInSeconds: number,
    customText?: string
  ) {
    // if (gameManager?.isThisTrainingSession()) return;

    const popupNotif = this.playersVsPopupNotifUi.get(player);
    // console.log.*$
    //   `Attaching popup notification UI to player 6: ${notifType.toString()}`
    // );

    if (popupNotif) {
      // console.log.*$
      //   `Attaching popup notification UI to player 7: ${notifType.toString()}`
      // );
      popupNotif
        .getComponents(UI_PopupNotifs)[0]
        .setImage(notifType, player, timeToHideInSeconds);
      // popupNotif.visible.set(true);
    }
  }

  public showGreetingUiToPlayer(
    player: hz.Player,
    order: Order,
    tableId: string
  ) {
    // if (gameManager?.isThisTrainingSession()) return;

    const greetingUi = this.playersVsGreetingUi.get(player);

    if (greetingUi) {
      // console.log.*$
      greetingUi
        .getComponents(UI_CustomerGreeting)[0]
        .setOrder(order, player, tableId);
      greetingUi.visible.set(true);
    }
  }
  public hideGreetingUiFromPlayer(player: hz.Player) {
    const greetingUi = this.playersVsGreetingUi.get(player);
    if (greetingUi) {
      greetingUi.visible.set(false);
    }
  }
  public detachPopupNotifUiFromPlayer(player: hz.Player) {
    const popupNotif = this.playersVsPopupNotifUi.get(player);
    if (popupNotif) {
      this.playersVsPopupNotifUi.delete(player);
      this.world.deleteAsset(popupNotif, true);
    }
  }

  public detachGreetingUiFromPlayer(player: hz.Player) {
    const greetingUi = this.playersVsGreetingUi.get(player);
    if (greetingUi) {
      this.playersVsGreetingUi.delete(player);
      this.world.deleteAsset(greetingUi, true);
    }
  }

  public detachFetcherButtonUiFromPlayer(player: hz.Player) {
    const fetcherButtonUi = this.playerVsFetcherButtonUi.get(player);
    if (fetcherButtonUi) {
      this.playerVsFetcherButtonUi.delete(player);
      this.world.deleteAsset(fetcherButtonUi, true);
    }
  }

  public attachPopupNotifUiToPlayer(player: hz.Player) {
    // console.log.*$
    //   `Attaching popup notification UI to player 1: ${player.name.get()}`
    // );
    if (this.playersVsPopupNotifUi.has(player)) {
      return;
    }
    // console.log.*$
    //   `Attaching popup notification UI to player 2: ${this.playersVsPopupNotifUi.has(
    //     player
    //   )}`
    // );
    if (!playerManager?.isRealPlayer(player)) return;

    // console.log.*$
    //   `Attaching popup notification UI to player 3: ${playerManager?.isRealPlayer(
    //     player
    //   )}`
    // );
    this.world
      .spawnAsset(
        this.props.popupNotifUI!,
        new hz.Vec3(-100, -100, 100),
        new hz.Quaternion(1, 1, 1, 1)
      )
      .then((popupNotifEntity) => {
        // console.log.*$

        if (popupNotifEntity[0]) {
          // console.log.*$
          popupNotifEntity[0].visible.set(false);
          this.playersVsPopupNotifUi.set(player, popupNotifEntity[0]);
          popupNotifEntity[0].setVisibilityForPlayers(
            [],
            hz.PlayerVisibilityMode.VisibleTo
          );
          popupNotifEntity[0].setVisibilityForPlayers(
            [player],
            hz.PlayerVisibilityMode.VisibleTo
          );
        }
      });
  }

  public attachGreetingUiToPlayer(player: hz.Player) {
    // console.log.*$
    if (!playerManager?.isRealPlayer(player)) return;

    if (this.playersVsGreetingUi.has(player)) {
      return;
    }
    // console.log.*$
    //   `Attaching greeting UI to player 2: ${this.playersVsGreetingUi.has(
    //     player
    //   )}`
    // );

    // console.log.*$
    //   `Attaching popup notification UI to player 3: ${playerManager?.isRealPlayer(
    //     player
    //   )}`
    // );
    this.world
      .spawnAsset(
        this.props.greetingUI!,
        new hz.Vec3(-100, -100, 100),
        new hz.Quaternion(1, 1, 1, 1)
      )
      .then((greetingEntity) => {
        // console.log.*$

        if (greetingEntity[0]) {
          // console.log.*$
          greetingEntity[0].visible.set(false);
          this.playersVsGreetingUi.set(player, greetingEntity[0]);
          greetingEntity[0].setVisibilityForPlayers(
            [],
            hz.PlayerVisibilityMode.VisibleTo
          );
          greetingEntity[0].setVisibilityForPlayers(
            [player],
            hz.PlayerVisibilityMode.VisibleTo
          );
        }
      });
  }

  public showReplayFtueUiToPlayer(player: hz.Player) {
    if (!this.props.replayFtueUi) return;
    if (this.playersVsReplayFtueUi.includes(player)) {
      return;
    }
    this.playersVsReplayFtueUi.push(player);
    this.props.replayFtueUi.visible.set(true);
    this.props.replayFtueUi.setVisibilityForPlayers(
      [],
      hz.PlayerVisibilityMode.VisibleTo
    );
    this.props.replayFtueUi.setVisibilityForPlayers(
      this.playersVsReplayFtueUi,
      hz.PlayerVisibilityMode.VisibleTo
    );
  }

  public hideReplayFtueUiFromPlayer(player: hz.Player) {
    if (!this.props.replayFtueUi) return;
    this.playersVsReplayFtueUi = this.playersVsReplayFtueUi.filter(
      (p) => p !== player
    );
    this.props.replayFtueUi.setVisibilityForPlayers(
      [],
      hz.PlayerVisibilityMode.VisibleTo
    );
    this.props.replayFtueUi.setVisibilityForPlayers(
      this.playersVsReplayFtueUi,
      hz.PlayerVisibilityMode.VisibleTo
    );
  }
  public showFetcherButtonUiToPlayer(player: hz.Player) {
    const fetcherButtonUi = this.getFetcherButtonUiForPlayer(player);
    if (fetcherButtonUi) {
      fetcherButtonUi.visible.set(true);
      fetcherButtonUi
        .getComponents(ButtonControl_Fetcher)[0]
        .setDefaultDisabledState();
      fetcherButtonUi.setVisibilityForPlayers(
        [],
        hz.PlayerVisibilityMode.VisibleTo
      );
      if (player.deviceType.get() === hz.PlayerDeviceType.Desktop || player.deviceType.get() === hz.PlayerDeviceType.Mobile) {
        fetcherButtonUi.setVisibilityForPlayers(
          [player],
          hz.PlayerVisibilityMode.VisibleTo
        );
      }
      // console.log.*$
      //   `Showing fetcher button UI to player: ${player.name.get()}, ${fetcherButtonUi.visible.get()}`
      // );
    }
  }

  public setFetcherDisabledStateForPlayer(player: hz.Player) {
    const fetcherButtonUi = this.getFetcherButtonUiForPlayer(player);
    if (!fetcherButtonUi) return;
    fetcherButtonUi
      .getComponents(ButtonControl_Fetcher)[0]
      .setDefaultDisabledState();
  }

  public hideFetcherButtonUiFromPlayer(player: hz.Player) {
    const fetcherButtonUi = this.getFetcherButtonUiForPlayer(player);
    if (fetcherButtonUi) {
      // console.log.*$
      //   `Hiding fetcher button UI from player: ${player.name.get()}, ${fetcherButtonUi.visible.get()}`
      // );

      fetcherButtonUi.setVisibilityForPlayers(
        [],
        hz.PlayerVisibilityMode.VisibleTo
      );
    }
  }

  public getFetcherButtonUiForPlayer(player: hz.Player): hz.Entity | undefined {
    return this.playerVsFetcherButtonUi.get(player);
  }

  public getFetcherButtonUiCompForPlayer(
    player: hz.Player
  ): ButtonControl_Fetcher | undefined {
    const uiEntity = this.playerVsFetcherButtonUi.get(player);
    return uiEntity?.getComponents(ButtonControl_Fetcher)[0];
  }

  public attachFetcherButtonUiToPlayer(player: hz.Player) {
    // console.log.*$
    //   `Attaching fetcher button UI to player 1: ${player.name.get()}`
    // );
    if (!playerManager?.isRealPlayer(player)) return;

    if (this.playerVsFetcherButtonUi.has(player)) {
      return;
    }
    // console.log.*$
    //   `Attaching fetcher button UI to player 2: ${this.playerVsFetcherButtonUi.has(
    //     player
    //   )}`
    // );
    let asset = this.props.fetcherButtonUi!;
    if (player.deviceType.get() === hz.PlayerDeviceType.Desktop) {
      asset = this.props.fetcherButtonUiDesktop!;
    }
    this.world
      .spawnAsset(
        asset,
        new hz.Vec3(-100, -100, 100),
        new hz.Quaternion(1, 1, 1, 1)
      )
      .then((fetcherButtonEntity) => {
        // console.log.*$

        if (fetcherButtonEntity[0]) {
          // console.log.*$
          //   `Attached fetcher button UI to player 5, ${fetcherButtonEntity[0].visible.get()}`
          // );
          // fetcherButtonEntity[0].visible.set(true);

          this.playerVsFetcherButtonUi.set(player, fetcherButtonEntity[0]);
          // fetcherButtonEntity[0].owner.set(player);
          fetcherButtonEntity[0].setVisibilityForPlayers(
            [],
            hz.PlayerVisibilityMode.VisibleTo
          );
          fetcherButtonEntity[0]
            .getComponents(ButtonControl_Fetcher)[0]
            .setPlayerAndDevice(player);
        }
      });
  }

  attachFTUEUiToPlayer(player: hz.Player) {
    // console.log.*$
    if (this.playersVsFTUEUi.has(player)) {
      return;
    }
    // console.log.*$
    //   `Attaching popup ftue UI to player 2: ${this.playersVsFTUEUi.has(player)}`
    // );
    if (!playerManager?.isRealPlayer(player)) return;
    if (!playerManager?.isFtueUiRequired(player)) return;

    this.world
      .spawnAsset(
        this.props.ftuePanelUi!,
        new hz.Vec3(-100, -100, 100),
        new hz.Quaternion(1, 1, 1, 1)
      )
      .then((ftueUiEntities) => {
        if (ftueUiEntities[0]) {
          ftueUiEntities[0].visible.set(false);
          this.playersVsFTUEUi.set(player, ftueUiEntities[0]);
          ftueUiEntities[0].setVisibilityForPlayers(
            [],
            hz.PlayerVisibilityMode.VisibleTo
          );
          ftueUiEntities[0].setVisibilityForPlayers(
            [player],
            hz.PlayerVisibilityMode.VisibleTo
          );

          const ftueData = playerManager?.getFTUEData(player);
          const entryType = EntryTypes.main; // Default to main entry
          if (ftueData && ftueData[entryType] === false) {
            hudManager?.showFTUEUiToPlayer(player, entryType);
          } else if (!ftueData) {
            hudManager?.showFTUEUiToPlayer(player, entryType);
          }
        }
      });
  }

  public showFTUEUiToPlayer(player: hz.Player, entryType: EntryTypes) {
    const ftueUi = this.playersVsFTUEUi.get(player);
    if (ftueUi) {
      ftueUi.getComponents(UI_FTUERole)[0].setImage(entryType);
      ftueUi.visible.set(true);
    }
  }

  public detachFTUEUiFromPlayer(player: hz.Player) {
    const ftueUi = this.playersVsFTUEUi.get(player);
    if (ftueUi) {
      this.playersVsFTUEUi.delete(player);
      this.world.deleteAsset(ftueUi, true);
    }
  }

  attachSnowflakeHudToPlayer() {
    this.world
      .spawnAsset(
        this.props.snowflakeHud!,
        new hz.Vec3(-100, -100, 100),
        new hz.Quaternion(1, 1, 1, 1)
      )
      .then((ftueUiEntities) => {
        if (ftueUiEntities[0]) {
          ftueUiEntities[0].visible.set(true);
        }
      });
  }

  public attachSnowfightButtonUiToPlayer(player: hz.Player) {
    // console.log.*$
    //   `Attaching snowfight button UI to player 1: ${player.name.get()}`
    // );
    if (!playerManager?.isRealPlayer(player)) return;

    if (this.playerVsSnowfightButtonUi.has(player)) {
      return;
    }
    // console.log.*$
    //   `Attaching snowfight button UI to player 2: ${this.playerVsSnowfightButtonUi.has(
    //     player
    //   )}`
    // );
    let asset = this.props.snowfightButtonUi!;
    if (player.deviceType.get() === hz.PlayerDeviceType.Desktop) {
      asset = this.props.snowfightButtonUiDesktop!;
    }
    this.world
      .spawnAsset(
        asset,
        new hz.Vec3(-100, -100, 100),
        new hz.Quaternion(1, 1, 1, 1)
      )
      .then((snowfightButtonEntity) => {
        // console.log.*$

        if (snowfightButtonEntity[0]) {
          // console.log.*$
          //   `Attached snowfight button UI to player 5, ${snowfightButtonEntity[0].visible.get()}`
          // );
          // snowfightButtonEntity[0].visible.set(true);

          this.playerVsSnowfightButtonUi.set(player, snowfightButtonEntity[0]);
          // snowfightButtonEntity[0].owner.set(player);
          snowfightButtonEntity[0].setVisibilityForPlayers(
            [],
            hz.PlayerVisibilityMode.VisibleTo
          );
          if (player.deviceType.get() !== hz.PlayerDeviceType.VR) {

            snowfightButtonEntity[0].setVisibilityForPlayers(
              [player],
              hz.PlayerVisibilityMode.VisibleTo
            );
          }
          snowfightButtonEntity[0]
            .getComponents(UIButton_Snowfight)[0]
            .setPlayerAndDevice(player);
        }
      });
  }

  public detachSnowfightButtonUiFromPlayer(player: hz.Player) {
    const snowfightButtonUi = this.playerVsSnowfightButtonUi.get(player);
    if (snowfightButtonUi) {
      this.playerVsSnowfightButtonUi.delete(player);
      this.world.deleteAsset(snowfightButtonUi, true);
    }
  }

  public showSnowfightButtonUiToPlayer(player: hz.Player) {
    const snowfightButtonUi = this.playerVsSnowfightButtonUi.get(player);
    if (snowfightButtonUi) {
      snowfightButtonUi.getComponents(UIButton_Snowfight)[0].resetUi();
    }
  }

  public hideSnowfightButtonUiFromPlayer(player: hz.Player) {
    const snowfightButtonUi = this.playerVsSnowfightButtonUi.get(player);
    if (snowfightButtonUi) {
      snowfightButtonUi.visible.set(false);
    }
  }

  public attachDanceEmoteButtonUiToPlayer(player: hz.Player) {
    // console.log.*$
    //   `Attaching dance emote button UI to player 1: ${player.name.get()}`
    // );
    if (!playerManager?.isRealPlayer(player)) return;

    if (this.playerVsDanceEmoteButtonUi.has(player)) {
      return;
    }
    // console.log.*$
    //   `Attaching dance emote button UI to player 2: ${this.playerVsDanceEmoteButtonUi.has(
    //     player
    //   )}`
    // );
    let asset = this.props.EmoteDanceButtonUi!;
    if (player.deviceType.get() === hz.PlayerDeviceType.Desktop) {
      asset = this.props.EmoteDanceButtonUiDesktop!;
    }
    this.world
      .spawnAsset(
        asset,
        new hz.Vec3(-100, -100, 100),
        new hz.Quaternion(1, 1, 1, 1)
      )
      .then((danceEmoteButtonEntity) => {
        // console.log.*$

        if (danceEmoteButtonEntity[0]) {
          // console.log.*$
          //   `Attached dance emote button UI to player 5, ${danceEmoteButtonEntity[0].visible.get()}`
          // );
          // snowfightButtonEntity[0].visible.set(true);

          this.playerVsDanceEmoteButtonUi.set(
            player,
            danceEmoteButtonEntity[0]
          );
          // snowfightButtonEntity[0].owner.set(player);
          danceEmoteButtonEntity[0].setVisibilityForPlayers(
            [],
            hz.PlayerVisibilityMode.VisibleTo
          );
          if (player.deviceType.get() !== hz.PlayerDeviceType.VR) {
            danceEmoteButtonEntity[0].setVisibilityForPlayers(
              [player],
              hz.PlayerVisibilityMode.VisibleTo
            );
          }
          danceEmoteButtonEntity[0]
            .getComponents(UIButton_DanceEmote)[0]
            .setPlayerAndDevice(player);
        }
      });
  }

  public detachDanceEmoteButtonUiFromPlayer(player: hz.Player) {
    const danceEmoteButtonUi = this.playerVsDanceEmoteButtonUi.get(player);
    if (danceEmoteButtonUi) {
      this.playerVsDanceEmoteButtonUi.delete(player);
      this.world.deleteAsset(danceEmoteButtonUi, true);
    }
  }

  public showDanceEmoteButtonUiToPlayer(player: hz.Player) {
    const danceEmoteButtonUi = this.playerVsDanceEmoteButtonUi.get(player);
    if (danceEmoteButtonUi) {
      danceEmoteButtonUi.visible.set(true);
    }
  }

  public hideDanceEmoteButtonUiFromPlayer(player: hz.Player) {
    const danceEmoteButtonUi = this.playerVsDanceEmoteButtonUi.get(player);
    if (danceEmoteButtonUi) {
      danceEmoteButtonUi.visible.set(false);
    }
  }

  // public attachTopStatsHudToPlayer(player: hz.Player) {
  //   const timeOut = this.async.setTimeout(() => {
  //     if (!playerManager?.isRealPlayer(player)) return;

  //     if (this.playersVsTopStatsHud.has(player)) {
  //       return;
  //     }

  //     let asset = this.props.playerStatsTopHud!;

  //     this.world
  //       .spawnAsset(
  //         asset,
  //         new hz.Vec3(-100, -100, 100),
  //         new hz.Quaternion(1, 1, 1, 1)
  //       )
  //       .then((topStatsHudEntity) => {
  //         // console.log.*$

  //         if (topStatsHudEntity[0]) {
  //           this.playersVsTopStatsHud.set(player, topStatsHudEntity[0]);
  //           // snowfightButtonEntity[0].owner.set(player);
  //           topStatsHudEntity[0].setVisibilityForPlayers(
  //             [],
  //             hz.PlayerVisibilityMode.VisibleTo
  //           );
  //           topStatsHudEntity[0].setVisibilityForPlayers(
  //             [player],
  //             hz.PlayerVisibilityMode.VisibleTo
  //           );
  //           topStatsHudEntity[0]
  //             .getComponents(HUD_PlayerTopStats)[0]
  //             .setPlayerData(player, PlayerRoles.Unknown);
  //           topStatsHudEntity[0].visible.set(true);
  //         }
  //       });
  //     this.async.clearTimeout(timeOut);
  //   }, 5000);
  // }

  // public detachPlayerTopStatsFromPlayer(player: hz.Player) {
  //   const topStatsHud = this.playersVsTopStatsHud.get(player);
  //   if (topStatsHud) {
  //     this.playersVsTopStatsHud.delete(player);
  //     this.world.deleteAsset(topStatsHud, true);
  //   }
  // }



  showPlayerTopHudsToPlayer(player: hz.Player) {
    const topStatsHud = this.playersVsTopStatsHud.get(player);
    if (topStatsHud) {
      topStatsHud.visible.set(true);
    }
    const playerCashHud = this.playersVsPlayerCashHud.get(player);
    if (playerCashHud) {
      playerCashHud.visible.set(true);
    }
    const playerExpHud = this.playersVsPlayerExpHud.get(player);
    if (playerExpHud) {
      playerExpHud.visible.set(true);
    }
  }


  async attachTopHudsToPlayer(player: hz.Player) {
    if (this.props.playerStatsTopHud) {
      await this.attachTopStatsHudToPlayer(player);
    }
    if (this.props.playerCashTopHud) {
      await this.attachPlayerCashHudToPlayer(player);
    }
    if (this.props.playerExpTopHud) {
      await this.attachPlayerExpHudToPlayer(player);
    }

    const timer = this.async.setTimeout(() => {
      const rec = playerManager?.getPlayerRecord(player);
      if (rec) {
        this.sendNetworkEvent(player, PlayerCashUpdatedEvent, {
          player,
          newCash: rec.cash,
        });
        const exp = playerManager?.getExp(player) ?? 0;
        const level = playerManager?.getLevel(exp) ?? 1;

        const prevCap = playerManager?.getLevelCap(level) ?? 0;
        const nextCap = playerManager?.getLevelCap(level + 1) ?? prevCap + 1;
        this.sendNetworkEvent(player, PlayerExpUpdatedEvent, {
          player,
          newExp: rec.exp,
          prevCap,
          nextCap,
          level,
        });
        this.sendNetworkEvent(player, PlayerNameStatsUpdatedEvent, {
          player,
          newRole: rec.role,
        });
        this.showPlayerTopHudsToPlayer(player);

      }
      this.async.clearTimeout(timer);
    }, 3000);
  }
  async detachTopHudsFromPlayer(player: hz.Player) {
    this.detachTopStatsHudFromPlayer(player);
    this.detachPlayerCashHudFromPlayer(player);
    this.detachPlayerExpHudFromPlayer(player);
  }

  async attachTopStatsHudToPlayer(player: hz.Player) {
    if (!playerManager?.isRealPlayer(player)) return;

    if (this.playersVsTopStatsHud.has(player)) {
      return;
    }
    await this.world
      .spawnAsset(
        this.props.playerStatsTopHud!,
        new hz.Vec3(-100, -100, 100),
        new hz.Quaternion(1, 1, 1, 1)
      )
      .then((topStatsHudEntity) => {
        // console.log.*$

        if (topStatsHudEntity[0]) {
          this.playersVsTopStatsHud.set(
            player,
            topStatsHudEntity[0]
          );
          topStatsHudEntity[0].owner.set(player);
          topStatsHudEntity[0].setVisibilityForPlayers(
            [],
            hz.PlayerVisibilityMode.VisibleTo
          );
          topStatsHudEntity[0].setVisibilityForPlayers(
            [player],
            hz.PlayerVisibilityMode.VisibleTo
          );
        }
      });
  }

  async attachPlayerCashHudToPlayer(player: hz.Player) {
    if (!playerManager?.isRealPlayer(player)) return;

    if (this.playersVsPlayerCashHud.has(player)) {
      return;
    }
    await this.world
      .spawnAsset(
        this.props.playerCashTopHud!,
        new hz.Vec3(-100, -100, 100),
        new hz.Quaternion(1, 1, 1, 1)
      )
      .then((cashHudEntity) => {
        // console.log.*$

        if (cashHudEntity[0]) {
          this.playersVsPlayerCashHud.set(
            player,
            cashHudEntity[0]
          );
          cashHudEntity[0].owner.set(player);
          cashHudEntity[0].setVisibilityForPlayers(
            [],
            hz.PlayerVisibilityMode.VisibleTo
          );
          cashHudEntity[0].setVisibilityForPlayers(
            [player],
            hz.PlayerVisibilityMode.VisibleTo
          );
          const currentCash = playerManager?.getCash(player) || 0;

        }
      });
  }

  async attachPlayerExpHudToPlayer(player: hz.Player) {
    if (!playerManager?.isRealPlayer(player)) return;

    if (this.playersVsPlayerExpHud.has(player)) {
      return;
    }
    await this.world
      .spawnAsset(
        this.props.playerExpTopHud!,
        new hz.Vec3(-100, -100, 100),
        new hz.Quaternion(1, 1, 1, 1)
      )
      .then((expHudEntity) => {
        // console.log.*$

        if (expHudEntity[0]) {
          this.playersVsPlayerExpHud.set(
            player,
            expHudEntity[0]
          );
          expHudEntity[0].owner.set(player);
          expHudEntity[0].setVisibilityForPlayers(
            [],
            hz.PlayerVisibilityMode.VisibleTo
          );
          expHudEntity[0].setVisibilityForPlayers(
            [player],
            hz.PlayerVisibilityMode.VisibleTo
          );

        }
      });
  }

  async detachTopStatsHudFromPlayer(player: hz.Player) {
    const topStatsHud = this.playersVsTopStatsHud.get(player);
    if (topStatsHud) {
      this.playersVsTopStatsHud.delete(player);
      this.world.deleteAsset(topStatsHud, true);
    }
  }

  async detachPlayerCashHudFromPlayer(player: hz.Player) {
    const playerCashHud = this.playersVsPlayerCashHud.get(player);
    if (playerCashHud) {
      this.playersVsPlayerCashHud.delete(player);
      this.world.deleteAsset(playerCashHud, true);
    }
  }

  async detachPlayerExpHudFromPlayer(player: hz.Player) {
    const playerExpHud = this.playersVsPlayerExpHud.get(player);
    if (playerExpHud) {
      this.playersVsPlayerExpHud.delete(player);
      this.world.deleteAsset(playerExpHud, true);
    }
  }
}

// Register the HudManager component
hz.Component.register(Manager_PlayerHud);
