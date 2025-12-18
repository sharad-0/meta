import {
  Component,
  Entity,
  Vec3,
  CodeBlockEvents,
  PropTypes,
  ParticleGizmo,
} from "horizon/core";
import { AssetBundleGizmo } from "horizon/unity_asset_bundles";
import { monsterPulledIn, setMonsterIndex } from "Manager_Events";

export default class MonsterMinimal extends Component<typeof MonsterMinimal> {
  static propsDefinition = {
    unityAsset: { type: PropTypes.Entity },
    entityTrigger: { type: PropTypes.Entity },
    itemKey: { type: PropTypes.String },
    particleEffect: { type: PropTypes.Entity }
  } as const;

  private monsterIndex: number = -1;

  start() {
    this.connectLocalEvent(
      this.entity,
      setMonsterIndex,
      (data: { index: number }) => {
        this.monsterIndex = data.index;
      }
    );

    if (this.props.entityTrigger) {
      this.connectCodeBlockEvent(
        this.props.entityTrigger,
        CodeBlockEvents.OnEntityEnterTrigger,
        (entity: Entity) => this.onPulled(entity)
      );
    }

    this.async.setTimeout(() => {
      const assetBundle = this.props.unityAsset?.as(AssetBundleGizmo);
      const assetRoot = assetBundle?.getRoot();
      if (assetRoot) {
        assetRoot.setAnimationParameterBool('idle', false);
        assetRoot.setAnimationParameterBool('walk', true);
        assetRoot.setAnimationParameterBool('shrink', false);
      }
    });
  }

  onPulled(entity: Entity) {
    this.sendLocalBroadcastEvent(monsterPulledIn, {
      monsterEntity: this.entity,
      targetEntity: entity,
      monsterIndex: this.monsterIndex,
      itemKey: this.props.itemKey
    });
  }

  public triggerParticleEffect(){
    this.props.particleEffect?.as(ParticleGizmo)?.play();
  }

  public resetParticleEffect(){
    this.props.particleEffect?.as(ParticleGizmo)?.stop();
  }
}

Component.register(MonsterMinimal);
