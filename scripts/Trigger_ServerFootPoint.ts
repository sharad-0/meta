import { PlayerRoles } from "Enums_Game";
import {
  CodeBlockEvents,
  Color,
  Component,
  Entity,
  Player,
  PropTypes,
} from "horizon/core";
import { Npc } from "horizon/npc";
import { orderManager, playerManager, serverManager } from "Managers_Instance";
import { ParlourClosedEvent } from "Manager_Events";

class Trigger_ServerFootPoint extends Component<
  typeof Trigger_ServerFootPoint
> {
  static propsDefinition = {
    tableId: { type: PropTypes.Number },
    footAsset: { type: PropTypes.Entity },
  };
  playerStandingOnTrigger: Player | undefined;
  triggerTableId: number | undefined;
  footAsset: Entity | undefined;
  private inactiveColor = Color.fromHex("#fbff00");
  private activeColor = Color.fromHex("#00DF28");
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

    this.connectLocalBroadcastEvent(ParlourClosedEvent, () => {
      this.resetTrigger();
    });
  }

  start() {
    if (this.props.tableId) {
      this.triggerTableId = this.props.tableId;
    }
    if (this.props.footAsset) {
      this.footAsset = this.props.footAsset;
    }

    this.resetTrigger();
  }

  OnPlayerEnterTrigger(player: Player) {
    if (Npc.playerIsNpc(player)) return;
    const playerRole = playerManager?.getRole(player);
    if (playerRole !== PlayerRoles.Server) return;
    const isItemInHand = serverManager?.getConeForPlayer(player);
    if (isItemInHand) return;
    if (!this.playerStandingOnTrigger) {
      this.playerStandingOnTrigger = player;
    }
    if (this.triggerTableId) {
      const iceCreamComp = orderManager?.getIceCreamComponentFromTableId(
        this.triggerTableId.toString()
      );
      if (iceCreamComp) {
        iceCreamComp?.makeIceCreamGrabbableByPlayer(
          this.playerStandingOnTrigger
        );
        this.markFootPointActive();
      }
    }
  }

  OnPlayerExitTrigger(player: Player) {
    if (this.playerStandingOnTrigger === player) {
      this.playerStandingOnTrigger = undefined;
      if (this.triggerTableId) {
        const iceCreamComp = orderManager?.getIceCreamComponentFromTableId(
          this.triggerTableId.toString()
        );
        if (iceCreamComp) {
          iceCreamComp?.makeIceCreamGrabbableByPlayer(
            this.playerStandingOnTrigger
          );
        }
        this.markFootPointInactive();
      }
    }
  }

  resetTrigger() {
    this.playerStandingOnTrigger = undefined;
    this.markFootPointInactive();
  }

  markFootPointActive() {
    if (this.footAsset) {
      this.footAsset.color.set(this.activeColor);
    }
  }

  markFootPointInactive() {
    if (this.footAsset) {
      this.footAsset.color.set(this.inactiveColor);
    }
  }
}
Component.register(Trigger_ServerFootPoint);
