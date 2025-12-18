import * as hz from "horizon/core";
import Component_Table from "Component_Table";
import { CashierStatus, Customer, PlayerRoles, TableStatus } from "Enums_Game";
import TaskManager, { ActionType } from "TaskManager";
import { npcManager, playerManager, snowflakeManager } from "Managers_Instance";
import { messCleanedAtTable } from "Manager_Events";

class Manager_Table extends hz.Component<typeof Manager_Table> {
  static propsDefinition = {
    tableTag: { type: hz.PropTypes.String, default: "table" },
  };

  private tables: Component_Table[] = [];
  private customersInTable = new Map<string, Customer>();

  prestart() { }

  start() {
    // Get all entities with the table component
  }

  public registerTableComponent(entity: hz.Entity) {
    const tableComp = entity.getComponents<Component_Table>()[0];
    if (tableComp) {
      this.tables.push(tableComp);
    }
    // Filter entities that have the TableComponent attached
    // console.log.*$
  }

  getAllTableComps(): Component_Table[] {
    return this.tables;
  }

  getTableCompFromId(tableId: string): Component_Table | undefined {
    return this.tables.find((table) => table.props.tableId === tableId);
  }

  getNextAvailableTable(): Component_Table | undefined {
    // Atomically find and claim the first free table
    for (const table of this.tables) {
      if (table.tableData.status === TableStatus.Free) {
        // Immediately mark as taken (atomic check-and-set)
        table.updateStatus(TableStatus.Taken);
        // console.log.*$
        return table;
      }
    }

    // No free tables available
    // console.log.*$
    return undefined;
  }

  releaseTable(tableId: string): void {
    const table = this.getTableCompFromId(tableId);
    if (table) {
      // console.log.*$
      table.updateStatus(TableStatus.Free);
      this.customersInTable.delete(tableId);
    } else {
      console.warn(
        `[TableManager] Attempted to release non-existent table ${tableId}`
      );
    }
  }

  resetAllTables() {
    this.tables.forEach((table) => {
      table.updateStatus(TableStatus.Free);
      table.disableIndication_cashier();
      table.disableIndication_server();
      table.disableDirtyMarker();
      table.cleanTable();

      // console.log.*$
    });
    this.customersInTable.clear();
  }

  // ----------------------------------------- customer actions -------------------------------------------- //

  addCustomer(customerId: bigint, orderId: number, tableId?: string) {
    this.customersInTable.set(tableId!, {
      id: customerId,
      orderId,
    });
  }

  getCustomerFromTable(tableId: string): Customer | undefined {
    return this.customersInTable.get(tableId);
  }

  // ----------------------------------------- table actions -------------------------------------------- //

  onOrderAccepted(tableId: string) {
    const table = this.getTableCompFromId(tableId);
    table?.updateStatus(TableStatus.WaitingForOrder);
    table?.disableIndication_cashier();
  }

  onTableMessCleaned(tableId: string, player?: hz.Player) {
    const table = this.getTableCompFromId(tableId);
    table?.disableDirtyMarker();
    table?.updateStatus(TableStatus.Free);
    this.sendLocalBroadcastEvent(messCleanedAtTable, {
      tableId: tableId,
    });
    if (player) {
      snowflakeManager?.addSnowflakeCurrencyToPlayer(player);
    }
    // TaskManager.recordAction(playerManager?.getRolePlayers(PlayerRoles.Server)[0] ?? (() => {throw new Error("No server player found");})(), ActionType.CleanTable, 1);
  }
}

hz.Component.register(Manager_Table);
export default Manager_Table;
