import { PlayerRoles } from "Enums_Game";
import {
  CodeBlockEvents,
  Color,
  Component,
  Entity,
  Player,
  PropTypes,
} from "horizon/core";
import {
  ParlourClosedEvent,
  PlayerEnterScooperFoot,
  PlayerExitScooperFoot,
} from "Manager_Events";
import { hapticsManager, playerManager } from "Managers_Instance";
import { Npc } from "horizon/npc";

export default class Trigger_ScooperFootPoints extends Component<
  typeof Trigger_ScooperFootPoints
> {
  static propsDefinition = {
    scooperTray: { type: PropTypes.Entity },
    footStandEntity: { type: PropTypes.Entity },
  };
  private inactiveColor = Color.fromHex("#fbff00");
  private activeColor = Color.fromHex("#00DF28");
  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      (player) => {
        if (!Npc.playerIsNpc(player)) {
          this.OnPlayerEnterTrigger(player);
        }
      }
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitTrigger,
      (player) => {
        if (!Npc.playerIsNpc(player)) {
          this.OnPlayerExitTrigger(player);
        }
      }
    );

    this.connectLocalBroadcastEvent(ParlourClosedEvent, () => {
      this.reset();
    });
  }

  start() {
    this.props.footStandEntity?.color.set(this.inactiveColor);
  }

  reset() {
    this.props.footStandEntity?.color.set(this.inactiveColor);
  }

  OnPlayerEnterTrigger(player: Player) {
    // console.log.*$
    //   `[Scooper Tray] Player ${player.name.get()} entered foot trigger.`
    // );
    const playerRole = playerManager?.getRole(player);
    if (this.props.scooperTray && playerRole === PlayerRoles.Scooper) {
      // console.log.*$
      //   `[Scooper Tray] Sending Event for Player ${player.name.get()} to tray.`
      // );
      if (!Npc.playerIsNpc(player)) {
        this.props.footStandEntity?.color.set(this.activeColor);
      }
      this.sendLocalBroadcastEvent(PlayerEnterScooperFoot, {
        entity: this.props.scooperTray,
        player: player,
      });
      hapticsManager?.playLightTap(player);
    }
  }

  OnPlayerExitTrigger(player: Player) {
    const playerRole = playerManager?.getRole(player);
    if (this.props.scooperTray && playerRole === PlayerRoles.Scooper) {
      if (!Npc.playerIsNpc(player)) {
        this.props.footStandEntity?.color.set(this.inactiveColor);
      }
      this.sendLocalBroadcastEvent(PlayerExitScooperFoot, {
        entity: this.props.scooperTray,
        player: player,
      });
    }
  }
}
Component.register(Trigger_ScooperFootPoints);
