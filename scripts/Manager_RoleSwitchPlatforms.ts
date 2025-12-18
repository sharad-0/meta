import { PlayerRoles, Role } from "Enums_Game";
import * as hz from "horizon/core";
import { PlayerJoinedEvent, PlayerSwitchedRoleEvent } from "Manager_Events";
import { playerManager } from "Managers_Instance";

export default class Manager_RoleSwitchPlatforms extends hz.Component<
  typeof Manager_RoleSwitchPlatforms
> {
  static propsDefinition = {
    fetcherPlatform: { type: hz.PropTypes.Entity },
    scooperPlatform: { type: hz.PropTypes.Entity },
    serverPlatform: { type: hz.PropTypes.Entity },
  };

  /** Reset visibility so all platforms are visible to everyone initially */
  private resetVisibility() {
    const players = playerManager?.getCurrentPlayers()!;
    [
      this.props.fetcherPlatform,
      this.props.scooperPlatform,
      this.props.serverPlatform,
    ].forEach((platform) => {
      platform?.setVisibilityForPlayers(
        players,
        hz.PlayerVisibilityMode.VisibleTo
      );
    });
  }

  /** Hide platform from players who ARE that role */
  public showSpecificPlatform(playerRole: PlayerRoles) {
    // console.log.*$
    //   `[Manager_RoleSwitchPlatforms] Showing platform for role: ${playerRole}`
    // );
    const players = playerManager?.getCurrentPlayers() ?? [];
    // Who should NOT see the platform → players of that role
    const visiblePlayers = players.filter(
      (player) => playerManager?.getRole(player) !== playerRole
    );

    let platformEntity: hz.Entity | undefined;

    switch (playerRole) {
      case PlayerRoles.Fetcher:
        platformEntity = this.props.fetcherPlatform;
        break;
      case PlayerRoles.Scooper:
        platformEntity = this.props.scooperPlatform;
        break;
      case PlayerRoles.Server:
        platformEntity = this.props.serverPlatform;
        break;
      default:
        console.warn("No role Selected");
        return;
    }
    // console.log.*$
    //   `[Manager_RoleSwitchPlatforms] Showing platform for role: ${playerRole}, players: ${players
    //     .map((p) => p.id)
    //     .join(", ")}}`
    // );
    // First make the platform visible to everyone

    platformEntity?.setVisibilityForPlayers(
      playerManager?.getCurrentPlayers()!,
      hz.PlayerVisibilityMode.HiddenFrom
    );

    platformEntity?.setVisibilityForPlayers(
      visiblePlayers,
      hz.PlayerVisibilityMode.VisibleTo
    );

    // Then hide it only from players of that role
  }

  start() {
    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, () => {
      this.updateAllPlatformVisibilities();
    });
    this.connectLocalBroadcastEvent(PlayerJoinedEvent, () => {
      this.updateAllPlatformVisibilities();
    });
  }

  /** On any switch, update all visibilities for all players and platforms */
  private updateAllPlatformVisibilities() {
    const players = playerManager?.getCurrentPlayers() ?? [];
    const platforms = [
      { role: PlayerRoles.Fetcher, entity: this.props.fetcherPlatform },
      { role: PlayerRoles.Scooper, entity: this.props.scooperPlatform },
      { role: PlayerRoles.Server, entity: this.props.serverPlatform },
    ];

    platforms.forEach(({ role, entity }) => {
      if (entity) {
        entity.setVisibilityForPlayers(
          players,
          hz.PlayerVisibilityMode.HiddenFrom
        );

        // if (role === PlayerRoles.Fetcher && this.checkRoleCount(role) >= 2) {
        //   return;
        // }
        entity.setVisibilityForPlayers(
          playerManager?.getPlayersWithoutRole(role)!,
          hz.PlayerVisibilityMode.VisibleTo
        );
      }
      // else: Leave platform hidden for that player
    });
  }

  checkRoleCount(role: PlayerRoles): number {
    return playerManager?.getRolePlayers(role)?.length ?? 0;
  }
}
hz.Component.register(Manager_RoleSwitchPlatforms);
