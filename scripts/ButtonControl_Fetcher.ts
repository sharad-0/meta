import { TextureAsset } from "horizon/2p";
import { Asset, Player, PlayerDeviceType, PlayerVisibilityMode, PropTypes } from "horizon/core";
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
import { vacuumController } from "Managers_Instance";

export default class ButtonControl_Fetcher extends UIComponent<
  typeof ButtonControl_Fetcher
> {
  btnScaleBinding: Binding<number> = new Binding(1);
  public deviceType: PlayerDeviceType = PlayerDeviceType.Mobile;
  imageSourceBinding: Binding<ImageSource> = new Binding(
    ImageSource.fromTextureAsset(
      new Asset(BigInt("666446276510964")) as TextureAsset
    )
  );

  static propsDefinition = {};
  player: Player | null = null;
  private isButtonPressable: boolean = false;
  private stateVsAssets: {
    [key: string]: { desktop: TextureAsset; mobile: TextureAsset };
  } = {
      disabled: {
        desktop: new Asset(BigInt("1997489391063863")) as TextureAsset,
        mobile: new Asset(BigInt("666446276510964")) as TextureAsset,
      },
      active: {
        desktop: new Asset(BigInt("24588410624163801")) as TextureAsset,
        mobile: new Asset(BigInt("1184097653646624")) as TextureAsset,
      },
      inactive: {
        desktop: new Asset(BigInt("1120048473567259")) as TextureAsset,
        mobile: new Asset(BigInt("3820133981464679")) as TextureAsset,
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
    if (this.isButtonPressable === false) return;
    // console.log.*$
    const state = vacuumController?.getVacuumState(player) || false;
    const isActive = !state;
    this.updateBinding(isActive);
    this.btnScaleBinding.set(0.9);
    vacuumController?.uiButtonPressed(player);
    this.async.setTimeout(() => {
      this.btnScaleBinding.set(1);
    }, 100);
  }

  start() { }

  public setPlayerAndDevice(player: Player) {
    if (player) {
      this.player = player;
      this.deviceType = player.deviceType.get();
    }
    // console.log.*$
    //   `FetcherButtonUI started ${this.deviceType} , ${player?.name.get()}`
    // );
  }

  public setDefaultDisabledState() {
    if (this.deviceType === PlayerDeviceType.Desktop) {
      this.imageSourceBinding.set(
        ImageSource.fromTextureAsset(this.stateVsAssets.disabled.desktop)
      );
    } else if (this.deviceType === PlayerDeviceType.Mobile) {
      this.imageSourceBinding.set(
        ImageSource.fromTextureAsset(this.stateVsAssets.disabled.mobile)
      );
    }

    this.isButtonPressable = false;
  }

  public setActiveState() {
    this.isButtonPressable = true;
    this.updateBinding(true);
  }

  public setInactiveState() {
    this.isButtonPressable = true;
    this.updateBinding(false);
  }

  updateBinding(isActive: boolean) {
    // console.log.*$
    if (this.deviceType === PlayerDeviceType.Desktop) {
      if (isActive) {
        this.imageSourceBinding.set(
          ImageSource.fromTextureAsset(this.stateVsAssets.active.desktop)
        );
      } else {
        this.imageSourceBinding.set(
          ImageSource.fromTextureAsset(this.stateVsAssets.inactive.desktop)
        );
      }
    } else {
      if (isActive) {
        this.imageSourceBinding.set(
          ImageSource.fromTextureAsset(this.stateVsAssets.active.mobile)
        );
      } else {
        this.imageSourceBinding.set(
          ImageSource.fromTextureAsset(this.stateVsAssets.inactive.mobile)
        );
      }
    }
  }
}
UIComponent.register(ButtonControl_Fetcher);
