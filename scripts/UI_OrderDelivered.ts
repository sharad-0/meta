import { DeliveryType } from "Enums_Game";
import { Asset } from "horizon/core";
import { PropTypes, TextureAsset } from "horizon/core";
import {
  Binding,
  ColorValue,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";


type NotificationItem = {
  type: DeliveryType;
  amount: number;
};

class UI_OrderDelivered extends UIComponent<typeof UI_OrderDelivered> {
  // Visibility/text/color/image bindings
  slot1VisibilityBinding = new Binding<boolean>(false);
  slot2VisibilityBinding = new Binding<boolean>(false);
  slot1TextColorBinding = new Binding<ColorValue>("#108314ff");
  slot2TextColorBinding = new Binding<ColorValue>("#FF0000");
  slot1TextBinding = new Binding<string>("0");
  slot2TextBinding = new Binding<string>("0");
  slot1ImageSourceBinding = new Binding<ImageSource | null>(
    ImageSource.fromTextureAsset(
      new Asset(BigInt("1843805389862488")) as TextureAsset
    )
  );
  slot2ImageSourceBinding = new Binding<ImageSource | null>(
    ImageSource.fromTextureAsset(
      new Asset(BigInt("1098883492042279")) as TextureAsset
    )
  );

  static propsDefinition = {};

  imageAssets = {
    green: ImageSource.fromTextureAsset(
      new Asset(BigInt("1843805389862488")) as TextureAsset
    ),
    yellow: ImageSource.fromTextureAsset(
      new Asset(BigInt("795313139961837")) as TextureAsset
    ),
    red: ImageSource.fromTextureAsset(
      new Asset(BigInt("1098883492042279")) as TextureAsset
    ),
  };

  colorStrings = {
    green: "#108314ff",
    yellow: "#FF9C24",
    red: "#FF0000",
  };

  // Runtime state for 2-slot queue
  private queue: NotificationItem[] = [];
  private slot1Active = false;
  private slot2Active = false;
  private slot1Timer: number | null = null;
  private slot2Timer: number | null = null;

  initializeUI(): UINode {
    return this.mainContainer();
  }

  private mainContainer() {
    return View({
      style: {
        width: "auto",
        height: "15%",
        aspectRatio: 283 / 111,
        top: "25%",
        right: "3%",
        alignContent: "center",
        alignItems: "center",
        position: "absolute",
      },
      children: [this.slot1Container(), this.slot2Container()],
    });
  }

  private slot1Container() {
    return UINode.if(
      this.slot1VisibilityBinding,
      View({
        style: {
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        },
        children: [
          Image({
            source: this.slot1ImageSourceBinding,
            style: {
              width: "100%",
              height: "100%",
              zIndex: 5,
              top: 0,
              left: 0,
            },
          }),
          Text({
            text: this.slot1TextBinding,
            style: {
              // backgroundColor: "rgba(236, 224, 1, 0.66)",
              width: "auto",
              height: "30%",
              aspectRatio: 52 / 33,
              position: "absolute",
              fontFamily: "Roboto",
              fontWeight: "bold",
              color: this.slot1TextColorBinding, // use binding
              textAlign: "center",
              textAlignVertical: "center",
              zIndex: 10,
              top: "30%",
              right: "2%",
            },
          }),
        ],
      })
    );
  }

  private slot2Container() {
    return UINode.if(
      this.slot2VisibilityBinding,
      View({
        style: {
          top: "8%",
          left: 0,
          width: "100%",
          height: "100%",
        },
        children: [
          Image({
            source: this.slot2ImageSourceBinding,
            style: {
              width: "100%",
              height: "100%",
              zIndex: 5,
              top: 0,
              left: 0,
            },
          }),
          Text({
            text: this.slot2TextBinding,
            style: {
              width: "auto",
              height: "30%",
              aspectRatio: 52 / 33,
              position: "absolute",
              fontFamily: "Roboto",
              fontWeight: "bold",
              color: this.slot2TextColorBinding, // use binding
              textAlign: "center",
              textAlignVertical: "center",
              zIndex: 10,
              top: "30%",
              right: "2%",
            },
          }),
        ],
      })
    );
  }

  // Internal helpers

  private showInSlot(slot: 1 | 2, item: NotificationItem) {
    const img = this.imageAssets[item.type];
    const color = this.colorStrings[item.type];
    const text = this.formatAmount(item.amount);

    if (slot === 1) {
      this.slot1ImageSourceBinding.set(img);
      this.slot1TextColorBinding.set(color);
      this.slot1TextBinding.set(text);
      this.slot1VisibilityBinding.set(true);
      this.slot1Active = true;

      if (this.slot1Timer !== null) {
        this.async.clearTimeout(this.slot1Timer);
      }
      this.slot1Timer = this.async.setTimeout(
        () => this.clearSlot(1),
        5000
      ) as unknown as number;
    } else {
      this.slot2ImageSourceBinding.set(img);
      this.slot2TextColorBinding.set(color);
      this.slot2TextBinding.set(text);
      this.slot2VisibilityBinding.set(true);
      this.slot2Active = true;

      if (this.slot2Timer !== null) {
        this.async.clearTimeout(this.slot2Timer);
      }
      this.slot2Timer = this.async.setTimeout(
        () => this.clearSlot(2),
        5000
      ) as unknown as number;
    }
  }

  private clearSlot(slot: 1 | 2) {
    if (slot === 1) {
      this.slot1VisibilityBinding.set(false);
      this.slot1Active = false;
      if (this.slot1Timer !== null) {
        this.async.clearTimeout(this.slot1Timer);
        this.slot1Timer = null;
      }
      this.processQueueInto(slot);
    } else {
      this.slot2VisibilityBinding.set(false);
      this.slot2Active = false;
      if (this.slot2Timer !== null) {
        this.async.clearTimeout(this.slot2Timer);
        this.slot2Timer = null;
      }
      this.processQueueInto(slot);
    }
  }

  private processQueueInto(slot: 1 | 2) {
    if (this.queue.length === 0) return;
    const next = this.queue.shift()!;
    this.showInSlot(slot, next);
  }

  private formatAmount(amount: number) {
    const sign = amount >= 0 ? "+" : "";
    return `${sign}${amount}`;
  }

  public notifyDelivered(type: DeliveryType, amount: number) {
    const item: NotificationItem = { type, amount };
    if (!this.slot1Active) {
      this.showInSlot(1, item);
    } else if (!this.slot2Active) {
      this.showInSlot(2, item);
    } else {
      this.queue.push(item);
    }
  }

  public clearAllNotifications() {
    // Cancel timers (no-op if IDs invalid)
    if (this.slot1Timer !== null) {
      this.async.clearTimeout(this.slot1Timer);
      this.slot1Timer = null;
    }
    if (this.slot2Timer !== null) {
      this.async.clearTimeout(this.slot2Timer);
      this.slot2Timer = null;
    }

    this.slot1VisibilityBinding.reset();
    this.slot2VisibilityBinding.reset();
    this.slot1Active = false;
    this.slot2Active = false;

    this.slot1TextBinding.reset();
    this.slot2TextBinding.reset();

    this.queue.length = 0;
  }
}

UIComponent.register(UI_OrderDelivered);
export default UI_OrderDelivered;
