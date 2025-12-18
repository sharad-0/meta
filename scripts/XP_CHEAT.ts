import {
  CodeBlockEvents,
  Component,
  Entity,
  Player,
  PropTypes,
} from "horizon/core";
import { playerManager } from "Managers_Instance";

class XP_CHEAT extends Component<typeof XP_CHEAT> {
  static propsDefinition = {
    isCheat: { type: PropTypes.Boolean, default: false },
  };

  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.OnPlayerEnterTrigger.bind(this)
    );
  }

  start() {}

  OnPlayerEnterTrigger(player: Player) {
    if (this.props.isCheat) {
      playerManager?.addExp(player, 50);
      playerManager?.addCash(player, 0);
    } else {
      const currentExp = playerManager?.getExp(player) ?? 0;
      const currentCash = playerManager?.getCash(player) ?? 200;
      playerManager?.deductCash(player, (currentCash! - 100));
      playerManager?.deductExp(player, currentExp);
      // playerManager?.setHouseLevel(player, 1);
    }
  }
}
Component.register(XP_CHEAT);
