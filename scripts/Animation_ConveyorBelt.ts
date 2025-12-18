import { Component } from "horizon/core";
import { AssetBundleGizmo } from "horizon/unity_asset_bundles";

export default class Animation_ConveyorBelt extends Component<
  typeof Animation_ConveyorBelt
> {
  static propsDefinition = {};

  start() {}

  public animateBelt(condition: boolean) {
    // Get the AssetBundleGizmo from this entity.
    const beltAsset = this.entity.as(AssetBundleGizmo);
    // Get the root instance to control animation parameters.
    const beltRoot = beltAsset?.getRoot();

    if (beltRoot) {
      beltRoot.setAnimationParameterBool("conveyor_belt", condition);
    }
  }
}
Component.register(Animation_ConveyorBelt);
