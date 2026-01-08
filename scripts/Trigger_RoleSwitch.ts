import {
  AttachableEntity,
  AttachablePlayerAnchor,
  AvatarGripPose,
  DefaultPopupOptions,
  TextGizmo,
} from "horizon/core";
import {
  CodeBlockEvents,
  Component,
  Player,
  PropTypes,
  SpawnPointGizmo,
  Vec3,
} from "horizon/core";
import { PlayerRoles } from "Enums_Game";
import {
  bagManager,
  orderManager,
  playerManager,
  scooperHandManager,
  scooperManager,
  serverManager,
} from "Managers_Instance";
import {
  PlayerSwitchedRoleEvent,
  RoleSwitched,
  RushHourBegins,
  RushHourEnds,
} from "Manager_Events";

const MIN_PLAYERS = 1;

class LobbyPlatform extends Component<typeof LobbyPlatform> {
  static propsDefinition = {
    lobbySpawnPoint: { type: PropTypes.Entity, required: true },
    role: { type: PropTypes.String, default: "Unknown" },
    roleCount: { type: PropTypes.Entity },
    vaccum: { type: PropTypes.Entity },
  };
  private rushHourBegins: boolean = false;
  /** Called once the component has been added to the world. */
  preStart(): void {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.playersEntryTrigger.bind(this)
    );
  }
  start(): void {
    this.async.setInterval(() => {
      this.updateCount();
    }, 1000);
  }

  playersEntryTrigger(player: Player) {
    if (
      playerManager &&
      playerManager.getRolePlayers(this.props.role.toString() as PlayerRoles)
        .length > 0 &&
      this.props.role !== PlayerRoles.Unknown
    ) {
      let popupOptions = {
        ...DefaultPopupOptions,
        position: new Vec3(0, 0.5, 0),
        fontSize: 2,
      };
      this.world.ui.showPopupForPlayer(
        player,
        "Role already taken!",
        2,
        popupOptions
      );
      return;
    }
    this.updateRole(player, this.props.role);
    this.props.lobbySpawnPoint?.as(SpawnPointGizmo).teleportPlayer(player);
    this.equipVacuumForFetcher(player);
  }

  equipVacuumForFetcher(player: Player) {
    if (this.props.vaccum!) {
      const vaccumEntity = this.props.vaccum!.as(AttachableEntity)!;
      if (vaccumEntity) {
        if (this.props.role === PlayerRoles.Fetcher) {
          vaccumEntity.scale.set(new Vec3(0.1, 0.1, 0.1));
          bagManager?.assignBagEntityToPlayer(player);
          vaccumEntity.attachToPlayer(player, AttachablePlayerAnchor.Torso);
          vaccumEntity.visible.set(true);
          // player.setAvatarGripPoseOverride(AvatarGripPose.Torch);
        } else {
          const playerAttachedToBag = bagManager?.getPlayerAttachedToBag1();
          if (playerAttachedToBag === player) {
            vaccumEntity.detach();
            bagManager?.removeBagEntityFromPlayer(player);
            vaccumEntity.visible.set(false);
            player.clearAvatarGripPoseOverride();
          }
        }
      }
    }
  }

  updateRole(player: Player, role: string): void {
    if (playerManager?.getRole(player) === PlayerRoles.Scooper) {
      scooperHandManager?.emptyHand(player, true);
    } else if (playerManager?.getRole(player) === PlayerRoles.Server) {
      if (serverManager?.getConeForPlayer(player)) {
        serverManager?.removeConeForPlayer(player, true);
      }
    }

    playerManager?.setRole(player, role as PlayerRoles);

    // console.log.*$
    this.sendNetworkBroadcastEvent(RoleSwitched, { player });
  }

  updateCount(): void {
    const display = this.props.roleCount?.as(TextGizmo) ?? null;
    const count =
      playerManager?.getRolePlayers(this.props.role.toString() as PlayerRoles)
        .length ?? 0;

    if (count > 0) {
      display?.text.set(`${count} /1`);
    } else {
      display?.text.set("0 /1");
    }
  }
}

Component.register(LobbyPlatform);
