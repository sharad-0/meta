import Component_SnowmanBuildingPlatform from "Component_SnowmanBuildingPlatform";
import * as hz from "horizon/core";
import { CodeBlockEvents, Entity, Player, PropTypes } from "horizon/core";
import { Npc } from "horizon/npc";
import { PlayerJoinedEvent } from "Manager_Events";
import { hudManager } from "Managers_Instance";

export default class Component_SnowmenManager extends hz.Component<
  typeof Component_SnowmenManager
> {
  // Queue system to serialize join/leave
  private taskQueue: Array<() => Promise<void>> = [];
  private processing = false;

  // Track which player owns which position index
  private playerToPosition: Map<Player, number> = new Map();
  // Track which positions are currently free
  private freePositions: Set<number> = new Set();

  // Spawned entities
  private spawnedSnowmen: Map<Player, Entity> = new Map();

  // All 8 base positions
  private snowmanBasePositions: Entity[] = [];
  static propsDefinition = {
    snowman1: { type: hz.PropTypes.Entity },
    snowman2: { type: hz.PropTypes.Entity },
    snowman3: { type: hz.PropTypes.Entity },
    snowman4: { type: hz.PropTypes.Entity },
    snowman5: { type: hz.PropTypes.Entity },
    snowman6: { type: hz.PropTypes.Entity },
    snowman7: { type: hz.PropTypes.Entity },
    snowman8: { type: hz.PropTypes.Entity },
  };
  private snowmanList: hz.Entity[] = [];
  async start() {
    this.snowmanList = [
      this.props.snowman1!,
      this.props.snowman2!,
      this.props.snowman3!,
      this.props.snowman4!,
      this.props.snowman5!,
      this.props.snowman6!,
      this.props.snowman7!,
      this.props.snowman8!,
    ];

    this.markSnowmanPositions();
    await this.syncExistingPlayersOnStart();

    this.subscribeToPlayerEvents();
  }

  getChildren(): hz.Entity[] {
    return this.snowmanList;
  }
  private enqueue(op: () => Promise<void>) {
    this.taskQueue.push(op);
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.processing = true;
    while (this.taskQueue.length > 0) {
      const op = this.taskQueue.shift()!;
      try {
        await op();
      } catch (e) {
        console.error("[Christmas Manager] queued op failed:", e);
      }
    }
    this.processing = false;
  }
  private async syncExistingPlayersOnStart() {
    const players = this.world.getPlayers(); // list of connected players
    const server = this.world.getServerPlayer();
    for (const p of players) {
      if (p === server) continue;
      if (Npc.playerIsNpc(p)) continue;
      // Use the queue so this stays serialized with join/leave ops
      this.enqueue(async () => {
        await this.handlePlayerJoin(p);
      });
    }
  }
  markSnowmanPositions() {
    const children = this.getChildren();
    for (const child of children) {
      this.snowmanBasePositions.push(child);
    }

    // Initialize all 8 positions as free
    for (let i = 0; i < this.snowmanBasePositions.length; i++) {
      this.freePositions.add(i);
    }

    // console.log.*$
    //   `[Christmas Manager] Marked ${this.snowmanBasePositions.length} snowman positions, all available.`
    // );
  }

  subscribeToPlayerEvents() {
    this.connectLocalBroadcastEvent(PlayerJoinedEvent, ({ player }) => {
      this.enqueue(async () => {
        // console.log.*$
        //   `[Christmas Manager] Player Joined: ${player.name.get()}, wishing them a Merry Christmas!`
        // );
        if (!Npc.playerIsNpc(player)) {
          await this.async.setTimeout(async () => {
            await this.handlePlayerJoin(player);
          }, 5000);
        }
      });
    });

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitWorld,
      (player) => {
        this.enqueue(async () => {
          // console.log.*$
          //   `[Christmas Manager] Player Left: ${player.name.get()}, hope to see you again this Christmas!`
          // );
          if (!Npc.playerIsNpc(player)) {
            await this.handlePlayerLeave(player);
          }
        });
      }
    );
  }

  private async handlePlayerJoin(player: Player) {
    // Guard against duplicate joins
    if (this.spawnedSnowmen.has(player)) {
      console.warn(
        `[Christmas Manager] Player ${player.name.get()} already has a snowman`
      );
      return;
    }

    // Check if we have free positions
    if (this.freePositions.size === 0) {
      console.warn(
        `[Christmas Manager] All 8 plots occupied! Cannot spawn for ${player.name.get()}`
      );
      return;
    }

    hudManager?.attachDanceEmoteButtonUiToPlayer(player);
    await this.spawnSnowmanAtPosition(player);
  }

  private async handlePlayerLeave(player: Player) {
    // Only despawn if something was spawned
    if (!this.spawnedSnowmen.has(player)) {
      return;
    }
    hudManager?.detachDanceEmoteButtonUiFromPlayer(player);
    await this.despawnPlayerSnowman(player);
  }

  private getNextFreePosition(): number | null {
    // Get the lowest available position index
    if (this.freePositions.size === 0) {
      return null;
    }

    const sortedFree = Array.from(this.freePositions).sort((a, b) => a - b);
    return sortedFree[0];
  }

  private async spawnSnowmanAtPosition(player: Player) {
    const positionIndex = this.getNextFreePosition();
    if (positionIndex === null) {
      console.warn("No free positions available");
      return;
    }

    const snowmanEntity = this.snowmanBasePositions[positionIndex];

    if (snowmanEntity) {
      // Mark this position as occupied
      this.freePositions.delete(positionIndex);
      this.playerToPosition.set(player, positionIndex);
      this.spawnedSnowmen.set(player, snowmanEntity);

      const platform = snowmanEntity.getComponents(
        Component_SnowmanBuildingPlatform
      )[0];
      if (platform) {
        platform.setPlayer(player);
      }

      // console.log.*$
      //   `[Christmas Manager] Spawned snowman for ${player.name.get()} at plot ${positionIndex}`
      // );
    }
  }

  private async despawnPlayerSnowman(player: Player) {
    const snowmanEntity = this.spawnedSnowmen.get(player);
    const positionIndex = this.playerToPosition.get(player);

    if (snowmanEntity && positionIndex !== undefined) {
      // Reset before hiding to ensure clean state
      snowmanEntity
        .getComponents(Component_SnowmanBuildingPlatform)[0]
        ?.resetSnowman();

      // Now hide the entity
      snowmanEntity.visible.set(false);

      // Free up the position for reuse
      this.freePositions.add(positionIndex);
      this.playerToPosition.delete(player);
      this.spawnedSnowmen.delete(player);

      // console.log.*$
      //   `[Christmas Manager] Despawned snowman for ${player.name.get()}, freed plot ${positionIndex}`
      // );
    }
  }

}
hz.Component.register(Component_SnowmenManager);
