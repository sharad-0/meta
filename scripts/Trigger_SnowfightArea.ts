import { CameraMode } from "horizon/camera";
import {
  CodeBlockEvents,
  Component,
  Entity,
  Player,
  PropTypes,
} from "horizon/core";
import {
  PlayerDroppedSnowball,
  PlayerEnteredSnowfightArea,
  PlayerExitedSnowfightArea,
  PlayerGrabbedSnowball,
} from "Manager_Events";
import { hudManager } from "Managers_Instance";
import { PlayerCameraEvents } from "PlayerCamera";
import { AreaEnterPayload } from "horizon/analytics";
import { AnalyticsManager } from "AnalyticsManager";

class Trigger_SnowfightArea extends Component<typeof Trigger_SnowfightArea> {
  static propsDefinition = {
    snowball: { type: PropTypes.Asset },
  };

  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      (player) => {
        this.OnPlayerEnterTrigger(player);
      }
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitTrigger,
      (player) => {
        this.OnPlayerExitTrigger(player);
      }
    );

    this.connectNetworkBroadcastEvent(PlayerGrabbedSnowball, ({ player }) => {
      hudManager?.showSnowfightButtonUiToPlayer(player);
    });

    this.connectNetworkBroadcastEvent(PlayerDroppedSnowball, ({ player }) => {
      hudManager?.hideSnowfightButtonUiFromPlayer(player);
    });
  }

  start() { }

  async OnPlayerEnterTrigger(player: Player) {
    // // console.log.*$
    // hudManager?.showSnowfightButtonUiToPlayer(player);
    // this.sendNetworkBroadcastEvent(PlayerEnteredSnowfightArea, {
    //   player: player,
    // });
    this.sendNetworkBroadcastEvent(PlayerEnteredSnowfightArea, {
      player: player,
    });

    this.sendNetworkEvent(player, PlayerCameraEvents.SetCameraMode, {
      mode: CameraMode.ThirdPerson,
    });
    // player.clearAvatarGripPoseOverride();

    const payload: AreaEnterPayload = {
      actionArea: "SnowfightArea",
      player: player,
      actionAreaIsLobbySection: false,
      actionAreaIsPlayerReadyZone: false,
    };
    AnalyticsManager.s_instance.sendAreaEnter(payload);
  }

  OnPlayerExitTrigger(player: Player) {
    // console.log.*$
    hudManager?.hideSnowfightButtonUiFromPlayer(player);
    player.stopAvatarAnimation();
    this.sendNetworkBroadcastEvent(PlayerExitedSnowfightArea, {
      player: player,
    });

    // this.sendNetworkEvent(player, PlayerCameraEvents.SetCameraMode, {
    //   mode: CameraMode.Follow,
    // });
  }
}
Component.register(Trigger_SnowfightArea);
