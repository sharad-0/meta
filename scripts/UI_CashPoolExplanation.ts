import * as hz from 'horizon/core';
import { Image, ImageSource, UIComponent, UINode, View } from 'horizon/ui';

const assetId = "1471988874016592";

class UI_CashPoolExplanation extends UIComponent<typeof UI_CashPoolExplanation> {
  static propsDefinition = {};

  start() {}
  
  initializeUI(): UINode {
    return View({
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new hz.Asset(BigInt(assetId)) as hz.TextureAsset
          ),
          style: {
            height: "auto",
            width: "100%",
            aspectRatio: 3602.4 / 2335.2,
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
UIComponent.register(UI_CashPoolExplanation);