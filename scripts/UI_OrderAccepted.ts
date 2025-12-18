import { Color, Player, PropTypes } from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Pressable,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { Order } from "Manager_Order";
import { orderManager } from "Managers_Instance";

class UI_OrderAccepted extends UIComponent<typeof UI_OrderAccepted> {
  protected panelHeight: number = 300;
  protected panelWidth: number = 500;

  static propsDefinition = {
    tickImageAsset: { type: PropTypes.Asset },
  };
  private orderNumberBinding = new Binding<string>("");
  private orderInQue: Binding<string> = new Binding<string>("");

  private ordersForPlayer = new Map <Player, Order>();
  private playersOnOrderAccepted: Player[] = [];

  start() {}

  initializeUI(): UINode {
    return View({
      children: [this.topBar(), this.tickImage()],
      style: {
        backgroundColor: "rgba(0,0,0,0.85)",
        padding: 20,
        borderRadius: 12,
        top: "20%",
        width: "60%",
        height: "65%",
        bottom: "10%",
        position: "absolute",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "space-evenly",
        left: "20%",
        right: "20%",
        flexDirection: "column",
      },
    });
  }

  private topBar() {
    return View({
      style: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "center",
        width: "100%",
        top: -20,
      },
      children: [
        this.getOrderDetails(),
        this.heading(),
        // this.getOrderInQueue(),
      ],
    });
  }

  private tickImage() {
    return Image({
      source: ImageSource.fromTextureAsset(this.props.tickImageAsset!),
      style: {
        width: 120,
        height: 120,
        marginTop: 20,
        marginBottom: 20,
      },
    });
  }

  private heading() {
    return Text({
      text: "Order Accepted!",
      style: {
        fontSize: 32,
        color: "rgba(255, 255, 255, 1)",
        fontWeight: "bold",
        textAlign: "center",
        left: -60
      },
    });
  }

  private getOrderDetails() {
    const order = orderManager?.getNextPendingOrder();
    this.orderNumberBinding.set(`Order No #${order?.id ?? 1}`);
    return Text({
      text: this.orderNumberBinding,
      style: {
        fontSize: 24,
        color: "rgba(255, 214, 132, 1)",
        fontWeight: "bold",
        left: -150,
      },
    });
  }

  private getOrderInQueue() {
    return Text({
      text: this.orderInQue,
      style: {
        fontSize: 24,
        color: "rgba(255, 214, 132, 1)",
        fontWeight: "bold",
        left: 50,
      },
    });
  }
  public setOrder(order: Order, player: Player) {
    this.ordersForPlayer.set(player, order);
    this.refreshUI(player);
  }

  public removeOrder(player: Player) {
    this.ordersForPlayer.delete(player);
    this.refreshUI(player);
  }

  public addPlayerToTrigger(player: Player) {
    this.playersOnOrderAccepted.push(player)
  }

  public removePlayerFromTrigger(player: Player) {
    this.playersOnOrderAccepted.splice(this.playersOnOrderAccepted.indexOf(player), 1);
  }

  public getPlayersOnTrigger(): Player[] {
    return this.playersOnOrderAccepted;
  }
  private refreshUI(player: Player) {
    // const next = OrderManager.getNextPendinOrder?.();
    this.orderNumberBinding.set(`Order No #${this.ordersForPlayer.get(player)?.id ?? 1}`, [player]);
    const pendingOrders = orderManager?.getPendingOrders?.();
    this.orderInQue.set(`Queue: ${pendingOrders ? pendingOrders.length : 0}`, [player]);
  }
}
UIComponent.register(UI_OrderAccepted);
export default UI_OrderAccepted;