import {
  AnimationCallback,
  AnimationCallbackReasons,
  AvatarAnimationMask,
  Component,
  Player,
  PropTypes,
} from "horizon/core";

class Manager_PlayerAnimations extends Component<
  typeof Manager_PlayerAnimations
> {
  static propsDefinition = {
    sittingIdleAnim: { type: PropTypes.Asset },
    standToSitAnim: { type: PropTypes.Asset },
    sitToStandAnim: { type: PropTypes.Asset },
    eatingAnim: { type: PropTypes.Asset },
    scoopingIceCream: { type: PropTypes.Asset },
    scooperConeDrop: { type: PropTypes.Asset },
    scooperPuttingCream: { type: PropTypes.Asset },
    scooperPick: { type: PropTypes.Asset },
    vacuumHoldingAnimPose: { type: PropTypes.Asset },
    vacuumIdleAnimPose: { type: PropTypes.Asset },
  };

  start() {}

  public playSittingIdleAnim(player: Player) {
    if (this.props.sittingIdleAnim) {
      player.playAvatarAnimation(this.props.sittingIdleAnim, {
        looping: true,
        playRate: 1,
      });
    }
  }

  public playStandToSitAnim(
    player: Player,
    callbackFunction: AnimationCallback
  ) {
    if (this.props.standToSitAnim) {
      player.stopAvatarAnimation();
      player.playAvatarAnimation(this.props.standToSitAnim, {
        looping: false,
        playRate: 2,
        callback: callbackFunction,
      });
    }
  }

  public playSitToStandAnim(player: Player) {
    if (this.props.sitToStandAnim) {
      player.stopAvatarAnimation();
      player.playAvatarAnimation(this.props.sitToStandAnim, {
        looping: false,
        playRate: 2,
      });
    }
  }

  public playEatingAnim(player: Player) {
    if (this.props.eatingAnim) {
      // player.stopAvatarAnimation();
      player.playAvatarAnimation(this.props.eatingAnim, {
        looping: true,
        playRate: 1,
      });
    }
  }

  public playScoopingIceCreamAnim(player: Player) {
    if (this.props.scoopingIceCream) {
      player.stopAvatarAnimation();
      // console.log.*$
      //   `Playing scooping ice cream animation for player ${player.id}`
      // );
      player.playAvatarAnimation(this.props.scoopingIceCream, {
        looping: false,
        playRate: 1,
      });
    }
  }

  public playScooperConeDropAnim(player: Player, playRate: number) {
    if (this.props.scooperConeDrop) {
      player.playAvatarAnimation(this.props.scooperConeDrop, {
        looping: false,
        playRate: playRate,
        mask: AvatarAnimationMask.UpperBody,
      });
    }
  }

  public playScooperPuttingCreamAnim(player: Player, playRate: number) {
    if (this.props.scooperPuttingCream) {
      player.playAvatarAnimation(this.props.scooperPuttingCream, {
        looping: false,
        playRate: playRate,
      });
    }
  }

  public playScooperPickAnim(player: Player, playRate: number) {
    if (this.props.scooperPick) {
      // console.log.*$
      player.playAvatarAnimation(this.props.scooperPick, {
        looping: false,
        playRate: playRate,
        mask: AvatarAnimationMask.UpperBody,
      });
    }
  }

  public playVacuumHoldingPose(player: Player) {
    if (this.props.vacuumHoldingAnimPose) {
      // console.log.*$
      //   Playing vacuum holding pose animation for player ${player.id}
      // `);
      player.playAvatarAnimation(this.props.vacuumHoldingAnimPose, {
        looping: false,
        playRate: 1,
        mask: AvatarAnimationMask.UpperBody,
      });
    }
  }

  public playVacuumIdlePose(player: Player) {
    if (this.props.vacuumIdleAnimPose) {
      // console.log.*$
      //   Playing vacuum idle pose animation for player ${player.id}
      // `);
      player.playAvatarAnimation(this.props.vacuumIdleAnimPose, {
        looping: true,
        playRate: 1,
        mask: AvatarAnimationMask.UpperBody,
      });
    }
  }

  public stopAvatarAnimation(player: Player) {
    player.stopAvatarAnimation();
  }
}

Component.register(Manager_PlayerAnimations);
export default Manager_PlayerAnimations;
