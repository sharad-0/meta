import { CodeBlockEvents, Component, Entity, Player, PropTypes, SpawnPointGizmo } from 'horizon/core';

class Trigger_MainArenaTeleport extends Component<typeof Trigger_MainArenaTeleport>{
  static propsDefinition = {
    spawnPoint: { type: PropTypes.Entity, required: true },
  };

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, this.OnPlayerEnterTrigger.bind(this));
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnEntityEnterTrigger, this.OnEntityEnterTrigger.bind(this));
  }

  start() {

  }

  OnPlayerEnterTrigger(player: Player) {
    // console.log.*$

    if (!this.props.spawnPoint) {
      console.error('Spawn point is not defined.');
      return;
    }

    // Teleport the player to the spawn point.
    // console.log.*$
    this.props.spawnPoint!.as(SpawnPointGizmo)
          .teleportPlayer(player);
  }

  OnEntityEnterTrigger(entity: Entity) {
    // Add code here that you want to run when an entity enters the trigger.
    // The entity will need to have a Gameplay Tag that matches the tag your
    // trigger is configured to detect.
    // console.log.*$
  }
}
Component.register(Trigger_MainArenaTeleport);