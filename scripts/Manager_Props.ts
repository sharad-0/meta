import { PlayerRoles, Role } from "Enums_Game";
import {
  Component,
  AttachableEntity,
  AttachablePlayerAnchor,
  Entity,
  Player,
  Quaternion,
  Vec3,
} from "horizon/core";
import { PlayerLeftEvent } from "Manager_Events";
import {
  objectPoolManager,
  playerManager,
  themeSessionManager,
} from "Managers_Instance";

export default class Manager_Props extends Component<typeof Manager_Props> {
  static propsDefinition = {};

  private PlayerProps: Map<Player, Entity> = new Map();

  start() {
    this.connectLocalBroadcastEvent(PlayerLeftEvent, ({ player }) => {
      const currRole = playerManager?.getRole(player);
      this.detachRoleProps(player, currRole!);
    });
  }

  async detachRoleProps(
    player: Player,
    currentRole: PlayerRoles
  ): Promise<void> {
    if (this.PlayerProps.has(player)) {
      const ent = this.PlayerProps.get(player);
      if (ent) {
        objectPoolManager?.releaseProp(currentRole!, ent);
        this.PlayerProps.delete(player);
      }
    }

    playerManager?.removeVacuumForFetcher(player);
  }

  async attachRoleProps(
    player: Player,
    role: PlayerRoles,
    currentRole?: PlayerRoles
  ): Promise<void> {
    if (currentRole) this.detachRoleProps(player, currentRole);
    switch (role) {
      case PlayerRoles.Scooper:
        const scooperEnt = await objectPoolManager?.acquireProps(role, {
          position: new Vec3(0, 0, 0),
          rotation: new Quaternion(0, 0, 0, 1),
        });
        // console.log.*$
        scooperEnt?.owner.set(player);
        const scooperProp = scooperEnt?.as(AttachableEntity);
        if (scooperProp) {
          scooperProp.attachToPlayer(player, AttachablePlayerAnchor.Head);
          // console.log.*$
          scooperProp.socketAttachmentPosition.set(new Vec3(0, 0.15, -0.12));
          this.PlayerProps.set(player, scooperProp);
        }
        break;
      case PlayerRoles.Server:
        const serverEnt = await objectPoolManager?.acquireProps(role, {
          position: new Vec3(0, 0, 0),
          rotation: new Quaternion(0, 0, 0, 1),
        });
        // console.log.*$
        serverEnt?.owner.set(player);
        const serverProp = serverEnt?.as(AttachableEntity);
        if (serverProp) {
          serverProp.attachToPlayer(player, AttachablePlayerAnchor.Head);
          // console.log.*$
          serverProp.socketAttachmentPosition.set(new Vec3(0, 0.1, -0.1));
          this.PlayerProps.set(player, serverProp);
        }
        break;

      case PlayerRoles.Unknown:
        if (themeSessionManager?.isChristmasSessionActive()) {
          const unknownEnt = await objectPoolManager?.acquireProps(role, {
            position: new Vec3(0, 0, 0),
            rotation: new Quaternion(0, 0, 0, 1),
          });
          // console.log.*$
          unknownEnt?.owner.set(player);
          const unknownProp = unknownEnt?.as(AttachableEntity);
          if (unknownProp) {
            unknownProp.attachToPlayer(player, AttachablePlayerAnchor.Head);
            // console.log.*$
            unknownProp.socketAttachmentPosition.set(
              new Vec3(-0.04, 0.1, -0.085)
            );
            this.PlayerProps.set(player, unknownProp);
          }
        }
        break;
    }
    playerManager?.equipVacuumForFetcher(player, role as Role);
  }
}
Component.register(Manager_Props);
