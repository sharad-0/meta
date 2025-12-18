import { Asset, TextureAsset } from "horizon/core";
import {
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";

class UI_EnterTutorial extends UIComponent<typeof UI_EnterTutorial> {
  static propsDefinition = {};

  initializeUI(): UINode {
    return View({
      style: {
        width: "100%",
        height: "56%",
        alignItems: "center",
        top: "22%",
        borderRadius: 10,
        // backgroundColor: "#000000",
        flexDirection: "row",
        justifyContent: "center",
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("598909496619380")) as TextureAsset
          ),
          style: {
            width: "50%",
            height: "80%",
            resizeMode: "contain",
          },
        }),
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("753823297513186")) as TextureAsset
          ),
          style: {
            width: "17%",
            height: "63%",
            marginLeft: 10,
          },
        }),
      ],
    });
  }
}
UIComponent.register(UI_EnterTutorial);
