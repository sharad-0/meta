import { TextureAsset } from "horizon/2p";
import { Asset, Player, PlayerDeviceType, PropTypes } from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Pressable,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { SnowballThrowEvent } from "Manager_Events";
export default class UIButton_Snowfight extends UIComponent<
  typeof UIButton_Snowfight
> {
  btnScaleBinding: Binding<number> = new Binding(1);
  public deviceType: PlayerDeviceType = PlayerDeviceType.Mobile;
  imageSourceBinding: Binding<ImageSource> = new Binding(
    ImageSource.fromTextureAsset(
      new Asset(BigInt("841698794885169")) as TextureAsset
    )
  );

  static propsDefinition = {};
  player: Player | null = null;
  isButtonPressable: boolean = true;
  private stateVsAssets: {
    [key: string]: { desktop: TextureAsset; mobile: TextureAsset };
  } = {
    active: {
      desktop: new Asset(BigInt("1337132621237807")) as TextureAsset,
      mobile: new Asset(BigInt("2694509680895524")) as TextureAsset,
    },
  };
  initializeUI(): UINode {
    return View({
      children: Pressable({
        onPress: (player) => {
          this.onButtonPress(player);
        },
        style: {
          height: "100%",
          width: "100%",
          alignContent: "center",
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: this.btnScaleBinding }],
        },
        children: Image({
          source: this.imageSourceBinding,
          style: {
            height: 120,
            width: "auto",
            aspectRatio: 1,
            alignContent: "center",
            alignItems: "center",
            justifyContent: "center",
            // backgroundColor: "rgba(18, 15, 199, 0.85)",
          },
        }),
      }),
      style: {
        // backgroundColor: "rgba(116, 10, 10, 0.77)",
        height: "15%",
        width: "auto",
        aspectRatio: 1,
        position: "absolute",
        left: "80%",
        zIndex: 10001,
        top: "65%",
      },
    });
  }

  onButtonPress(player: Player) {
    if (this.isButtonPressable) {
      // console.log.*$
      this.btnScaleBinding.set(0.9);
      this.entity.visible.set(false);
      this.isButtonPressable = false;
      this.executeThrow();
      // this.async.setTimeout(() => {
      //   this.btnScaleBinding.set(1);
      // }, 100);
    }
  }

  resetUi(){
    this.entity.visible.set(true);
    this.isButtonPressable = true;
    this.btnScaleBinding.set(1);
  }

  start() {}

  public setPlayerAndDevice(player: Player) {
    if (player) {
      this.player = player;
      this.deviceType = player.deviceType.get();
    }
    this.setDefaultDisabledState();
    // console.log.*$
    //   `SnowfightButtonUi started ${this.deviceType} , ${player?.name.get()}`
    // );
  }

  public setDefaultDisabledState() {
    if (this.deviceType === PlayerDeviceType.Desktop) {
      this.imageSourceBinding.set(
        ImageSource.fromTextureAsset(this.stateVsAssets.active.desktop)
      );
    } else {
      this.imageSourceBinding.set(
        ImageSource.fromTextureAsset(this.stateVsAssets.active.mobile)
      );
    }
  }

  executeThrow() {
    // this.sendNetworkBroadcastEvent(ToggleFetcherVacuum, {
    //   fetcherPlayer: this.player,
    // });
    if (this.player) {
      // console.log.*$
      //   `Sending SnowballThrowEvent for player: ${this.player.name.get()}`
      // );
      this.sendNetworkEvent(this.player, SnowballThrowEvent, {
        player: this.player,
      });
    }
    // this.player?.throwHeldItem();
    // // console.log.*$
  }
}
UIComponent.register(UIButton_Snowfight);
