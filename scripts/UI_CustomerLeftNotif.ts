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

class UI_CustomerLeftNotif extends UIComponent<typeof UI_CustomerLeftNotif> {
  protected panelHeight: number = 300;
  protected panelWidth: number = 500;
  private tableNumberBinding = new Binding<string>("Table Number: ");
  private orderNumberBinding = new Binding<string>("Customer has left!");
  static propsDefinition = {
    clockIconImageAsset: { type: PropTypes.Asset },
  };

  initializeUI(): UINode {
    return View({
      children: [
        this.headingClockIcon(),
        this.greetingText(),
        this.cashAmount(),
      ],
      style: {
        backgroundColor: "rgba(0, 0, 0, 0.81)",
        borderRadius: 12,
        top: "25%",
        width: "75%",
        height: "15%",
        left: "12.5%",
        right: "12.5%",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "space-evenly",
        flexDirection: "column",
      },
    });
  }

  private greetingText() {
    return Text({
      text: "Time's up!",
      style: {
        fontSize: 22,
        fontFamily: "Roboto",
        fontWeight: "bold",
        color: "white",
        top: -45,
      },
    });
  }

  private headingClockIcon() {
    return Image({
      source: ImageSource.fromTextureAsset(
        this.props.clockIconImageAsset! as TextureAsset
      ),
      style: {
        width: 75,
        height: 75,
        top: -40,
      },
    });
  }
  private cashAmount() {
    return View({
      children: [
        Text({
          text: this.orderNumberBinding,
          style: {
            fontSize: 28,
            color: "rgba(255,90,90,1)",
            textAlign: "center",
            fontFamily: "Roboto",
            fontWeight: "bold",
          },
        }),
      ],
      style: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-evenly",
        top: -50,
        left: -2,
      },
    });
  }

  public setTableNumber(tableNumber: string, orderNumber: number) {
    if (orderNumber <= 0) {
      this.orderNumberBinding.set("Customer has left!");
      return;
    }
    this.tableNumberBinding.set(`Table Number: ${tableNumber}`);
    this.orderNumberBinding.set(`Order #${orderNumber} cancelled, Customer has left!`);
  }
}
UIComponent.register(UI_CustomerLeftNotif);
export default UI_CustomerLeftNotif;
