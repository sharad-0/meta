import { PlayerRoles } from "Enums_Game";
import * as hz from "horizon/core";
import { Npc } from "horizon/npc";
import { playerManager } from "Managers_Instance";

export default class Manager_Snowflake extends hz.Component<typeof Manager_Snowflake> {
  static propsDefinition = {};

  start() {}

  addSnowflakeCurrencyToPlayer(player: hz.Player) {
    if (Npc.playerIsNpc(player)) return;

    const role = playerManager?.getRole(player);
    let coinsToBeAdded = 0;
    switch (role) {
      case PlayerRoles.Fetcher:
        coinsToBeAdded = this.getFetcherReward();
        break;
      case PlayerRoles.Scooper:
        coinsToBeAdded = this.getScooperReward();
        break;
      case PlayerRoles.Server:
        coinsToBeAdded = this.getServerReward();
        break;
      default:
        coinsToBeAdded = 0;
        break;
    }

    if (coinsToBeAdded > 0) {
      playerManager?.addSnowflake(player, coinsToBeAdded);
    }
  }

  getFetcherReward() {
    return 2;
  }

  getServerReward() {
    return 1;
  }

  getScooperReward() {
    return 2;
  }
}
hz.Component.register(Manager_Snowflake);
