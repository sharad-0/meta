import { CodeBlockEvents, Component, PropTypes, World } from "horizon/core";
import { AssetBundleGizmo } from "horizon/unity_asset_bundles";

export class UnityAnimationPlayer extends Component<
  typeof UnityAnimationPlayer
> {
  static propsDefinition = {
    animationParameterName: { type: PropTypes.String, default: "idle" },
    animationParameterCondition: { type: PropTypes.Boolean, default: false },
  };

  start() {
    this.async.setTimeout(() => {
      this.animateAsset();
    }, 1000);

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterWorld,
      () => {
        this.animateAsset();
      }
    );

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitAFK,
      () => {
        this.animateAsset();
      }
    );
  }

  animateAsset() {
    const assetBundle = this.entity.as(AssetBundleGizmo);
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

Component.register(UnityAnimationPlayer);
