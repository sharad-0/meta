import * as hz from 'horizon/core';
import { AssetBundleGizmo } from 'horizon/unity_asset_bundles';
import { PlayerSwitchedRoleEvent } from 'Manager_Events';

export class Component_SnowmanArrow extends hz.Component<typeof Component_SnowmanArrow> {
  static propsDefinition = {
    animObject: { type: hz.PropTypes.Entity },
    animationParameterName: { type: hz.PropTypes.String, default: "idle" },
    animationParameterCondition: { type: hz.PropTypes.Boolean, default: false },
  };

  start() {
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      () => {
        this.animateAsset();
      }
    );

    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitAFK,
      () => {
        this.animateAsset();
      }
    );

    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, () => {
      this.animateAsset();
    });

    const timer = this.async.setTimeout(() => {
      this.animateAsset();
      this.async.clearTimeout(timer);
    }, 1000);
  }

  animateAsset() {
    const assetBundle = this.props.animObject!.as(AssetBundleGizmo);
    const assetRoot = assetBundle?.getRoot();
    if (assetRoot) {
      assetRoot.setAnimationParameterBool(
        this.props.animationParameterName!,
        this.props.animationParameterCondition
      );
    } else {
      console.warn("Asset Root not found for animation.");
    }
  }
}
hz.Component.register(Component_SnowmanArrow);