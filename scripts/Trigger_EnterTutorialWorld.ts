import {
  CodeBlockEvents,
  Component,
  Entity,
  Player,
  PlayerVisibilityMode,
  PropTypes,
} from "horizon/core";
import { hudManager, playerManager } from "Managers_Instance";

export default class Trigger_EnterTutorialWorld extends Component<
  typeof Trigger_EnterTutorialWorld
> {
 
  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.OnPlayerEnterTrigger.bind(this)
    );
  }

  start() {}

  OnPlayerEnterTrigger(player: Player) {
   hudManager?.showReplayFtueUiToPlayer(player);
  }

}
Component.register(Trigger_EnterTutorialWorld);
