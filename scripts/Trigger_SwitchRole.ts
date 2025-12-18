import { PlayerRoles } from "Enums_Game";
import { AreaEnterPayload, Turbo, TurboEvents } from "horizon/analytics";
import {
  CodeBlockEvents,
  Component,
  Entity,
  Player,
  PlayerVisibilityMode,
  PropTypes,
  TriggerGizmo,
} from "horizon/core";
import {
  ParlourClosedEvent,
  ParlourOpenedEvent,
  PlayerJoinedEvent,
  RushHourBegins,
} from "Manager_Events";
import {
  bagManager,
  gameManager,
  hapticsManager,
  hudManager,
  mainArenaManager,
  playerManager,
  propsManager,
  ringArrowManager,
  scooperHandManager,
  serverManager,
} from "Managers_Instance";

export let playersOnTrigger: Player[] = [];
export class Trigger_SwitchRole extends Component<typeof Trigger_SwitchRole> {
  static propsDefinition = {
    // roleSwitchUi: { type: PropTypes.Entity, required: true },
  };

  preStart() {
    // this.connectLocalBroadcastEvent(PlayerJoinedEvent, () =>
    //   this.UpdateVisibility()
    // );

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.OnPlayerEnterTrigger.bind(this)
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitTrigger,
      this.OnPlayerExitTrigger.bind(this)
    );

    // this.connectLocalBroadcastEvent(ParlourClosedEvent, () => {
    //   this.hideUi();
    // })

    this.connectLocalBroadcastEvent(ParlourOpenedEvent, () => {
      this.entity.as(TriggerGizmo).enabled.set(true);
    });
  }

  start() {
    // const roleSwitchUI = this.props.roleSwitchUi;
    // if (roleSwitchUI) {
    //   //// console.log.*$
    //   roleSwitchUI.setVisibilityForPlayers(
    //     playerManager?.getCurrentPlayers() ?? [],
    //     PlayerVisibilityMode.HiddenFrom
    //   );
    // }
  }

  OnPlayerEnterTrigger(player: Player) {
    const playerRec = playerManager?.getPlayerRecord(player);
    if (!mainArenaManager?.isParlourOpen()) {
      return;
    }
    if (playerManager?.getRole(player) != PlayerRoles.Unknown) {
      this.updateRole(player, PlayerRoles.Unknown);
      hudManager?.refreshHUD();
      return;
    }
    if (playerManager?.isFtueUiRequired(player)) return;
    if (!playersOnTrigger.includes(player)) {
      playersOnTrigger.push(player);

      ringArrowManager?.playerReachedArena(player);
    }
    //// console.log.*$
    // this.UpdateVisibility();
    this.updateRole(player, PlayerRoles.Server);
    hudManager?.refreshHUD();

    Turbo.send(TurboEvents.OnAreaEnter, {
      player: player,
      actionArea: "Parlour",
    } as AreaEnterPayload);
  }

  private updateRole(player: Player, role: PlayerRoles): void {
    const currRole = playerManager?.getRole(player);
    propsManager?.attachRoleProps(player, PlayerRoles[role], currRole!);

    switch (currRole) {
      case PlayerRoles.Scooper:
        scooperHandManager?.destroyItemAsset(player);
        break;
      case PlayerRoles.Server:
        // serverManager?.resetConePosition(player);
        serverManager?.onPlayerExitWorld(player, true); // Reset any server-specific state
        break;
      case PlayerRoles.Fetcher:
        bagManager?.dumpAllItems(player);
    }
    hapticsManager?.playStrongRumble(player);
    playerManager?.setRole(player, role);

    //// console.log.*$
  }

  OnPlayerExitTrigger(player: Player) {
    if (playersOnTrigger.includes(player)) {
      playersOnTrigger.splice(playersOnTrigger.indexOf(player), 1);
    }

    this.UpdateVisibility();
    //// console.log.*$
  }

  UpdateVisibility() {
    // const roleSwitchUI = this.props.roleSwitchUi;
    // if (roleSwitchUI) {
    //   roleSwitchUI.visible.set(true);
    //   roleSwitchUI.setVisibilityForPlayers(
    //     playersOnTrigger,
    //     PlayerVisibilityMode.VisibleTo
    //   );
    //   roleSwitchUI.setVisibilityForPlayers(
    //     this.getPlayersToHide(),
    //     PlayerVisibilityMode.HiddenFrom
    //   );
    // }
  }

  private getPlayersToHide(): Player[] {
    const idsOnTrigger = new Set(playersOnTrigger.map((p) => p.id)); // Use Set for fast lookup

    const allPlayers = this.world.getPlayers();
    const playersToHide = allPlayers.filter(
      (player) => !idsOnTrigger.has(player.id)
    );
    //// console.log.*$
    return playersToHide;
  }

  hideUi() {
    // playersOnTrigger = [];
    // const roleSwitchUI = this.props.roleSwitchUi;
    // if (roleSwitchUI) {
    //   roleSwitchUI.visible.set(false);
    // }
  }
}

Component.register(Trigger_SwitchRole);
