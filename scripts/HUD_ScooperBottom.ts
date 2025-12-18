// ScooperRightHud.ts – v2.1
// -----------------------------------------------------------------------------
// Shows the current scooper order on the right-hand side of the screen.
//
// ✔ Header (“Current Order”) stays at the top while items grow downward.
// ✔ Uses ITEM_NAMES map so the HUD shows friendly names.
//
// Requires: ScooperInventory.ts in the same folder
// Attach to: any always-loaded Screen-layer UI gizmo
// -----------------------------------------------------------------------------

import { UIComponent, View, Text, Binding, UINode } from "horizon/ui";
import { Component } from "horizon/core";
import { getEnumKeyFromValue, Items, parseItem, PlayerRoles } from "Enums_Game";
import { orderManager, playerManager, scooperHandManager } from "Managers_Instance";
import { PlayerSwitchedRoleEvent } from "Manager_Events";

export default class ScooperBottomHud extends UIComponent<typeof ScooperBottomHud> {
  /* bindings */
  private objectiveBinding = new Binding<string>("Waiting for order");
  private orderText    = new Binding<string>("-");
  private unsubscribe?: () => void;

  /* ---------------- UI tree ---------------- */
  initializeUI(): UINode {
    return View({
      style: {
        position: "absolute",
        bottom: 20,
        left: "31%",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: 50,
        borderWidth: 5,
        borderColor: "white",
        width: 500,
        height: 100,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10
      },
      children: [
        Text({
          text: this.objectiveBinding,
          style: {
            fontFamily: "Roboto",
            fontSize: 32,
            fontWeight: "bold",
            color: "black",
            textAlign: "center",
            marginBottom: -8,
          },
        }),
        View({
          style: {
            position: "absolute",
            top: -15,
            backgroundColor: "rgba(255, 255, 255, 1)",
            borderRadius: 15,
            borderWidth: 1,
            borderColor: "white",
            width: 150,
            height: 30,
            alignItems: "center",
            justifyContent: "center",
          },
          children: [
            Text({
              text: this.orderText,
              style: {
                fontFamily: "Roboto",
                fontSize: 20,
                fontWeight: "bold",
                color: "black",
                textAlign: "center",
              },
            }),
          ],
        })
      ],
    });
  }

  /* ---------------- lifecycle ---------------- */
  start(): void {
    // this.refresh();                                // first paint
    // this.unsubscribe = scooperHandManager?.subscribe(() => this.refresh());
    // orderManager?.subscribe(() => this.refresh());
    // this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, () => this.refresh());

    // this.async.setInterval(() => this.refresh(), 1000); // refresh every second
  }

  onDestroy(): void {
    this.unsubscribe?.();
  }

  /* ---------------- helpers ---------------- */
  // private refresh(): void {
  //   const allScooperInWorld = playerManager?.getRolePlayers(PlayerRoles.Scooper) ?? [];
  //   allScooperInWorld.forEach(player => {
  //     const inv = scooperHandManager?.getOrder(player) ?? [];     // readonly ItemKey[]
  //     const currentOrder = orderManager?.getPlayerOrder(player) ? orderManager?.getPlayerOrder(player)! : { id: null, status: null, items: [] };
  //     const currentOrderItems = currentOrder ? currentOrder.items : [];

  //     // If there's no order or it's already served/delivered
  //     if (!currentOrder.id || ["putOnTable", "delivered"].includes(currentOrder.status)) {
  //       this.objectiveBinding.set("Waiting for order", [player]);
  //       this.orderText.set("-", [player]);
  //       return;
  //     }

  //     this.orderText.set(`Order #${currentOrder.id}`, [player]);
  //     // If the recipe is complete but not delivered
  //     if (currentOrder.status === "completed") {
  //       this.objectiveBinding.set("Place it on the Serving Station", [player]);
  //       return;
  //     }

  //     // Active order in progress
  //     const itemsInOrder = inv.every((item, i) => item === currentOrderItems[i]);
  //     let lines = "";

  //     if (!itemsInOrder) {
  //       lines = "Throw in bin and try again";
  //     } else {
  //       const nextItem = currentOrderItems[inv.length];
  //       const item = parseItem(nextItem) ?? Items.Cone;

  //       lines = nextItem === Items.Cone
  //         ? "Pick a Cone"
  //         : `Scoop ${getEnumKeyFromValue(item) ?? item}`;
  //     }

  //     this.objectiveBinding.set(lines, [player]);
  //   });
  // }
}

Component.register(ScooperBottomHud);
