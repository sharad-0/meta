import {
  Asset,
  AudioGizmo,
  CodeBlockEvent,
  Player,
  PlayerDeviceType,
  PropTypes,
  TextureAsset,
  World,
} from "horizon/core";
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
import { playerAnimations } from "Managers_Instance";

export default class UIButton_DanceEmote extends UIComponent<
  typeof UIButton_DanceEmote
> {
  private playerDanceAnimationAssets: Asset[] = [];
  btnScaleBinding: Binding<number> = new Binding(1);
  public deviceType: PlayerDeviceType = PlayerDeviceType.Mobile;
  imageSourceBinding: Binding<ImageSource> = new Binding(
    ImageSource.fromTextureAsset(
      new Asset(BigInt("802371749281189")) as TextureAsset
    )
  );
  static propsDefinition = {
    dance1Asset: { type: PropTypes.Asset },
    dance2Asset: { type: PropTypes.Asset },
    dance3Asset: { type: PropTypes.Asset },
  };
  player: Player | null = null;
  private stateVsAssets: {
    [key: string]: { desktop: TextureAsset; mobile: TextureAsset };
  } = {
      active: {
        desktop: new Asset(BigInt("864821242870147")) as TextureAsset,
        mobile: new Asset(BigInt("802371749281189")) as TextureAsset,
      },
      inactive: {
        desktop: new Asset(BigInt("1505790237341105")) as TextureAsset,
        mobile: new Asset(BigInt("1385514729846687")) as TextureAsset,
      }
    };
  private isButtonPressable: boolean = true;
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
      this.isButtonPressable = false;
      this.setDefaultDisabledState();
      this.executeDance(player);
      this.async.setTimeout(() => {
        this.btnScaleBinding.set(1);
        this.isButtonPressable = true;
        this.setDefaultDisabledState();
      }, 3000); // 5 seconds cooldown
    }
  }

  start() {
    this.playerDanceAnimationAssets = [
      this.props.dance1Asset!,
      this.props.dance2Asset!,
      this.props.dance3Asset!,
    ];
  }

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
    if (this.isButtonPressable) {
      if (this.deviceType === PlayerDeviceType.Desktop) {
        this.imageSourceBinding.set(
          ImageSource.fromTextureAsset(this.stateVsAssets.active.desktop)
        );
      } else {
        this.imageSourceBinding.set(
          ImageSource.fromTextureAsset(this.stateVsAssets.active.mobile)
        );
      }
    } else {
      if (this.deviceType === PlayerDeviceType.Desktop) {
        this.imageSourceBinding.set(
          ImageSource.fromTextureAsset(this.stateVsAssets.inactive.desktop)
        );
      } else {
        this.imageSourceBinding.set(
          ImageSource.fromTextureAsset(this.stateVsAssets.inactive.mobile)
        );
      }
    }
  }

  executeDance(player: Player) {
    const randomIndex = Math.floor(
      Math.random() * this.playerDanceAnimationAssets.length
    );
    // console.log.*$
    player.playAvatarAnimation(this.playerDanceAnimationAssets[randomIndex]);
    const danceMusic = this.world
      .getEntitiesWithTags(["DanceBg"])[0]
      ?.as(AudioGizmo);
    danceMusic?.play();
    const playerPos = this.player?.position.get();
    const worldUpdate = this.connectLocalBroadcastEvent(World.onUpdate, () => {
      const playerPosNow = this.player?.position.get();
      if (playerPosNow && playerPos) {
        if (playerPosNow.distance(playerPos) > 0.5) {
          // console.log.*$
          this.player?.stopAvatarAnimation();
          danceMusic?.stop();
          worldUpdate.disconnect();
          const timer = this.async.setTimeout(() => {
            this.btnScaleBinding.set(1);
            this.isButtonPressable = true;
            this.async.clearTimeout(timer);
            this.setDefaultDisabledState();
          }, 1000); // 5 seconds cooldown
        }
      }
    });
  }
}
UIComponent.register(UIButton_DanceEmote);
