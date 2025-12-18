import SegmentedCircularTimer from "CircularTimer";
import { OrderStatus } from "Enums_Game";
import * as hz from "horizon/core";
import { AssetBundleGizmo } from "horizon/unity_asset_bundles";
import {
  OrderStatusChanged,
  ParlourClosedEvent,
  ParlourOpenedEvent,
} from "Manager_Events";
import { orderManager } from "Managers_Instance";

enum TimerState {
  Empty,
  Green,
  Yellow1,
  Yellow2,
  Red,
}

export default class Component_OrderTimer extends hz.Component<
  typeof Component_OrderTimer
> {
  static propsDefinition = {
    tableId: { type: hz.PropTypes.String },
    timerObject: { type: hz.PropTypes.Entity },
    serverTimerUiObject: { type: hz.PropTypes.Entity },
    timerUiObject: { type: hz.PropTypes.Entity },
  };

  private orderId: number = 0;
  private isOrderActive: boolean = false;
  private timerId: number | null = null;
  start() {
    this.resetTimer();
    this.connectLocalBroadcastEvent(OrderStatusChanged, () => this.refresh());
    this.connectLocalBroadcastEvent(ParlourOpenedEvent, () => {
      this.resetTimer();
    });
    // this.startTimer(60); // For testing purpose only
  }

  public refresh() {
    const order = orderManager?.getOrderFromTable(this.props.tableId!);
    const maxTime = order ? orderManager?.getOrderMaxTime(order) : undefined;
    // console.log.*$
    //   `[Order Timer Refreshed] , ${this.props.tableId},  ${order?.status}, ${order?.timestamp}, ${maxTime}, ${order?.id}`
    // );
    if (order && order.id !== this.orderId) {
      if (order.status === OrderStatus.Accepted && maxTime) {
        this.orderId = order.id;
        this.startTimer(maxTime);
        // console.log.*$
        //   `[Order Timer] , ${this.props.tableId},  ${order.timestamp}`
        // );
      }
    } else {
      if (
        order?.status === OrderStatus.Delivered ||
        order?.status === OrderStatus.Paid
      ) {
        this.resetTimer();
      }
    }
  }

  startTimer(timerValue: number) {
    if (!this.isOrderActive) {
      this.isOrderActive = true;
      // this.animateAsset();
      this.startUiTTimer(timerValue);
    }
  }

  startUiTTimer(timerValue: number) {
    if (this.props.timerUiObject && this.props.serverTimerUiObject) {
      const timerUi =
        this.props.timerUiObject.getComponents<SegmentedCircularTimer>()[0];
      const serverTimerUi =
        this.props.serverTimerUiObject.getComponents<SegmentedCircularTimer>()[0];
      if (timerUi && serverTimerUi) {
        timerUi.setMaxTime(timerValue * 1000);
        timerUi.startTimer();
        serverTimerUi.setMaxTime(timerValue * 1000);
        serverTimerUi.startTimer();
        this.timerId = this.async.setInterval(() => {
          timerUi.updateProgress(1000);
          serverTimerUi.updateProgress(1000);
        }, 1000);
      }
    }
  }

  stopUiTimer() {
    if (this.props.timerUiObject && this.props.serverTimerUiObject) {
      const timerUi =
        this.props.timerUiObject.getComponents<SegmentedCircularTimer>()[0];
      const serverTimerUi =
        this.props.serverTimerUiObject.getComponents<SegmentedCircularTimer>()[0];
      if (timerUi) {
        timerUi.stopTimer();
        if (this.timerId) this.async.clearInterval(this.timerId!);
        this.timerId = null;
      }
      if (serverTimerUi) {
        serverTimerUi.stopTimer();
      }
    }
  }

  resetTimer() {
    this.isOrderActive = false;
    this.orderId = 0;
    // this.animateAsset();
    this.stopUiTimer();
  }

  // animateAsset() {
  //   if (!this.props.timerObject || !this.props.serverTimerObject) return;
  //   const assetBundle = this.props.timerObject.as(AssetBundleGizmo);
  //   const serverAssetBundle = this.props.serverTimerObject.as(AssetBundleGizmo);
  //   const assetRoot = assetBundle?.getRoot();
  //   const serverAssetRoot = serverAssetBundle?.getRoot();
  //   if (assetRoot && serverAssetRoot) {
  //     // console.log.*$
  //       `timer animation params ${JSON.stringify(
  //         assetRoot.getAnimationParameters()
  //       )}`
  //     );
  //     assetRoot.setAnimationParameterInteger("speed", this.speed);
  //     serverAssetRoot.setAnimationParameterInteger("speed", this.speed);
  //   }
  // }
}
hz.Component.register(Component_OrderTimer);
