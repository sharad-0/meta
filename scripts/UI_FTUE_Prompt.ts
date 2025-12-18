import {
  Text,
  UIComponent,
  UINode,
  View,
  Binding,
  Image,
  ImageSource,
  Pressable,
  DimensionValue,
} from "horizon/ui";
import {
  PropTypes,
  TextureAsset,
  Player,
  PlayerVisibilityMode,
} from "horizon/core";
import { PlayerRoles, Role } from "Enums_Game";
import { playerManager, trainingManager } from "Managers_Instance";

export const desiredWidth = 500;
const aspectRatio = 1032.5 / 388;
export const calculatedHeight = desiredWidth / aspectRatio;

export default class UI_FTUE_Prompt extends UIComponent<typeof UI_FTUE_Prompt> {
  static propsDefinition = {
    Fetcher_Prompt_1: { type: PropTypes.Asset },
    Fetcher_Prompt_2: { type: PropTypes.Asset },

    Scooper_Prompt_1: { type: PropTypes.Asset },
    Scooper_Prompt_2: { type: PropTypes.Asset },

    Server_Prompt_1: { type: PropTypes.Asset },
    Server_Prompt_2: { type: PropTypes.Asset },
    Server_Prompt_3: { type: PropTypes.Asset },

    Unknown_Prompt_1: { type: PropTypes.Asset },
    Unknown_Prompt_2: { type: PropTypes.Asset },
  };

  private popupImageBinding = new Binding<ImageSource | null>(null);

  private currentStatusForPlayer = new Map<Player, number>();
  private playersSeeingUI: Player[] = [];

  initializeUI(): UINode {
    return Pressable({
      onClick: (player: Player) => {
        const index = this.playersSeeingUI.findIndex((p) => p.id === player.id);
        if (index !== -1) {
          this.playersSeeingUI.splice(index, 1);
        }

        this.setUIVisibility();

        trainingManager?.updatePlayerPromptStatus(
          player,
          this.currentStatusForPlayer.get(player) ?? 0
        );
      },
      style: {
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        position: "relative",
        zIndex: 50,
      },
      children: [this.promptUI(), this.tapToContinueText()],
    });
  }

  tapToContinueText() {
    return View({
      style: {
        right: "5%",
        bottom: "5%",
        position: "absolute",
        padding: "2%",
      },

      children: Text({
        text: "Tap to continue",
        style: {
          fontFamily: "Bangers",
          fontSize: 30,
          textAlign: "center",
          alignSelf: "center",
        },
      }),
    });
  }

  promptUI(): UINode {
    return View({
      style: {
        flex: 1,
        alignItems: "flex-start",
        justifyContent: "flex-start",
        top: "20%",
        left: "3%",
        position: "absolute",
      },
      children: [
        Image({
          source: this.popupImageBinding,
          style: {
            width: desiredWidth,
            height: calculatedHeight,
            borderRadius: 12,
          },
        }),
      ],
    });
  }

  triggerPopup(player: Player, role: PlayerRoles, status: number) {
    // console.log.*$

    const setPopup = (texture: TextureAsset) => {
      this.popupImageBinding.set(ImageSource.fromTextureAsset(texture), [
        player,
      ]);
    };

    // Switch based on role
    switch (role) {
      case "Unknown":
        const textureMap: Record<number, TextureAsset | undefined> = {
          1: this.props.Unknown_Prompt_1?.as(TextureAsset),
          2: this.props.Unknown_Prompt_2?.as(TextureAsset),
        };
        const texture = textureMap[status];
        if (texture) setPopup(texture);
        break;

      case "Fetcher": {
        const textureMap: Record<number, TextureAsset | undefined> = {
          1: this.props.Fetcher_Prompt_1?.as(TextureAsset),
          2: this.props.Fetcher_Prompt_2?.as(TextureAsset),
        };
        const texture = textureMap[status];
        if (texture) setPopup(texture);
        break;
      }

      case "Scooper": {
        const textureMap: Record<number, TextureAsset | undefined> = {
          1: this.props.Scooper_Prompt_1?.as(TextureAsset),
          2: this.props.Scooper_Prompt_2?.as(TextureAsset),
        };
        const texture = textureMap[status];
        if (texture) setPopup(texture);
        break;
      }

      case "Server": {
        const textureMap: Record<number, TextureAsset | undefined> = {
          1: this.props.Server_Prompt_1?.as(TextureAsset),
          2: this.props.Server_Prompt_2?.as(TextureAsset),
          3: this.props.Server_Prompt_3?.as(TextureAsset),
        };
        const texture = textureMap[status];
        if (texture) setPopup(texture);
        break;
      }
    }

    this.currentStatusForPlayer.set(player, status);
    this.playersSeeingUI.push(player);

    this.setUIVisibility();
  }

  preStart(): void {
    this.entity.visible.set(true);
  }

  setUIVisibility() {
    const idsSeeingUI = new Set(this.playersSeeingUI.map((p) => p.id)); // Use Set for fast lookup

    const allPlayers = playerManager?.getCurrentPlayers() ?? [];
    const playersToHide = allPlayers.filter(
      (player) => !idsSeeingUI.has(player.id)
    );

    this.entity.setVisibilityForPlayers(
      playersToHide,
      PlayerVisibilityMode.HiddenFrom
    );
    this.entity.setVisibilityForPlayers(
      this.playersSeeingUI,
      PlayerVisibilityMode.VisibleTo
    );

    this.entity.visible.set(true);
  }

  start(): void {
    // console.log.*$
  }
}
UIComponent.register(UI_FTUE_Prompt);
