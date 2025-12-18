import {
  CodeBlockEvents,
  Component,
  Player,
  PlayerVisibilityMode,
  PropTypes,
  Entity,
} from 'horizon/core';
import { playerManager } from 'Managers_Instance';

/**
 * ObjectiveMessage
 * 
 * This component shows a message (i.e., the entity it is attached to) to a player
 * when they enter a trigger zone and then hides it for that player after 4 seconds.
 * 
 * Key Features:
 * - Each player sees the message once.
 * - Message hides after 4 seconds for that player.
 * - Prevents repeated triggers per player.
 */
class ObjectiveMessage extends Component<typeof ObjectiveMessage> {
  
  // Exposed property to assign the trigger entity in the editor
  static propsDefinition = {
    triggerEntity: {
      type: PropTypes.Entity,
    },
  };

  // Keeps track of which players have already triggered the message
  private playerWhoHaveSeen: Set<Player> = new Set();

  /**
   * Called before 'start'. Connects the trigger zone's OnPlayerEnterTrigger event
   * to our handler function.
   */
  preStart(): void {
    const trigger = this.props.triggerEntity as Entity;

    if (trigger) {
      // // console.log.*$
      this.connectCodeBlockEvent(
        trigger,
        CodeBlockEvents.OnPlayerEnterTrigger,
        this.handlePlayerTrigger
      );
    } else {
      console.warn("[ObjectiveMessage] triggerEntity is not assigned in the editor.");
    }
  }

  /**
   * Currently unused, but reserved for future logic if needed.
   */
  start(): void {}

  /**
   * Called when a player enters the trigger zone.
   * Adds the player to the seen set and schedules the message to be hidden after 4 seconds.
   */
  private handlePlayerTrigger = (player: Player): void => {
    if (!this.playerWhoHaveSeen.has(player)) {
      // // console.log.*$

      this.playerWhoHaveSeen.add(player);
      this.updateVisibility(player);
    } else {
      // // console.log.*$
    }
  }

  /**
   * Hides the message for the given player after a 4-second delay.
   */
  private updateVisibility(player: Player): void {
    // // console.log.*$

    this.entity.setVisibilityForPlayers([player], PlayerVisibilityMode.VisibleTo);
    this.async.setTimeout(() => {
      // // console.log.*$
      this.entity.setVisibilityForPlayers(playerManager?.getCurrentPlayers() ?? [], PlayerVisibilityMode.HiddenFrom);
    }, 4000);
  }
}

Component.register(ObjectiveMessage);
