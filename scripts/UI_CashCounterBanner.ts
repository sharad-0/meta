import { PropTypes, TextureAsset } from "horizon/core";
import {
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";

class UI_CashCounterBanner extends UIComponent<typeof UI_CashCounterBanner> {
  private height: string = "55%";
  private width: string = "100%";

  static propsDefinition = {
    counterBanner: { type: PropTypes.Asset },
  };

  initializeUI(): UINode {
    return View({
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            this.props.counterBanner! as TextureAsset
          ),
          style: {
            width: "90%",
            height: "90%",
            alignContent: "center",
            alignItems: "center",
            justifyContent: "center",
            top: "5%",
            left: "5%",
            // resizeMode: "contain",
            borderRadius: 10,
          },
        }),
      ],
      style: {
        // backgroundColor: "black",
        height: this.height,
        width: this.width,
        borderRadius: 10,
      },
    });
  }
}
UIComponent.register(UI_CashCounterBanner);
