import * as hz from "horizon/core";
import { Player } from "horizon/core";
import TaskManager, { ActionType } from "TaskManager";
import { PlayerRoles } from "Enums_Game";
import {
  gameManager,
  hudManager,
  orderManager,
  playerManager,
  trainingManager,
} from "Managers_Instance";
import Component_IceCreamCone from "Component_IceCreamCone";
import { IceCream } from "Enums_Game";
import {
  addPlayersToUseTrash,
  onServerTrashedItem,
  removePlayersFromUseTrash,
  ResetTrayForOrder,
} from "Manager_Events";
import HUD_Scooper from "HUD_Scooper";

export default class Manager_Server extends hz.Component<
  typeof Manager_Server
> {
  static propsDefinition = {
    iceCreamCollectionPoint: { type: hz.PropTypes.Entity, required: true },
  };

  // Runtime state (per component instance)
  private conesInTable = new Set<Component_IceCreamCone>();
  private conesByPlayer = new Map<Player, Component_IceCreamCone>();

  preStart(): void {}

  start(): void {
    // Ensure clean state on (re)start
    this.conesByPlayer.clear();

    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitWorld,
      (player) => this.onPlayerExitWorld(player, true)
    );
  }

  onPlayerExitWorld(player: Player, destroyCone: boolean = false) {
    const cone = this.getConeForPlayer(player);
    if (cone) {
      const orderId = cone.getConeOrderId();
      const tableId = orderManager?.getTableForOrder(orderId ?? 0);
      this.ResetServerTable(orderId ?? 0, tableId ?? "");
      this.removeConeForPlayer(player, destroyCone);
    }
  }

  ResetServerTable(orderId: number, tableId: string) {
    if (orderId && tableId) {
      orderManager?.removeIceCreamEntityForCompletedOrder(tableId);
      orderManager?.markOrderAsAccepted(orderId, false);
      HUD_Scooper.get().resetOrderColor(tableId);
    }
  }

  addNewConeToTable(cone: Component_IceCreamCone): void {
    this.conesInTable.add(cone);
    // this.setConeToCollectionPoint(cone);
  }

  /** Remove a cone from the table. */
  removeConeFromTable(entityId: bigint): void {
    const cone = Array.from(this.conesInTable).find(
      (c) => c.entity.id === entityId
    );
    if (cone) {
      this.conesInTable.delete(cone);
    }
  }

  /** Associate a cone with a player by id. */
  playerPickedCone(player: Player, cone: Component_IceCreamCone): boolean {
    if (this.conesByPlayer.has(player)) {
      return false; // Player already has a cone
    }
    this.conesByPlayer.set(player, cone);
    this.conesInTable.delete(cone);

    this.sendLocalBroadcastEvent(addPlayersToUseTrash, { player });

    // Award PickUpIceCream action for the Scooper role
    if (gameManager?.isThisTrainingSession()) {
      trainingManager?.triggerNextFTUETask(player, 3, "Success");
    }

    this.resetGrabStateForCones();
    return true;
  }

  /** Get the cone associated with a player id, if any. */
  getConeForPlayer(player: Player): Component_IceCreamCone | undefined {
    return this.conesByPlayer.get(player);
  }

  doesPlayerHaveConeInHand(player: Player): boolean {
    return this.conesByPlayer.has(player);
  }

  playerHasConeForTable(tableId: string): boolean {
    return Array.from(this.conesInTable).some(
      (c) => orderManager?.getTableForOrder(c.getConeOrderId() ?? 0) === tableId
    );
  }

  getConeEntityForPlayer(player: Player): Component_IceCreamCone | undefined {
    const cone = this.getConeForPlayer(player);
    if (cone) {
      return Array.from(this.conesInTable).find(
        (c) => c.entity.id === cone.entity.id
      );
    }
    return undefined;
  }

  public resetConePosition(player: Player) {
    const cone = this.getConeEntityForPlayer(player);
    if (cone) {
      this.setConeToCollectionPoint(cone);
    }
  }

  private setConeToCollectionPoint(cone: Component_IceCreamCone): void {
    cone.entity.position.set(
      this.props.iceCreamCollectionPoint!.position.get()
    );
  }

  private resetGrabStateForCones() {
    this.conesInTable.forEach((cone) => {
      cone.makeConeGrabbable();
    });
  }

  public onPlayerTrashedCone(player: Player) {
    // check the order for the cone and change the status of the order
    const cone = this.getConeForPlayer(player);
    if (cone) {
      const orderId = cone.getConeOrderId();
      const tableId = orderManager?.getTableForOrder(orderId ?? 0);
      if (orderId && tableId) {
        orderManager?.markOrderAsAccepted(orderId, false);
        HUD_Scooper.get().resetOrderColor(tableId);
        this.sendLocalBroadcastEvent(onServerTrashedItem, {
          player: player,
          orderId: orderId,
        });
      }
      this.removeConeForPlayer(player, true);
      this.sendLocalBroadcastEvent(onServerTrashedItem, {
        player,
        orderId: orderId ?? 0,
      });
    }

    this.resetGrabStateForCones();
  }

  /**
   * Remove the cone mapping for a player id.
   */
  removeConeForPlayer(player: Player, destroyOnComplete: boolean): void {
    if (!this.conesByPlayer.has(player)) return;

    const cone = this.conesByPlayer.get(player);
    if (cone && destroyOnComplete) {
      const orderId = cone.getConeOrderId();
      if (orderId) {
        const tableId = orderManager?.getTableForOrder(orderId);
        if (tableId) {
          this.sendLocalBroadcastEvent(ResetTrayForOrder, {
            trayId: tableId,
            player,
          });
        }
      }
      this.world.deleteAsset(cone.entity);
      this.sendLocalBroadcastEvent(removePlayersFromUseTrash, { player });
      // cone.resetCone();
    }

    this.conesByPlayer.delete(player);
    this.resetGrabStateForCones();

    // if (awardAction) {
    //   const serverPlayer = playerManager?.getRolePlayers(PlayerRoles.Server)[0];
    //   if (serverPlayer) {
    //     TaskManager.recordAction(serverPlayer, ActionType.ServeOrder, 1);
    //   } else {
    //     // Optional: log or handle missing Server role gracefully
    //     // console.warn("[Manager_Server] No Server player found to award action.");
    //   }
    // }
  }

  onParlourClosed() {
    // console.log.*$
    Array.from(this.conesByPlayer).forEach(([player, cone]) => {
      this.removeConeForPlayer(player, true);
    });
    this.conesInTable.forEach((cone) => {
      cone.resetCone();
      // Alternatively, if you want to completely remove the cone:
      cone.entity.visible.set(false);
      this.world.deleteAsset(cone.entity);
      //
      // cone.destroyIceCream();
    });
    this.conesInTable.clear();
  }
}

hz.Component.register(Manager_Server);
