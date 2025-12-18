import Component_Table from "Component_Table";
import { Items, TableStatus } from "Enums_Game";
import * as hz from "horizon/core";
import { orderManager, tableManager } from "Managers_Instance";
import UI_CustomerHeadsUp from "UI_CustomerHeadsUp";

class Component_FTUE_NPC extends hz.Component<typeof Component_FTUE_NPC> {
  static propsDefinition = {
    customerHudUi: { type: hz.PropTypes.Entity },
  };

  start() {
    this.props.customerHudUi?.visible.set(false);
    this.async.setTimeout(() => {
      this.setNpc();
    }, 3000); // wait for 3 seconds before setting the NPC
  }

  private tableComp?: Component_Table;
  setNpc() {
    this.tableComp = tableManager?.getTableCompFromId("1");
    this.setOrder();
    this.tableComp!.updateStatus(TableStatus.Occupied);
    this.tableComp!.indicateTheStation_cashier();
    this.props.customerHudUi?.visible.set(true);
  }

  setOrder() {
    const order = this.createRandomOrder();
    const orderId =
      orderManager?.addOrder(
        order,
        "Placeholder Name",
        this.entity.id,
        this.tableComp?.props.tableId ?? ""
      ) ?? 0;

    this.tableComp?.setOrderAtTable(this.tableComp.props.tableId);
    tableManager?.addCustomer(
      this.entity.id,
      orderId,
      this.tableComp?.props.tableId ?? ""
    );
    this.props.customerHudUi
      ?.getComponents(UI_CustomerHeadsUp)[0]
      ?.setOrder(order);
  }

  createRandomOrder(maxItems: number = 4): Items[] {
    return [Items.Cone, Items.Vanilla];
  }
}
hz.Component.register(Component_FTUE_NPC);
