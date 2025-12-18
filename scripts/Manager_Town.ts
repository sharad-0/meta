import * as hz from "horizon/core";
import { PlayerJoinedEvent } from "Manager_Events";
import {
  hapticsManager,
  playerManager,
  utilityManager,
} from "Managers_Instance";
import Component_HouseV2 from "Component_HouseV2";
import { UpgradeInfo, UpgradeType } from "Enums_Game";
import { Npc } from "horizon/npc";

// Queue item types for better type safety
interface PlayerQueueItem {
  player: hz.Player;
  action: 'join' | 'leave';
  timestamp: number;
}

export default class Manager_Town extends hz.Component<typeof Manager_Town> {
  static propsDefinition = {
    housePlots: { type: hz.PropTypes.Entity },
    houseAsset: { type: hz.PropTypes.Asset },
  };

  private plotVacancy: Map<number, boolean> = new Map();
  private plotData: Map<number, [hz.Vec3, hz.Quaternion]> = new Map();
  public playerJoinedEventAck: hz.Player[] = [];
  private playerQueue: PlayerQueueItem[] = [];
  private playerHouseComponents: Map<hz.Player, Component_HouseV2> = new Map();
  private playerPlotList: Map<hz.Player, number> = new Map();
  private isProcessingQueue: boolean = false;

  preStart(): void {
    this.connectLocalBroadcastEvent(PlayerJoinedEvent, async ({ player }) => {
      if (!Npc.playerIsNpc(player)) {
        this.addToQueue(player, 'join');
      }
    });

    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitWorld,
      async (player) => {
        if (!Npc.playerIsNpc(player)) {
          this.addToQueue(player, 'leave');
        }
      }
    );
  }

  start() {
    const plots = this.props.housePlots!.children;
    for (let i = 1; i <= plots.get().length; i++) {
      this.plotData.set(i, [
        plots.get()[i - 1].position.get(),
        plots.get()[i - 1].rotation.get(),
      ]);
      this.plotVacancy.set(i, true);
    }

    console.log(
      `Manager_Town: Initialized with ${this.plotVacancy.size} plots and queue system`
    );
  }

  // Fixed: Removed async, simplified queueing logic
  addToQueue(player: hz.Player, action: 'join' | 'leave'): void {
    // Deduplicate: prevent multiple pending actions for same player
    const existingIndex = this.playerQueue.findIndex(item => item.player === player);
    if (existingIndex !== -1) {
      // Replace existing action with newer one
      this.playerQueue[existingIndex] = { player, action, timestamp: Date.now() };
      console.log(`Manager_Town: Updated queue action for player to '${action}'`);
      return;
    }

    this.playerQueue.push({ player, action, timestamp: Date.now() });
    console.log(`Manager_Town: Added player to queue with action '${action}'`);

    // Trigger processing if not already running
    void this.processQueue();
  }

  // Fixed: Loop-based queue processing with proper error handling
  private async processQueue(): Promise<void> {
    // Guard against concurrent processing
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.playerQueue.length > 0) {
        const nextPlayer = this.playerQueue.shift()!;

        try {
          if (nextPlayer.action === 'join') {
            await this.spawnHouse(nextPlayer.player);
          } else if (nextPlayer.action === 'leave') {
            await this.removeHouse(nextPlayer.player);
          }
        } catch (error) {
          console.error(
            `Manager_Town: Failed to process ${nextPlayer.action} for player:`,
            error
          );
          // Continue processing remaining queue items despite error
        }
      }
    } finally {
      this.isProcessingQueue = false;
      console.log("Manager_Town: Queue processing complete");
    }
  }

  // Fixed: Uses forEach instead of for...of iteration
  private getVacantPlot(): number {
    let vacantPlot = -1;

    this.plotVacancy.forEach((isVacant, key) => {
      if (isVacant && vacantPlot === -1) {
        vacantPlot = key;
      }
    });

    return vacantPlot;
  }


  // Fixed: Also removes player from playerPlotList
  private resetPlotVacancy(player: hz.Player): void {
    const plot = this.playerPlotList.get(player);
    if (plot !== undefined) {
      this.plotVacancy.set(plot, true);
      this.playerPlotList.delete(player);
      console.log(`Manager_Town: Reset plot ${plot} for player`);
    }
  }

  // Fixed: Added comprehensive error handling and rollback
  private async spawnHouse(player: hz.Player): Promise<void> {
    // Check if player already has a house
    if (this.playerHouseComponents.has(player)) {
      console.warn("Manager_Town: Player already has a house, skipping spawn");
      return;
    }

    const plot = this.getVacantPlot();
    if (plot === -1) {
      console.warn("Manager_Town: No vacant plot available for player");
      return;
    }

    if (!this.props.houseAsset) {
      console.error("Manager_Town: House asset not configured");
      return;
    }

    // Reserve plot before async operation
    this.plotVacancy.set(plot, false);
    this.playerPlotList.set(player, plot);

    const plotData = this.plotData.get(plot)!;

    try {
      const entities = await this.world.spawnAsset(
        this.props.houseAsset,
        plotData[0],
        plotData[1]
      );

      // Validate spawn result
      if (!entities || entities.length === 0) {
        throw new Error("spawnAsset returned no entities");
      }

      const entity = entities[0];
      const components = entity.getComponents(Component_HouseV2);

      if (!components || components.length === 0) {
        throw new Error("House entity missing Component_HouseV2");
      }

      const component = components[0];
      this.playerHouseComponents.set(player, component);

      // Initialize house
      await component.initialiseHouse(player);

      console.log(`Manager_Town: Successfully spawned house for player on plot ${plot}`);
    } catch (error) {
      console.error("Manager_Town: Failed to spawn house:", error);

      // Rollback: free the plot and remove player mapping
      this.plotVacancy.set(plot, true);
      this.playerPlotList.delete(player);
      this.playerHouseComponents.delete(player);

      // Optionally: notify player of failure
      // player.showNotification("Failed to spawn house. Please try rejoining.");
    }
  }

  // Fixed: Added existence checks
  private async removeHouse(player: hz.Player): Promise<void> {
    const component = this.playerHouseComponents.get(player);

    if (!component) {
      console.warn("Manager_Town: No house component found for player during removal");
      // Still clean up mappings in case of inconsistent state
      this.resetPlotVacancy(player);
      return;
    }

    try {
      await component.removeHouse();
      console.log("Manager_Town: Successfully removed house for player");
    } catch (error) {
      console.error("Manager_Town: Error during house removal:", error);
    } finally {
      // Always clean up mappings
      this.playerHouseComponents.delete(player);
      this.resetPlotVacancy(player);
    }
  }

  // Fixed: Added validation and error handling
  async upgradeHouseForPlayer(
    player: hz.Player,
    upgrade: UpgradeInfo,
    upgradeType: UpgradeType,
    index: number = -1,
    deductCoins: boolean = false
  ): Promise<void> {
    const component = this.playerHouseComponents.get(player);

    if (!component) {
      console.error(
        "Manager_Town: Cannot upgrade - player does not have an active house"
      );
      return;
    }

    try {
      await component.upgradeHouse(player, upgrade, upgradeType, index, deductCoins);
      console.log(`Manager_Town: Successfully upgraded house for player (type: ${upgradeType})`);
    } catch (error) {
      console.error("Manager_Town: House upgrade failed:", error);
      // Consider reverting coins if deduction happened but upgrade failed
    }
  }

  // Optional: Utility method to check player house status
  public hasHouse(player: hz.Player): boolean {
    return this.playerHouseComponents.has(player);
  }

  // Optional: Utility to get available plot count
  public getAvailablePlotCount(): number {
    let count = 0;
    this.plotVacancy.forEach(isVacant => {
      if (isVacant) {
        count++;
      }
    });
    return count;
  }
}

hz.Component.register(Manager_Town);
