import * as hz from "horizon/core";
import { Image, ImageSource, UIComponent, UINode, View } from "horizon/ui";

class UI_WelcomeToParlour extends UIComponent<typeof UI_WelcomeToParlour> {
  static propsDefinition = {
    isBoard: { type: "boolean", default: false },
  };

  start() {}

  initializeUI(): UINode {
    const assetId = this.props.isBoard ? "837522472281100" : "1988115565356636";
    return View({
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new hz.Asset(BigInt(assetId)) as hz.TextureAsset
          ),
          style: {
            height: "auto",
            width: "100%",
            aspectRatio: 1920 / 886,
          },
        }),
      ],
      style: {
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        alignContent: "center",
        // backgroundColor: "#000000ff",
        zIndex: 1000000,
      },
    });
  }
}
UIComponent.register(UI_WelcomeToParlour);
