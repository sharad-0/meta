import LocalCamera from 'horizon/camera';
import * as hz from 'horizon/core';

class LocalHorizonTVEntity extends hz.Component<typeof LocalHorizonTVEntity> {
  static propsDefinition = {
  };

  private owningPlayer!: hz.Player;

  start() {
    if (this.owningPlayer == null || this.owningPlayer == undefined)
      this.owningPlayer = this.entity.owner.get();


    if (this.owningPlayer == this.world.getServerPlayer())
      return;



    this.AttachCameraToEntity(this.world.getEntitiesWithTags(["DefaultCamera"])[0]);
  }

  private AttachCameraToEntity(target: hz.Entity) {
    if (target == null || target == undefined) {
      console.error("LocalPassiveInstance::AttachCameraToEntity - target is invalid.");
      return;
    }


    LocalCamera.setCameraModeAttach(target);
  }
}
hz.Component.register(LocalHorizonTVEntity);
