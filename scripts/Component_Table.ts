import { PlayerRoles, TableStatus } from "Enums_Game";
import * as hz from "horizon/core";
import { Asset, Player } from "horizon/core";
import Trigger_Server_RemoveMess from "Trigger_Server_RemoveMess";
import { TableData } from "Enums_Game";
import {
  iceCreamDelivered,
  messCleanedAtTable,
  onPlayerTrashedItem,
  onServerTrashedItem,
  playerPickedItem,
  PlayerSwitchedRoleEvent,
  ResetTrayForOrder,
} from "Manager_Events";
import {
  gameManager,
  mainArenaManager,
  npcManager,
  orderManager,
  playerManager,
  serverManager,
  tableManager,
} from "Managers_Instance";
import Component_TableBoards from "Component_TableBoards";
import Component_IceCreamCone from "Component_IceCreamCone";

class Component_Table extends hz.Component<typeof Component_Table> {
  static propsDefinition = {
    tableId: { type: hz.PropTypes.String, default: "" },
    messEntity: { type: hz.PropTypes.Entity },
    indicationMarker_server: { type: hz.PropTypes.Entity },
    indicationMarker_cashier: { type: hz.PropTypes.Entity },
    tableBoardComponent: { type: hz.PropTypes.Entity },
    dirtyTableMarker: { type: hz.PropTypes.Entity },
  };

  public tableData: TableData = {
    status: TableStatus.Free,
    position: new hz.Vec3(0, 0, 0),
    tableId: "",
    isOrderSet: false,
  };

  updateStatus(status: TableStatus) {
    // if (!mainArenaManager?.isParlourOpen()) return;
    // console.log.*$
    this.tableData.status = status;
    this.updateTableBoardStatus();
    if (status === TableStatus.Free && mainArenaManager?.isParlourOpen()) {
      npcManager?.checkForFreeTable();
    }
  }

  updateTableBoardStatus() {
    this.props.tableBoardComponent
      ?.getComponents(Component_TableBoards)[0]
      .updateBoardVisibility(this.tableData.status, this.props.tableId);
  }

  setOrderAtTable(tableId: string) {
    if (tableId !== this.props.tableId) {
      // console.log.*$
      //   `[TableSetRemove] Attempted to set order at table ${tableId}, but this component is for table ${this.props.tableId}.`
      // );
      return;
    }
    this.tableData.isOrderSet = true;
    // console.log.*$
  }

  removeOrderFromTable(tableId: string) {
    if (tableId === this.props.tableId) {
      this.tableData.isOrderSet = false;
      // console.log.*$
      //   `[TableSetRemove] removed table ${this.props.tableId}, ${this.tableData.isOrderSet}`
      // );
    } else {
      // console.log.*$
      //   `[TableSetRemove] remove table ${tableId}, for table ${this.props.tableId}. ${this.tableData.isOrderSet}`
      // );
    }
  }

  start() {
    // Initialize the table component
    this.tableData.position =
      this.world
        .getEntitiesWithTags([`tableStop${this.props.tableId}`])[0]
        ?.position.get() ?? new hz.Vec3(0, 0, 0);

    this.tableData.tableCenter = this.entity.position.get();
    this.props.tableBoardComponent
      ?.getComponents(Component_TableBoards)[0]
      .updateBoardVisibility(TableStatus.Free, this.props.tableId);

    this.tableData.tableId = this.props.tableId;

    this.connectLocalBroadcastEvent(playerPickedItem, ({ player, orderId }) => {
      const tableId = orderManager?.getTableForOrder(orderId);
      this.indicateDeliveryTableStation(player, tableId ?? "");
      this.setCashierIndicatorVisibility();
      this.indicateDirtyTable();
    });

    this.connectLocalBroadcastEvent(
      onServerTrashedItem,
      ({ player, orderId }) => {
        const tableId = orderManager?.getTableForOrder(orderId);
        this.removeDeliveryTableStation(player, tableId ?? "");
        this.setCashierIndicatorVisibility();
        this.indicateDirtyTable();
      }
    );

    this.connectLocalBroadcastEvent(ResetTrayForOrder, (data) => {
      if (data.trayId && data.trayId == this.props.tableId) {
        this.removeDeliveryTableStation(data.player, data.trayId);
      }
    })

    this.connectLocalBroadcastEvent(iceCreamDelivered, () => {
      this.setCashierIndicatorVisibility(false);
      this.async.setTimeout(() => {
        this.indicateDirtyTable();
      }, 500);
    });

    this.connectLocalBroadcastEvent(messCleanedAtTable, () => {
      this.setCashierIndicatorVisibility();
      this.indicateDirtyTable();
    });

    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, ({ player }) => {
      this.setCashierIndicatorVisibility();
      this.indicateDirtyTable();
    });

    tableManager?.registerTableComponent(this.entity);
  }

  OnCustomerLeftTable() {
    this.updateStatus(TableStatus.Dirty);

    if (!this.props.messEntity) {
      console.error("Mess entity is missing for drop order table");
      return;
    }

    const comp = this.props.messEntity.getComponents(
      Trigger_Server_RemoveMess
    )[0];
    comp.enableMessOnTable(this.props.tableId);

    // console.log.*$
    this.indicateDirtyTable();
  }

  public indicateDirtyTable(): void {
    if (!this.props.indicationMarker_server) {
      console.warn("Indicator marker is missing for dirty table");
      return;
    }

    const isTableDirty = this.tableData.status === TableStatus.Dirty;

    if (isTableDirty) {
      this.props.dirtyTableMarker!.visible.set(true);
      let playersToShow =
        playerManager?.getRolePlayers(PlayerRoles.Server, true) ?? [];
      playersToShow.forEach((player) => {
        if (serverManager?.getConeForPlayer(player)) {
          playersToShow = playersToShow?.filter((p) => p !== player);
        }
      });
      this.props.dirtyTableMarker!.setVisibilityForPlayers(
        [],
        hz.PlayerVisibilityMode.VisibleTo
      );
      this.props.dirtyTableMarker!.setVisibilityForPlayers(
        playersToShow ?? [],
        hz.PlayerVisibilityMode.VisibleTo
      );
    }
  }

  public indicateDeliveryTableStation(player: Player, tableId: string): void {
    if (tableId != this.props.tableId) {
      return;
    }

    if (!this.props.indicationMarker_server) {
      console.warn("Indicator marker is missing for drop order table");
      return;
    }
    this.props.indicationMarker_server!.visible.set(true);
    this.props.indicationMarker_server.setVisibilityForPlayers(
      [],
      hz.PlayerVisibilityMode.VisibleTo
    );
    this.props.indicationMarker_server.setVisibilityForPlayers(
      [player],
      hz.PlayerVisibilityMode.VisibleTo
    );

    this.indicateTheStation_cashier();
  }

  public removeDeliveryTableStation(player: Player, tableId: string): void {
    if (tableId != this.props.tableId) {
      return;
    }

    if (!this.props.indicationMarker_server) {
      console.warn("Indicator marker is missing for drop order table");
      return;
    }
    this.props.indicationMarker_server!.visible.set(false);

    this.indicateTheStation_cashier();
  }

  public indicateTheStation_cashier(): void {
    this.setCashierIndicatorVisibility();
  }

  public updateCashierIndicator() {
    if (this.tableData.status !== TableStatus.Occupied) {
      return;
    }
  }

  public setCashierIndicatorVisibility(checkCone: boolean = true) {
    if (!this.props.indicationMarker_cashier) {
      console.warn("Indicator marker is missing for take order table");
      return;
    }
    let playersToShow =
      playerManager?.getRolePlayers(PlayerRoles.Server, true) ?? [];
    if (checkCone) {
      let serverPlayers =
        playerManager?.getRolePlayers(PlayerRoles.Server, true) ?? [];
      serverPlayers.forEach((player) => {
        if (serverManager?.getConeForPlayer(player)) {
          playersToShow = playersToShow?.filter((p) => p !== player);
        }
      });
    }

    // console.log.*$
    //   `Setting cashier indicator visibility for table ${this.props.tableId}, ${playersToShow?.length}`
    // );
    if (this.tableData.status == TableStatus.Occupied) {
      this.props.indicationMarker_cashier!.visible.set(true);
      this.props.indicationMarker_cashier.setVisibilityForPlayers(
        [],
        hz.PlayerVisibilityMode.VisibleTo
      );

      this.props.indicationMarker_cashier.setVisibilityForPlayers(
        playersToShow ?? [],
        hz.PlayerVisibilityMode.VisibleTo
      );
    }
  }

  public disableIndication_server() {
    this.props.indicationMarker_server!.visible.set(false);
    this.setCashierIndicatorVisibility();
    this.indicateDirtyTable();
  }
  public disableDirtyMarker() {
    this.props.dirtyTableMarker!.visible.set(false);
    this.setCashierIndicatorVisibility();
    // this.indicateDirtyTable();
  }
  public disableIndication_cashier() {
    this.props.indicationMarker_cashier!.visible.set(false);
    this.setCashierIndicatorVisibility();
    this.indicateDirtyTable();
  }
  cleanTableForBot(player: hz.Player) {
    const triggerComp = this.props.messEntity?.getComponents(
      Trigger_Server_RemoveMess
    )[0];
    triggerComp?.onPlayerEnterTrigger(player);
  }
  cleanTable() {
    const triggerComp = this.props.messEntity?.getComponents(
      Trigger_Server_RemoveMess
    )[0];
    triggerComp?.cleanTable();
  }
}

hz.Component.register(Component_Table);
export default Component_Table;
