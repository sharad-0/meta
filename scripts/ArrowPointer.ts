import * as hz from "horizon/core";
import { playerManager } from "Managers_Instance";

export default class ArrowFollower extends hz.Component<typeof ArrowFollower> {
  static propsDefinition = {
    arrowParent: { type: hz.PropTypes.Entity }, // The parent entity to which the arrow is attached
    arrowMesh: { type: hz.PropTypes.Entity }, // The mesh entity representing the arrow
    particleFxEntity: { type: hz.PropTypes.Entity },
    localOffset: { type: hz.PropTypes.Vec3 }, // The local offset from the player where the arrow should appear
    lockToYAxis: { type: hz.PropTypes.Boolean, default: true }, // Whether to lock the arrow's rotation to the Y-axis
  };

  // Variables
  private particleFx: hz.ParticleGizmo | undefined = undefined;
  private arrowMesh: hz.Entity | null = null;
  private arrowParent: hz.Entity | null = null;
  private localOffset: hz.Vec3 = new hz.Vec3(0, -0.2, 1.2);
  private playerToFollow?: hz.Player;
  private updateSub?: hz.EventSubscription;
  private target: hz.Entity | null = null;

  preStart() {
    this.arrowMesh = this.props.arrowMesh ?? null;
    this.localOffset = this.props.localOffset ?? new hz.Vec3(0, -0.2, 1.2);
    this.arrowParent = this.props.arrowParent ?? null;
  }

  start() {
    this.particleFx = this.props.particleFxEntity?.as(hz.ParticleGizmo);

    // this.connectCodeBlockEvent(
    //   this.entity,
    //   hz.CodeBlockEvents.OnPlayerEnterWorld,
    //   (player: hz.Player) => {
    //     this.assignToPlayer(player);
    //   }
    // );
    this.arrowParent!.visible.set(false);
  }

  private assignToPlayer(player: hz.Player) {
    this.playerToFollow = player;

    // Attach the arrow to the player's head
    if (this.arrowParent) {
      this.arrowParent
        .as(hz.AttachableEntity)
        .attachToPlayer(player, hz.AttachablePlayerAnchor.Torso);
      this.arrowParent
        .as(hz.AttachableEntity)
        .socketAttachmentPosition.set(this.localOffset);
    }

    // Start the update loop to keep the arrow facing the target
    this.updateSub = this.connectLocalBroadcastEvent(
      hz.World.onUpdate,
      this.onUpdate.bind(this)
    );
  }

  private onUpdate() {
    if (!this.arrowMesh || !this.target || !this.playerToFollow) return;

    const arrowPos = this.arrowMesh.transform.position.get();
    const targetPos = this.target.transform.position.get();

    const lookAtPos = this.props.lockToYAxis
      ? new hz.Vec3(targetPos.x, arrowPos.y, targetPos.z)
      : targetPos;

    this.arrowMesh.lookAt(lookAtPos, hz.Vec3.up);

    const playerPos = this.playerToFollow.position.get();

    if (playerPos.distance(targetPos) < 1) {
      this.arrowParent!.visible.set(false);
      this.particleFx?.stop();
    }
    // } else {
    //   this.arrowParent!.visible.set(true);
    //   this.particleFx?.play();
    // }
  }

  public setTarget(target: hz.Entity) {
    this.target = target;
    // console.log.*$
    this.arrowParent!.visible.set(true);
    this.entity.visible.set(true);
    const player = playerManager?.getCurrentPlayers()[0];
    this.particleFx?.play();
    this.assignToPlayer(player!);
  }

  public setPointerTarget(target: hz.Entity, player: hz.Player) {
    this.target = target;
    // console.log.*$
    this.arrowParent!.visible.set(true);
    this.entity.visible.set(true);
    this.particleFx?.play();
    this.assignToPlayer(player!);
  }

  disableArrow() {
    this.arrowParent!.visible.set(false);
    this.particleFx?.stop();
    this.target = null;
    this.playerToFollow = undefined;
    if (this.updateSub) {
      this.updateSub.disconnect();
      this.updateSub = undefined;
    }
  }
}

hz.Component.register(ArrowFollower);
