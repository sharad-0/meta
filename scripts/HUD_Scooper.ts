import {
  UIComponent,
  View,
  Text,
  Binding,
  UINode,
  Image,
  ImageSource,
  DynamicList,
} from "horizon/ui";
import { Component, TextureAsset, PropTypes, Color } from "horizon/core";
import { orderManager } from "Managers_Instance";
import { Items, OrderStatus } from "Enums_Game";
import { OrderStatusChanged } from "Manager_Events";
// ... other imports

const backgroundColor = Color.fromHex("#000000");
const borderColor = Color.fromHex("#764B1C");
const ITEM_SIZE = 45;
const OVERLAP_OFFSET = 25;

export default class HUD_Scooper extends UIComponent<typeof HUD_Scooper> {
  private static _instance: HUD_Scooper | null = null;
  static get(): HUD_Scooper {
    if (!HUD_Scooper._instance) {
      throw new Error(
        "HUD_Scooper not initialised – attach it to an always‑loaded entity."
      );
    }
    return HUD_Scooper._instance;
  }

  static propsDefinition = {
    item1Icon: { type: PropTypes.Asset },
    item2Icon: { type: PropTypes.Asset },
    item3Icon: { type: PropTypes.Asset },
    item4Icon: { type: PropTypes.Asset },
    noOrderIcon: { type: PropTypes.Asset },
    background: { type: PropTypes.Asset },
  };

  private orders: { items: string[] }[] = [];
  private ordersBinding = new Binding<{ items: string[] }[]>([]);

  // NEW: one color binding per table slot (1..6)
  private slotBgBindings: Binding<Color>[] = Array.from(
    { length: 6 },
    () => new Binding<Color>(Color.fromHex("#F9EADF"))
  );

  private unsubOrder?: () => void;
  private unsubHand?: () => void;

  initializeUI(): UINode {
    const MAX_COLUMNS = 6;
    const MAX_ITEMS = 4;

    return View({
      style: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(this.props.background!),
          style: {
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
        }),
        View({
          style: {
            width: "100%",
            aspectRatio: 255 / 163,
            // backgroundColor: backgroundColor,
            // borderColor: borderColor,
            // borderWidth: 3,d
            top: 57,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          },
          children: [
            DynamicList<{ items: string[] }>({
              data: this.ordersBinding,
              renderItem: (order, index) => {
                // Use the per-slot color binding; index aligns with tableId-1
                const bgBinding =
                  this.slotBgBindings[index ?? 0] ??
                  new Binding<Color>(Color.fromHex("#F9EADF"));
                return View({
                  style: {
                    width: "15%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: bgBinding, // CHANGED: binding-driven
                    borderRadius: 12,
                    // left: -2 * index!,
                  },
                  children: (() => {
                    if (!order.items || order.items.length === 0) {
                      return [
                        Image({
                          source: ImageSource.fromTextureAsset(
                            this.props.noOrderIcon!
                          ),
                          style: {
                            width: 40,
                            height: 100,
                          },
                        }),
                      ];
                    }
                    return View({
                      style: {
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
                        height:
                          2 * ITEM_SIZE +
                          (order.items.length - 1) * OVERLAP_OFFSET,
                        width: ITEM_SIZE * 0.8,
                        // transform: [{ rotate: "15deg" }],
                      },
                      children: order.items
                        .slice(0, MAX_ITEMS)
                        .map((item: string, i: number) =>
                          Image({
                            source: ImageSource.fromTextureAsset(
                              this.resolveIcon(item)
                            ),
                            style: {
                              width: ITEM_SIZE * 0.8,
                              height: ITEM_SIZE * 2,
                              position: "absolute",
                              bottom: i * OVERLAP_OFFSET,
                              zIndex: i,
                            },
                          })
                        ),
                    });
                  })(),
                });
              },
              style: {
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "flex-end",
                width: "100%",
                height: "100%",
              },
            }),
          ],
        }),
      ],
    });
  }

  preStart(): void {
    HUD_Scooper._instance = this;
  }

  start(): void {
    this.refresh();
    this.connectLocalBroadcastEvent(OrderStatusChanged, () => this.refresh());
  }

  onDestroy(): void {
    // this.unsubOrder?.();
    // this.unsubHand?.();
  }

  private resolveIcon(key: string): TextureAsset {
    const iconMap: Record<string, TextureAsset | undefined> = {
      item1: this.props.item1Icon?.as(TextureAsset),
      item2: this.props.item2Icon?.as(TextureAsset),
      item3: this.props.item3Icon?.as(TextureAsset),
      item4: this.props.item4Icon?.as(TextureAsset),
    };
    return iconMap[key] ?? this.props.item1Icon!.as(TextureAsset);
  }

  private refresh(): void {
    const allOrders = orderManager?.getOrderPool() ?? [];
    const orders = allOrders.filter(
      (o) =>
        o.status === OrderStatus.Accepted || o.status === OrderStatus.Completed
    );

    // const orders = orderManager?.getAcceptedOrders() ?? [];
    const slots: { items: string[]; tableId: string }[] = Array.from(
      { length: 6 },
      (_, i) => ({
        items: [],
        tableId: String(i + 1),
      })
    );

    for (const order of orders) {
      const tid = parseInt(order.tableId!, 10);
      if (!Number.isNaN(tid) && tid >= 1 && tid <= 6) {
        if (slots[tid - 1].items.length === 0) {
          slots[tid - 1] = {
            items: order.items ?? [],
            tableId: order.tableId!,
          };
        }
      }
    }

    this.ordersBinding.set(slots);

    // Optional: when orders refresh, reset colors for empty slots
    for (let i = 0; i < 6; i++) {
      if (slots[i].items.length === 0)
        this.slotBgBindings[i].set(Color.fromHex("#F9EADF"));
    }
  }

  // PUBLIC API: color controls per slot by tableId (1..6)

  public markOrderGreen(tableId: number | string): void {
    const idx = this.normalizeIndex(tableId);
    if (idx !== null) this.slotBgBindings[idx].set(Color.green);
  }

  public markOrderRed(tableId: number | string): void {
    const idx = this.normalizeIndex(tableId);
    if (idx !== null) this.slotBgBindings[idx].set(Color.red);
  }

  public resetOrderColor(tableId: number | string): void {
    const idx = this.normalizeIndex(tableId);
    if (idx !== null) this.slotBgBindings[idx].set(Color.fromHex("#F9EADF"));
  }

  private normalizeIndex(tableId: number | string): number | null {
    const n = typeof tableId === "string" ? parseInt(tableId, 10) : tableId;
    if (Number.isNaN(n) || n < 1 || n > 6) return null;
    return n - 1;
  }
}

Component.register(HUD_Scooper);
