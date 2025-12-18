import * as hz from "horizon/core";
import TaskManager, { ActionType } from "TaskManager";
import {
  DeliveryType,
  DeliveryTypeEnum,
  Items,
  orderItemAmount,
  OrderStatus,
  PlayerRoles,
} from "Enums_Game";
import { playerManager } from "Managers_Instance";
import {
  OrderStatusChanged,
  ParlourClosedEvent,
  ParlourOpenedEvent,
} from "Manager_Events";
import Component_IceCreamCone from "Component_IceCreamCone";

export interface Order {
  id: number;
  items: Items[];
  status: OrderStatus;
  name: string;
  customerId?: bigint;
  tableId?: string;
  paymentReceived?: number;
  forFTUE: boolean;
  timestamp?: number;
}

export default class Manager_Order extends hz.Component<typeof Manager_Order> {
  static propsDefinition = {};

  private nextId = 1;
  private orderPool: Order[] = [];
  private subscribers = new Set<() => void>();
  private orderAddedNotify = new Set<() => void>();
  private orderCompletedCount = 0;
  private completedOrderIceCreamEntities = new Map<string, hz.Entity>();

  start(): void {
    this.resetData();

    // console.log.*$
  }

  resetData() {
    this.orderPool = [];
    this.subscribers.clear();
    this.orderAddedNotify.clear();
    this.orderCompletedCount = 0;
    this.nextId = 1;
  }

  addOrder(
    items: Items[],
    name: string,
    customerId: bigint,
    tableId?: string,
    forFTUE: boolean = false
  ): number {
    const order: Order = {
      id: this.nextId++,
      items: [...items],
      status: OrderStatus.Pending,
      name,
      customerId,
      tableId,
      forFTUE,
    };
    this.orderPool.push(order);
    this.orderAddedNotify.forEach((fn) => fn());
    this.notify();
    return order.id;
  }

  removeOrderFromPool(orderId: number) {
    const index = this.orderPool.findIndex((o) => o.id === orderId);
    if (index !== -1) this.orderPool.splice(index, 1);
  }

  getNextPendingOrder(): Order | undefined {
    return this.orderPool.find(
      (o) => o.status === OrderStatus.Pending && !o.forFTUE
    );
  }

  getPendingOrders(): Order[] {
    return this.orderPool.filter(
      (o) => o.status === OrderStatus.Pending && !o.forFTUE
    );
  }

  getDeliveredOrders(): Order[] {
    return this.orderPool.filter(
      (o) => o.status === OrderStatus.Delivered && !o.forFTUE
    );
  }

  getAcceptedOrders(): Order[] {
    return this.orderPool.filter(
      (o) => o.status === OrderStatus.Accepted && !o.forFTUE
    );
  }

  getCustomerIdFromOrderId(orderId: number): bigint | undefined {
    return this.orderPool.find((o) => o.id === orderId)?.customerId;
  }

  markOrderAsAccepted(orderId: number, forFTUE: boolean = false): boolean {
    const order = this.orderPool.find((o) => o.id === orderId);
    if (!order) return false;
    order.status = OrderStatus.Accepted;

    // if (!forFTUE) {
    //   const server = playerManager?.getRolePlayers(PlayerRoles.Server)[0];
    //   // if (server) {
    //   //   TaskManager.recordAction(server, ActionType.TakeOrder, 1);
    //   // }
    order.timestamp = Date.now();

    this.notify();
    return true;
  }

  getNextAvailableOrder(forFTUE: boolean = false): Order | undefined {
    return this.orderPool.find(
      (o) => o.status === OrderStatus.Accepted && o.forFTUE === forFTUE
    );
  }

  setOrderPaymentReceived(orderId: number): boolean {
    const order = this.orderPool.find((o) => o.id === orderId);
    if (!order) return false;
    order.paymentReceived = this.calculateOrderAmount(order);
    this.updateStatus(order.id, OrderStatus.Paid);
    this.removeOrderFromPool(orderId);

    // console.log.*$
    //   `[Manager_Order] Order ${orderId} payment received: ${order.paymentReceived}`
    // );

    return true;
  }

  setTableForOrder(orderId: number, tableId: string): boolean {
    const order = this.orderPool.find((o) => o.id === orderId);
    if (!order) return false;
    order.tableId = tableId;
    this.getTableForOrder(orderId); // optional debug
    return true;
  }

  getTableForOrder(orderId: number): string | undefined {
    return this.orderPool.find((o) => o.id === orderId)?.tableId;
  }

  getOrderFromTable(tableId: string): Order | undefined {
    return this.orderPool.find((o) => o.tableId === tableId);
  }

  getOrderPool(): readonly Order[] {
    return [...this.orderPool];
  }

  getOrderById(orderId: number): Order | undefined {
    return this.orderPool.find((o) => o.id === orderId);
  }

  getAcceptedOrderForItems(items: string[]): Order | undefined {
    return this.orderPool.find(
      (o) =>
        o.status === OrderStatus.Accepted &&
        o.items.length === items.length &&
        o.items.every((item) => items.includes(item))
    );
  }

  updateStatus(orderId: number, status: OrderStatus): boolean {
    // console.log.*$
    //   `[Manager_Order] Updating status for order ${orderId} to ${status}`
    // );

    const order = this.getOrderById(orderId);
    if (!order) return false;
    order.status = status;

    if (status === OrderStatus.Paid) {
      this.orderCompletedCount++;
    }

    this.notify();
    return true;
  }

  private notify() {
    this.subscribers.forEach((fn) => fn());
    this.sendLocalBroadcastEvent(OrderStatusChanged, {});
  }

  subscribe(fn: () => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  calculateOrderAmount(order: Order): number {
    return order.items.reduce(
      (total, item) =>
        total + (orderItemAmount[item as keyof typeof orderItemAmount] || 0),
      0
    );
  }

  getCompletedOrderCount(): number {
    return this.orderCompletedCount;
  }

  onParlourOpened() {
    this.orderCompletedCount = 0;
  }

  onParlourClosed() {
    this.resetData();
    this.notify();
  }

  getOrderMaxTime(order: Order): number {
    // Guard: need a start timestamp
    if (!order || !order.timestamp) return 0;

    const itemCount = order.items?.length ?? 0;
    if (itemCount <= 0) return 0;
    switch (itemCount) {
      case 1:
        return 120; // 1 item -> 1 min
      case 2:
        return 180; // 2 items -> 2 min
      case 3:
        return 240; // 3 items -> 3 min
      case 4:
        return 300; // 4 items -> 4 min
      default:
        return 120;
        break;
    }
  }

  calculateBonusBasedOnTimeTaken(order: Order): {
    deliveryType: DeliveryType;
    amount: number;
  } {
    let deliveryType: DeliveryType = DeliveryTypeEnum.Late;
    let bonusAmount = 0;
    if (!order || !order.timestamp)
      return { deliveryType, amount: bonusAmount };

    const now = Date.now();
    const timeTakenSec = Math.max(0, (now - order.timestamp) / 1000);
    const maxTimeSec = this.getOrderMaxTime(order);
    // Fraction of the allowed window consumed
    const fraction = timeTakenSec / maxTimeSec;

    // Faster completion (smaller fraction) earns higher bonus.
    if (fraction <= 1) {
      bonusAmount = 10;
      deliveryType = DeliveryTypeEnum.Fast;
    } else {
      bonusAmount = 0;
      deliveryType = DeliveryTypeEnum.Late;
    }

    return { deliveryType, amount: bonusAmount };
  }

  addIceCreamEntityForCompletedOrder(tableId: string, entity: hz.Entity) {
    this.completedOrderIceCreamEntities.set(tableId, entity);
  }
  getIceCreamEntityForCompletedOrder(tableId: string): hz.Entity | undefined {
    if (tableId) return this.completedOrderIceCreamEntities.get(tableId);
  }
  getIceCreamComponentFromTableId(tableId: string): Component_IceCreamCone | undefined {
    const entity = this.getIceCreamEntityForCompletedOrder(tableId);
    if (!entity) return undefined;
    return entity.getComponents(Component_IceCreamCone)[0];
  }
  removeIceCreamEntityForCompletedOrder(tableId: string) {
    this.completedOrderIceCreamEntities.delete(tableId);
  }
}

hz.Component.register(Manager_Order);
