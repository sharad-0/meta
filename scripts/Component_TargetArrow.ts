import * as hz from "horizon/core";

export default class Component_TargetArrow extends hz.Component<
  typeof Component_TargetArrow
> {
  static propsDefinition = {
    particleFx: { type: hz.PropTypes.Entity },
  };

  private particleFx: hz.ParticleGizmo | undefined = undefined;

  preStart(): void {
    this.entity.visible.set(false);
  }
  start() {
    this.particleFx = this.props.particleFx?.as(hz.ParticleGizmo);
    this.particleFx?.stop();
  }

  setArrowMarkerVisible(isVisible: boolean) {
    this.entity.visible.set(isVisible);
    if (isVisible) {
      this.particleFx?.play();
    } else {
      this.particleFx?.stop();
    }
  }
}
hz.Component.register(Component_TargetArrow);
