import { CodeBlockEvents, Component, Entity, Player } from "horizon/core";
import { PlayerEnteredSnowmanArea, PlayerExitedSnowmanArea } from "Manager_Events";
import { hudManager, playerManager } from "Managers_Instance";
import { AreaEnterPayload } from "horizon/analytics";
import { AnalyticsManager } from "AnalyticsManager";
import { Npc } from "horizon/npc";

class Trigger_PlayerMove extends Component<typeof Trigger_PlayerMove> {
  static propsDefinition = {};
  private playersInWorld: Player[] = [];
  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.OnPlayerEnterTrigger.bind(this)
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterWorld,
      (player) => {
        if (Npc.playerIsNpc(player)) return;
        if (!this.playersInWorld.includes(player)) {
          this.playersInWorld.push(player);
        }
      }
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitWorld,
      (player) => {
        if (Npc.playerIsNpc(player)) return;
        const index = this.playersInWorld.indexOf(player);
        if (index !== -1) {
          this.playersInWorld.splice(index, 1);
        }
      }
    );

  }

  start() { }

  OnPlayerEnterTrigger(player: Player) {
    if (Npc.playerIsNpc(player)) return;
    if (this.playersInWorld.includes(player)) {
      const payload: AreaEnterPayload = {
        actionArea: "PlayerMoveArea",
        player: player,
        actionAreaIsLobbySection: false,
        actionAreaIsPlayerReadyZone: false,
      };
      AnalyticsManager.s_instance.sendAreaEnter(payload);
      const index = this.playersInWorld.indexOf(player);
      if (index !== -1) {
        this.playersInWorld.splice(index, 1);
      }
    }
  }

}
Component.register(Trigger_PlayerMove);
