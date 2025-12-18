import { NotificationTypes } from "Enums_Game";
import {
  Asset,
  AudioGizmo,
  Entity,
  ParticleGizmo,
  Player,
  PlayerVisibilityMode,
  TextureAsset,
} from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { hudManager, playerManager } from "Managers_Instance";

export default class UI_SnowmanHud extends UIComponent<typeof UI_SnowmanHud> {
  static propsDefinition = {};
  private playerNameBinding: Binding<string> = new Binding("");
  private snowmanStageBinding: Binding<string> = new Binding("0/50");
  private currentStage: number = 0;
  private player: Player | null = null;
  initializeUI(): UINode {
    return View({
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("1161663735537212")) as TextureAsset
          ),
          style: {
            height: "auto",
            width: "100%",
            aspectRatio: 230 / 115,

            position: "absolute",
          },
        }),
        Text({
          text: this.playerNameBinding,
          style: {
            fontSize: 72,
            textAlign: "center",
            textAlignVertical: "center",
            height: this.panelHeight,
            width: this.panelWidth,
            fontFamily: "Bangers",
            top: "-15%",

            position: "absolute",
            // backgroundColor: "rgba(0, 0, 0, 0.82)",
          },
        }),
        Text({
          text: this.snowmanStageBinding,
          style: {
            fontSize: 64,
            textAlign: "center",
            textAlignVertical: "center",
            height: this.panelHeight,
            width: this.panelWidth,
            fontFamily: "Bangers",
            top: "-39%",
            position: "absolute",

            // backgroundColor: "rgba(0, 0, 0, 0.82)",
          },
        }),
      ],
      style: {
        // backgroundColor: "black",
        height: "100%",
        width: "100%",
      },
    });
  }

  setPlayerName(player: Player) {
    const formattedName = this.formatName(player.name.get());
    this.playerNameBinding.set(formattedName);
    this.player = player;
    this.entity.visible.set(true);
    this.entity.setVisibilityForPlayers(
      [player],
      PlayerVisibilityMode.VisibleTo
    );
  }

  setSnowmanStage(
    stage: number,
    maxStage: number = 100,
    particleEffect: Entity,
    audioEntity: Entity
  ) {
    this.aniamteProgressToStage(stage, maxStage, audioEntity, particleEffect);
  }

  aniamteProgressToStage(
    targetStage: number,
    maxStage: number,
    audioEntity: Entity,
    particleEffect: Entity
  ) {
    const step = targetStage > this.currentStage ? 1 : 0;
    const diff = Math.abs(targetStage - this.currentStage);
    const interval = this.async.setInterval(() => {
      this.currentStage += step;
      this.snowmanStageBinding.set(`${this.currentStage}/${maxStage}`);
      if (this.currentStage === maxStage) {
        this.snowmanStageBinding.set(`Completed`);
      }
      if (this.currentStage === targetStage) {
        this.async.clearInterval(interval);
      }
      if (this.currentStage === maxStage) {
        audioEntity.as(AudioGizmo).play();
        particleEffect.as(ParticleGizmo).play();
        hudManager?.showDanceEmoteButtonUiToPlayer(this.player!);
        hudManager?.showPopupNotifToPlayer(
          NotificationTypes.CashEarned,
          this.player!,
          4
        );
        playerManager?.addCash(this.player!, 150);
      }
    }, 200);
  }

  resetUi() {
    this.currentStage = 0;
    this.snowmanStageBinding.set(`0/50`);
    this.playerNameBinding.set("");
  }

  formatName(name: string): string {
    if (name.length > 10) {
      return name.slice(0, 10) + "...";
    }
    return name;
  }
  aniamteProgress() { }
}
UIComponent.register(UI_SnowmanHud);
