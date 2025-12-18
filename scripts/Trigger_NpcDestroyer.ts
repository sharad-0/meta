import { CodeBlockEvents, Component, Entity, } from "horizon/core";
// import { DeleteNPC } from "Manager_Events";

class NpcDestroyer extends Component<typeof NpcDestroyer> {
  static propsDefinition = {};

  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnEntityEnterTrigger,
      this.OnEntityEnterTrigger.bind(this)
    );
  }

  start() {}

  OnEntityEnterTrigger(entity: Entity) {
    // Add code here that you want to run when an entity enters the trigger.
    // The entity will need to have a Gameplay Tag that matches the tag your
    // trigger is configured to detect.
    // // console.log.*$
    // this.sendLocalBroadcastEvent(DeleteNPC, { npc: entity });
    this.world.deleteAsset(entity, true).then(() => {
      // console.log.*$
    });
  }
}
Component.register(NpcDestroyer);
