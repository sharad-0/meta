import { Component, PropTypes } from "horizon/core";
import { AssetBundleGizmo } from "horizon/unity_asset_bundles";

class Animation_Processor extends Component<typeof Animation_Processor> {
  static propsDefinition = {
    machineAsset: {
      type: PropTypes.Entity,
    },

    bowlAsset: {
      type: PropTypes.Entity,
    },

    blade: {
      type: PropTypes.Entity,
    }
  };

  start() {
    this.animateAssets(true);
  }

  animateAssets(condition: boolean) {
    const machineAsset = this.props.machineAsset!.as(AssetBundleGizmo);
    const bowlAsset = this.props.bowlAsset!.as(AssetBundleGizmo);
    const bladeAsset = this.props.blade!.as(AssetBundleGizmo);
    // Get the root instance to control animation parameters.
    const machineRoot = machineAsset?.getRoot();
    const bowlRoot = bowlAsset?.getRoot();
    const bladeRoot = bladeAsset?.getRoot();

    if (machineRoot) {
      machineRoot.setAnimationParameterBool("chocolate_machine", condition);
    }

    if (bladeRoot) {
      bladeRoot.setAnimationParameterBool("cone_machine", condition);
    }

    if (bowlRoot) {
      bowlRoot.setAnimationParameterBool("cone_machine", condition);    
    }
  }
}
Component.register(Animation_Processor);
