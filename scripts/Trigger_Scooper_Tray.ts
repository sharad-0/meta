import Component_IceCreamCone from "Component_IceCreamCone";
import {
  ConeState,
  CustomAnalyticsEvents,
  IceCream,
  Items,
  OrderStatus,
  PlayerRoles,
} from "Enums_Game";
import * as hz from "horizon/core";
import {
  itemDroppedInTray,
  itemPickedFromScooper,
  onPlayerTrashedItem,
  ParlourClosedEvent,
  pickedItemFromTray,
  PlayerEnterScooperFoot,
  PlayerExitScooperFoot,
  playerPickedItem,
  PlayerSwitchedRoleEvent,
  ResetTrayForOrder,
} from "Manager_Events";
import {
  gameManager,
  orderManager,
  playerAnimations,
  playerManager,
  scooperHandManager,
  serverManager,
  snowflakeManager,
  themeSessionManager,
  trainingManager,
  utilityManager,
} from "Managers_Instance";
import Utility_EntityLerper from "Utility_EntityLerper";
import HUD_Scooper from "HUD_Scooper";
import { Player } from "horizon/core";
import Animation_ConveyorBelt from "Animation_ConveyorBelt";
import { Npc } from "horizon/npc";
import { AnalyticsManager } from "AnalyticsManager";

export default class Trigger_Scooper_Tray extends hz.Component<
  typeof Trigger_Scooper_Tray
> {
  static propsDefinition = {
    trayId: { type: hz.PropTypes.Number, default: 0 },
    conePosition: { type: hz.PropTypes.Entity, required: true },
    coneMover: { type: hz.PropTypes.Entity, required: true },
    coneDropPosForTableId: {
      type: hz.PropTypes.Entity,
      required: true,
    },
    scooperHud: { type: hz.PropTypes.Entity, required: true },
    conveyorBelt: { type: hz.PropTypes.Entity, required: false },
    cantServeBoard: { type: hz.PropTypes.Entity, required: true },
  };

  private iceCreamInTray: Component_IceCreamCone | null = null;
  private orderForTheTable: Items[] = [];
  private isOrderComplete: boolean = false;
  private scoopersSet: Player[] = [];
  private isOrderSentToServer: boolean = false;
  private isOrderLaneBusy: boolean = false;
  private canTrigger: boolean = true;

  preStart(): void {
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterTrigger,
      this.onPlayerEnterTrigger.bind(this)
    );

    // this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, () =>
    //   this.refreshTriggerAccess()
    // );

    // this.connectLocalBroadcastEvent(
    //   pickedItemFromTray,
    //   ({ player, entityId }) => this.onPlayerPickedItem(player, entityId)
    // );

    // this.connectLocalBroadcastEvent(itemPickedFromScooper, ({ player }) =>
    //   this.refreshTriggerAccess()
    // );

    // this.connectLocalBroadcastEvent(itemDroppedInTray, ({ player }) =>
    //   this.refreshTriggerAccess()
    // );

    // this.connectLocalBroadcastEvent(onPlayerTrashedItem, ({ player }) =>
    //   this.refreshTriggerAccess()
    // );

    this.connectLocalBroadcastEvent(ParlourClosedEvent, () =>
      this.onParlourClosed()
    );
    this.connectLocalBroadcastEvent(
      PlayerEnterScooperFoot,
      ({ entity, player }) => {
        // console.log.*$
        if (entity == this.entity) {
          this.setTriggerAccess(player);
        } else {
          this.removeTriggerAccess(player);
        }
      }
    );

    this.connectLocalBroadcastEvent(
      PlayerExitScooperFoot,
      ({ entity, player }) => {
        this.removeTriggerAccess(player);
      }
    );
  }

  start() {
    // this.refreshTriggerAccess();
    this.entity.as(hz.TriggerGizmo).setWhoCanTrigger([]); // Start with no one able to trigger
    this.connectLocalBroadcastEvent(ResetTrayForOrder, (data) => {
      if (data.trayId && data.trayId == this.props.trayId?.toString()) {
        this.resetTray();
      }
    });
  }

  onPlayerEnterTrigger(player: hz.Player) {
    if (!this.canTrigger || this.isOrderSentToServer) return;
    // console.log.*$
    //   `[Scooper Tray] Player ${player.name.get()} entered tray trigger.`
    // );
    const itemInPlayerHand =
      scooperHandManager?.getItemTypeInHand(player) ?? Items.None;

    // console.log.*$

    this.getOrderForTheTable();

    if (itemInPlayerHand !== Items.None) {
      if (
        (this.iceCreamInTray !== null && itemInPlayerHand === Items.Cone) ||
        (this.iceCreamInTray === null && itemInPlayerHand !== Items.Cone)
      ) {
        return;
      }
      playerAnimations?.playScooperConeDropAnim(player, 2);
      this.addItemAssetToTray(player, itemInPlayerHand);
      this.sendLocalBroadcastEvent(itemDroppedInTray, { player });
      this.nextTriggerDelay();
      // if (gameManager?.isThisTrainingSession()) {
      //   this.handleFTUETriggers(player, itemInPlayerHand);
      // }
    } else if (this.iceCreamInTray !== null && !Npc.playerIsNpc(player)) {
      this.iceCreamInTray?.SetConeState(ConeState.ScooperHand);
      scooperHandManager?.addIceCreamToHand(player, this.iceCreamInTray);
      playerAnimations?.playScooperConeDropAnim(player, 2);
      this.resetTray();
      this.nextTriggerDelay();
    }
    this.removeTriggerAccess(player);
  }
  async nextTriggerDelay(timer: number = 0.3) {
    this.canTrigger = false;
    this.async.setTimeout(() => {
      this.canTrigger = true;
    }, timer * 1000);
  }

  // handleTrigger(player?: Player, triggerCondition: boolean = false) {
  //   if (player) {
  //     if (triggerCondition) {
  //       this.scoopersSet.add(player);
  //     } else {
  //       this.scoopersSet.delete(player);
  //     }
  //     // console.log.*$
  //       `Current scoopers: ${Array.from(this.scoopersSet)
  //         .map((p) => p.name.get())
  //         .join(", ")}`
  //     );
  //   }
  //   // Convert to array only at the edge
  //   this.entity
  //     .as(hz.TriggerGizmo)
  //     .setWhoCanTrigger(Array.from(this.scoopersSet));
  // }

  private addItemAssetToTray(player: hz.Player, item: Items) {
    if (item === Items.Cone) {
      const entityInPlayerHand = scooperHandManager?.getEntityInHand(player);
      const cone = entityInPlayerHand?.getComponents(Component_IceCreamCone)[0];
      cone?.SetConeState(ConeState.ScooperTray);
      scooperHandManager?.emptyHand(player, false);
      // console.log.*$
      if (cone) {
        this.iceCreamInTray = cone;
        if (cone.getConeItems().length <= 0) {
          cone.setIceCreamCone();
        } else {
          if (this.checkWithTableOrder()) {
            playerManager?.addScooperAction(player);
            this.checkOrderCompletion(player);
          } else {
            this.markHudRed();
            if (!Npc.playerIsNpc(player)) {
              AnalyticsManager.s_instance.sendScooperWrongDeposit(player);
            }
          }
        }
        cone.entity.position.set(this.props.conePosition!.position.get());
        cone.entity.rotation.set(this.props.conePosition!.rotation.get());
        // console.log.*$
        //   `Player ${player.name.get()} added a cone to the tray and set position to ${this.props.conePosition!.position.get()}.`
        // );
      }
    } else {
      this.iceCreamInTray?.addScoopToCone(item);
      scooperHandManager?.emptyHand(player, true);
      if (this.checkWithTableOrder()) {
        // console.log.*$
        //   `Tray ${this.props.trayId
        //   } matches the order: ${this.orderForTheTable.join(", ")}`
        // );
        playerManager?.addScooperAction(player);
        this.checkOrderCompletion(player);
      } else {
        // console.log.*$
        this.markHudRed();
        if (!Npc.playerIsNpc(player)) {
          AnalyticsManager.s_instance.sendScooperWrongDeposit(player);
        }
      }
    }

    AnalyticsManager.s_instance.sendScooperDeposit(player, item);
    // this.refreshTriggerAccess();
  }

  async checkOrderCompletion(player: Player) {
    if (this.isOrderSentToServer) return;
    if (this.isOrderCompleted()) {
      // console.log.*$
      this.markHudGreen();
      this.isOrderLaneBusy = true;
      const currentIcecreamInTray = this.iceCreamInTray;
      this.iceCreamInTray = null;
      const tableId = this.props.trayId.toString();
      const order = orderManager?.getOrderFromTable(tableId);
      this.CloseLaneAccess();
      await this.animateIceCreamToServingSide(currentIcecreamInTray!);
      currentIcecreamInTray?.setConeOrderId(order?.id!);
      orderManager?.addIceCreamEntityForCompletedOrder(
        tableId,
        currentIcecreamInTray!.entity
      );
      this.orderForTheTable = [];
      // this.refreshTriggerAccess();
      // this.handleTrigger(player, false);

      this.async.setTimeout(() => {
        this.isOrderLaneBusy = false;
        orderManager?.updateStatus(order?.id!, OrderStatus.Completed);
      }, 1000);
      snowflakeManager?.addSnowflakeCurrencyToPlayer(player);

      if (!Npc.playerIsNpc(player)) {
        AnalyticsManager.s_instance.sendScooperCorrectIceCream(
          player,
          order!.items
        );
      }
    }
  }

  async animateIceCreamToServingSide(iceCreamInHand: Component_IceCreamCone) {
    if (!this.props.coneDropPosForTableId) {
      //  this.conesInPosition.set(entityId, this.props.coneDropPosForTableId!);
      return;
    }
    const conePosition = this.props.coneDropPosForTableId.position.get();
    const coneRotation = this.props.coneDropPosForTableId.rotation.get();

    if (!conePosition) {
      console.warn(
        `[Trigger_Scooper_DropOrder] No free cone position found - positions taken`
      );
      return;
    }

    const mover = this.props.coneMover?.getComponents(Utility_EntityLerper)[0];
    if (!mover) {
      console.warn(`[Trigger_Scooper_DropOrder] No mover found for cone`);
      return;
    }
    this.props.conveyorBelt
      ?.getComponents(Animation_ConveyorBelt)[0]
      ?.animateBelt(true);

    await utilityManager?.sleep(1);
    const ok = await mover.moveTo(iceCreamInHand.entity, conePosition, 1.25);
    if (ok) {
      iceCreamInHand.entity.position.set(conePosition);
      iceCreamInHand.entity.rotation.set(coneRotation);
      this.props.conveyorBelt
        ?.getComponents(Animation_ConveyorBelt)[0]
        ?.animateBelt(false);
      if (themeSessionManager?.isChristmasSessionActive()) {
        iceCreamInHand.setAddonToScoop();
      }

    } else {
      console.warn(`[Trigger_Scooper_DropOrder] Cone movement failed`);
    }

    serverManager?.addNewConeToTable(iceCreamInHand);
  }

  // private onPlayerPickedItem(player: hz.Player, entityId: bigint) {
  //   // this.refreshTriggerAccess();
  // }

  resetTray() {
    this.iceCreamInTray = null;
    this.scoopersSet = [];
    this.isOrderLaneBusy = false;
    this.ResetLaneAccess();
    this.markHudWhite();
    // this.refreshTriggerAccess();
    this.entity.as(hz.TriggerGizmo).setWhoCanTrigger(this.scoopersSet);
  }

  ResetLaneAccess() {
    this.isOrderSentToServer = false;
    this.props.cantServeBoard?.visible.set(false);
  }
  CloseLaneAccess() {
    this.isOrderSentToServer = true;
    this.props.cantServeBoard?.visible.set(true);
  }

  onParlourClosed() {
    if (this.iceCreamInTray) {
      this.iceCreamInTray.entity.visible.set(false);
      this.world.deleteAsset(this.iceCreamInTray.entity, true).then(() => {
        // console.log.*$
        //   `[Trigger_Scooper_Tray] Deleted ice cream cone in tray due to parlour closing.`
        // );
        this.iceCreamInTray = null;
      });
    }
    this.resetTray();
  }

  private getOrderForTheTable() {
    if (this.props.trayId) {
      const tableId = this.props.trayId.toString();
      const order = orderManager?.getOrderFromTable(tableId);
      if (order && order.status == OrderStatus.Accepted) {
        this.orderForTheTable = order.items;
      }
    }
  }

  private checkWithTableOrder(): boolean {
    if (this.orderForTheTable.length === 0 || !this.iceCreamInTray)
      return false;

    // Current items on cone (item 0 considered already there by default)
    const coneItems: Items[] = this.iceCreamInTray.getConeItems();

    // If there are fewer than 1 items, we cannot validate yet
    if (coneItems.length < 1) return false;

    // The index in the order we should match equals the current cone length - 1,
    // because item 1 is “already there” by default and we validate incremental scoops as a running prefix.
    const matchIndex = coneItems.length - 1;

    // If the order is shorter than what is on the cone, it's an immediate mismatch
    if (matchIndex >= this.orderForTheTable.length) return false;

    // Validate last added item matches the expected item at matchIndex
    const lastAdded = coneItems[matchIndex];
    const expected = this.orderForTheTable[matchIndex];

    return lastAdded === expected;
  }

  // Call this whenever a scoop is added or when validating completion.
  private isOrderCompleted(): boolean {
    if (!this.iceCreamInTray) return false;

    const coneItems: Items[] = this.iceCreamInTray.getConeItems();

    // Exact length must match
    if (coneItems.length !== this.orderForTheTable.length) return false;

    // Exact sequence must match
    for (let i = 0; i < coneItems.length; i++) {
      if (coneItems[i] !== this.orderForTheTable[i]) return false;
    }
    return true;
  }

  handleFTUETriggers(player: hz.Player, item: Items) {
    switch (item) {
      case Items.Cone:
        trainingManager?.triggerNextFTUETask(player, 2, "Success");
        break;
      case Items.Vanilla:
        trainingManager?.triggerNextFTUETask(player, 4, "Success");
        break;
    }
  }
  markHudRed() {
    if (this.orderForTheTable.length <= 0) return;
    const tableId = this.props.trayId.toString();
    this.props.scooperHud?.getComponents(HUD_Scooper)[0]?.markOrderRed(tableId);
  }
  markHudGreen() {
    const tableId = this.props.trayId.toString();
    this.props.scooperHud
      ?.getComponents(HUD_Scooper)[0]
      ?.markOrderGreen(tableId);
  }
  markHudWhite() {
    const tableId = this.props.trayId.toString();
    this.props.scooperHud
      ?.getComponents(HUD_Scooper)[0]
      ?.resetOrderColor(tableId);
  }

  // /**  Updates the TriggerGizmo so that:
  //  *  – If the tray is empty, only a scooper holding a Cone may enter.
  //  *  – If the tray already has a cone, a scooper may enter when …
  //  *      • their hand is empty → they intend to pick it up, or
  //  *      • they are holding Strawberry, Vanilla or Chocolate → they intend to add a scoop. */
  // private refreshTriggerAccess(): void {
  //   this.scoopersSet.clear();

  //   const PLACEABLE = [Items.Strawberry, Items.Vanilla, Items.Chocolate];
  //   const allScoopers =
  //     playerManager?.getRolePlayers(PlayerRoles.Scooper) ?? [];

  //   for (const p of allScoopers) {
  //     const handItem = scooperHandManager?.getItemTypeInHand(p) ?? Items.None;

  //     if (!this.iceCreamInTray) {
  //       // tray empty → need a cone
  //       if (handItem === Items.Cone) this.scoopersSet.add(p);
  //     } else {
  //       // tray occupied
  //       if (handItem === Items.None || PLACEABLE.includes(handItem)) {
  //         this.scoopersSet.add(p);
  //       }
  //     }
  //   }

  //   this.entity
  //     .as(hz.TriggerGizmo)
  //     .setWhoCanTrigger(Array.from(this.scoopersSet));
  // }

  private setTriggerAccess(player: Player): void {
    const PLACEABLE = [
      Items.Strawberry,
      Items.Vanilla,
      Items.Chocolate,
      Items.None,
    ];
    if (this.scoopersSet.includes(player)) return;
    const handItem =
      scooperHandManager?.getItemTypeInHand(player) ?? Items.None;

    if (!this.iceCreamInTray) {
      // tray empty → need a cone
      if (handItem === Items.Cone) this.scoopersSet.push(player);
    } else {
      // tray occupied
      if (PLACEABLE.includes(handItem)) {
        this.scoopersSet.push(player);
      }
    }
    if (this.isOrderSentToServer) {
      this.scoopersSet = [];
    }
    this.entity.as(hz.TriggerGizmo).setWhoCanTrigger(this.scoopersSet);
  }

  private removeTriggerAccess(player: Player) {
    const index = this.scoopersSet.indexOf(player);
    if (index !== -1) {
      this.scoopersSet.splice(index, 1);
    }

    if (this.isOrderSentToServer) {
      this.scoopersSet = [];
    }

    this.entity.as(hz.TriggerGizmo).setWhoCanTrigger(this.scoopersSet);
  }

  getNextRequiredItem(): Items {
    //order completed and going through belt
    if (this.isOrderLaneBusy) return Items.None;
    // Ensure we have a table order to follow
    if (this.orderForTheTable.length === 0) return Items.Cone;

    // If tray has no cone yet → need a cone first
    if (!this.iceCreamInTray) return Items.Cone;

    // Current items already on the cone (Cone is treated as item 0 baseline by this system)
    const coneItems: Items[] = this.iceCreamInTray.getConeItems();

    // If current progress exceeds the order length, something is off → no next item
    if (coneItems.length > this.orderForTheTable.length) return Items.None;

    // Validate the existing sequence is a correct running prefix of the order
    for (let i = 0; i < coneItems.length; i++) {
      if (coneItems[i] !== this.orderForTheTable[i]) {
        return Items.None; // mismatch; cannot determine a “next correct” item
      }
    }

    // If fully matched, nothing more to add
    if (coneItems.length === this.orderForTheTable.length) return Items.None;

    // Otherwise, the next required item is the next element in the order
    return this.orderForTheTable[coneItems.length];
  }
}
hz.Component.register(Trigger_Scooper_Tray);
