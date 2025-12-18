import { NotificationTypes } from "Enums_Game";
import { VFXParticleGizmo } from "horizon/2p";
import {
  Asset,
  AudioGizmo,
  CodeBlockEvent,
  CodeBlockEvents,
  Color,
  Component,
  Entity,
  ParticleGizmo,
  PlayAnimationLocomotionOptions,
  Player,
  PlayerVisibilityMode,
  PropTypes,
  Quaternion,
  TextGizmo,
  Vec3,
} from "horizon/core";
import { AssetBundleGizmo } from "horizon/unity_asset_bundles";
import { PlayerEnteredSnowmanArea } from "Manager_Events";
import { hudManager, playerManager } from "Managers_Instance";
import UI_SnowmanHud from "UI_SnowmanHud";
import { UnityAnimationPlayer } from "UnityAnimationPlayer";
import { Component_SnowmanArrow } from "Component_SnowmanArrow";

export default class Component_SnowmanBuildingPlatform extends Component<
  typeof Component_SnowmanBuildingPlatform
> {
  player: Player | null = null;
  currentSnowmanStage: number = 0;
  maxStage: number = 50;
  animationMaxStage: number = 20;
  static propsDefinition = {
    snowmanHud: { type: PropTypes.Entity },
    platformTrigger: { type: PropTypes.Entity },
    snowmanAnimObject: { type: PropTypes.Entity },
    snowmanCompletedSfx: { type: PropTypes.Entity },
    snowmanCompletedVfx: { type: PropTypes.Entity },
    collider: { type: PropTypes.Entity },
    coinCollectSound: { type: PropTypes.Entity },
    coinAnimObject: { type: PropTypes.Entity },
    arrowVfx: { type: PropTypes.Entity },
  };
  private playerDanceAnimationAssets: Asset[] = [];
  playerOnPlatform: boolean = false;
  assetBundle: AssetBundleGizmo | null = null;
  private projectileTimer: number | null = null;
  private animationPlaying: Boolean = false;
  private _projectiles: Array<{
    entity: Entity;
    start: Vec3;
    control: Vec3;
    end: Vec3;
    t: number;
  }> = [];
  start() {
    // this.props.coinAnimObject?.visible.set(false);
    // this.entity.visible.set(false);
    // this.entity.collidable.set(false);
    // this.props.collider?.collidable.set(false);

    this.setSnowmanStage(0);
    if (this.props.platformTrigger) {
      this.connectCodeBlockEvent(
        this.props.platformTrigger,
        CodeBlockEvents.OnPlayerEnterTrigger,
        (player: Player) => {
          this.OnPlayerStepOnPlatform(player);
        }
      );

      this.connectCodeBlockEvent(
        this.props.platformTrigger,
        CodeBlockEvents.OnPlayerExitTrigger,
        (player: Player) => {
          this.playerOnPlatform = false;
          player.stopAvatarAnimation();
        }
      );
    }

    this.props.snowmanHud?.visible.set(false);
    this.props.snowmanHud?.setVisibilityForPlayers(
      [],
      PlayerVisibilityMode.VisibleTo
    );
    this.props.arrowVfx?.setVisibilityForPlayers(
      [],
      PlayerVisibilityMode.VisibleTo
    )
    this.assetBundle = this.entity.as(AssetBundleGizmo);
  }

  setPlayer(player: Player) {
    if (player) {
      this.player = player;
      this.entity.visible.set(true);
      this.entity.collidable.set(true);
      this.props.collider?.collidable.set(true);
      this.async.setTimeout(() => {
        this.setPlayerName(player);
      }, 2000);
    }
  }

  setPlayerName(player: Player) {
    if (this.props.snowmanHud) {
      this.props.snowmanHud
        .getComponents(UI_SnowmanHud)[0]
        .setPlayerName(player);
      this.props.arrowVfx?.visible.set(true);
      this.props.arrowVfx?.setVisibilityForPlayers(
        [],
        PlayerVisibilityMode.VisibleTo
      )
      this.props.arrowVfx?.setVisibilityForPlayers(
        [player],
        PlayerVisibilityMode.VisibleTo
      );
      this.props.arrowVfx?.getComponents(Component_SnowmanArrow)[0].animateAsset();
    }

    // this.OnPlayerStepOnPlatform(player);
  }

  OnPlayerStepOnPlatform(player: Player) {
    if (player && player !== this.player) return;
    if (this.playerOnPlatform) return;
    this.playerOnPlatform = true;

    const neededFlakes = this.maxStage - this.currentSnowmanStage;
    if (neededFlakes <= 0 || this.currentSnowmanStage >= this.maxStage) {
      this.world.ui.showPopupForPlayer(
        player,
        `Snowman is already built`,
        3,
        {
          position: new Vec3(0, 0.3, 0),
          fontSize: 2.5,
          backgroundColor: Color.fromHex("#f06363"),
        }
      );
      return
    };

    const playerFrostCoins = playerManager?.getSnowflake(player) ?? 0; // normalize to number
    if (playerFrostCoins <= 0) {
      // const popupOptions = {
      //   position: new Vec3(0, 0.3, 0),
      //   fontSize: 2.5,
      //   backgroundColor: Color.fromHex("#f06363"),
      // };
      // this.world.ui.showPopupForPlayer(
      //   player,
      //   `A minimum of 3 frost coins \n are required to start building`,
      //   3,
      //   popupOptions
      // );
      hudManager?.showPopupNotifToPlayer(
        NotificationTypes.SnowmanBuildRequirement,
        player,
        3
      );
      return;
    }
    let upgradeBy = 0;
    if (neededFlakes <= playerFrostCoins) {
      upgradeBy = neededFlakes; // case 1
    } else if (playerFrostCoins >= 3) {
      upgradeBy = playerFrostCoins; // case 2
    } else {
      hudManager?.showPopupNotifToPlayer(
        NotificationTypes.SnowmanBuildRequirement,
        player,
        3
      );
      return; // not enough coins to partial-upgrade
    }
    this.playCoinAnimation();
    playerManager?.deductSnowflake(player, upgradeBy);
    this.upgradeSnowman(upgradeBy);

    this.async.setTimeout(() => {
      this.props.coinAnimObject?.visible.set(false);
      this.animationPlaying = false;
    }, 1500);
  }

  upgradeSnowman(upgradeBy: number) {
    let newStage = this.currentSnowmanStage + upgradeBy;
    if (newStage >= this.maxStage) {
      newStage = this.maxStage;
      this.OnMaxStage();
    } else {
      playerManager?.updateSnowmanState(this.player!, false);
    }
    this.setSnowmanStage(newStage);
    this.props.arrowVfx?.visible.set(false);
  }

  OnMaxStage() {
    playerManager?.updateSnowmanState(this.player!, true);
    this.sendNetworkEvent(this.player!, PlayerEnteredSnowmanArea, {
      player: this.player!,
    });

    // if (playerManager?.isAllSnowmanCompleted()) {
    //   this.world
    //     .getEntitiesWithTags(["Santa"])[0]
    //     ?.getComponents(UnityAnimationPlayer)[0]
    //     .animateAsset();
    // }
  }

  setSnowmanStage(stage: number) {
    this.currentSnowmanStage = stage;
    if (this.props.snowmanHud) {
      this.props.snowmanHud
        .getComponents(UI_SnowmanHud)[0]
        .setSnowmanStage(
          stage,
          this.maxStage,
          this.props.snowmanCompletedVfx!,
          this.props.snowmanCompletedSfx!
        );
    }
    this.playSnowmanAnimation();
  }

  playSnowmanAnimation() {
    const animObj = this.props.snowmanAnimObject;
    if (animObj) {
      const assetBundle = animObj.as(AssetBundleGizmo);
      const assetRoot = assetBundle?.getRoot();
      const snowmanLevel = Math.floor(this.currentSnowmanStage / 2.5);
      if (assetRoot) {
        assetRoot.setAnimationParameterInteger("snowman", snowmanLevel);
      } else {
        console.warn("Asset Root not found for animation.");
      }
    }
  }

  resetSnowman() {
    // Add this line to reset the stage
    this.currentSnowmanStage = 0;
    this.playerOnPlatform = false;
    this.player = null; // Also clear the player reference

    if (this.props.snowmanHud) {
      this.props.snowmanHud.getComponents(UI_SnowmanHud)[0].resetUi();
      this.props.snowmanHud?.visible.set(false);
      this.props.snowmanHud?.setVisibilityForPlayers(
        [],
        PlayerVisibilityMode.VisibleTo
      );
    }

    // Reset the animation to stage 0
    this.playSnowmanAnimation();

    // Hide arrow VFX
    this.props.arrowVfx?.visible.set(false);
  }


  playCoinAnimation() {
    if (this.animationPlaying) return;
    this.animationPlaying = true;
    const coinAnimObj = this.props.coinAnimObject;
    if (coinAnimObj) {
      const assetBundle = coinAnimObj.as(AssetBundleGizmo);
      const assetRoot = assetBundle?.getRoot();
      if (assetRoot) {
        assetRoot.resetAnimationParameterTrigger("coin");

        assetRoot.setAnimationParameterBool("coin", true);
        // this.async.setTimeout(() => {
        this.props.coinAnimObject?.visible.set(true);
        this.props.coinCollectSound!.as(AudioGizmo).play();

        // }, 250);
      } else {
        console.warn("Asset Root not found for coin animation.");
      }
    }
  }

  stopCoinAnimation() {
    this.props.coinAnimObject?.visible.set(false);
    this.animationPlaying = false;
    const coinAnimObj = this.props.coinAnimObject;
    if (coinAnimObj) {
      const assetBundle = coinAnimObj.as(AssetBundleGizmo);
      const assetRoot = assetBundle?.getRoot();
      if (assetRoot) {
        assetRoot.setAnimationParameterBool("coin", false);
        assetRoot.resetAnimationParameterTrigger("coin");
      } else {
        console.warn("Asset Root not found for coin animation.");
      }
    }
  }
}
Component.register(Component_SnowmanBuildingPlatform);
