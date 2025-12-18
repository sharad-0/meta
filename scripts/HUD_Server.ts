// ServerHud.ts
// -----------------------------------------------------------------------------
// • Rendered only for users with the **Server** role (i.e. Horizon desktop
//   editor’s “Play As Server”). Ordinary clients never see or even instantiate
//   this HUD.
// • Shows the table-number that the local-server player currently owns, as
//   stored in ServerManager’s registry:
//
//          “Table 4”   (updates live)
//
//   If the player has no cone yet the label reads “—”.
//
// Requires
//   • ServerManager.ts  – must expose `getCone(playerId)` returning `Cone | undefined`
//   • PlayerManager.ts  – to detect local player & role
//   • Attach to any always-active Screen-layer UI gizmo.
// -----------------------------------------------------------------------------

import { UIComponent, View, Text, Binding, UINode, DynamicList, Image, ImageSource } from "horizon/ui";
import { Component, Player, PropTypes } from "horizon/core";
import Component_Table from "Component_Table";
import { TableStatus, TABLESTATUS_COLORS, TABLESTATUS_BORDERCOLORS, PlayerRoles } from "Enums_Game";
import { playerManager, tableManager } from "Managers_Instance";


/* polling interval */
const POLL_MS = 500;

export default class HUD_Server extends UIComponent<typeof HUD_Server> {
  static propsDefinition = {
    dirtyTableIcon: { type: PropTypes.Asset },
  };
  private displaySlots = [0, 1, 2, 3, 4, 5]; // fixed 6 box indices
  private numberListBinding = new Binding<TableStatus[]>([]); // 0 to 6 numbers

  /* only build UI if local user is a server -------------------------- */
  initializeUI(): UINode {
    return View({
      style: {
        position: "absolute",
        top: 120,
        right: -5,
        overflow: "hidden",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderRadius: 12,
      },
      children: [
        View ({
          style: {
            flexDirection: "row",
            backgroundColor: "rgba(194, 187, 187, 0.9)",
            width: "100%",
            height: 40,
          },
          children: [
            Text({
              text: "Tables",
              style: {
                fontFamily: "Roboto",
                fontWeight: "bold",
                fontSize: 20,
                position: "absolute",
                color: "black",              // Changed to black
                top: 10,
                left: 15,
              },
            }),
          ]
        }),
        DynamicList<number>({
          data: new Binding<number[]>(this.displaySlots), // Number of tables
          renderItem: (_, index?: number) => {
            const valueBinding = index !== undefined ? `${index + 1}` : "0";

            const colorBinding = this.numberListBinding.derive((arr) => 
              index !== undefined && arr[index] === TableStatus.Dirty ? TABLESTATUS_COLORS.dirty : 
              index !== undefined && arr[index] === TableStatus.Free ? TABLESTATUS_COLORS.free :  TABLESTATUS_COLORS.occupied 
            );

            const borderColorBinding = this.numberListBinding.derive((arr) => 
              index !== undefined && arr[index] === TableStatus.Dirty ? TABLESTATUS_BORDERCOLORS.dirty : 
              index !== undefined && arr[index] === TableStatus.Free ? TABLESTATUS_BORDERCOLORS.free :  TABLESTATUS_BORDERCOLORS.occupied 
            );

            const iconBinding = this.numberListBinding.derive((arr) =>
              index !== undefined && arr[index] === TableStatus.Dirty
                ? ImageSource.fromTextureAsset(this.props.dirtyTableIcon!)
                : null
            );

            return View({
              style: {
                width: 70,
                height: 40,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: borderColorBinding,
                backgroundColor: colorBinding,
                justifyContent: "center",
                margin: 8,
              },
              children: [
                Text({
                  text: valueBinding,
                  style: {
                    color: "white",
                    fontSize: 15,
                    textAlign: "center",
                    paddingLeft: 5,
                    fontFamily: "Roboto"
                  },
                }),
                // Icon on top of start of progress bar
                Image({
                  source: iconBinding,
                  style: {
                    width: 15,
                    height: 15,
                    position: "absolute",
                    right: 5,
                    bottom: 5,
                    zIndex: 1,
                  },
                }),
              ],
            });
          },
          style: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            width: 260
          },
        }),
        View ({
          style: {
            flexDirection: "row",
            width: "100%",
            height: 40,
            alignContent: "center",
          },
          children: [
            // Vacant Legend
            View({
              style: {
                left: 15,
                top: 10,
                width: 25,
                height: 18,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: TABLESTATUS_BORDERCOLORS.free,
                backgroundColor: TABLESTATUS_COLORS.free,
                flexDirection: "row"
              },
              children: [
                Text({
                  text: "Vacant",
                  style: {
                    position: "absolute",
                    left: 20,
                    paddingLeft: 10,
                    fontFamily: "Roboto",
                    fontSize: 12,
                    fontWeight: "bold",
                    color: TABLESTATUS_BORDERCOLORS.free,
                  },
                }),
              ]
            }),
            // Occupied Legend
            View({
              style: {
                left: 70,
                top: 10,
                width: 25,
                height: 18,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: TABLESTATUS_BORDERCOLORS.occupied,
                backgroundColor: TABLESTATUS_COLORS.occupied,
                flexDirection: "row"
              },
              children: [
                Text({
                  text: "Occupied",
                  style: {
                    position: "absolute",
                    left: 20,
                    paddingLeft: 10,
                    fontFamily: "Roboto",
                    fontSize: 12,
                    fontWeight: "bold",
                    color: TABLESTATUS_BORDERCOLORS.occupied,
                  },
                }),
              ]
            }),
            // Dirty Legend
            View({
              style: {
                left: 140,
                top: 10,
                width: 25,
                height: 18,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: TABLESTATUS_BORDERCOLORS.dirty,
                backgroundColor: TABLESTATUS_COLORS.dirty,
                flexDirection: "row"
              },
              children: [
                Text({
                  text: "Dirty",
                  style: {
                    position: "absolute",
                    left: 20,
                    paddingLeft: 10,
                    fontFamily: "Roboto",
                    fontSize: 12,
                    fontWeight: "bold",
                    color: TABLESTATUS_BORDERCOLORS.dirty,
                  },
                }),
              ]
            }),
          ]
        }),
      ],
    });
  }


  /* life-cycle ------------------------------------------------------- */
  start(): void {
    // if (!this.localIsServer()) return; // no polling on clients
    this.getTables();
    this.async.setInterval(() => this.getTables(), POLL_MS);
  }

  getTables(): void {
    const allServerInWorld = playerManager?.getRolePlayers(PlayerRoles.Server) ?? []; // get first server player
    allServerInWorld.forEach((player) => {
      const tableComps: TableStatus[] = [];
      const tables = tableManager?.getAllTableComps() ?? [];
  
      tables.forEach((tableComponent) => {
        if (tableComponent) {
          tableComps.push(tableComponent.tableData.status);
        }
      });
  
      this.numberListBinding.set(tableComps, [player]);
    })
  }
}

Component.register(HUD_Server);
