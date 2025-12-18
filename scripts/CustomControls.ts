import { ButtonIcon } from "horizon/2p";
import {
  Component,
  PlayerControls,
  CodeBlockEvents,
  PlayerInputAction,
  PlayerDeviceType,
  PlayerInput,
  Player,
  Handedness,
  Asset,
  AudioGizmo,
  World,
  PropTypes,
} from "horizon/core";
import {
  ActivateFetcherControls,
  ToggleFetcherVacuum,
  DeactivateFetcherControls,
  PlayerEnteredSnowfightArea,
  PlayerExitedSnowfightArea,
  PlayerEnteredSnowmanArea,
  PlayerExitedSnowmanArea,
  SnowballThrowEvent,
  RushHourBegins,
  RushHourEnds,
  RoleSwitched,
} from "Manager_Events";

export default class CustomControls extends Component<typeof CustomControls> {
  static propsDefinition = {
    dance1: { type: PropTypes.Asset },
    dance2: { type: PropTypes.Asset },
    dance3: { type: PropTypes.Asset },
  };
  private MOUSECLICK: PlayerInput | null = null;
  private snowfightButton: PlayerInput | null = null;
  private danceButton: PlayerInput | null = null;
  private player: Player | null = null;
  private isVacuumActive: boolean = false;
  private playerDanceAnimationAssets: Asset[] = [];
  private snowballThrowCooldown: boolean = false;
  private danceCooldown: boolean = false;
  factor: number = 1.5;
  private isRushHourRunning: boolean = false;
  private playerOrignalSpeed: number = 4.5;
  start() {
    if (this.entity.owner.get().id != this.world.getServerPlayer().id) {
      // 1. Disable all system UI (jump, joystick, etc.)
      const player = this.entity.owner.get();
      this.player = player;
      this.playerOrignalSpeed = player.locomotionSpeed.get();
      this.player.jumpSpeed.set(0);
      // if (player.deviceType.get() === PlayerDeviceType.Mobile) {
      PlayerControls.disableSystemControls(true);
      // }
      this.playerDanceAnimationAssets = [
        this.props.dance1!,
        this.props.dance2!,
        this.props.dance3!,
      ];
      this.connectNetworkEvent(
        this.player,
        ActivateFetcherControls,
        ({ fetcherPlayer }) => {
          if (fetcherPlayer && fetcherPlayer.id === this.player!.id) {
            this.enableFetcherControls();
          }
        }
      );

      this.connectNetworkEvent(
        this.player,
        DeactivateFetcherControls,
        ({ fetcherPlayer }) => {
          if (fetcherPlayer && fetcherPlayer.id === this.player!.id) {
            this.disableFetcherControls();
          }
        }
      );

      this.connectNetworkEvent(
        this.player,
        PlayerEnteredSnowfightArea,
        ({ player }) => {
          if (player && player.id !== this.player!.id) return;
          this.enableSnowfightControls();
          // PlayerControls.disableSystemControls(false);
        }
      );

      this.connectNetworkEvent(
        this.player,
        PlayerExitedSnowfightArea,
        ({ player }) => {
          if (player && player.id !== this.player!.id) return;
          this.disableSnowfightControls();
        }
      );
      this.connectNetworkEvent(
        this.player,
        PlayerEnteredSnowmanArea,
        ({ player }) => {
          if (player && player.id !== this.player!.id) return;
          this.enableSnowmanControls();
          // PlayerControls.disableSystemControls(false);
        }
      );

      this.connectNetworkEvent(
        this.player,
        PlayerExitedSnowmanArea,
        ({ player }) => {
          if (player && player.id !== this.player!.id) return;
          this.disableSnowmanControls();
        }
      );

      this.connectNetworkBroadcastEvent(RoleSwitched, ({ player }) => {
        // console.log.*$
        if (this.isRushHourRunning) {
          this.increasePlayerSpeed();
        } else {
          player.locomotionSpeed.set(this.playerOrignalSpeed);
        }
      });

      this.connectNetworkBroadcastEvent(RushHourBegins, () => {
        this.isRushHourRunning = true;
        this.increasePlayerSpeed();
      });

      this.connectNetworkBroadcastEvent(RushHourEnds, () => {
        this.isRushHourRunning = false;
        this.resetPlayerSpeed();
      });

      this.entity.owner.get().jumpSpeed.set(0);
    }
  }

  enableFetcherControls() {
    const deviceType = this.player?.deviceType.get();
    if (deviceType === PlayerDeviceType.VR) {
      this.MOUSECLICK = PlayerControls.connectLocalInput(
        PlayerInputAction.RightTrigger,
        ButtonIcon.Fire,
        this
      );
    } else {
      this.MOUSECLICK = PlayerControls.connectLocalInput(
        PlayerInputAction.RightGrip,
        ButtonIcon.Fire,
        this
      );
    }

    this.MOUSECLICK.registerCallback((_, pressed) => {
      if (pressed) {
        this.executeButtonPress();
      }
    });
  }

  executeButtonPress() {
    this.sendNetworkBroadcastEvent(ToggleFetcherVacuum, {
      fetcherPlayer: this.player,
    });
    // console.log.*$
  }

  disableFetcherControls() {
    this.isVacuumActive = false;
    this.MOUSECLICK!.disconnect();
  }

  enableSnowfightControls() {
    this.snowfightButton = PlayerControls.connectLocalInput(
      PlayerInputAction.RightPrimary,
      ButtonIcon.Fire,
      this
    );
    this.snowfightButton.registerCallback((_, pressed) => {
      if (pressed) {
        this.executeThrow();
      }
    });
  }
  enableSnowmanControls() {
    this.danceButton = PlayerControls.connectLocalInput(
      PlayerInputAction.RightTertiary,
      ButtonIcon.Fire,
      this
    );
    this.danceButton.registerCallback((_, pressed) => {
      if (pressed) {
        this.executeDance();
      }
    });
  }
  executeThrow() {
    // this.sendNetworkEvent(this.player!, SnowballThrowEvent, {
    //   player: this.player!,
    // });
    // console.log.*$
  }
  executeDance() {
    if (this.danceCooldown) return;
    this.danceCooldown = true;
    const timer = this.async.setTimeout(() => {
      this.danceCooldown = false;
      this.async.clearTimeout(timer);
    }, 3000); // 5 seconds cooldown
    const randomIndex = Math.floor(
      Math.random() * this.playerDanceAnimationAssets.length
    );
    const danceAnim = this.playerDanceAnimationAssets[randomIndex];
    this.player?.playAvatarAnimation(danceAnim);
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
        }
      }
    });
  }
  disableSnowfightControls() {
    if (this.snowfightButton) this.snowfightButton.disconnect();
  }
  disableSnowmanControls() {
    if (this.danceButton) this.danceButton.disconnect();
  }
  increasePlayerSpeed() {
    const player = this.entity.owner.get();
    player.locomotionSpeed.set(this.playerOrignalSpeed * this.factor);
    // console.log.*$
    //   `[Custom Controls] Player Speed increased to ${this.playerOrignalSpeed * this.factor
    //   }`
    // );
  }

  resetPlayerSpeed() {
    const player = this.entity.owner.get();
    player.locomotionSpeed.set(this.playerOrignalSpeed);
  }
}
// Register the component with Horizon
Component.register(CustomControls);
