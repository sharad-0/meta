import { Items } from "Enums_Game";
import { Asset, Color, PropTypes, TextureAsset } from "horizon/core";
import {
  Binding,
  DynamicList,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
const backgroundColor = Color.fromHex("#FFECE1");
const borderColor = Color.fromHex("#764B1C");
const ITEM_SIZE = 100;
const OVERLAP_OFFSET = 30;

export default class UI_CustomerHeadsUp extends UIComponent<
  typeof UI_CustomerHeadsUp
> {
  static propsDefinition = {
    item1Icon: { type: PropTypes.Asset },
    item2Icon: { type: PropTypes.Asset },
    item3Icon: { type: PropTypes.Asset },
    item4Icon: { type: PropTypes.Asset },
    backgroundImage: { type: PropTypes.Asset },
  };
  private order: Items[] = [Items.Cone, Items.Chocolate];
  private orderBinding = new Binding<Items[]>(this.order);

  initializeUI(): UINode {
    const orderArr: Items[] = this.order; // Use the order array directly
    const itemCount = orderArr.length;

    // Calculate container height and width to fit backgroundImage & icons
    const containerWidth = ITEM_SIZE * 4; // width to cover icons comfortably
    const containerHeight = ITEM_SIZE * 4; // height for background + overlapping scoops

    return View({
      style: {
        position: "relative",
        width: containerWidth,
        height: containerHeight,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        overflow: "visible",
      },
      children: [
        // Background Image fills the container
        Image({
          source: ImageSource.fromTextureAsset(
            this.props.backgroundImage! as TextureAsset
          ),
          style: {
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            borderRadius: 16,
          },
        }),

        // Icon stack container, centered relative to background image
        View({
          style: {
            position: "absolute",
            bottom: ITEM_SIZE * 0.8, // little offset from bottom if needed
            // left: "50%",
            // top: containerHeight * 0.5,
            transform: [{ translateX: -ITEM_SIZE / 2 }], // horizontal center by half icon width
            height: ITEM_SIZE + (itemCount - 1) * OVERLAP_OFFSET,
            width: ITEM_SIZE,
            justifyContent: "center",
            alignItems: "center",
          },
          children: [
            View({
              style: {
                // width: ITEM_SIZE,
                // height: ITEM_SIZE + (itemCount - 1) * OVERLAP_OFFSET,
                // left: 0,
                // right: 0,
                // marginLeft: "auto",
                // marginRight: "auto",
                // top: 0,
                // bottom: 0,
                // position: "relative",
              },
              children: [
                DynamicList<Items>({
                  data: this.orderBinding, // Binding<Items[]>
                  renderItem: (item, i) =>
                    Image({
                      source: ImageSource.fromTextureAsset(
                        this.resolveIcon(item)
                      ),
                      style: {
                        width: ITEM_SIZE,
                        height: ITEM_SIZE,
                        position: "absolute",
                        bottom: i! * OVERLAP_OFFSET,
                      },
                    }),
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }

  private resolveIcon(key: string): TextureAsset {
    const iconMap: Record<string, TextureAsset | undefined> = {
      item1: this.props.item1Icon?.as(TextureAsset),
      item2: this.props.item2Icon?.as(TextureAsset),
      item3: new Asset(BigInt("1870177350377473")) as TextureAsset,
      item4: this.props.item4Icon?.as(TextureAsset),
    };

    return iconMap[key] ?? this.props.item1Icon!.as(TextureAsset); // fallback
  }

  public setOrder(newOrder: Items[]) {
    // console.log.*$
    this.order = newOrder;
    this.orderBinding.set(this.order);
  }
}
UIComponent.register(UI_CustomerHeadsUp);
