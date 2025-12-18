import BagPackAnimator from "BagPackAnimator";
import CustomControls from "CustomControls";
import * as hz from "horizon/core";
import { Player } from "horizon/core";
import {
  ActivateFetcherControls,
  DeactivateFetcherControls,
  ToggleFetcherVacuum,
} from "Manager_Events";
import { hudManager, playerManager } from "Managers_Instance";

export default class Manager_VacuumControl extends hz.Component<
  typeof Manager_VacuumControl
> {
  static propsDefinition = {};

  private vacuumStates = new Map<Player, boolean>();
  private playerCustomControlComps = new Map<Player, hz.Entity>();
  start() {
    this.connectNetworkBroadcastEvent(
      ToggleFetcherVacuum,
      ({ fetcherPlayer }) => {
        // console.log.*$
        //   `Received ToggleFetcherVacuum event for player:`,
        //   fetcherPlayer?.name.get()
        // );
        if (fetcherPlayer) {
          this.setVacuumState(fetcherPlayer);
        }
      }
    );
  }

  public registerPlayerCustomControls(
    player: Player,
    customControlEntity: hz.Entity
  ) {
    if (!this.vacuumStates.has(player)) {
      this.vacuumStates.set(player, false);
    }
    if (customControlEntity) {
      this.playerCustomControlComps.set(player, customControlEntity);
    } else {
      console.warn(
        "CustomControls component not found on entity for player:",
        player.name.get()
      );
    }
  }

  public ActivateFetcherControls(player: Player) {
    hudManager?.getFetcherButtonUiCompForPlayer(player)?.setInactiveState();
    this.sendNetworkEvent(player, ActivateFetcherControls, {
      fetcherPlayer: player,
    });
  }

  public DeactivateFetcherControls(player: Player) {
    this.setVacuumDisabledState(player);
    this.sendNetworkEvent(player, DeactivateFetcherControls, {
      fetcherPlayer: player,
    });
  }

  public getVacuumState(player: Player): boolean {
    return this.vacuumStates.get(player) || false;
  }

  setVacuumDisabledState(player: Player) {
    this.vacuumStates.set(player, false);
    this.setVacuumIn(player);
    hudManager
      ?.getFetcherButtonUiCompForPlayer(player)
      ?.setDefaultDisabledState();
  }

  public setVacuumState(player: Player) {
    const currentState = this.getVacuumState(player);
    const state = !currentState;
    this.vacuumStates.set(player, state);
    if (state) {
      this.setVacuumOut(player);
    } else {
      this.setVacuumIn(player);
    }
  }

  setVacuumOut(player: Player) {
    const vacuumEntity = playerManager?.getVacuumEntityByPlayer(player);

    if (vacuumEntity) {
      const bagPackComp = vacuumEntity.getComponents(BagPackAnimator)[0];
      bagPackComp.vacuumOut(true);
      hudManager?.getFetcherButtonUiCompForPlayer(player)?.setActiveState();
    }
  }

  setVacuumIn(player: Player) {
    const vacuumEntity = playerManager?.getVacuumEntityByPlayer(player);

    if (vacuumEntity) {
      const bagPackComp = vacuumEntity.getComponents(BagPackAnimator)[0];
      bagPackComp.vacuumOut(false);
      hudManager?.getFetcherButtonUiCompForPlayer(player)?.setInactiveState();
    }
  }

  public uiButtonPressed(player: Player) {
    this.setVacuumState(player);
  }
}
hz.Component.register(Manager_VacuumControl);
