import { Analytics, AnalyticsManager } from "AnalyticsManager";
import {
  AudioGizmoTags,
  CashierUiTags,
  CustomAnalyticsEvents,
  Items,
  NotificationTypes,
} from "Enums_Game";
import { CameraMode } from "horizon/camera";
import {
  Asset,
  AudioGizmo,
  Component,
  Player,
  PropTypes,
  TextureAsset,
} from "horizon/core";
import {
  Binding,
  ColorValue,
  DynamicList,
  Image,
  ImageSource,
  Pressable,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { Order } from "Manager_Order";
import {
  cashierManager,
  cashierUIManager,
  gameManager,
  hapticsManager,
  hudManager,
  orderManager,
  playerManager,
  snowflakeManager,
  tableManager,
  trainingManager,
} from "Managers_Instance";
import { PlayerCameraEvents } from "PlayerCamera";

const BUTTON_BG_COLORS = [
  "rgba(255, 233, 161, 1)", // Vanilla
  "rgba(244, 156, 170, 1)", // Strawberry
  "rgba(217, 160, 108, 1)", // Chocolate
];
const ITEM_SIZE = 80; // Larger for visuals
const OVERLAP_OFFSET = 35; // Offset between scoops

class UI_CustomerGreeting extends UIComponent<typeof UI_CustomerGreeting> {
  static propsDefinition = {};

  private order: Items[] = [Items.Cone];
  private orderBinding = new Binding<Items[]>(this.order);
  ordersForPlayer: Map<Player, { order: Order; tableId: string }> = new Map();
  correctOrder: Items[] = [];
  playersOnCustomerGreeting: Player[] = [];
  private uiBackgroundColorBinding = new Binding<ColorValue>("#363D73"); //
  private itemToButtonMap = new Map<Items, TextureAsset>();
  private btn1ScaleBinding = new Binding<number>(1);
  private btn2ScaleBinding = new Binding<number>(1);
  private btn3ScaleBinding = new Binding<number>(1);
  private tableId: string = "";
  initializeUI(): UINode {
    // this.itemToButtonMap.set(
    //   Items.Vanilla,
    //   this.props.vanillaButton!.as(TextureAsset)
    // );
    // this.itemToButtonMap.set(
    //   Items.Strawberry,
    //   this.props.strawberryButton!.as(TextureAsset)
    // );
    // this.itemToButtonMap.set(
    //   Items.Chocolate,
    //   this.props.chocolateButton!.as(TextureAsset)
    // );
    return View({
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("767734442768474")) as TextureAsset
          ),
          style: {
            width: "100%",
            height: "100%",
            alignSelf: "center",
            position: "absolute",
          },
        }),
        this.closeButton(),
        this.header(),
        this.body(),
      ],
      style: {
        // backgroundColor: "#58586E",
        height: "50%",
        width: "auto",
        aspectRatio: 605 / 577,
        alignItems: "center",
        left: "6%",
        top: "30%",
        position: "relative", // optional
        borderRadius: 16,
        flexDirection: "column",
        justifyContent: "space-evenly",
      },
    });
  }
  header() {
    return View({
      children: Text({
        text: "MATCH THE ORDER!",
        style: {
          fontSize: 32,
          fontWeight: "bold",
          color: "#fff",
          fontFamily: "Bangers",
          textAlign: "center",
        },
      }),
      style: {
        width: "90%",
        borderRadius: 16,
        backgroundColor: "#363654",
        alignContent: "center",
        justifyContent: "center",
        padding: 8,
        height: "20%",
      },
    });
  }

  body() {
    return View({
      style: {
        width: "auto",
        height: "72%",
        aspectRatio: 579 / 438,
        flexDirection: "row",
        justifyContent: "space-between",
        // backgroundColor: "#cf176dff",
      },
      children: [this.leftPanel(), this.rightPanel()],
    });
  }
  leftPanel(): UINode {
    return View({
      style: {
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        width: "auto",
        height: "100%",
        aspectRatio: 323 / 434,
        backgroundColor: "#2f2fe2af",
      },
      children: [
        this.flavorButton(Items.Vanilla, 0, "1361045942021811"),
        this.flavorButton(Items.Strawberry, 1, "660586650465199"),
        this.flavorButton(Items.Chocolate, 2, "1499401227765167"),
      ],
    });
  }

  flavorButton(item: Items, idx: number, assetId: string): UINode {
    return Pressable({
      onPress: (player) => {
        // console.log.*$
        //   `Button pressed: ${this.order.length} by Player ${player.id}`
        // );
        if (this.order.length > 4) return; // Max 4 items
        const replaceIdx = this.order.indexOf(Items.None);
        if (replaceIdx !== -1) {
          const newOrder = [...this.order];
          newOrder[replaceIdx] = item;
          this.order = newOrder;
          this.orderBinding.set(newOrder, [player]);
          this.setBtnScaleBinding(item, 0.9, player);
        }

        this.async.setTimeout(() => {
          this.setBtnScaleBinding(item, 1, player);
        }, 100);
        if (this.playersOnCustomerGreeting.length > 0) {
          this.checkOrderCorrectness(player, this.tableId);
        }
      },
      style: {
        width: "auto",
        height: "33%",
        aspectRatio: 323 / 140,
        // backgroundColor: BUTTON_BG_COLORS[idx],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale: this.getBindingScaleBinding(item) }],
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt(assetId)) as TextureAsset
          ),
          style: {
            width: "100%",
            height: "100%",
          },
        }),
      ],
    });
  }

  rightPanel(): UINode {
    const orderArr: Items[] = this.order; // Use the order array directly
    const itemCount = orderArr.length;
    return View({
      style: {
        justifyContent: "flex-end",
        alignItems: "center",
        backgroundColor: this.uiBackgroundColorBinding,
        borderRadius: 16,
        padding: 16,
        width: "auto",
        height: "100%",
        aspectRatio: 242 / 438,
        position: "relative",
      },
      children: [
        DynamicList<Items>({
          data: this.orderBinding, // Binding<Items[]>
          renderItem: (item, i) =>
            Image({
              source: ImageSource.fromTextureAsset(this.resolveIcon(item)),
              style: {
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                position: "absolute",
                bottom: i! * OVERLAP_OFFSET,
                zIndex: i,
                transform: [{ translateX: -ITEM_SIZE / 2 }],
              },
            }),
        }),
      ],
    });
  }

  closeButton() {
    return View({
      style: {
        position: "absolute",
        top: 0,
        right: -0,
        zIndex: 10,
        height: "16%",
        width: "auto",
        aspectRatio: 1,
        // backgroundColor: "#ff0000",
        borderBottomLeftRadius: 20,
        borderTopRightRadius: 20,
      },
      children: [
        Pressable({
          onPress: (player) => {
            this.closeUI(player);
          },
          style: {
            // padding: 8,
            // borderRadius: 16,
          },
          children: [
            Image({
              source: ImageSource.fromTextureAsset(
                new Asset(BigInt("714118215018100")) as TextureAsset
              ),
              style: {
                width: "100%",
                height: "100%",
                top: 0,
                right: 0,
              },
            }),
          ],
        }),
      ],
    });
  }

  closeUI(player: Player) {
    this.entity.visible.set(false);
    this.sendNetworkEvent(player, PlayerCameraEvents.SetCameraMode, {
      mode: CameraMode.Follow,
    });
  }

  private resolveIcon(item: Items): TextureAsset {
    switch (item) {
      case Items.Cone:
        return new Asset(BigInt("1260644325364972")) as TextureAsset;
      case Items.Vanilla:
        return new Asset(BigInt("1914243516024217")) as TextureAsset;
      case Items.Strawberry:
        return new Asset(BigInt("1870177350377473")) as TextureAsset;
      case Items.Chocolate:
        return new Asset(BigInt("24274868795501648")) as TextureAsset;
      default:
        return new Asset(BigInt("772724465379626")) as TextureAsset;
    }
  }
  public setOrder(order: Order, player: Player, tableId: string) {
    // console.log.*$
    this.ordersForPlayer.set(player, { order, tableId });
    const orderLength = order.items.length;
    let uiOrder = [Items.Cone];
    for (let i = 0; i < orderLength - 1; i++) {
      uiOrder.push(Items.None);
    }
    this.order = uiOrder;
    // console.log.*$
    this.orderBinding.set(this.order, [player]);
    this.addPlayerToTrigger(player);
    this.tableId = tableId;
  }

  public removeOrder(player: Player) {
    this.ordersForPlayer.delete(player);
  }

  public addPlayerToTrigger(player: Player) {
    // console.log.*$
    this.playersOnCustomerGreeting.push(player);
  }

  public removePlayerFromTrigger(player: Player) {
    this.playersOnCustomerGreeting.splice(
      this.playersOnCustomerGreeting.indexOf(player),
      1
    );
  }

  public getPlayersOnTrigger(): Player[] {
    return this.playersOnCustomerGreeting;
  }

  private checkOrderCorrectness(player: Player, tableId: string) {
    const expectedOrder = this.ordersForPlayer.get(player)?.order.items ?? [];
    const currentOrder = this.order;

    // Find the first placeholder; last filled index is one before it.
    const firstNone = currentOrder.indexOf(Items.None);
    const lastFilledIdx =
      firstNone === -1 ? currentOrder.length - 1 : firstNone - 1; // -1 means fully filled [web:9][web:18]

    // If nothing beyond the mandatory cone is filled yet, just return.
    if (lastFilledIdx < 0) {
      return; // only the cone is present; no validation needed yet [web:18]
    }

    // If last filled index exceeds expected array, it's an immediate wrong state.
    if (lastFilledIdx >= expectedOrder.length) {
      return this.handleWrong(player, expectedOrder, tableId); // overflow beyond expected length [web:18]
    }

    // Incremental check: compare the just-filled slot with expected.
    const incrementallyCorrect =
      currentOrder[lastFilledIdx] === expectedOrder[lastFilledIdx]; // strict eq [web:18]
    if (!incrementallyCorrect) {
      return this.handleWrong(player, expectedOrder, tableId); // mismatch at last filled [web:18]
    }

    // If still incomplete (has a placeholder), it’s “so far correct”: no UI success yet.
    const hasPlaceholders = firstNone !== -1; // at least one None exists [web:9]
    if (hasPlaceholders) {
      return; // early OK, continue filling [web:18]
    }

    // Completed: compare full sequence.
    const sameLength = currentOrder.length === expectedOrder.length; // must match [web:18]
    const allMatch =
      sameLength && currentOrder.every((item, i) => item === expectedOrder[i]); // full equality [web:3]
    if (!allMatch) {
      return this.handleWrong(player, expectedOrder, tableId); // completed but wrong [web:3]
    }

    // Completed and correct: success branch.
    return this.handleSuccess(player); // trigger accept flow [web:18]
  }

  handleSuccess(player: Player) {
    // Change UI bg color to green to indicate success
    this.uiBackgroundColorBinding.set("rgba(14, 198, 14, 0.7)", [player]);
    this.world
      .getEntitiesWithTags([AudioGizmoTags.OrderAccepted])[0]
      .as(AudioGizmo)
      .play();
    const tableId = this.ordersForPlayer.get(player)?.tableId;
    orderManager?.markOrderAsAccepted(
      this.ordersForPlayer.get(player)?.order.id!
    );
    tableManager?.onOrderAccepted(tableId!);
    if (gameManager?.isThisTrainingSession()) {
      trainingManager?.triggerNextFTUETask(player, 1, "Success"); // Close UI after 1 seconds (simulate close by clearing order and resetting UI color)
    }

    playerManager?.addServerAction(player);
    hapticsManager?.playStrongRumble(player);
    snowflakeManager?.addSnowflakeCurrencyToPlayer(player);

    this.async.setTimeout(() => {
      this.order = [Items.Cone];
      this.orderBinding.set(this.order, [player]);
      this.uiBackgroundColorBinding.set("#32333a", [player]);
      // cashierUIManager?.updateHud(
      //   CashierUiTags.OrderAccepted,
      //   this.ordersForPlayer.get(player)?.tableId?.toString() ?? "",
      //   player
      // );
      this.entity.visible.set(false);
      hudManager?.showPopupNotifToPlayer(
        NotificationTypes.orderConfirmed,
        player,
        3
      );
      this.sendNetworkEvent(player, PlayerCameraEvents.SetCameraMode, {
        mode: CameraMode.Follow,
      });
    }, 1000);

    AnalyticsManager.s_instance.sendServerOrderGuess(
      player,
      tableId!,
      this.ordersForPlayer.get(player)?.order.items ?? [],
      "Yes"
    );
  }

  handleWrong(player: Player, expectedOrder: Items[], tableId: string) {
    // Same length but incorrect sequence — show red, then reset UI immediately
    this.uiBackgroundColorBinding.set("rgba(255, 0, 0, 0.84)", [player]);
    hapticsManager?.playShortBuzz(player);
    this.async.setTimeout(() => {
      let uiOrder = [Items.Cone];
      for (let i = 0; i < expectedOrder.length - 1; i++) {
        uiOrder.push(Items.None);
      }

      this.order = uiOrder;

      this.orderBinding.set(uiOrder, [player]);
      this.uiBackgroundColorBinding.set("#363D73", [player]);
    }, 500);

    AnalyticsManager.s_instance.sendServerOrderGuess(
      player,
      tableId!,
      this.ordersForPlayer.get(player)?.order.items ?? [],
      "No"
    );
  }

  setBtnScaleBinding(item: Items, scale: number, player: Player) {
    switch (item) {
      case Items.Vanilla:
        this.btn1ScaleBinding.set(scale);
        break;
      case Items.Strawberry:
        this.btn2ScaleBinding.set(scale);
        break;
      case Items.Chocolate:
        this.btn3ScaleBinding.set(scale);
        break;
      default:
        this.btn1ScaleBinding.set(1);
    }
  }

  getBindingScaleBinding(item: Items): Binding<number> {
    switch (item) {
      case Items.Vanilla:
        return this.btn1ScaleBinding;
      case Items.Strawberry:
        return this.btn2ScaleBinding;
      case Items.Chocolate:
        return this.btn3ScaleBinding;
      default:
        return this.btn1ScaleBinding;
    }
  }
}

Component.register(UI_CustomerGreeting);
export default UI_CustomerGreeting;
