import { AnalyticsManager } from "AnalyticsManager";
import { CustomAnalyticsEvents, EntryTypes, PlayerRoles } from "Enums_Game";
import { CodeBlockEvents, Component, Entity, Player } from "horizon/core";
import { hudManager, playerManager } from "Managers_Instance";

class Trigger_FTUE extends Component<typeof Trigger_FTUE> {
  static propsDefinition = {
    triggerEntryType: { type: "string", default: "mainEntry" },
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
    // console.log.*$
    const ftueData = playerManager?.getFTUEData(player);
    const entryType = this.props.triggerEntryType as EntryTypes;
    if (ftueData && ftueData[entryType] === false) {
      hudManager?.showFTUEUiToPlayer(player, entryType);
      this.sendAnalyticsEvent(player, entryType);
    } else if (!ftueData) {
      hudManager?.showFTUEUiToPlayer(player, entryType);
      this.sendAnalyticsEvent(player, entryType);
    }
  }

  sendAnalyticsEvent(player: Player, entryType: EntryTypes) {
    let role = playerManager?.getRole(player).toString();

    switch (entryType) {
      case EntryTypes.main:
        AnalyticsManager.s_instance.sendGameTutorialStart(player);
        break;
      case EntryTypes.fetcher:
        AnalyticsManager.s_instance.sendRoleTutorialStart(player, PlayerRoles.Fetcher);

        break;
      case EntryTypes.scooper:
        AnalyticsManager.s_instance.sendRoleTutorialStart(player, PlayerRoles.Scooper);

        break;
      case EntryTypes.server:
        AnalyticsManager.s_instance.sendRoleTutorialStart(player, PlayerRoles.Server);
        break;
    }
  }
}
Component.register(Trigger_FTUE);
