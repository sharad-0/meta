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

class UI_InfoBoards extends UIComponent<typeof UI_InfoBoards> {
  static propsDefinition = {
    boardType: { type: "string", default: "scooper" }, // 'scooper', 'fetcher', 'server'
  };

  private scooperInfoBoardAssetId: string = "3324149681068811";
  private fetcherInfoBoardAssetId: string = "830602149534262";
  private serverInfoBoardAssetId: string = "1839755893416207";

  initializeUI(): UINode {
    return View({
      children: [
        Image({
          source: this.getInfoBoardAssetId(),
          style: {
            height: "auto",
            width: "100%",
            aspectRatio: 465 / 300,
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
UIComponent.register(UI_InfoBoards);
