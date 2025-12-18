import * as hz from "horizon/core";
import { AssetBundleGizmo } from "horizon/unity_asset_bundles";
import { hudManager } from "Managers_Instance";

export default class BagPackAnimator extends hz.Component<
  typeof BagPackAnimator
> {
  static propsDefinition = {
    vacuumBagEntity: {
      type: hz.PropTypes.Entity,
      required: true,
    },
    vacuumPipeEntity: {
      type: hz.PropTypes.Entity,
      required: true,
    },
    collider: {
      type: hz.PropTypes.Entity,
      required: true,
    },
    particleEffect: {
      type: hz.PropTypes.Entity,
      required: false,
    },
    vacuumSound: { type: hz.PropTypes.Entity, required: false },
    bagFullSound: { type: hz.PropTypes.Entity, required: false },
    collectSound: { type: hz.PropTypes.Entity, required: false },
  };

  public isVacuumActive: boolean = false;
  start() {
    this.props.particleEffect?.as(hz.ParticleGizmo).visible.set(false);
    this.props.particleEffect?.as(hz.ParticleGizmo).stop();
    // this.connectNetworkBroadcastEvent(
    //   ToggleFetcherVacuum,
    //   ({ fetcherPlayer, toggle }) => {
    //     // console.log.*$
    //     if (this.entity.owner.get().id === fetcherPlayer?.id) {
    //       this.vacuumOut(toggle!);
    //     }
    //   }
    // );
  }

  public playCollectSound() {
    this.props.collectSound?.as(hz.AudioGizmo).play();
  }

  public vacuumOut(condition: boolean) {
    // this.async.setTimeout(() => {
    //   this.props.collider?.collidable.set(condition);
    // }, 500);
    // Get the AssetBundleGizmo from this entity.
    const bagAsset = this.props.vacuumBagEntity!.as(AssetBundleGizmo);
    // const pipeAsset = this.props.vacuumPipeEntity!.as(AssetBundleGizmo);
    // Get the root instance to control animation parameters.
    const bagRoot = bagAsset?.getRoot();
    // const pipeRoot = pipeAsset?.getRoot();
    // console.log.*$
    if (bagRoot) {
      bagRoot.setAnimationParameterBool("Vaccum_throw", condition);
    }

    if (condition) {
      this.props.vacuumSound?.as(hz.AudioGizmo).play();
    } else {
      this.props.vacuumSound?.as(hz.AudioGizmo).stop();
    }

    this.isVacuumActive = condition;

    // if (pipeRoot) {
    //   pipeRoot.setAnimationParameterBool("pipe_out", condition);
    // }

    // this.props.vacuumGunEntity?.visible.set(condition);
    // this.props.particleEffect?.as(hz.ParticleGizmo).visible.set(condition);
    // if (condition) {
    //   this.async.setTimeout(() => {
    //     this.props.particleEffect?.as(hz.ParticleGizmo).play();
    //   }, 2000);
    // } else {
    //   this.props.particleEffect?.as(hz.ParticleGizmo).stop();
    // }
  }

  public playBagFullSound() {
    this.props.bagFullSound?.as(hz.AudioGizmo).play();
  }

  public vacuumThrow(condition: boolean) {
    // this.async.setTimeout(() => {
    //   this.props.collider?.collidable.set(condition);
    // }, 500);
    // Get the AssetBundleGizmo from this entity.
    const bagAsset = this.props.vacuumBagEntity!.as(AssetBundleGizmo);
    // const pipeAsset = this.props.vacuumPipeEntity!.as(AssetBundleGizmo);
    // Get the root instance to control animation parameters.
    const bagRoot = bagAsset?.getRoot();
    // const pipeRoot = pipeAsset?.getRoot();

    if (bagRoot) {
      bagRoot.setAnimationParameterBool("Vaccum_deposit", condition);
    }
    // if (pipeRoot) {
    //   pipeRoot.setAnimationParameterBool("pipe_out", condition);
    // }

    // this.props.vacuumGunEntity?.visible.set(condition);
    // this.props.particleEffect?.as(hz.ParticleGizmo).visible.set(condition);
    // if (condition) {
    //   this.async.setTimeout(() => {
    //     this.props.particleEffect?.as(hz.ParticleGizmo).play();
    //   }, 2000);
    // } else {
    //   this.props.particleEffect?.as(hz.ParticleGizmo).stop();
    // }
  }
}
hz.Component.register(BagPackAnimator);
