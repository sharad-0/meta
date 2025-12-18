import { CodeBlockEvents, Component, Entity, Player } from "horizon/core";
import { ringArrowManager } from "Managers_Instance";
class Trigger_PlayerEnterParlour extends Component<
  typeof Trigger_PlayerEnterParlour
> {
  static propsDefinition = {};

  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.OnPlayerEnterTrigger.bind(this)
    );
  }

  start() {}

  OnPlayerEnterTrigger(player: Player) {
    // console.log.*$
    ringArrowManager?.playerReachedArena(player);
  }
}
Component.register(Trigger_PlayerEnterParlour);
