import {
  UIComponent,
  View,
  Text,
  Binding,
  UINode,
  DynamicList,
  ScrollView,
  Image,
  ImageSource,
} from "horizon/ui";
import { CodeBlockEvents, Component, Player, PlayerDeviceType, PlayerVisibilityMode, PropTypes } from "horizon/core";
import { ParlourClosedEvent, PlayerSwitchedRoleEvent } from "Manager_Events";
import { gameManager, playerManager } from "Managers_Instance";
import { PlayerRoles } from "Enums_Game";
import { TextureAsset } from "horizon/2p";
import { Npc } from "horizon/npc";

class HUD_PlayerRoles extends UIComponent<typeof HUD_PlayerRoles> {
  protected panelHeight: number = 300;
  protected panelWidth: number = 500;

  static propsDefinition = {
    scooperIcon: { type: PropTypes.Asset },
    fetcherIcon: { type: PropTypes.Asset },
    serverIcon: { type: PropTypes.Asset },
    onBreakIcon: { type: PropTypes.Asset },
  };

  // Binding of player display names
  private playersBinding = new Binding<{ name: string; role: PlayerRoles }[]>(
    []
  );
  private groupedBinding = new Binding<
    {
      type: "header" | "player";
      role?: PlayerRoles;
      name?: string;
      count?: number;
    }[]
  >([]);
  bgColorBinding = new Binding<string>("rgba(0, 0, 0, 0)");
  borderColorBinding = new Binding<string>("rgba(255, 255, 255, 0)");
  initializeUI(): UINode {
    return View({
      style: {
        position: "absolute",
        top: "20%",
        left: "8%",
        width: 200, // fixed width
        // no height -> auto-size by content
        backgroundColor: "rgba(0, 0, 0, 0)",
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0)",
        padding: 6,
        alignItems: "stretch",
        justifyContent: "flex-start",
      },
      children: [
        // Content wrapper (no fixed height)
        View({
          style: { width: "100%" },
          children: [
            DynamicList<{
              type: "header" | "player";
              role?: PlayerRoles;
              name?: string;
            }>({
              data: this.groupedBinding,
              renderItem: (item) => {
                // if (item.type === "header") {
                return View({
                  style: {
                    width: "100%",
                    minHeight: 24,
                    // backgroundColor: this.resolveRoleColor(item.role!),
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    marginTop: 0,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                  children: [
                    // LEFT: icon + role name
                    View({
                      style: {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      },
                      children: [
                        Image({
                          source: ImageSource.fromTextureAsset(
                            this.resolveRoleIcon(item.role!)
                          ),
                          style: {
                            width: "100%", // explicit size for icon
                            height: "auto",
                            aspectRatio: 255 / 37,
                            marginRight: 6,
                          },
                        }),
                        Text({
                          text: item.name!,
                          style: {
                            color: "white",
                            fontSize: 18,
                            fontFamily: "Bangers",
                            position: "absolute",
                            left: "35%"
                          },
                        }),
                      ],
                    }),
                  ],
                });
                // }

                // return View({
                //   style: {
                //     width: "100%",
                //     minHeight: 24,
                //     backgroundColor: "black",
                //     borderRadius: 4,
                //     paddingHorizontal: 6,
                //     marginTop: 2,
                //     justifyContent: "center",
                //   },
                //   children: [
                //     Text({
                //       text: item.name!,
                //       style: {
                //         color: "white",
                //         fontSize: 18,
                //         fontFamily: "Bangers",
                //       },
                //     }),
                //   ],
                // });
              },
              style: {
                width: "100%",
                flexDirection: "column",
                alignItems: "stretch",
                // no height -> let items define total height
              },
            }),
          ],
        }),
      ],
    });
  }

  // Helper to rebuild the grouped rows from the flat players list:
  private rebuildGrouped(players: { name: string; role: PlayerRoles }[]) {
    const rows: {
      type: "header" | "player";
      role?: PlayerRoles;
      name?: string;
      count?: number;
    }[] = [];

    Object.values(PlayerRoles).forEach((role) => {
      // let name = role.toString();
      // if (role === PlayerRoles.Unknown) {
      //   name = "On Break";
      // }
      const rolePlayers = players.filter((p) => p.role === role);
      // rows.push({
      //   type: "header",
      //   role,
      //   name,
      //   count: rolePlayers.length,
      // });
      rolePlayers.forEach((p) =>
        rows.push({ type: "player", role, name: p.name })
      );
    });

    if (rows.length === 0) {
      this.entity.visible.set(false);
    } else {
      this.entity.visible.set(true);
    }

    this.groupedBinding.set(rows);
  }

  private resolveRoleColor(role: PlayerRoles): string {
    switch (role) {
      case "Fetcher":
        return "#ff4545e0";
      case "Scooper":
        return "#dd45ffdc";
      case "Server":
        return "#2aa723de";
      default:
        return "#444444d8";
    }
  }

  private resolveRoleIcon(role: PlayerRoles): TextureAsset {
    switch (role) {
      case PlayerRoles.Fetcher:
        return this.props.fetcherIcon as TextureAsset;
      case PlayerRoles.Scooper:
        return this.props.scooperIcon as TextureAsset;
      case PlayerRoles.Server:
        return this.props.serverIcon as TextureAsset;
      default:
        return this.props.onBreakIcon as TextureAsset;
    }
  }

  start(): void {
    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, () => {
      this.updateUI();
    });

    this.connectLocalBroadcastEvent(ParlourClosedEvent, () => {
      this.updateUI();
    });

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterWorld,
      () => {
        this.updateUI();
      }
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitWorld,
      () => {
        this.updateUI();
      }
    );
  }

  updateUI(): void {
    const names: { name: string; role: PlayerRoles }[] = [];
    const records = playerManager?.getCurrentPlayerRecs() ?? [];

    for (const record of records) {
      const name = record?.name ?? "";
      const trimmed = name.length > 12 ? name.substring(0, 12) + "..." : name;
      names.push({ name: trimmed, role: record?.role as PlayerRoles });
    }
    if (!gameManager?.isThisTrainingSession()) {
      this.playersBinding.set(names);
      this.rebuildGrouped(names);
    } else {
      this.entity.visible.set(false);
    }
    let players = this.world.getPlayers();
    players = players.filter((p) => (!Npc.playerIsNpc(p) && p.deviceType.get() === PlayerDeviceType.VR));
    this.entity.setVisibilityForPlayers(players, PlayerVisibilityMode.HiddenFrom);
  }
}
UIComponent.register(HUD_PlayerRoles);
