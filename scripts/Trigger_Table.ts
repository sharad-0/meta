import {
  AudioGizmo,
  CodeBlockEvents,
  Component,
  Entity,
  Player,
  PropTypes,
  Vec3,
} from "horizon/core";
import Component_Table from "Component_Table";
import {
  AudioGizmoTags,
  CashierUiTags,
  CustomAnalyticsEvents,
  DeliveryTypeEnum,
  PlayerRoles,
  TableStatus,
} from "Enums_Game";
import {
  cashierManager,
  cashierUIManager,
  cashPoolManager,
  gameManager,
  hapticsManager,
  hudManager,
  mainArenaManager,
  npcManager,
  orderManager,
  playerAnimations,
  playerManager,
  serverManager,
  snowflakeManager,
  tableManager,
  utilityManager,
} from "Managers_Instance";
import { Order } from "Manager_Order";
import { PlayerCameraEvents } from "PlayerCamera";
import { CameraMode } from "horizon/camera";
import { iceCreamDelivered, ParlourClosedEvent } from "Manager_Events";
import { Npc } from "horizon/npc";
import { AnalyticsManager } from "AnalyticsManager";

export default class TableTrigger extends Component<typeof TableTrigger> {
  static propsDefinition = {
    tableComp: { type: PropTypes.Entity },
    deliverSound: { type: PropTypes.Entity },
    eatingSound: { type: PropTypes.Entity },
    cameraOffset: { type: PropTypes.Vec3, default: new Vec3(2, 0, 0) },
    translationSpeed: { type: PropTypes.Number, default: 4.0 },
    collisionsEnabled: { type: PropTypes.Boolean, default: false },
    keepCameraOnExit: { type: PropTypes.Boolean, default: false },
    cameraTarget: { type: PropTypes.Entity },
  };

  private tableId: string = "";
  private tableComp: Component_Table | null = null;
  private activePlayer: Player | null = null;
  private serverDeliveringSound: AudioGizmo | null = null;
  private customerEatingSound: AudioGizmo | null = null;
  private timerOutVar: number | null = null;

  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.OnPlayerEnterTrigger.bind(this)
    );

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitTrigger,
      this.onPlayerExit.bind(this)
    );

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitWorld,
      this.onPlayerExit.bind(this)
    );

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterAFK,
      this.onPlayerExit.bind(this)
    );

    this.connectLocalBroadcastEvent(
      ParlourClosedEvent,
      this.resetTrigger.bind(this)
    );
    this.serverDeliveringSound =
      this.props.deliverSound?.as(AudioGizmo) ?? null;
    this.customerEatingSound = this.props.eatingSound?.as(AudioGizmo) ?? null;
  }

  resetTrigger() {
    this.HideUiForPlayer();
    this.timerOutVar && this.async.clearTimeout(this.timerOutVar);
    this.timerOutVar = null;
    this.activePlayer = null;
  }

  start() {
    this.tableComp =
      this.props.tableComp?.getComponents(Component_Table)[0] ?? null;
    this.tableId = this.tableComp?.tableData.tableId ?? "";
  }

  OnPlayerEnterTrigger(player: Player) {
    const role = playerManager?.getPlayerRecord(player)?.role;
    if (role == PlayerRoles.Server) {
      this.onServerEnterTrigger(player);
    }
  }

  onPlayerExit(player: Player) {
    const role = playerManager?.getPlayerRecord(player)?.role;
    if (role == PlayerRoles.Server) {
      this.onServerExitTrigger(player);
    }
  }

  async onServerEnterTrigger(player: Player) {
    if (Npc.playerIsNpc(player)) {
      // // console.log.*$
      return;
    }

    if (!this.tableComp) return;
    //// console.log.*$
    // `[TableTrigger] Player ${player.id} entered trigger for table ${this.tableId}`
    // );

    if (this.tableComp.tableData.status === TableStatus.Occupied) {
      //// console.log.*$
      // `[TableTrigger] checking active player ${this.activePlayer?.id} for ${this.tableId}`
      // );
      if (this.activePlayer != null) {
        //// console.log.*$
        // `[TableTrigger] already have active player ${this.activePlayer?.id} for ${this.tableId}`
        // );
        return;
      } // already have a player in this trigger
      this.activePlayer = player;
      // // console.log.*$
      if (this.tableComp.tableData.isOrderSet) {
        const tableStatus = this.tableComp?.tableData.status;
        const order = orderManager?.getOrderFromTable(this.tableId);
        if (order && order.id) {
          hapticsManager?.playStrongRumble(player);
          this.openOrderHud(player, order);
          if (!Npc.playerIsNpc(player)) {
            AnalyticsManager.s_instance.sendServerOrderStart(
              player,
              this.tableId,
              order.items
            );
          }
        }
      }
    }
    this.serverDeliverOrder(player);
  }

  async serverDeliverOrder(player: Player) {
    const cone = serverManager?.getConeForPlayer(player);
    if (!cone) return;

    const coneOrder = cone.getConeOrderId();
    const tableForOrder = orderManager?.getTableForOrder(coneOrder!);

    if (cone && tableForOrder === this.tableId) {
      playerAnimations?.playScooperConeDropAnim(player, 2);
      if (this.serverDeliveringSound) {
        this.serverDeliveringSound.play();
      } else {
        console.warn(
          "server deliver sound entity does not have an AudioGizmo component."
        );
      }

      const customerId = orderManager?.getCustomerIdFromOrderId(coneOrder!);
      npcManager?.onOrderReceived(customerId!);
      hapticsManager?.playShortBuzz(player);
      this.tableComp?.updateStatus(TableStatus.Served);
      this.tableComp?.disableIndication_server();
      snowflakeManager?.addSnowflakeCurrencyToPlayer(player);
      playerManager?.addServerAction(player);
      const order = orderManager?.getOrderFromTable(this.tableId!);
      let totalBonusAmount = 0;
      if (order && order.id) {
        const orderDetails =
          orderManager?.calculateBonusBasedOnTimeTaken(order);

        if (orderDetails) {
          totalBonusAmount = orderDetails.amount;
          hudManager?.showOrderDeliveredNotifUi(
            orderDetails?.deliveryType,
            orderDetails?.amount
          );
        }
      }
      serverManager?.removeConeForPlayer(player, true);
      this.sendLocalBroadcastEvent(iceCreamDelivered, {
        player,
        orderId: coneOrder!,
      });
      // if (gameManager?.isThisTrainingSession()) {
      //   trainingManager?.triggerNextFTUETask(player, 4, "Success");
      // }

      try {
        await utilityManager?.sleep(1);
      } catch (error) {
        console.error(`Error while waiting at table ${this.tableId}:`, error);
      }

      //// console.log.*$
      // `Customer started eating at table ${this.tableId} , ${order?.id}`
      // );
      // Play the eating audio after 1 second
      if (this.customerEatingSound) {
        this.customerEatingSound.play();
      } else {
        console.warn(
          "Customer Eating audio entity does not have an AudioGizmo component."
        );
      }

      orderManager?.setOrderPaymentReceived(order?.id!);
      // if (gameManager?.isThisTrainingSession()) {
      //   trainingManager?.triggerNextFTUETask(player, 3, "Success");
      // }
      await utilityManager?.sleep(5);

      //// console.log.*$
      // make the customer leave the table after 5 seconds
      const comps = tableManager?.getAllTableComps() ?? [];
      for (const comp of comps) {
        if (
          comp &&
          comp.props.tableId === this.tableId &&
          typeof comp.OnCustomerLeftTable === "function"
        ) {
          comp.OnCustomerLeftTable();
          break; // Exit after processing the first table
        }
      }

      try {
        this.distributeCashAmongPlayers(order!, player, totalBonusAmount);
      } catch (error) {
        console.error("Error distributing cash among players:", error);
      }

      if (!Npc.playerIsNpc(player)) {
        AnalyticsManager.s_instance.sendServerOrderDeliver(
          player,
          this.tableId,
          order!.items
        );
      }
    }
  }

  onServerExitTrigger(player: Player) {
    if (!this.activePlayer || this.activePlayer.id !== player.id) {
      return; // not the active player
    }

    this.activePlayer = null;
    // this.timerOutVar && this.async.clearTimeout(this.timerOutVar);
    // this.timerOutVar = null;
    // //// console.log.*$
    // `[TableTrigger] Player ${player.id} exited cashier trigger for table ${this.tableId}`
    // );
    this.closeOrderHud(player);
    // // console.log.*$
    this.sendNetworkEvent(player, PlayerCameraEvents.SetCameraMode, {
      mode: CameraMode.Follow,
    });
  }

  HideUiForPlayer() {
    if (!this.activePlayer) {
      // console.log.*$
      return; // not the active player
    }
    // console.log.*$
    hudManager?.hideGreetingUiFromPlayer(this.activePlayer);
    this.sendNetworkEvent(this.activePlayer, PlayerCameraEvents.SetCameraMode, {
      mode: CameraMode.Follow,
    });
  }

  private distributeCashAmongPlayers(
    order: Order,
    player: Player,
    totalBonusAmount: number
  ) {
    const orderAmountReceived =
      (order?.paymentReceived ?? 0) * (mainArenaManager?.isHappyHour() ? 5 : 1);
    const players = playerManager?.getCurrentPlayers() ?? [];

    //// console.log.*$
    // `[CashRegister] Distributing Cash to players: ${orderAmountReceived} , ${players.length}`
    // );
    // const amount = Math.floor(orderAmountReceived / players.length);
    const bonusAmountPerPlayer = totalBonusAmount / players.length;
    players.forEach((p) => {
      playerManager?.addCashAndExp(p, orderAmountReceived);
      playerManager?.addBonusCash(p, bonusAmountPerPlayer);
    });
    cashPoolManager?.spawnCash(totalBonusAmount);

    //// console.log.*$
    // `[CashRegister] Saving Cash to players: ${orderAmountReceived} , ${players.length}`
    // );
    // hudManager?.showCashEarnedNotifUi(orderAmountReceived, amount);
    // //// console.log.*$
    // `[CashRegister] Opening UI to players: ${orderAmountReceived} , ${players.length}`
    // );
    this.world
      .getEntitiesWithTags([AudioGizmoTags.CashCollectedSound])[0]
      ?.as(AudioGizmo)
      ?.play();
  }
  // Inside Manager_Order

  openOrderHud(player: Player, order: Order) {
    if (Npc.playerIsNpc(player)) return;
    //// console.log.*$
    // `Attaching camera to player ${player.id}, Opening UI, for order ${order.id}`
    // );
    this.sendNetworkEvent(player, PlayerCameraEvents.SetCameraCollisions, {
      collisionsEnabled: this.props.collisionsEnabled,
    });
    if (
      this.props.cameraOffset !== undefined &&
      this.props.cameraOffset !== null
    ) {
      this.sendNetworkEvent(
        player,
        PlayerCameraEvents.SetCameraAttachWithTarget,
        {
          target: this.props.cameraTarget ?? this.entity,
        }
      );
    } else {
      console.warn(
        "Attempted to use FixedCameraTrigger without a camera position entity. Create an empty object and reference it in the props."
      );
    }
    hudManager?.showGreetingUiToPlayer(player, order, this.tableId);
  }

  closeOrderHud(player: Player) {
    if (Npc.playerIsNpc(player)) return;
    //// console.log.*$
    // `Closing UI for player ${player.id}`
    // );
    this.sendNetworkEvent(player, PlayerCameraEvents.SetCameraMode, {
      mode: CameraMode.Follow,
    });
    hudManager?.hideGreetingUiFromPlayer(player);
  }
}

Component.register(TableTrigger);
