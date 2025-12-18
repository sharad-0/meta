import { UIComponent, UINode, View, Image, ImageSource, Text, } from "horizon/ui";
import { PlayerVisibilityMode, PropTypes, TextureAsset } from "horizon/core";


class HUD_Fetcher_Notification extends UIComponent<typeof HUD_Fetcher_Notification> {
  static propsDefinition = {
    positiveBGImage: { type: PropTypes.Asset }, 
    negativeBGImage: { type: PropTypes.Asset },
  };

  initializeUI(): UINode {
    return View({
      style: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      },
      children: [
        View({
        style: {
          width: 750,          
          height: 50,         
          position: "relative",
        },
        children: [
          Image({
            source: ImageSource.fromTextureAsset(this.props.positiveBGImage!.as(TextureAsset)),
            style: {
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(67, 14, 14, 0.5)",
              // gradientColorA: "rgba(67, 14, 14, 1)",
              // gradientColorB: "rgba(67, 14, 14, 0.5)",
              position: "absolute",
            },
          }),

          // 📝 Overlay text
          Text({
            text: "Bag is Full!",
            style: {
              fontFamily: "Anton",
              fontSize: 24,
              color: "#FFDADA",
              fontWeight: "bold",
              textAlign: "center",
              width: "100%",
              height: "100%",
              textAlignVertical: "center",
            },
          }),
        ],
      }),
      ]
    });
  }

  start() {
    this.entity.setVisibilityForPlayers(
      this.world.getPlayers(),
      PlayerVisibilityMode.VisibleTo
    );
  }
}
UIComponent.register(HUD_Fetcher_Notification);