import * as hz from "horizon/core";
import {
  PlayerJoinedEvent
} from "Manager_Events";
import { hudManager, playerManager, propsManager } from "Managers_Instance";

export default class Manager_Theme extends hz.Component<typeof Manager_Theme> {
  static propsDefinition = {
    isChristmasSession: { type: hz.PropTypes.Boolean },
    isWinterSession: { type: hz.PropTypes.Boolean },
    christmasThemeAsset: { type: hz.PropTypes.Asset },
    winterDecorAsset: { type: hz.PropTypes.Asset },
    snowFightArea: { type: hz.PropTypes.Asset },
    snowManArea: { type: hz.PropTypes.Asset },
    christmasBg: { type: hz.PropTypes.Entity },
  };

  private isChristmasSession: boolean = false;
  private isWinterSession: boolean = false;

  async start() {

    this.isChristmasSession = this.props.isChristmasSession;
    this.isWinterSession = this.props.isWinterSession;

    // console.log.*$
    // console.log.*$

    if (this.isWinterSession) {
      await this.SetUpWintersDecor();
      const timeout = this.async.setTimeout(() => {
        if (hudManager) {
          hudManager?.attachSnowflakeHudToPlayer();
        } else {
          console.error("hudManager is not initialized");
        }
        hudManager?.markPlayerHudsVisible();
        this.async.clearTimeout(timeout);
      }, 5000);
    }

  }

  isChristmasSessionActive(): boolean {
    return this.isChristmasSession;
  }

  isWinterSessionActive(): boolean {
    return this.isWinterSession;
  }


  async SetUpWintersDecor() {
    this.connectLocalBroadcastEvent(PlayerJoinedEvent, ({ player }) => {
      hudManager?.attachSnowfightButtonUiToPlayer(player);
      const role = playerManager?.getRole(player);
      propsManager?.attachRoleProps(player, role!);

    });
  }

  playChristmasBg() {
    this.props.christmasBg?.as(hz.AudioGizmo).play();
  }

  stopChristmasBg() {
    this.props.christmasBg?.as(hz.AudioGizmo).stop();
  }
}

hz.Component.register(Manager_Theme);
