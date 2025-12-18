import * as hz from "horizon/core";
import { CodeBlockEvents, Player, TriggerGizmo } from "horizon/core";
import { ParlourClosedEvent, playerPickedItem } from "Manager_Events";
import { OrderStatus, PlayerRoles } from "Enums_Game";
import {
  orderManager,
  playerAnimations,
  playerManager,
  scooperHandManager,
  serverManager,
  trainingManager,
  utilityManager,
} from "Managers_Instance";
import Component_IceCreamCone from "Component_IceCreamCone";
import Utility_EntityLerper from "Utility_EntityLerper";

class Trigger_Scooper_DropOrder extends hz.Component<
  typeof Trigger_Scooper_DropOrder
> {
  static propsDefinition = {
    dropSound: { type: hz.PropTypes.Entity },
    coneDropPos: { type: hz.PropTypes.Entity, required: true },
    coneDropPosForTableId: {
      type: hz.PropTypes.Entity,
      required: true,
    },
    coneMover: { type: hz.PropTypes.Entity, required: true },
    forFTUE: { type: hz.PropTypes.Boolean, default: false },
    tableId: {
      type: hz.PropTypes.String,
    },
  };

  private triggerGizmo: TriggerGizmo | null = null;
  private playersToDropOrder: Set<Player> = new Set();
  private conesInPosition: Map<Component_IceCreamCone, number> = new Map();
  private dropAudio: hz.AudioGizmo | null = null;

  start() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.onPlayerEnter.bind(this)
    );

    this.connectLocalBroadcastEvent(playerPickedItem, ({ entityId: itemId }) =>
      this.freeConePosition(itemId)
    );

    this.connectLocalBroadcastEvent(ParlourClosedEvent, () =>
      this.onParlourClosed()
    );

    this.triggerGizmo = this.entity?.as(TriggerGizmo);
    // this.triggerGizmo?.setWhoCanTrigger([]);

    this.dropAudio = this.props.dropSound?.as(hz.AudioGizmo) ?? null;
  }

  public onPlayerEnter(player: Player) {
    const playerRec = playerManager?.getPlayerRecord(player);
    if (playerRec?.role !== PlayerRoles.Scooper) {
      return;
    }

    const entityInHand = scooperHandManager?.getEntityInHand(player);
    if (!entityInHand) {
      this.showNotification(player, "No item in hand");
      return;
    }

    const iceCreamInHand = entityInHand?.getComponents(
      Component_IceCreamCone
    )[0];
    if (!iceCreamInHand) {
      this.showNotification(player, "Cannot drop whatever you are holding");
      return;
    }

    const currentOrder = orderManager?.getAcceptedOrderForItems(
      iceCreamInHand.getConeItems()
    );

    const tableId = orderManager?.getTableForOrder(currentOrder?.id!);
    if (tableId !== this.props.tableId) {
      this.showNotification(player, "This order does not belong to this table");
      return;
    }

    // console.log.*$
    //   `[Trigger_Scooper_DropOrder] Player ${player.name.get()} entered with order:`,
    //   currentOrder
    // );
    if (!currentOrder) {
      this.showNotification(player, "No matching order found");
      return;
    }

    iceCreamInHand.setConeOrderId(currentOrder?.id!);
    orderManager?.updateStatus(currentOrder?.id!, OrderStatus.Completed);
    // console.log.*$

    /* reset state and grab next waiting job */
    scooperHandManager?.emptyHand(player, false);

    this.animateIceCreamToServingSide(iceCreamInHand);
    playerAnimations?.playScooperConeDropAnim(player, 2);
    if (this.dropAudio) {
      this.dropAudio.play();
    } else {
      console.warn("drop audio is not available in the entity");
    }

    // trainingManager?.triggerNextFTUE(player, 3);
  }

  async animateIceCreamToServingSide(iceCreamInHand: Component_IceCreamCone) {
    const conePosition = this.findFreeConePositionForTable();
    if (!conePosition) {
      console.warn(
        `[Trigger_Scooper_DropOrder] No free cone position found - ${this.conesInPosition.size} positions taken`
      );
      return;
    }
    iceCreamInHand.entity.position.set(
      utilityManager?.getRandomPointInEntityBounds(this.entity) ??
        new hz.Vec3(0, 0, 0)
    );

    serverManager?.addNewConeToTable(iceCreamInHand);

    const mover = this.props.coneMover?.getComponents(Utility_EntityLerper)[0];
    if (!mover) {
      console.warn(`[Trigger_Scooper_DropOrder] No mover found for cone`);
      return;
    }

    await utilityManager?.sleep(1);
    const ok = await mover.moveTo(iceCreamInHand.entity, conePosition, 1.25);
    if (ok) {
      iceCreamInHand.entity.position.set(conePosition);
    } else {
      console.warn(`[Trigger_Scooper_DropOrder] Cone movement failed`);
    }
  }

  findFreeConePositionForTable(): hz.Vec3 | null {
    if (this.props.coneDropPosForTableId) {
      return this.props.coneDropPosForTableId.position.get();
    }

    return null;
  }

  freeConePosition(entityId: bigint) {
    // console.log.*$
    //   `[Trigger_Scooper_DropOrder] Freeing cone position for entity ${entityId}`
    // );

    // find the conesInPosition entry with this entityId and remove it
    this.conesInPosition.forEach((id, cone) => {
      if (cone.entity.id === entityId) {
        this.conesInPosition.delete(cone);
      }
    });
  }

  onParlourClosed() {
    this.playersToDropOrder.clear();
    this.conesInPosition.forEach((id, cone) => {
      cone.entity.visible.set(false);
      this.world.deleteAsset(cone.entity);
      this.conesInPosition.delete(cone);
    });
  }

  private showNotification(player: Player, notification: string) {
    this.world.ui.showPopupForPlayer(player, notification, 3, {
      position: new hz.Vec3(0, 0.3, 0),
      fontSize: 3.5,
      backgroundColor: hz.Color.fromHex("#f55e5e"),
    });
  }

  handleTriggerCollision() {
    if (!this.triggerGizmo) {
      return;
    }

    this.triggerGizmo.setWhoCanTrigger(Array.from(this.playersToDropOrder));
    // console.log.*$
    //   "Drop order collision handled for players:",
    //   Array.from(this.playersToDropOrder)
    // );
  }
}
hz.Component.register(Trigger_Scooper_DropOrder);
