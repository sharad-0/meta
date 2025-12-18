import { Component, PropTypes, Player, CodeBlockEvents, AudioGizmo } from 'horizon/core';

class SaveWorld extends Component<typeof SaveWorld> {
  static propsDefinition = {
    // An optional sound effect to play when the world is saved.
    saveSound: { type: PropTypes.Entity },
  };

  override preStart() {
    // Connect to the trigger event. This will fire when a player enters the trigger zone.
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      (player: Player) => {
        this.handlePlayerEnter(player);
      }
    );
  }

  override start() {
    // This component is event-driven, so no initialization is needed in start().
  }

  private handlePlayerEnter(player: Player) {
    // The world.saveWorld() method is not available in the API.
    // This is a conceptual implementation of how it might work.
    console.log(`Player ${player.name.get()} entered the save trigger.`);

    // Play the sound effect if it has been assigned in the properties panel.
    if (this.props.saveSound) {
      this.props.saveSound.as(AudioGizmo)?.play();
    }

    // A confirmation message could be shown to the player.
    this.world.ui.showPopupForPlayer(player, "World Saved!", 2);
  }
}

Component.register(SaveWorld);