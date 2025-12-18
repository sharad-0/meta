import { CodeBlockEvents, Component, Entity, Player } from "horizon/core";
import { PlayerEnteredSnowmanArea, PlayerExitedSnowmanArea } from "Manager_Events";
import { hudManager, playerManager } from "Managers_Instance";
import { AreaEnterPayload } from "horizon/analytics";
import { AnalyticsManager } from "AnalyticsManager";

class Trigger_SnowmanArea extends Component<typeof Trigger_SnowmanArea> {
  static propsDefinition = {};

  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.OnPlayerEnterTrigger.bind(this)
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitTrigger,
      this.OnPlayerExitTrigger.bind(this)
    );
  }

  start() { }

  OnPlayerEnterTrigger(player: Player) {
    if (playerManager?.isSnowmanCompleted(player)) {
      hudManager?.showDanceEmoteButtonUiToPlayer(player);
      this.sendNetworkEvent(player, PlayerEnteredSnowmanArea, {
        player: player,
      });
    }

    const payload: AreaEnterPayload = {
      actionArea: "SnowmanArea",
      player: player,
      actionAreaIsLobbySection: false,
      actionAreaIsPlayerReadyZone: false,
    };
    AnalyticsManager.s_instance.sendAreaEnter(payload);
  }

  OnPlayerExitTrigger(player: Player) {
    hudManager?.hideDanceEmoteButtonUiFromPlayer(player);
    this.sendNetworkEvent(player, PlayerExitedSnowmanArea, {
      player: player,
    });
  }
}
Component.register(Trigger_SnowmanArea);
