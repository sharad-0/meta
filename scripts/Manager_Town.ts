import * as hz from "horizon/core";
import { PlayerJoinedEvent } from "Manager_Events";
import {
  hapticsManager,
  playerManager,
  utilityManager,
} from "Managers_Instance";
import Component_House from "Component_House";
import { UpgradeInfo, UpgradeType } from "Enums_Game";
import { Npc } from "horizon/npc";

export default class Manager_Town extends hz.Component<typeof Manager_Town> {
  static propsDefinition = {
    housePlots: { type: hz.PropTypes.Entity },
    houseAsset: { type: hz.PropTypes.Asset },
  };

  private plotVacancy: Map<number, boolean> = new Map();
  private plotData: Map<number, [hz.Vec3, hz.Quaternion]> = new Map();
  private playerHouses: Map<hz.Player, [number, hz.Entity]> = new Map();
  private playerHousesComp: Map<hz.Player, Component_House> = new Map();
  public playerJoinedEventAck: hz.Player[] = [];

  preStart(): void {
    this.connectLocalBroadcastEvent(PlayerJoinedEvent, ({ player }) => {
      if (player.isValidReference && !Npc.playerIsNpc(player)) {
        if (!this.playerJoinedEventAck.includes(player)) {
          this.playerJoinedEventAck.push(player);
        }
        const timeout = this.async.setTimeout(() => {
          this.onPlayerJoined(player);
          this.async.clearTimeout(timeout);
        }, 5000); // delay to ensure other managers are ready
      }
    });
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitWorld,
      async (player) => {
        this.playerJoinedEventAck = this.playerJoinedEventAck.filter(
          (p) => p !== player
        );
        await this.removeHouseEntityForPlayer(player);
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

    // console.log.*$
    //   `Manager_Town: Initialized with ${this.plotVacancy.size} plots`
    // );
  }

  onPlayerJoined(player: hz.Player) {
    if (!this.playerJoinedEventAck.includes(player)) {
      return;
    }
    this.playerJoinedEventAck.push(player);
    // console.log.*$
    const plotId = this.getFirstVacantPlot();
    if (plotId !== -1) {
      this.plotVacancy.set(plotId, false);

      let plotPos = this.getPlotPosition(plotId);
      plotPos = new hz.Vec3(plotPos.x, plotPos.y + 0.15, plotPos.z);
      const plotRot = this.getPlotRotation(plotId);

      this.world
        .spawnAsset(this.props.houseAsset!, plotPos, plotRot)
        .then((entities) => {
          const houseEntity = entities.find(
            (e) => e.getComponents(Component_House)[0]
          );
          if (!houseEntity) {
            console.error(
              `Manager_Town: Failed to spawn house entity for player ${player.name}`
            );
            return;
          }
          this.setHouseEntityForPlayer(player, plotId, houseEntity);
          const houseComp = houseEntity.getComponents(Component_House)[0];
          if (houseComp) {
            houseComp.initialiseHouse(player);

            this.playerHousesComp.set(player, houseComp);
          }
          entities.forEach((entity) => {
            entity.tags.set([`${player.name.get()}_house`]);
          });
        });
      // console.log.*$
    } else {
      // console.log.*$
    }
  }

  setHouseEntityForPlayer(
    player: hz.Player,
    plotId: number,
    entity: hz.Entity
  ) {
    this.playerHouses.set(player, [plotId, entity]);
  }

  async clearEntitiesOnPlot(plotId: number, player: hz.Player) {
    await Promise.all(
      Array.from(this.playerHouses.entries()).map(async ([key, value]) => {
        if (value[0] === plotId) {
          if (value[1].exists()) {
            value[1].visible.set(false);
            await this.world.deleteAsset(value[1], true);
          }
        }
      })
    );

    this.playerHouses.delete(player);
    try {
      const playerName = player.name.get();
      const expectedTags = [
        `${playerName}_house`,
        `${playerName}_waffle`,
        `${playerName}_scoop`,
        `${playerName}_decor`,
      ];
      const allEntities = this.world.getEntitiesWithTags(expectedTags);
      if (allEntities.length > 0) {
        // Use Promise.all instead of forEach
        await Promise.all(
          allEntities.map(async (entity) => {
            if (entity.exists()) {
              entity.visible.set(false);
              await this.world.deleteAsset(entity, true);
            }
          })
        );
      }
    } catch (error) {
      console.error(`Error clearing plot ${plotId}:`, error);
    }
  }

  async removeHouseEntityForPlayer(player: hz.Player) {
    // console.log.*$
    //   `Manager_Town: Removing house entity for player ${player.name.get()}`
    // );
    const playerHouse = this.playerHouses.get(player);
    let plotId = -1;
    if (playerHouse) {
      plotId = playerHouse[0];
      const entity = playerHouse[1];
      await new Promise((resolve) => this.async.setTimeout(resolve, 500));
      if (entity.exists()) {
        entity.visible.set(false);
        await this.world.deleteAsset(entity, true);
      }
      this.plotVacancy.set(playerHouse[0], true);
      this.playerHousesComp.delete(player);
      if (this.playerJoinedEventAck.includes(player)) {
        this.playerJoinedEventAck = this.playerJoinedEventAck.filter(
          (p) => p !== player
        );
      }
    }
    // console.log.*$
    //   `Manager_Town: Clearing remaining house entity for player ${player.name.get()}`
    // );
    await this.clearEntitiesOnPlot(plotId, player);
  }

  getFirstVacantPlot(): number {
    let found = -1;

    this.plotVacancy.forEach((value, plotId) => {
      if (found === -1 && value === true) {
        found = plotId;
      }
    });

    // if (found === -1) {
    //   // console.log.*$
    //   //   `Manager_Town: Checked ${this.plotVacancy.size} plots, no vacant plots found`
    //   // );
    // }
    return found;
  }

  getPlotPosition(plotId: number): hz.Vec3 {
    const plot = this.plotData.get(plotId);
    return plot ? plot[0] : hz.Vec3.forward;
  }

  getPlotRotation(plotId: number): hz.Quaternion {
    const plot = this.plotData.get(plotId);
    return plot ? plot[1] : hz.Quaternion.zero;
  }

  upgradeHouseForPlayer(
    player: hz.Player,
    upgrade: UpgradeInfo,
    upgradeType: UpgradeType,
    index: number = -1,
    deductCoins: boolean = false
  ) {
    const houseComp = this.playerHousesComp.get(player);
    if (houseComp) {
      // console.log.*$
      //   `[House Upgrade] Upgrading house, ${player.name}, ${JSON.stringify(
      //     upgrade
      //   )}, ${UpgradeType[upgradeType]}, ${index}`
      // );
      houseComp.upgradeHouse(player, upgrade, upgradeType, index, deductCoins);
      hapticsManager?.playShortBuzz(player);
    }
  }
}
hz.Component.register(Manager_Town);
