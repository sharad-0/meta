import * as hz from "horizon/core";
import { OrderStatus, PlayerRoles } from "Enums_Game"
import { orderManager, scooperHandManager } from "Managers_Instance";

export default class Manager_Scooper extends hz.Component<typeof Manager_Scooper> {
  static propsDefinition = {};

  /* ---------- internal state ---------- */
  private offCone?: hz.EventSubscription;

  /* ---------- life-cycle ---------- */
  start(): void {}

  onDestroy(): void {
    this.offCone?.disconnect();
  }  

  /* ---------- cone placed event ---------- */
  private onConePlaced(player: hz.Player, orderId: number) {
    orderManager?.updateStatus(orderId, OrderStatus.Completed);
    // scooperHandManager?.destroyItemAsset(player);
    // console.log.*$

    /* reset state and grab next waiting job */
    scooperHandManager?.emptyHand(player, false);
  }

  

  /* ---------- helpers ---------- */
  private arraysEqual(a: readonly String[], b: readonly String[]): boolean {
    if (a.length <= 0 || b.length <= 0 || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}

/* register as a Horizon component */
hz.Component.register(Manager_Scooper);
