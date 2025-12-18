import { PlayerRoles } from "Enums_Game";
import {
  CodeBlockEvents,
  Component,
  Entity,
  Player,
  PlayerVisibilityMode,
  PropTypes,
  World
} from "horizon/core";
import { playerManager } from "Managers_Instance";

const playersInStation: Player[] = [];

class FetcherTriggerScript extends Component<typeof FetcherTriggerScript> {
  static propsDefinition = {
    vaccumHud: { type: PropTypes.Entity },
  };

  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.OnPlayerEnterTrigger.bind(this)
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitTrigger,
      this.onPlayerExitTrigger.bind(this)
    );

    playersInStation.length = 0; // Clear the playersInStation array
  }

  start() {
    this.props.vaccumHud!.visible.set(true);
    this.props.vaccumHud!.setVisibilityForPlayers(
      playerManager?.getCurrentPlayers() ?? [],
      PlayerVisibilityMode.HiddenFrom
    );
    
  }

  OnPlayerEnterTrigger(player: Player) {
    if (playerManager?.getRole(player) === PlayerRoles.Unknown) {
      playerManager?.setRole(player, PlayerRoles.Fetcher);
    }

    if(playerManager?.getRole(player) !== PlayerRoles.Fetcher) {
      // // console.log.*$
      return; // Exit if the player is not a Fetcher
    }

    // if (!playersInStation.includes(player)) {
    //   playersInStation.push(player); // Add player to the list of players in the station
    // }

    // // get the players that are not in this station
    // const playersNotInStation = playerManager?.getCurrentPlayers();

    // this.props.vaccumHud!.setVisibilityForPlayers(
    //   playersNotInStation,
    //   PlayerVisibilityMode.HiddenFrom
    // );

    // // this.props.vaccumHud?.owner.set(player); // Set the owner of the HUD to the player who entered the trigger
    this.props.vaccumHud!.setVisibilityForPlayers(
      [player],
      PlayerVisibilityMode.VisibleTo
    );
    // // console.log.*$
  }

  onPlayerExitTrigger(player: Player) {
    // if(playerManager?.getRole(player) !== "Fetcher") {
    //   // console.log.*$
    //   return; // Exit if the player is not a Fetcher
    // }

    // const index = playersInStation.indexOf(player);
    // if (index !== -1) {
    //   playersInStation.splice(index, 1);
    // }

    // // console.log.*$
  }

  private updateVisibility(player: Player): void {
    // this.props.vaccumHud!.setVisibilityForPlayers(
    //   playerManager?.getCurrentPlayers(),
    //   PlayerVisibilityMode.HiddenFrom
    // );
    // this.props.vaccumHud!.setVisibilityForPlayers(playersInStation, PlayerVisibilityMode.VisibleTo);
  }
}
Component.register(FetcherTriggerScript);
