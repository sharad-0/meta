import { PlayerRoles } from "Enums_Game";
import { Entity } from "horizon/core";
import * as hz from "horizon/core";
import { gameManager, playerManager, trainingManager } from "Managers_Instance";

class DoorTrigger extends hz.Component<typeof DoorTrigger> {
  static propsDefinition = {
    door: { type: hz.PropTypes.Entity },
    trigger: { type: hz.PropTypes.Entity },
    slideDistance: { type: hz.PropTypes.Number, default: 4 },
    openRightSide: { type: hz.PropTypes.Boolean, default: false },
    doorId: { type: hz.PropTypes.String, default: "Door1" },
  };

  private initialPosition!: hz.Vec3;
  private targetPosition!: hz.Vec3;
  private isOpen: boolean = false;
  private updateSubscription!: hz.EventSubscription;
  private playersOnTrigger: hz.Player[] = [];

  start() {
    this.initialPosition = this.props.door!.position.get();
    // Calculate target position: move only to the left (negative X), keep Y and Z the same
    if (this.props.openRightSide) {
      this.targetPosition = new hz.Vec3(
        this.initialPosition.x - this.props.slideDistance!,
        this.initialPosition.y,
        this.initialPosition.z
      );
    } else {
      this.targetPosition = new hz.Vec3(
        this.initialPosition.x + this.props.slideDistance!,
        this.initialPosition.y,
        this.initialPosition.z
      );
    }

    this.connectCodeBlockEvent(
      this.props.trigger!,
      hz.CodeBlockEvents.OnPlayerEnterTrigger,
      (player: hz.Player) => {
        if (!this.playersOnTrigger.includes(player)) {
          this.playersOnTrigger.push(player);
        }
        this.askPlayerToOpenDoor(player);
      }
    );

    // Add trigger for when player leaves the zone
    this.connectCodeBlockEvent(
      this.props.trigger!,
      hz.CodeBlockEvents.OnPlayerExitTrigger,
      (player: hz.Player) => {
        this.playersOnTrigger = this.playersOnTrigger.filter(
          (p) => p !== player
        );
        if (this.playersOnTrigger.length <= 0) {
          this.closeDoor();
        }
      }
    );
  }

  askPlayerToOpenDoor(player: hz.Player) {
    if (gameManager?.isThisTrainingSession()) {
      if (
        this.props.doorId === "Door1" &&
        playerManager?.getRole(player) !== PlayerRoles.Scooper
      ) {
        return; // Only allow Scoopers to open Door1 during training
      }

      if (
        this.props.doorId === "Door3" &&
        (playerManager?.getRole(player) !== PlayerRoles.Fetcher || trainingManager?.getPlayerPromptStatusPerRole(player, PlayerRoles.Fetcher)! !== 2)
      ) {
        return; // Only allow Fetchers to open Door3 during training
      }

      if (
        this.props.doorId === "Door2" &&
        (playerManager?.getRole(player) !== PlayerRoles.Server || (trainingManager?.getPlayerPromptStatusPerRole(player, PlayerRoles.Server)! !== 2))
      ) {
        return; // Only allow Servers to open Door2 during training
      }

      if (
        this.props.doorId === "Door4" &&
        playerManager?.getRole(player) !== PlayerRoles.Server
      ) {
        return; // Only allow Servers to open Door4 during training
      }
    }
    this.openDoor();
  }

  openDoor() {
    if (!this.isOpen) {
      this.isOpen = true;
      this.slideDoor(this.targetPosition);
    }
  }

  closeDoor() {
    if (this.isOpen) {
      this.isOpen = false;
      this.slideDoor(this.initialPosition);
    }
  }

  slideDoor(targetPosition: hz.Vec3) {
    const duration = 0.5; // seconds
    const startTime = Date.now();
    const initialPosition = this.props.door!.position.get();

    // Disconnect any existing animation
    if (this.updateSubscription) {
      this.updateSubscription.disconnect();
    }

    this.updateSubscription = this.connectLocalBroadcastEvent(
      hz.World.onUpdate,
      (data: { deltaTime: number }) => {
        const elapsed = (Date.now() - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);

        // Use smooth interpolation for position
        const position = hz.Vec3.lerp(initialPosition, targetPosition, t);
        this.props.door!.position.set(position);

        if (t === 1) {
          this.updateSubscription.disconnect();
          // console.log.*$
        }
      }
    );
  }
}

hz.Component.register(DoorTrigger);
