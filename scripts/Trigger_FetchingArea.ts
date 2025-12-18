import * as hz from "horizon/core";
import { Player } from "horizon/core";

class FetchingAreaTrigger extends hz.Component<typeof FetchingAreaTrigger> {
  static propsDefinition = {};
  private vacuumSound: hz.AudioGizmo | null = null;

  start() {
    this.vacuumSound = this.world
      .getEntitiesWithTags(["VacuumSound"])[0]
      .as(hz.AudioGizmo);
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterTrigger,

      this.playerEnterTrigger.bind(this)
    );
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitTrigger,
      this.playerExitTrigger.bind(this)
    );
  }

  playSound() {
    if (this.vacuumSound) {
      this.vacuumSound.play();
    } else {
      console.warn("Vacuum sound not found.");
    }
  }
  stopSound() {
    if (this.vacuumSound) {
      this.vacuumSound.stop();
    } else {
      console.warn("Vacuum sound not found.");
    }
  }

  playerExitTrigger(player: Player) {
    this.stopSound();
  }

  playerEnterTrigger(player: Player) {
    this.playSound();
  }
}
hz.Component.register(FetchingAreaTrigger);
