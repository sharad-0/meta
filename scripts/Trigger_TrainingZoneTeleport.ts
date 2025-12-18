import * as hz from 'horizon/core';
import { StartGroupTravelOptions, World2p } from 'horizon/2p';
import { Player } from 'horizon/core';

const MAXGROUPSIZE: number = 8
const worldId: string = "784299174756454"; // This should be the ID of the world you want to teleport to

class Trigger_TrainingZoneTeleport extends hz.Component {
  static propsDefinition = {};

  playerGroup: Player[] = []; // array that holds players to teleport

  private minGroupSize: number = 1
  private world2p: World2p | null = null;

  start() {
    this.world2p = new World2p(this.world);
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterTrigger,
      (enteredBy: hz.Player) => {
          this.onPlayerEnterTrigger(enteredBy);
      });
  }

  onPlayerEnterTrigger(player: hz.Player) {
    this.playerGroup.push(player);
    // console.log.*$
    if((this.playerGroup.length >= this.minGroupSize) || (this.playerGroup.length == MAXGROUPSIZE))
    {
      const options: StartGroupTravelOptions = {navigateToInviteOnlyInstance: false};
      if (this.world2p) {
        this.world2p.startGroupTravel(
          worldId,
          this.playerGroup,
          options
        );
      } else {
        console.error("world2p is null. Cannot start group travel.");
      }
    }
  }
}
hz.Component.register(Trigger_TrainingZoneTeleport);