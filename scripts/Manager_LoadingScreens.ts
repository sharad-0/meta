import {
  Component,
  Player,
  PropTypes,
  Entity,
  PlayerVisibilityMode,
  CodeBlockEvents,
} from "horizon/core";
import UI_LoadingScreen from "UI_LoadingScreen";

export default class Manager_LoadingScreens extends Component<
  typeof Manager_LoadingScreens
> {
  static propsDefinition = {
    L1: { type: PropTypes.Entity, required: true },
    L2: { type: PropTypes.Entity, required: true },
    L3: { type: PropTypes.Entity, required: true },
    L4: { type: PropTypes.Entity, required: true },
    L5: { type: PropTypes.Entity, required: true },
    L6: { type: PropTypes.Entity, required: true },
    L7: { type: PropTypes.Entity, required: true },
    L8: { type: PropTypes.Entity, required: true },
  };

  private screens: Entity[] = [];
  private playersToIndex: Map<Player, number> = new Map();
  private assigned: (Player | null)[] = Array(8).fill(null);

  start() {
    // // Initialize screens for quick index access
    // this.screens[0] = this.props.L1!;
    // this.screens[1] = this.props.L2!;
    // this.screens[2] = this.props.L3!;
    // this.screens[3] = this.props.L4!;
    // this.screens[4] = this.props.L5!;
    // this.screens[5] = this.props.L6!;
    // this.screens[6] = this.props.L7!;
    // this.screens[7] = this.props.L8!;
    // // this.hideAllScreens();

    // this.connectCodeBlockEvent(
    //   this.entity,
    //   CodeBlockEvents.OnPlayerEnterWorld,
    //   (player) => {
    //     this.showLoadingScreenToPlayer(player);
    //   }
    // );

    // this.connectCodeBlockEvent(
    //   this.entity,
    //   CodeBlockEvents.OnPlayerExitWorld,
    //   (player) => {
    //     this.hideLoadingScreenFromPlayer(player);
    //   }
    // );

    // this.connectLocalBroadcastEvent(teleportedToArena, ({ player }) => {
    //   this.hideLoadingScreenFromPlayer(player);
    // });
  }

  hideAllScreens() {
    for (let i = 0; i < 8; i++) {
      this.screens[i].visible.set(false);
      this.assigned[i] = null;
    }
    this.playersToIndex.clear();
  }

  showLoadingScreenToPlayer(player: Player) {
    // console.log.*$
    if (this.playersToIndex.has(player)) return; // Already assigned

    for (let i = 0; i < 8; i++) {
      if (this.assigned[i] === null) {
        if (this.assigned[i] !== null) continue;
        // console.log.*$
        //   `Assigning loading screen ${i + 1} to player ${player.name.get()} , ${
        //     this.screens[i].id
        //   }, ${this.screens[i].visible.get()}`
        // );
        this.screens[i].setVisibilityForPlayers(
          [],
          PlayerVisibilityMode.VisibleTo
        );
        this.screens[i].setVisibilityForPlayers(
          [player],
          PlayerVisibilityMode.VisibleTo
        );
        this.screens[i].getComponents<UI_LoadingScreen>()[0].startAnimating();
        this.assigned[i] = player;
        this.playersToIndex.set(player, i);
        // console.log.*$
        //   `Assigned loading screen ${i + 1} to player ${player.name.get()} , ${
        //     this.screens[i].id
        //   }, ${this.screens[i].visible.get()}`
        // );
        this.screens[i].visible.set(true);
        return;
      }
    }
    // No available screens; can log or handle overflow if needed
  }

  hideLoadingScreenFromPlayer(player: Player) {
    const index = this.playersToIndex.get(player);
    if (index === undefined) return;
    this.screens[index].visible.set(false);
    this.assigned[index] = null;
    this.playersToIndex.delete(player);
  }
}
Component.register(Manager_LoadingScreens);
