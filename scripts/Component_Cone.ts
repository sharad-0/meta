import * as hz from 'horizon/core';
import {
  AttachableEntity,
  AttachablePlayerAnchor,
  AvatarGripPose,
  DefaultPopupOptions,
  PlayerVisibilityMode,
  TextGizmo,
  CodeBlockEvents,
  Component,
  Player,
  PropTypes,
  SpawnPointGizmo,
  Vec3,
  World,
} from "horizon/core";
import { playerManager } from 'Managers_Instance';

export default class Component_Cone extends hz.Component<typeof Component_Cone> {
  static propsDefinition = {
    cone: { type: hz.PropTypes.Entity },
  };

  start() {
  }

  public attachConeToPlayer(player: Player) {
    const role = playerManager?.getPlayerRecord(player)?.role;
    if (!this.props.cone) {
      console.error("Component_Cone: Cone entity is not set.");
      return;
    }
    if (this.props.cone!) {
      const coneEntity = this.props.cone!.as(AttachableEntity)!;
      if (coneEntity) {
        if (role === "Scooper") {
          coneEntity.attachToPlayer(player, AttachablePlayerAnchor.Torso);
          player.setAvatarGripPoseOverride(AvatarGripPose.CarryLight);
        } else {
          // // console.log.*$
          //   `Detaching cone from player ${JSON.stringify(player.id)}`
          // );
          coneEntity.detach();
          coneEntity.position.set(new Vec3(0, -10, 0));
          player.clearAvatarGripPoseOverride();
        }
      }
    }
  }
}
hz.Component.register(Component_Cone);