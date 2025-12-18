import BagPackAnimator from "BagPackAnimator";
import { PlayerRoles } from "Enums_Game";
import { CameraMode } from "horizon/camera";
import {
  AvatarGripPose,
  CodeBlockEvents,
  Component,
  Entity,
  Player,
} from "horizon/core";
import {
  gameManager,
  hudManager,
  playerManager,
  vacuumController,
} from "Managers_Instance";
import { ActivateFetcherControls } from "Manager_Events";
import { PlayerCameraEvents } from "PlayerCamera";

class Trigger_WholeFetchingArea extends Component<
  typeof Trigger_WholeFetchingArea
> {
  static propsDefinition = {};

  preStart() {
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
  }

  start() {}

  OnPlayerEnterTrigger(player: Player) {
    const playerRole = playerManager?.getRole(player);

    if (playerRole !== PlayerRoles.Fetcher) return;

    const vacuumEntity = playerManager?.getVacuumEntityByPlayer(player);

    if (vacuumEntity) {
      // const bagPackComp = vacuumEntity.getComponents(BagPackAnimator)[0];
      // bagPackComp.vacuumOut(true);

      // hudManager?.showFetcherButtonUiToPlayer(player);
      if (gameManager?.isThisTrainingSession()) {
        vacuumController?.setVacuumState(player);
      } else {
        vacuumController?.ActivateFetcherControls(player);
      }
    }
  }

  OnPlayerExitTrigger(player: Player) {
    const playerRole = playerManager?.getRole(player);

    if (playerRole !== PlayerRoles.Fetcher) return;
    const vacuumEntity = playerManager?.getVacuumEntityByPlayer(player);
    if (vacuumEntity) {
      // if (gameManager?.isThisTrainingSession()) {
      //   vacuumController?.setVacuumState(player);
      // } else {
      vacuumController?.DeactivateFetcherControls(player);

      // const bagPackComp = vacuumEntity.getComponents(BagPackAnimator)[0];
      // bagPackComp.vacuumOut(false);
      // this.sendNetworkBroadcastEvent(DeactivateFetcherControls, {
      //   fetcherPlayer: player,
      // });
      // hudManager?.setFetcherDisabledStateForPlayer(player);
    }
  }
}
Component.register(Trigger_WholeFetchingArea);
