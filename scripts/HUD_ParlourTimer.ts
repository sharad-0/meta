import { PropTypes, TextureAsset } from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { SecondPassedEvent } from "Manager_Events";
import { gameManager, mainArenaManager } from "Managers_Instance";

class HUD_ParlourTimer extends UIComponent<typeof HUD_ParlourTimer> {
  protected panelHeight: number = 300;
  protected panelWidth: number = 500;

  static propsDefinition = {
    bgAsset: { type: PropTypes.Asset },
    rushHourBGAsset: { type: PropTypes.Asset },
  };

  private isRushHour = new Binding<Boolean>(true);
  private timeBinding = new Binding<string>("00:00");

  initializeUI(): UINode {
    return View({
      children: [this.mainComponent()],
      style: {
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        width: "10%",
        height: "13%",
        top: "5%",
        zIndex: 100,
        left: "40%"

        // backgroundColor: "rgba(0, 0, 0, 0.81)",
      },
    });
  }

  mainComponent() {
    const timerIcon = Image({
      source: ImageSource.fromTextureAsset(
        new TextureAsset(BigInt("663615243452499"))
      ),
      style: {
        width: "auto",
        height: "100%",
        aspectRatio: 305 / 165,
        position: "absolute",
      },
    });
    const timerNode = View({
      children: Text({
        text: this.timeBinding,
        style: {
          fontSize: 30,
          color: "#735305",
          fontFamily: "Roboto",
          textAlign: "center",
          textAlignVertical: "center",
          fontWeight: "bold",
          // backgroundColor: "rgba(65, 196, 26, 0.81)"
        },
      }),
      style: {
        top: "15%",
        // left: "19%",
        width: "60%",
        height: "40%",
        // backgroundColor: "#ac1414b7",
      },
    });
    const rushHourBG = Image({
      source: ImageSource.fromTextureAsset(
        new TextureAsset(BigInt("1511454980009170"))
      ),
      style: {
        width: "auto",
        height: "50%",
        aspectRatio: 168 / 57,
        position: "absolute",
        top: "98%",
        // left: "25%",
        backgroundColor: "#000000b2",
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
      },
    });
    return View({
      style: {
        position: "absolute",
        width: "auto",
        height: "100%",
        left: "34%",
        aspectRatio: 199 / 86,
        justifyContent: "center",
        alignItems: "center",
      },
      children: [timerIcon, timerNode, UINode.if(this.isRushHour, rushHourBG)],
    });
  }

  start(): void {
    this.connectLocalBroadcastEvent(SecondPassedEvent, () => this.updateUI());
  }

  updateUI() {
    const closeTime = mainArenaManager?.getTimeToCloseParlour() ?? 0;
    if (closeTime <= 0) {
      this.entity.visible.set(false);
      return;
    } else {
      this.entity.visible.set(true);
    }
    const minutes = Math.floor(closeTime / 60);
    const seconds = closeTime % 60;
    this.timeBinding.set(
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    );

    if (mainArenaManager?.isHappyHour()) {
      this.isRushHour.set(true);
    } else {
      this.isRushHour.set(false);
    }
  }
}
UIComponent.register(HUD_ParlourTimer);
