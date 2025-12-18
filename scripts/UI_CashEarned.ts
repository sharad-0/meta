import { PropTypes, TextureAsset } from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";

class UI_CashEarned extends UIComponent<typeof UI_CashEarned> {
  protected panelHeight: number = 300;
  protected panelWidth: number = 500;
  private cashAmountBinding = new Binding<string>("0");
  private orderAmountReceivedBinding = new Binding<string>("0");
  private expBinding = new Binding<string>("+0");

  static propsDefinition = {
    cashIconImageAsset: { type: PropTypes.Asset },
    uiBackgroundImageAsset: { type: PropTypes.Asset },
  };

  initializeUI(): UINode {
    return this.mainContainer();
  }

  mainContainer() {
    return View({
      style: {
        position: "relative", // establish containing block for absolute children [4]
        width: 382,
        height: 256,
        top: "20%",
        left: "32%",
        alignContent: "center",
        alignItems: "center",
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            this.props.uiBackgroundImageAsset as TextureAsset
          ),
          style: {
            width: "100%",
            height: "100%",
            position: "absolute", // sit at (0,0) of the container [4]
            top: 0,
            left: 0,
            zIndex: 0, // background layer [11]
          },
        }),
        this.bodyContainer(), // will sit above via absolute + zIndex [11]
      ],
    });
  }

  bodyContainer() {
    return View({
      style: {
        position: "absolute", // overlay the background image [4]
        bottom: 22,
        left: 16,
        width: "92%",
        height: "63%",
        paddingHorizontal: 12,
        padding: 6,
        zIndex: 10, // ensure on top [11]
        flexDirection: "column",
        justifyContent: "space-between",
        // optionally add padding if text hugs edges
      },
      children: [this.orderValue(), this.cashAmount(), this.expEarned()],
    });
  }

  orderValue() {
    return View({
      style: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      },
      children: [
        Text({
          text: "Order Value",
          style: {
            fontFamily: "Bangers",
            fontSize: 32,
            color: "#286B2F",
          },
        }),

        View({
          style: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-evenly",
            width: 100,
            height: 32.1,
          },
          children: [
            Image({
              source: ImageSource.fromTextureAsset(
                this.props.cashIconImageAsset as TextureAsset
              ),
              style: {
                width: 35.2,
                height: 30.6,
              },
            }),
            Text({
              text: this.orderAmountReceivedBinding,
              style: {
                fontFamily: "Bangers",
                fontSize: 32,
                color: "#286B2F",
                alignContent: "center",
                textAlign: "center",
                justifyContent: "center",
                padding: 5,
                textAlignVertical: "center",
              },
            }),
          ],
        }),
      ],
    });
  }

  cashAmount() {
    return View({
      style: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      },
      children: [
        Text({
          text: "cash earned",
          style: {
            fontFamily: "Bangers",
            fontSize: 32,
            color: "#286B2F",
          },
        }),

        View({
          style: {
            flexDirection: "row",
            alignItems: "center",
            width: 100,
            height: 32.1,
            justifyContent: "space-evenly",
          },
          children: [
            Image({
              source: ImageSource.fromTextureAsset(
                this.props.cashIconImageAsset as TextureAsset
              ),
              style: {
                width: 35.2,
                height: 30.6,
              },
            }),
            Text({
              text: this.cashAmountBinding,
              style: {
                fontFamily: "Bangers",
                fontSize: 32,
                color: "#286B2F",
                alignContent: "center",
                textAlign: "center",
                justifyContent: "center",
                padding: 5,
                textAlignVertical: "center",
              },
            }),
          ],
        }),
      ],
    });
  }

  expEarned() {
    return View({
      style: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      },
      children: [
        Text({
          text: "xp earned",
          style: {
            fontFamily: "Bangers",
            fontSize: 32,
            color: "#286B2F",
          },
        }),

        View({
          style: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            width: 80,
            height: 32.1,
            marginRight: 5,
          },
          children: [
            Text({
              text: this.expBinding,
              style: {
                fontFamily: "Bangers",
                fontSize: 32,
                color: "#286B2F",
              },
            }),
          ],
        }),
      ],
    });
  }

  public setCashAmount(orderAmountReceived: number, amount: number) {
    this.cashAmountBinding.set(`${amount}`);
    this.orderAmountReceivedBinding.set(`${orderAmountReceived}`);
    this.expBinding.set(`+ ${orderAmountReceived}`);
  }
}
UIComponent.register(UI_CashEarned);
export default UI_CashEarned;
