import { TextureAsset } from "horizon/2p";
import { Asset } from "horizon/core";
import {
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";

class UI_RoleSwitchInfo extends UIComponent<typeof UI_RoleSwitchInfo> {
  static propsDefinition = {
    boardType: { type: "string", default: "scooper" }, // 'scooper', 'fetcher', 'server'
  };

  private scooperInfoBoardAssetId: string = "1808471829753979";
  private fetcherInfoBoardAssetId: string = "24719992534331687";
  private serverInfoBoardAssetId: string = "1607669546876163";

  initializeUI(): UINode {
    return View({
      children: [
        Image({
          source: this.getInfoBoardAssetId(),
          style: {
            height: "100%",
            width: "auto",
            aspectRatio: 170 / 250,
          },
        }),
      ],
      style: {
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        alignContent: "center",
      },
    });
  }

  private getInfoBoardAssetId(): ImageSource {
    switch (this.props.boardType) {
      case "scooper":
        return ImageSource.fromTextureAsset(
          new Asset(BigInt(this.scooperInfoBoardAssetId)) as TextureAsset
        );
      case "fetcher":
        return ImageSource.fromTextureAsset(
          new Asset(BigInt(this.fetcherInfoBoardAssetId)) as TextureAsset
        );
      case "server":
        return ImageSource.fromTextureAsset(
          new Asset(BigInt(this.serverInfoBoardAssetId)) as TextureAsset
        );
      default:
        return ImageSource.fromTextureAsset(
          new Asset(BigInt(this.scooperInfoBoardAssetId)) as TextureAsset
        );
    }
  }
}
UIComponent.register(UI_RoleSwitchInfo);
