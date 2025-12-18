// // Manager_notifications.ts – toast-style notification system (July 2025)
// // -----------------------------------------------------------------------------
// // • Drop this script once in your world (attach to a harmless empty Entity).
// // • Call the static helpers, e.g.:
// //
// //     ManagerNotifications.bagIsFull(player);
// //     ManagerNotifications.orderAccepted([p1, p2], 7);
// //     ManagerNotifications.earnedCash(player, 25);
// //
// // Each call spawns a tiny UI gizmo **visible only to the target player(s)**,
// // fades it in, keeps it for 3 s and then destroys itself automatically.
// //
// // If you need more notification types later, add another helper that delegates
// // to `_show(players, "Your message")`.
// // -----------------------------------------------------------------------------

// import { Component, Entity, Player, PropTypes, World } from "horizon/core";
// import { UIComponent, View, Text, Binding, UINode, UIGizmo } from "horizon/ui";

// /*─────────────────────────────────────────────────────────────────────────────
//   Internal UI component – one per toast
// ─────────────────────────────────────────────────────────────────────────────*/
// class NotificationToast extends UIComponent<typeof NotificationToast> {
//   static propsDefinition = {
//     message: { type: PropTypes.String },
//     duration: { type: PropTypes.Number, default: 3000 }, // ms
//   };

//   private opacity = new Binding<number>(0); // fade-in/out if you like

//   initializeUI(): UINode {
//     return View({
//       style: {
//         position: "absolute",
//         top: "40%",
//         left: "50%",
//         transform: [{ translate: [-50, -50] }],
//         backgroundColor: "rgba(0, 0, 0, 0.85)",
//         padding: 24,
//         borderRadius: 12,
//         maxWidth: 480,
//         alignItems: "center",
//         justifyContent: "center",
//       },
//       children: [
//         Text({
//           text: this.props.message!,
//           style: {
//             fontFamily: "Roboto",
//             fontWeight: "700",
//             fontSize: 24,
//             color: "white",
//             textAlign: "center",
//           },
//         }),
//       ],
//     });
//   }

//   start(): void {
//     // Simple life-cycle – destroy after `duration`
//     // this.async.setTimeout(() => this.entity.destroy(), this.props.duration!);
//   }
// }
// UIComponent.register(NotificationToast);

// /*─────────────────────────────────────────────────────────────────────────────
//   Manager (singleton)
// ─────────────────────────────────────────────────────────────────────────────*/
// export default class ManagerNotifications extends Component<
//   typeof ManagerNotifications
// > {
//   /* -------- singleton plumbing ------------------------------------------ */
//   private static _inst: ManagerNotifications | null = null;
//   start(): void {
//     ManagerNotifications._inst = this;
//   }
//   static get(): ManagerNotifications {
//     if (!ManagerNotifications._inst)
//       throw new Error(
//         "[ManagerNotifications] Script must exist in the world exactly once."
//       );
//     return ManagerNotifications._inst;
//   }

//   /* -------- core helper -------------------------------------------------- */
//   private _show(
//     targets: Player | Player[],
//     message: string,
//     duration = 3000
//   ): void {
//     const list = Array.isArray(targets) ? targets : [targets];

//     list.forEach((player) => {
//       // Spawn a *local-only* entity in the Screen layer
//       const toastEnt = new UIComponent()
//       toastEnt.
//       toastEnt.layer.set("Screen"); // UI layer
//       toastEnt.owner.set(player); // visible only to this player
//       toastEnt.addComponent(NotificationToast, {
//         message,
//         duration,
//       });
//     });
//   }

//   /* -------- public convenience wrappers ---------------------------------- */
//   // NB: all helpers accept Player | Player[] so you can target one or many.
//   static bagIsFull(p: Player | Player[]): void {
//     this.get()._show(p, "Bag is Full");
//   }

//   static maxCapacity(p: Player | Player[]): void {
//     this.get()._show(p, "Max Capacity for Ingredient");
//   }

//   static noIngredient(p: Player | Player[]): void {
//     this.get()._show(p, "No Ingredient to Deposit");
//   }

//   static pickingCone(p: Player | Player[]): void {
//     this.get()._show(p, "Picking Cone");
//   }

//   static scoopingVanilla(p: Player | Player[]): void {
//     this.get()._show(p, "Scooping Vanilla");
//   }

//   static wrongRecipe(p: Player | Player[]): void {
//     this.get()._show(p, "Wrong Recipe! Try Again");
//   }

//   static dirtyTable(p: Player | Player[]): void {
//     this.get()._show(p, "Dirty Table");
//   }

//   static orderAccepted(p: Player | Player[], orderId: number): void {
//     this.get()._show(p, `Order ${orderId} Accepted`);
//   }

//   static orderCompleted(p: Player | Player[], orderId: number): void {
//     this.get()._show(p, `Order ${orderId} Completed`);
//   }

//   static earnedCash(p: Player | Player[], amount: number): void {
//     this.get()._show(p, `Congratulations! You have Earned ${amount} Cash`);
//   }

//   static leveledUp(p: Player | Player[]): void {
//     this.get()._show(p, "Congratulations! You Have Levelled Up");
//   }
// }
