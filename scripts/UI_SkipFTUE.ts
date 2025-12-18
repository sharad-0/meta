import { CodeBlockEvents, Player, PropTypes, TextureAsset } from "horizon/core";
import {
  UIComponent,
  UINode,
  View,
  Text,
  Pressable,
  Image,
  ImageSource,
  Binding,
} from "horizon/ui";
import { playerManager, trainingManager } from "Managers_Instance";

class UI_SkipFTUE extends UIComponent<typeof UI_SkipFTUE> {
  static propsDefinition = {
    background: { type: PropTypes.Asset },
    iconAsset: { type: PropTypes.Asset },
    textImage: { type: PropTypes.Asset },
  };
  private buttonColorBinding: Binding<string> = new Binding<string>("#42c249ff");
  initializeUI(): UINode {
    return View({
      style: {
        width: "100%",
        height: "56%",
        alignItems: "center",
        justifyContent: "center",
        top: "22%",
        borderRadius: 10,
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            this.props.background! as TextureAsset
          ),
          style: {
            height: "100%",
            width: "100%",
            position: "absolute",
            borderRadius: 10,
          },
        }),
        Pressable({
          onClick: (player: Player) => {
            // console.log.*$
            this.onPlayerEnter(player);
          },
          onEnter:() => {
            this.buttonColorBinding.set("#023a05"); // Darker green on hover
          },
          onExit: () => {
            this.buttonColorBinding.set("#53F55C"); // Reset to original color
          },
          style: {
            backgroundColor: this.buttonColorBinding, // Light background
            borderColor: "#53F55C", // Black border
            borderWidth: 4,
            borderRadius: 10,
            width: "54%",
            height: "25%",
            // paddingVertical: 10,
            // paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
            top: "28%",
            flexDirection: "row",
            // justifyContent: "center",
          },
          children: [
            Image({
              source: ImageSource.fromTextureAsset(
                this.props.textImage! as TextureAsset
              ),
              style: {
                width: "50%",
                height: "80%",
                resizeMode: "contain",
              },
            }),
            Image({
              source: ImageSource.fromTextureAsset(
                this.props.iconAsset! as TextureAsset
              ),
              style: {
                width: "17%",
                height: "63%",
                marginLeft: 10,
              },
            }),
          ],
        }),
      ],
    });
  }

  start() {}

  onPlayerEnter(player: Player) {
    trainingManager?.endFTUE(player);
  }
}
UIComponent.register(UI_SkipFTUE);
