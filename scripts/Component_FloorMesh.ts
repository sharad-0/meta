import * as hz from "horizon/core";

export default class Component_FloorMesh extends hz.Component<
  typeof Component_FloorMesh
> {
  static propsDefinition = {
    meshEntity: { type: hz.PropTypes.Entity },
    fxEntity: { type: hz.PropTypes.Entity },
  };

  private meshEntity: hz.MeshEntity | null = null;

  preStart(): void {}

  start() {
    this.meshEntity = this.props.meshEntity?.as(hz.MeshEntity) ?? null;
    if (!this.meshEntity) {
      console.error(
        "Component_FloorMesh: meshEntity prop is not defined or is not a MeshEntity."
      );
    }
  }

  playFX() {
    if (this.props.fxEntity) {
      const particleSystem = this.props.fxEntity.as(hz.ParticleGizmo);
      if (particleSystem) {
        particleSystem.play();
      } else {
        console.error("Component_FloorMesh: fxEntity is not a ParticleGizmo.");
      }
    }
  }

  setTexture(textureAsset: hz.TextureAsset) {
    if (this.props.meshEntity!) {
      // console.log.*$
      this.props.meshEntity!.as(hz.MeshEntity).setTexture(textureAsset);
      // console.log.*$
    } else {
      console.error("Component_FloorMesh: meshEntity is not initialized.");
    }
  }
}
hz.Component.register(Component_FloorMesh);
