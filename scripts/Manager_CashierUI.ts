import { Component, Player, PropTypes } from "horizon/core";
import { CashierUiTags } from "Enums_Game";
import UI_CustomerGreeting from "UI_CustomerGreeting";
import UI_OrderAccepted from "UI_OrderAccepted";
import { PlayerJoinedEvent } from "Manager_Events";
import { hudManager, orderManager, playerManager } from "Managers_Instance";

export default class Manager_CashierUI extends Component<
  typeof Manager_CashierUI
> {
  static propsDefinition = {
    greetingHud: { type: PropTypes.Entity },
    acceptedHud: { type: PropTypes.Entity },
  };

  private greetingUIComp: UI_CustomerGreeting | undefined;
  private acceptedUIComp: UI_OrderAccepted | undefined;

  preStart(): void {
    this.connectLocalBroadcastEvent(PlayerJoinedEvent, () =>
      this.updateHudOnPlayerChange()
    );
  }

  start() {
    this.greetingUIComp =
      this.props.greetingHud?.getComponents(UI_CustomerGreeting)[0];
    this.acceptedUIComp =
      this.props.acceptedHud?.getComponents(UI_OrderAccepted)[0];
  }

  public updateHud(tag: CashierUiTags, tableId: string, player: Player) {
    if (!this.props.greetingHud || !this.props.acceptedHud) return;
    if (tag === CashierUiTags.Undefined) {
      this.hideHud(player);
      return;
    }

    // console.log.*$

    if (tag === CashierUiTags.GreetingAssignment) {
      this.greetingUIComp?.addPlayerToTrigger(player);
      this.acceptedUIComp?.removePlayerFromTrigger(player);
    } else if (tag === CashierUiTags.OrderAccepted) {
      // this.acceptedUIComp?.addPlayerToTrigger(player);
      this.greetingUIComp?.removePlayerFromTrigger(player);
    }

    // Step 2: Update HUD visibility
    this.updateHudOnPlayerChange();

    // Step 3: Update order if tag is valid
    const order = orderManager?.getOrderFromTable(tableId);
    if (order) {
      this.greetingUIComp?.setOrder(order, player, tableId);
      this.acceptedUIComp?.setOrder(order, player);
    }
  }

  public hideHud(player: Player) {
    if (!this.props.greetingHud || !this.props.acceptedHud) return;

    this.greetingUIComp?.removePlayerFromTrigger(player);
    this.acceptedUIComp?.removePlayerFromTrigger(player);

    this.updateHudOnPlayerChange();

    this.greetingUIComp?.removeOrder(player);
    this.acceptedUIComp?.removeOrder(player);
  }

  public hideHudFromAllPlayers() {
    playerManager?.getCurrentPlayers().forEach((player) => {
      this.hideHud(player);
    });
  }

  public updateHudOnPlayerChange() {
    if (!this.props.greetingHud || !this.props.acceptedHud) return;

    const allPlayers = playerManager?.getCurrentPlayers() ?? [];
    const playersOnGreeting = this.greetingUIComp?.getPlayersOnTrigger() ?? [];
    const playersOnAccepted = this.acceptedUIComp?.getPlayersOnTrigger() ?? [];

    hudManager?.syncHudVisibility(
      this.props.greetingHud,
      playersOnGreeting,
      allPlayers
    );
    hudManager?.syncHudVisibility(
      this.props.acceptedHud,
      playersOnAccepted,
      allPlayers
    );
  }
}
Component.register(Manager_CashierUI);
