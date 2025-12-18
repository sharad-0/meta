import { PlayerRoles } from "Enums_Game";
import * as hz from "horizon/core";
import { spawnPointReady } from "Manager_Events";
import UI_SwitchRole from "UI_SwitchRole";

class Component_SpawnPoint extends hz.Component<typeof Component_SpawnPoint> {
  static propsDefinition = {
    spawnPointType: { type: hz.PropTypes.String, required: true },
  };

  start() {
    const spawnPointType = this.props.spawnPointType as PlayerRoles;
    this.sendLocalBroadcastEvent(spawnPointReady, {
      spawnPointType: spawnPointType,
      spawnPointEntity: this.entity,
    });
  }
}
hz.Component.register(Component_SpawnPoint);
