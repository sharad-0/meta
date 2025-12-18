import { PlayerRoles } from "Enums_Game";
import * as hz from "horizon/core";
import {
  PropTypes,
  Player,
  TextureAsset,
  PlayerVisibilityMode,
} from "horizon/core";
import {
  Binding,
  ImageSource,
  UINode,
  Pressable,
  View,
  Image,
  Text,
  UIComponent,
} from "horizon/ui";
import {
  trainingManager,
  playerManager,
  utilityManager,
} from "Managers_Instance";

const desiredWidth = 300;
const aspectRatio = 405 / 150;
const calculatedHeight = desiredWidth / aspectRatio;

export type taskType = "Assign" | "Success" | "Failure";

export default class UI_FTUE_Task extends UIComponent<typeof UI_FTUE_Task> {
  static propsDefinition = {
    Fetcher_Task_1: { type: PropTypes.Asset },
    Fetcher_Task_1_Success: { type: PropTypes.Asset },
    Fetcher_Task_2: { type: PropTypes.Asset },
    Fetcher_Task_2_Success: { type: PropTypes.Asset },
    Fetcher_Task_3: { type: PropTypes.Asset },
    Fetcher_Task_3_Success: { type: PropTypes.Asset },

    Scooper_Task_1: { type: PropTypes.Asset },
    Scooper_Task_1_Success: { type: PropTypes.Asset },
    Scooper_Task_2: { type: PropTypes.Asset },
    Scooper_Task_2_Success: { type: PropTypes.Asset },
    Scooper_Task_3: { type: PropTypes.Asset },
    Scooper_Task_3_Success: { type: PropTypes.Asset },
    Scooper_Task_4: { type: PropTypes.Asset },
    Scooper_Task_4_Success: { type: PropTypes.Asset },
    Scooper_Task_5: { type: PropTypes.Asset },
    Scooper_Task_5_Success: { type: PropTypes.Asset },
    Scooper_Task_5_Failure: { type: PropTypes.Asset },
    Scooper_Task_6: { type: PropTypes.Asset },
    Scooper_Task_6_Success: { type: PropTypes.Asset },

    Server_Task_1: { type: PropTypes.Asset },
    Server_Task_1_Success: { type: PropTypes.Asset },
    Server_Task_2: { type: PropTypes.Asset },
    Server_Task_3: { type: PropTypes.Asset },
    Server_Task_2_Success: { type: PropTypes.Asset },
    Server_Task_3_Success: { type: PropTypes.Asset },
    Server_Task_4: { type: PropTypes.Asset },
    Server_Task_4_Success: { type: PropTypes.Asset },

    Unknown_Task: {
      type: PropTypes.Asset,
    },
    Unknown_Task_Success: { type: PropTypes.Asset },
  };

  private popupImageBinding = new Binding<ImageSource | null>(null);

  private currentStatusForPlayer = new Map<Player, number>();
  private playersSeeingUI: Player[] = [];

  marginPercent = "5%";
  initializeUI(): UINode {
    return View({
      style: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        bottom: this.marginPercent,
        right: this.marginPercent,
      },

      children: [
        Image({
          source: this.popupImageBinding,
          style: {
            width: desiredWidth,
            height: calculatedHeight,
          },
        }),
      ],
    });
  }

  async triggerPopup(
    player: Player,
    role: PlayerRoles,
    status: number,
    type: taskType
  ) {
    // console.log.*$

    const setPopup = (texture: TextureAsset) => {
      // if (texture === undefined) {
      //   // console.log.*$
      //   this.hideUI(player, type);
      //   return;
      // }
      this.popupImageBinding.set(ImageSource.fromTextureAsset(texture), [
        player,
      ]);
    };

    // Switch based on role
    switch (role) {
      case "Unknown": {
        const textureMap: Map<
          taskType,
          Record<number, TextureAsset | undefined>
        > = new Map([
          [
            "Assign",
            {
              1: this.props.Unknown_Task?.as(TextureAsset),
            },
          ],
          [
            "Success",
            {
              1: this.props.Unknown_Task_Success?.as(TextureAsset),
            },
          ],
        ]);
        const texture = textureMap.get("Assign")?.[1];
        if (texture) setPopup(texture);
        break;
      }

      case "Fetcher": {
        const textureMap: Map<
          taskType,
          Record<number, TextureAsset | undefined>
        > = new Map([
          [
            "Assign",
            {
              1: this.props.Fetcher_Task_1?.as(TextureAsset),
              2: this.props.Fetcher_Task_2?.as(TextureAsset),
              3: this.props.Fetcher_Task_3?.as(TextureAsset),
            },
          ],
          [
            "Success",
            {
              1: this.props.Fetcher_Task_1_Success?.as(TextureAsset),
              2: this.props.Fetcher_Task_2_Success?.as(TextureAsset),
              3: this.props.Fetcher_Task_3_Success?.as(TextureAsset),
            },
          ],
        ]);
        const texture = textureMap.get(type)?.[status];
        if (texture) setPopup(texture);
        break;
      }

      case "Scooper": {
        const textureMap: Map<
          taskType,
          Record<number, TextureAsset | undefined>
        > = new Map([
          [
            "Assign",
            {
              1: this.props.Scooper_Task_1?.as(TextureAsset),
              2: this.props.Scooper_Task_2?.as(TextureAsset),
              3: this.props.Scooper_Task_3?.as(TextureAsset),
              4: this.props.Scooper_Task_4?.as(TextureAsset),
              5: this.props.Scooper_Task_5?.as(TextureAsset),
            },
          ],
          [
            "Success",
            {
              1: this.props.Scooper_Task_1_Success?.as(TextureAsset),
              2: this.props.Scooper_Task_2_Success?.as(TextureAsset),
              3: this.props.Scooper_Task_3_Success?.as(TextureAsset),
              4: this.props.Scooper_Task_4_Success?.as(TextureAsset),
              5: this.props.Scooper_Task_5_Success?.as(TextureAsset),
            },
          ],
          [
            "Failure",
            {
              5: this.props.Scooper_Task_5_Failure?.as(TextureAsset),
            },
          ],
        ]);
        const texture = textureMap.get(type)?.[status];
        if (texture) setPopup(texture);
        break;
      }

      case "Server": {
        const textureMap: Map<
          taskType,
          Record<number, TextureAsset | undefined>
        > = new Map([
          [
            "Assign",
            {
              1: this.props.Server_Task_1?.as(TextureAsset),
              2: this.props.Server_Task_2?.as(TextureAsset),
              3: this.props.Server_Task_3?.as(TextureAsset),
              4: this.props.Server_Task_4?.as(TextureAsset),
            },
          ],
          [
            "Success",
            {
              1: this.props.Server_Task_1_Success?.as(TextureAsset),
              2: this.props.Server_Task_2_Success?.as(TextureAsset),
              3: this.props.Server_Task_3_Success?.as(TextureAsset),
              4: this.props.Server_Task_4_Success?.as(TextureAsset),
            },
          ],
        ]);
        const texture = textureMap.get(type)?.[status];
        if (texture) setPopup(texture);
        break;
      }
    }

    this.currentStatusForPlayer.set(player, status);
    this.playersSeeingUI.push(player);

    this.setUIVisibility();

    if (type === "Success" || type === "Failure") {
      await utilityManager?.sleep(1);
      this.hideUI(player, type);
    }
  }

  preStart(): void {
    this.entity.visible.set(true);
  }

  hideUI(player: Player, type: taskType) {
    const index = this.playersSeeingUI.findIndex((p) => p.id === player.id);
    if (index !== -1) {
      this.playersSeeingUI.splice(index, 1);
    }

    this.setUIVisibility();
    this.entity.visible.set(false);

    if (type === "Success") {
      trainingManager?.updatePlayerTaskStatus(
        player,
        this.currentStatusForPlayer.get(player) ?? 0
      );
    }
  }

  setUIVisibility() {
    const idsSeeingUI = new Set(this.playersSeeingUI.map((p) => p.id)); // Use Set for fast lookup

    const allPlayers = playerManager?.getCurrentPlayers() ?? [];
    const playersToHide = allPlayers.filter(
      (player) => !idsSeeingUI.has(player.id)
    );

    // console.log.*$
    //   "Players to hide task UI from:",
    //   playersToHide.map((p) => p.name)
    // );
    this.entity.setVisibilityForPlayers(
      playersToHide,
      PlayerVisibilityMode.HiddenFrom
    );
    // console.log.*$
    //   "Players to show task UI to:",
    //   this.playersSeeingUI.map((p) => p.name)
    // );
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
UIComponent.register(UI_FTUE_Task);
