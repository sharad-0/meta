import {
  Asset,
  CodeBlockEvents,
  Player,
  PropTypes,
  TextureAsset,
} from "horizon/core";
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
import { hudManager, playerManager } from "Managers_Instance";
import Trigger_EnterTutorialWorld from "Trigger_EnterTutorialWorld";

class UI_ReplayFTUE extends UIComponent<typeof UI_ReplayFTUE> {
  static propsDefinition = {};

  initializeUI(): UINode {
    return View({
      style: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        backgroundColor: "rgba(0, 0, 0, 0.76)",
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("1132464484930435")) as TextureAsset
          ),
          style: {
            height: "70%",
            width: "auto",
            position: "absolute",
            aspectRatio: 1199 / 991,
          },
        }),

        View({
          children: [this.yesButton(), this.noButton()],
          style: {
            position: "absolute",
            bottom: "19%",
            width: "100%",
            height: "14%",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
          },
        }),
      ],
    });
  }

  yesButton() {
    return Pressable({
      onPress: (player: Player) => {
        // console.log.*$
        playerManager?.replayFTUE(player);
      },
      style: {
        // backgroundColor: "#1010e5d4", // Light background
        width: "auto",
        aspectRatio: 470 / 188,
        height: "100%",
        left: "29%",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
      },
    });
  }

  noButton() {
    return Pressable({
      onPress: (player: Player) => {
        // console.log.*$
        hudManager?.hideReplayFtueUiFromPlayer(player);
      },
      style: {
        // backgroundColor: "#10e510d4", // Light background
        width: "auto",
        aspectRatio: 470 / 188,
        height: "100%",
        left: "51%",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
      },
    });
  }

  start() {}
}
UIComponent.register(UI_ReplayFTUE);
