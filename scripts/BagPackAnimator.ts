import * as hz from "horizon/core";
import { Player } from "horizon/core";
import { AssetBundleGizmo } from "horizon/unity_asset_bundles";
import HUD_FetcherVacuum from "Hud_FetcherVacuum";
import { hudManager } from "Managers_Instance";

export default class BagPackAnimator extends hz.Component<
  typeof BagPackAnimator
> {
  static propsDefinition = {
    vacuumGunEntity: {
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
    fetcherHud: { type: hz.PropTypes.Entity, required: false },
    strip1: { type: hz.PropTypes.Entity, required: false },
    strip2: { type: hz.PropTypes.Entity, required: false },
    strip3: { type: hz.PropTypes.Entity, required: false },
    strip4: { type: hz.PropTypes.Entity, required: false },
    strip5: { type: hz.PropTypes.Entity, required: false },
  };

  public isVacuumActive: boolean = false;
  public fetcherHudComponent: HUD_FetcherVacuum | undefined;
  start() {
    this.props.particleEffect?.as(hz.ParticleGizmo).visible.set(false);
    this.props.particleEffect?.as(hz.ParticleGizmo).stop();
    if (this.props.fetcherHud) {
      this.fetcherHudComponent = this.props.fetcherHud.getComponents(HUD_FetcherVacuum)[0];
    }

    // this.async.setTimeout(() => {
    //   this.animateGunForItems(5);
    //   this.vacuumOut(true);
    //   this.async.setTimeout(() => {
    //     this.vacuumOut(false);
    //     this.animateGunForItems(3);
    //   }, 2000);
    // }, 500);
  }

  public setPlayer(player: Player | undefined) {
    if (!this.fetcherHudComponent && this.props.fetcherHud) {
      this.fetcherHudComponent = this.props.fetcherHud.getComponents(HUD_FetcherVacuum)[0];
    }

    this.fetcherHudComponent?.setPlayer(player);
  }

  public playCollectSound() {
    this.props.collectSound?.as(hz.AudioGizmo).play();
  }

  public vacuumOut(condition: boolean) {
    // this.async.setTimeout(() => {
    //   this.props.collider?.collidable.set(condition);
    // }, 500);
    // Get the AssetBundleGizmo from this entity.
    const bagAsset = this.props.vacuumGunEntity!.as(AssetBundleGizmo);
    // const pipeAsset = this.props.vacuumPipeEntity!.as(AssetBundleGizmo);
    // Get the root instance to control animation parameters.
    const bagRoot = bagAsset?.getRoot();
    // // const pipeRoot = pipeAsset?.getRoot();
    // // console.log.*$
    if (bagRoot) {
      bagRoot.setAnimationParameterBool("fetcher", condition);
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

    // const bagAsset = this.props.vacuumGunEntity!.as(AssetBundleGizmo);
    // const bagRoot = bagAsset?.getRoot();
    // if (bagRoot) {
    //   bagRoot.setAnimationParameterBool("deposite", condition);

    // }
    // if (!condition) {
    //   const timeout = this.async.setTimeout(() => {
    //     bagRoot.resetAnimationParameterTrigger("deposite", false);
    //     this.async.clearTimeout(timeout);
    //   }, 2000);
    // }

  }

  public animateGunForItems(itemCount: number) {
    const strip1 = this.props.strip1!.as(AssetBundleGizmo);
    const strip2 = this.props.strip2!.as(AssetBundleGizmo);
    const strip3 = this.props.strip3!.as(AssetBundleGizmo);
    const strip4 = this.props.strip4!.as(AssetBundleGizmo);
    const strip5 = this.props.strip5!.as(AssetBundleGizmo);
    const stripRoot1 = strip1?.getRoot();
    const stripRoot2 = strip2?.getRoot();
    const stripRoot3 = strip3?.getRoot();
    const stripRoot4 = strip4?.getRoot();
    const stripRoot5 = strip5?.getRoot();
    if (stripRoot1) {
      stripRoot1.setAnimationParameterBool("strip1", itemCount > 0);
    }
    if (stripRoot2) {
      stripRoot2.setAnimationParameterBool("strip2", itemCount > 1);
    }
    if (stripRoot3) {
      stripRoot3.setAnimationParameterBool("strip3", itemCount > 2);
    }
    if (stripRoot4) {
      stripRoot4.setAnimationParameterBool("strip4", itemCount > 3);
    }
    if (stripRoot5) {
      stripRoot5.setAnimationParameterBool("strip5", itemCount > 4);
    }
  }
}
hz.Component.register(BagPackAnimator);
