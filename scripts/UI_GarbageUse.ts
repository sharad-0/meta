import * as hz from "horizon/core";
import * as ui from "horizon/ui";

class GarbageUseUI extends ui.UIComponent<typeof GarbageUseUI> {
  static propsDefinition = {
    image: { type: hz.PropTypes.Asset },
  };

  initializeUI(): ui.UINode {
    return ui.Image({
      source: ui.ImageSource.fromTextureAsset(
        this.props.image as hz.TextureAsset
      ),
      style: {
        backgroundColor: hz.Color.white,
        borderRadius: 10,
        height: "55%",
        width: "100%",
      },
    });
  }
}
hz.Component.register(GarbageUseUI);
