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
    cheatCurrency: { type: PropTypes.String, default: "cash" },
    amount: { type: PropTypes.Number, default: 100 },
  };

  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.OnPlayerEnterTrigger.bind(this)
    );

    // this.connectCodeBlockEvent(
    //   this.entity,
    //   CodeBlockEvents.OnPlayerExitTrigger,
    //   this.OnPlayerExitTrigger.bind(this)
    // );
  }

  start() { }

  OnPlayerEnterTrigger(player: Player) {
    if (this.props.cheatCurrency === "cash") {
      playerManager?.addCash(player, this.props.amount);
    } else if (this.props.cheatCurrency === "exp") {
      playerManager?.addExp(player, this.props.amount);
    } else if (this.props.cheatCurrency === "snowflake") {
      playerManager?.addSnowflake(player, this.props.amount);
    }
  }

  OnPlayerExitTrigger(player: Player) {
    if (this.props.cheatCurrency === "cash") {
      playerManager?.deductCash(player, this.props.amount);
    } else if (this.props.cheatCurrency === "exp") {
      playerManager?.deductExp(player, this.props.amount);
    } else if (this.props.cheatCurrency === "snowflake") {
      playerManager?.deductSnowflake(player, this.props.amount);
    }
  }
}
Component.register(XP_CHEAT);
