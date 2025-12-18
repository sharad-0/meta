import { UIComponent, View, Text, Binding, UINode } from "horizon/ui";
import Manager_Server from 'Manager_Server';
import { PlayerRoles, TableStatus } from 'Enums_Game';
import Component_Table from 'Component_Table';
import { orderManager, playerManager, serverManager, tableManager } from 'Managers_Instance';

/* polling interval */
const POLL_MS = 500;

class HUD_ServerBottom extends UIComponent<typeof HUD_ServerBottom> {
  static propsDefinition = {};

  private objectiveBinding = new Binding<string>("Wait for order");

  /* ---------------- UI tree ---------------- */
  initializeUI(): UINode {
    return View({
      style: {
        position: "absolute",
        bottom: 20,
        left: "31%",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: 50,
        borderWidth: 5,
        borderColor: "white",
        width: 500,
        height: 100,
        alignItems: "center",
        justifyContent: "center",
      },
      children: [
        Text({
          text: this.objectiveBinding,
          style: {
            fontFamily: "Roboto",
            fontSize: 32,
            fontWeight: "bold",
            color: "black",
            textAlign: "center",
            marginBottom: -8,
          },
        }),
      ],
    });
  }

  start() {
    this.refresh();
    this.async.setInterval(() => this.refresh(), POLL_MS);
  }

  private refresh(): void {
    const allServerInWorld = playerManager?.getRolePlayers(PlayerRoles.Server) ?? []; // get first server player
    allServerInWorld.forEach(player => {
      const cone = serverManager?.getConeForPlayer(player);

      let dirtyTableCount = 0;
      const tables = tableManager?.getAllTableComps() ?? [];

      tables.forEach((tableComponent) => {
        if (tableComponent.tableData.status == TableStatus.Dirty) {
          dirtyTableCount++;
        }
      });
      
      // if (cone) {
      //   const tableId = orderManager?.getTableForOrder(cone?.getConeOrderId() ?? 0);
      //   if(tableId != undefined) {
      //   this.objectiveBinding.set(`Deliver to Table ${tableId}`, [player]);
      //   }else{
      //   this.objectiveBinding.set(`Dump Cone`, [player]);
      //   }
      // } else if (Spawner_ConeOnTable.get().activeConesOnStand.size > 0) {
      //   this.objectiveBinding.set("Pick an Order", [player]);
      // } else if (dirtyTableCount > 0) {
      //   this.objectiveBinding.set("Clean dirty table(s)", [player]);
      // } else {
      //   this.objectiveBinding.set("Wait for Order", [player]);
      // }
    });
  }
}
UIComponent.register(HUD_ServerBottom);