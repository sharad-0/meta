import { AnalyticsManager } from 'AnalyticsManager';
import Component_FloorMesh from 'Component_FloorMesh';
import { itemAffordableCosts } from 'Constants_TownHouse';
import { ColorCombinations, PlayerHouseConfig, UpgradeInfo, UpgradeType } from 'Enums_Game';
import { MeshEntity } from 'horizon/2p';
import { AreaEnterPayload } from 'horizon/analytics';
import * as hz from 'horizon/core';
import { PlayerJoinedEvent } from 'Manager_Events';
import { playerManager, utilityManager } from 'Managers_Instance';
import UI_HouseOwnerName from 'UI_HouseOwnerName';
import UI_TownUpgrade from 'UI_TownUpgrade';
const YOffset = 8;

export default class Component_HouseV2 extends hz.Component<typeof Component_HouseV2> {
  static propsDefinition = {
    waffleGroundAsset: { type: hz.PropTypes.Asset },

    pinkWaffleTextureAsset: { type: hz.PropTypes.Asset },
    orangeWaffleTextureAsset: { type: hz.PropTypes.Asset },
    blueWaffleTextureAsset: { type: hz.PropTypes.Asset },
    greenWaffleTextureAsset: { type: hz.PropTypes.Asset },

    scoopFloorAsset: { type: hz.PropTypes.Asset },
    waffleFloorAsset: { type: hz.PropTypes.Asset },

    chocoScoopTextureAsset: { type: hz.PropTypes.Asset },
    pinkScoopTextureAsset: { type: hz.PropTypes.Asset },
    vanillaScoopTextureAsset: { type: hz.PropTypes.Asset },

    houseBoardEntity: { type: hz.PropTypes.Entity },
    selfHouseBoardEntity: { type: hz.PropTypes.Entity },
    ownerNameUI: { type: hz.PropTypes.Entity },
    upgradeUI: { type: hz.PropTypes.Entity },
    houseIconUI: { type: hz.PropTypes.Entity },
    smokeFX: { type: hz.PropTypes.Entity },
  };
  private waffleEntities: hz.Entity[] = [];
  private scoopEntities: hz.Entity[] = [];
  private houseOwner: hz.Player | null = null;
  private upgradeUI: UI_TownUpgrade | null = null;
  private isSpawningFloor: boolean = false;

  start() {

    this.entity!.as(hz.TriggerGizmo)?.setWhoCanTrigger([]);

    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterTrigger,
      this.onPlayerEnter.bind(this)
    );

    this.upgradeUI =
      this.props.upgradeUI?.getComponents(UI_TownUpgrade)[0] ?? null;
    if (!this.upgradeUI) {
      console.warn("UI_HouseUpgrade component not found.");
    }

    this.connectLocalBroadcastEvent(PlayerJoinedEvent, ({ player }) => {
      this.refreshBoardVisibility();
    });
  }

  onPlayerEnter(player: hz.Player) {
    this.upgradeUI?.entity.setVisibilityForPlayers(
      [player],
      hz.PlayerVisibilityMode.VisibleTo
    );
    this.upgradeUI?.setPlayer(player);
    this.upgradeUI?.entity.visible.set(true);

    this.upgradeUI!.onClosePressed = () => {
      this.closeUpgradeUI();
    };

    this.entity!.as(hz.TriggerGizmo)?.setWhoCanTrigger([]);

    const payload: AreaEnterPayload = {
      actionArea: "House",
      player: player,
      actionAreaIsLobbySection: false,
      actionAreaIsPlayerReadyZone: false,
    };
    AnalyticsManager.s_instance.sendAreaEnter(payload);
  }

  refreshBoardVisibility() {
    if (!this.houseOwner) return;
    const playersExceptOwner =
      playerManager?.getCurrentPlayers().filter((p) => p !== this.houseOwner) ??
      [];
    this.props.houseIconUI?.visible.set(true);
    this.props.houseIconUI?.setVisibilityForPlayers(
      [this.houseOwner!],
      hz.PlayerVisibilityMode.VisibleTo
    );

    this.props.houseBoardEntity?.visible.set(true);
    this.props.houseBoardEntity?.setVisibilityForPlayers(
      [],
      hz.PlayerVisibilityMode.VisibleTo
    );

    this.props.houseBoardEntity?.setVisibilityForPlayers(
      playersExceptOwner,
      hz.PlayerVisibilityMode.VisibleTo
    );

    this.props.selfHouseBoardEntity?.visible.set(true);
    this.props.selfHouseBoardEntity?.setVisibilityForPlayers(
      [],
      hz.PlayerVisibilityMode.VisibleTo
    );
    this.props.selfHouseBoardEntity?.setVisibilityForPlayers(
      [this.houseOwner!],
      hz.PlayerVisibilityMode.VisibleTo
    );
  }


  async initialiseHouse(player: hz.Player) {
    this.isSpawningFloor = true;
    this.houseOwner = player;
    const houseUpgrade = playerManager?.getHouseUpgrade(player);
    await this.setupHouse(houseUpgrade!, player).then(() => {
      this.entity!.as(hz.TriggerGizmo)?.setWhoCanTrigger([player]);

      this.props.ownerNameUI
        ?.getComponents(UI_HouseOwnerName)[0]
        ?.updateOwnerName(player.name.get());
      this.props.ownerNameUI?.visible.set(true);

      this.refreshBoardVisibility();
    }).catch((error) => {
      console.error("Component_House: Failed to initialise house:", error);
    }).finally(() => {
      this.isSpawningFloor = false;
    });
  }

  async setupHouse(
    upgradeInfo: PlayerHouseConfig,
    player: hz.Player
  ): Promise<void> {
    const entPos = this.entity.position.get();
    const entRot = this.entity.rotation.get();
    const waffles = upgradeInfo.waffles;
    const scoops = upgradeInfo.scoops;
    await this.spawnWafflesSequential(waffles, entRot).then(() => {
    }).catch((error) => {
      console.error("Component_House: Failed to spawn waffles:", error);
    }).finally(() => {
      this.isSpawningFloor = false;
    });
    await this.spawnScoopsSequential(scoops, waffles.length).then(() => {
    }).catch((error) => {
      console.error("Component_House: Failed to spawn scoops:", error);
    }).finally(() => {
      this.isSpawningFloor = false;
    });
  }


  async upgradeHouse(
    player: hz.Player,
    upgrade: UpgradeInfo,
    upgradeType: UpgradeType,
    index: number = -1,
    deductCoins: boolean = false
  ) {
    if (player !== this.houseOwner) {
      console.warn("Only the house owner can upgrade the house.");
      return;
    }

    const currentUpgrade = playerManager?.getHouseUpgrade(player);
    const costData =
      itemAffordableCosts[upgrade.assetId as keyof typeof itemAffordableCosts];
    if (
      deductCoins &&
      costData &&
      !playerManager?.canAffordUpgrade(player, costData.level, costData.cost)
    ) {
      console.warn("Player cannot afford house upgrade.");
      return;
    }
    this.isSpawningFloor = true;
    await this.handleUpgrade(upgrade, upgradeType, index!);
    this.isSpawningFloor = false;
    if (index >= 0) {
      if (upgradeType === UpgradeType.Waffle) {
        currentUpgrade!.waffles[index] = upgrade;
      }
      if (upgradeType === UpgradeType.Scoop) {
        currentUpgrade!.scoops[index] = upgrade;
      }
      if (upgradeType === UpgradeType.Decor) {
        const currentInfo = currentUpgrade!.scoops[index];
        if (!currentInfo) {
          console.warn("Invalid scoop index for decoration.");
          return;
        }
        if (currentInfo.decoration) {
          console.warn("This scoop already has a decoration.");
          return;
        }
        currentUpgrade!.scoops[index].decoration = upgrade.decoration;
      }
    } else {
      if (upgradeType === UpgradeType.Waffle) {
        currentUpgrade!.waffles.push(upgrade);
      }
      if (upgradeType === UpgradeType.Scoop) {
        currentUpgrade!.scoops.push(upgrade);
      }
    }

    if (deductCoins) {
      playerManager?.deductCash(player, costData.cost);
      AnalyticsManager.s_instance.sendUpgradeHome(
        player,
        UpgradeType[upgradeType],
        costData.cost
      );
    } else {
      AnalyticsManager.s_instance.sendUpgradeHome(
        player,
        UpgradeType[upgradeType],
        0
      );
    }
    playerManager?.setHouseUpgrade(player, currentUpgrade!);

    const timeout = this.async.setTimeout(async () => {
      await this.repositionAllEntities();
      this.async.clearTimeout(timeout);
    }, 500);

  }

  async handleUpgrade(upgradeInfo: UpgradeInfo,
    upgradeType: UpgradeType,
    index: number) {
    switch (upgradeType) {
      case UpgradeType.Waffle:
        await this.handleWaffleUpgrade(upgradeInfo, index);
        break;
      case UpgradeType.Scoop:
        await this.handleScoopUpgrade(upgradeInfo, index);
        break;

      default:
        console.warn(`Unknown upgrade type: ${upgradeType}`);
    }
  }



  /////////////////////////////////////////Waffle Functions/////////////////////////////////////////

  private async handleWaffleUpgrade(
    upgradeInfo: UpgradeInfo,
    index: number
  ): Promise<void> {
    if (index >= 0 && index < this.waffleEntities.length) {
      // Update existing waffle color
      await this.updateWaffleColor(upgradeInfo, index);
    } else if (index < 0) {
      // Add new waffle
      await this.addNewWaffle(upgradeInfo);
    } else {
      console.warn(
        `Component_House: Invalid waffle index ${index}. Current waffle count: ${this.waffleEntities.length}`
      );
    }
  }

  private async updateWaffleColor(
    upgradeInfo: UpgradeInfo,
    index: number
  ): Promise<void> {
    const waffleEntity = this.waffleEntities[index];
    if (waffleEntity) {
      const newWaffleTexture = this.getWaffleTexture(upgradeInfo.color as ColorCombinations);
      try {
        if (newWaffleTexture) {
          waffleEntity.as(MeshEntity)?.setTexture(newWaffleTexture);
        } else {
          console.error(`Component_House: No texture found for waffle ${upgradeInfo.color}`);
        }
      } catch (error) {
        console.error(`Component_House: Failed to update waffle color at index ${index}:`, error);
      }
    } else {
      console.error(`Component_House: Waffle entity at index ${index} does not exist.`);
    }
  }

  private async addNewWaffle(upgradeInfo: UpgradeInfo): Promise<void> {
    const spawnPos = this.getFlorPosition(
      this.waffleEntities.length,
      UpgradeType.Waffle,
      this.waffleEntities.length + 1
    );
    const randomYRotation = upgradeInfo.yRotation;
    const yAxis = new hz.Vec3(0, 1, 0);
    const spawnRot =
      this.waffleEntities.length === 0
        ? this.entity!.rotation.get()
        : hz.Quaternion.fromAxisAngle(yAxis, randomYRotation);

    let waffleAsset = this.props.waffleFloorAsset;

    if (!waffleAsset) {
      console.error(
        `Component_House: No waffle asset found for color ${upgradeInfo.color} at index ${this.waffleEntities.length}.`
      );
      return;
    }
    this.isSpawningFloor = true;
    // Sequential spawning - waits for each spawn to complete
    await this.world.spawnAsset(waffleAsset, spawnPos, spawnRot).then((entity) => {
      this.waffleEntities.push(entity[0]);
      this.updateWaffleColor(upgradeInfo, this.waffleEntities.length - 1);
    }).catch((error) => {
      console.error("Component_House: Failed to spawn waffle:", error);
    }).finally(() => {
      this.isSpawningFloor = false;
    });
  }

  private async spawnWafflesSequential(
    waffles: UpgradeInfo[],
    entRot: hz.Quaternion
  ): Promise<void> {
    for (let i = 0; i < waffles.length; i++) {
      const spawnPos = this.getFlorPosition(i, UpgradeType.Waffle, waffles.length);
      const randomYRotation = waffles[i].yRotation;
      const yAxis = new hz.Vec3(0, 1, 0);
      const spawnRot =
        i === 0 ? entRot : hz.Quaternion.fromAxisAngle(yAxis, randomYRotation);

      let waffleAsset = this.props.waffleFloorAsset;

      if (i === 0) {
        waffleAsset = this.props.waffleGroundAsset;
      }

      if (!waffleAsset) {
        console.error(
          `Component_House: No waffle asset found for color ${waffles[i].color} at index ${i}.`
        );
        continue; // Skip this waffle and proceed to next
      }
      this.isSpawningFloor = true;
      // Sequential spawning - waits for each spawn to complete
      await this.world
        .spawnAsset(waffleAsset, spawnPos, spawnRot)
        .then((entities) => {
          if (entities.length > 0 && entities[0]) {
            this.waffleEntities.push(entities[0]);
            entities[0].tags.set([`${this.houseOwner!.name.get()}_waffle`]);
            const getWaffleTexture = this.getWaffleTexture(waffles[i].color);
            if (getWaffleTexture) {
              entities[0].as(hz.MeshEntity).setTexture(getWaffleTexture);
            }
          }
        }).catch((error) => {
          console.error(
            `Component_House: Failed to spawn waffle at index ${i}:`,
            error
          );
        }).finally(() => {
        });
    }
  }


  //////////////////////////////////////////////////Scoop Functions/////////////////////////////////////////////////

  private async handleScoopUpgrade(
    upgradeInfo: UpgradeInfo,
    index: number
  ): Promise<void> {
    if (index >= 0 && index < this.scoopEntities.length) {
      // Update existing scoop color
      await this.updateScoopColor(upgradeInfo, index);
    } else if (index < 0) {
      // Add new scoop
      await this.addNewScoop(upgradeInfo);
    } else {
      console.warn(
        `Component_House: Invalid scoop index ${index}. Current scoop count: ${this.scoopEntities.length}`
      );
    }
  }

  private async updateScoopColor(
    upgradeInfo: UpgradeInfo,
    index: number
  ): Promise<void> {
    const scoopEntity = this.scoopEntities[index];
    if (!scoopEntity || !scoopEntity.exists()) {
      console.error(`Component_House: Scoop entity at index ${index} does not exist.`);
      return;
    }
    try {
      const texture = this.getScoopTexture(upgradeInfo.assetId);
      if (texture) {
        scoopEntity.as(hz.MeshEntity).setTexture(texture);
      } else {
        console.error(`Component_House: No texture found for scoop ${upgradeInfo.assetId}`);
      }
    } catch (error) {
      console.error(`Component_House: Failed to update scoop color at index ${index}:`, error);
    }
  }

  private async addNewScoop(upgradeInfo: UpgradeInfo): Promise<void> {
    const entPos = this.entity.position.get();
    const offset = (this.waffleEntities.length + this.scoopEntities.length) * YOffset;
    const spawnPos = new hz.Vec3(entPos.x, entPos.y + offset, entPos.z);

    const randomYRotation = Math.random() * 360;
    const yAxis = new hz.Vec3(0, 1, 0);
    const spawnRot = hz.Quaternion.fromAxisAngle(yAxis, randomYRotation);

    const scoopAsset = this.props.scoopFloorAsset;
    const texture = this.getScoopTexture(upgradeInfo.assetId);

    if (!scoopAsset || !texture) {
      console.error(
        `Component_House: Missing scoop asset or texture for ${upgradeInfo.assetId}.`
      );
      return;
    }

    this.isSpawningFloor = true;

    try {
      await this.world.spawnAsset(scoopAsset, spawnPos, spawnRot).then((entities) => {
        this.scoopEntities.push(entities[0]);
        upgradeInfo.yRotation = randomYRotation;
        this.updateScoopColor(upgradeInfo, this.scoopEntities.length - 1);
        this.playFX(entities[0]);
      });
    } catch (error) {
      console.error(`Component_House: Failed to add new scoop:`, error);
    }
  }


  private async spawnScoopsSequential(
    scoops: UpgradeInfo[],
    wafflesLength: number
  ): Promise<void> {
    for (let i = 0; i < scoops.length; i++) {
      const spawnPos = this.getFlorPosition(i, UpgradeType.Scoop, wafflesLength);
      const randomYRotation = scoops[i].yRotation;
      const yAxis = new hz.Vec3(0, 1, 0);
      const spawnRot = hz.Quaternion.fromAxisAngle(yAxis, randomYRotation);

      const scoopAsset = this.props.scoopFloorAsset;

      if (!scoopAsset) {
        console.error(
          `Component_House: No scoop asset found for color ${scoops[i].color} at index ${i}.`
        );
        continue; // Skip this scoop and proceed to next
      }
      this.isSpawningFloor = true;
      // Sequential spawning - waits for each spawn to complete
      await this.world
        .spawnAsset(scoopAsset, spawnPos, spawnRot)
        .then((entities) => {
          entities.forEach((element) => {
            this.scoopEntities.push(element);
            element.tags.set([`${this.houseOwner!.name.get()}_scoop`]);
            const getScoopTexture = this.getScoopTexture(scoops[i].assetId);
            if (getScoopTexture) {
              element.as(hz.MeshEntity).setTexture(getScoopTexture);
            }
          });
        }).catch((error) => {
          console.error(
            `Component_House: Failed to spawn scoop at index ${i}:`,
            error
          );
        }).finally(() => {
        });
    }
  }

  ////////////////////////////////////////////////////Helper Functions////////////////////////////////////////////////




  closeUpgradeUI() {
    this.upgradeUI?.entity.visible.set(false);
    this.entity!.as(hz.TriggerGizmo)?.setWhoCanTrigger([this.houseOwner!]);
  }


  playFX(entity: hz.Entity) {
    const floorEntity = entity.getComponents(Component_FloorMesh)[0];
    if (floorEntity) {
      floorEntity.playFX();
    }
  }

  getFlorPosition(index: number, type: UpgradeType, wafflesLength: number) {
    const entPos = this.entity.position.get();
    const wafflesOffset = this.waffleEntities.length * YOffset;

    let spawnPos: hz.Vec3;

    if (type === UpgradeType.Waffle) {
      // Waffles start at YOffset/2 and stack upward
      spawnPos = new hz.Vec3(
        entPos.x,
        entPos.y + YOffset / 2 + index * YOffset,
        entPos.z
      );
    } else if (type === UpgradeType.Scoop) {
      // Scoops ALSO need YOffset/2 offset, PLUS waffle offset
      spawnPos = new hz.Vec3(
        entPos.x,
        entPos.y + YOffset / 2 + index * 4.5 + wafflesOffset,
        entPos.z
      );
    } else {
      // Default fallback
      spawnPos = new hz.Vec3(entPos.x, entPos.y, entPos.z);
    }

    return spawnPos;
  }

  getWaffleTexture(color: ColorCombinations): hz.TextureAsset | null {
    let textureToReturn;
    switch (color) {
      case ColorCombinations.Pink:
        textureToReturn = this.props.pinkWaffleTextureAsset;
        break;
      case ColorCombinations.Orange:
        textureToReturn = this.props.orangeWaffleTextureAsset;
        break;
      case ColorCombinations.Blue:
        textureToReturn = this.props.blueWaffleTextureAsset;
        break;
      case ColorCombinations.Green:
        textureToReturn = this.props.greenWaffleTextureAsset;
        break;
      default:
        textureToReturn = this.props.orangeWaffleTextureAsset;
    }

    if (textureToReturn) {
      return textureToReturn;
    }

    return this.props.orangeWaffleTextureAsset!;
  }

  getScoopTexture(id: string): hz.TextureAsset | null {
    switch (id) {
      case "scoop1":
        return this.props.pinkScoopTextureAsset!;
      case "scoop2":
        return this.props.vanillaScoopTextureAsset!;
      case "scoop3":
        return this.props.chocoScoopTextureAsset!;
      default:
        return this.props.pinkScoopTextureAsset!;
    }
  }


  /////////////////////////////////////////////////////////Deletion And Resetting///////////////////////////////////////////////////////////////////////////////
  async removeHouse(): Promise<void> {
    await this.waitForSpawningToComplete();
    await this.resetHouse();
    this.hideHouseUI();
    this.stopVisualEffects();
  }

  // async dispose(): Promise<void> {
  //   await this.removeHouse();
  // }

  private async waitForSpawningToComplete(): Promise<void> {
    // Wait for any ongoing spawning operations to complete
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max wait (100 * 100ms)

    while (this.isSpawningFloor && attempts < maxAttempts) {
      await utilityManager?.sleep(2);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.warn("Component_House: Timeout waiting for spawning to complete");
    }
  }

  async resetHouse(): Promise<void> {
    console.log("Component_House: Starting house reset...");

    try {
      // Delete all entities in parallel batches for better performance
      await Promise.all([
        this.deleteAllWaffles(),
        this.deleteAllScoops()
      ]);

      // Reset UI visibility
      this.resetUIVisibility();

      // Clear entity arrays
      this.clearEntityArrays();

      // Reset house owner
      this.houseOwner = null;

      console.log("Component_House: House reset completed successfully");
    } catch (error) {
      console.error("Component_House: Error during house reset:", error);
    }
  }

  private async deleteAllWaffles(): Promise<void> {
    if (this.waffleEntities.length === 0) {
      return;
    }

    console.log(`Component_House: Deleting ${this.waffleEntities.length} waffles...`);

    const deletePromises = this.waffleEntities.map(async (entity, index) => {
      if (entity && entity.exists()) {
        try {
          entity.visible.set(false);
          await this.world.deleteAsset(entity, true);
        } catch (error) {
          console.error(
            `Component_House: Failed to delete waffle at index ${index}:`,
            error
          );
        }
      }
    });

    await Promise.all(deletePromises);
    console.log("Component_House: All waffles deleted");
  }

  private async deleteAllScoops(): Promise<void> {
    if (this.scoopEntities.length === 0) {
      return;
    }

    console.log(`Component_House: Deleting ${this.scoopEntities.length} scoops...`);

    const deletePromises = this.scoopEntities.map(async (entity, index) => {
      if (entity && entity.exists()) {
        try {
          entity.visible.set(false);
          await this.world.deleteAsset(entity, true);
        } catch (error) {
          console.error(
            `Component_House: Failed to delete scoop at index ${index}:`,
            error
          );
        }
      }
    });

    await Promise.all(deletePromises);
    console.log("Component_House: All scoops deleted");
  }

  private resetUIVisibility(): void {
    this.props.houseBoardEntity?.visible.set(false);
    this.props.selfHouseBoardEntity?.visible.set(false);
    this.props.ownerNameUI?.visible.set(false);
    this.props.houseIconUI?.visible.set(false);
    this.props.upgradeUI?.visible.set(false);
  }

  private clearEntityArrays(): void {
    this.waffleEntities = [];
    this.scoopEntities = [];
  }

  private hideHouseUI(): void {
    this.props.houseIconUI?.visible.set(false);
  }

  private stopVisualEffects(): void {
    this.props.smokeFX?.as(hz.ParticleGizmo)?.stop();
  }


  private async repositionAllEntities(): Promise<void> {
    console.log("Component_House: Repositioning all entities...");

    try {
      await Promise.all([
        this.repositionWaffles(),
        this.repositionScoops()
      ]);
      console.log("Component_House: All entities repositioned successfully");
    } catch (error) {
      console.error("Component_House: Error repositioning entities:", error);
    }
  }

  /**
   * Reposition all waffles and reapply their textures
   */
  private async repositionWaffles(): Promise<void> {
    const entPos = this.entity.position.get();
    const entRot = this.entity.rotation.get();

    for (let i = 0; i < this.waffleEntities.length; i++) {
      const waffleEntity = this.waffleEntities[i];

      if (!waffleEntity || !waffleEntity.exists()) {
        console.warn(`Component_House: Waffle at index ${i} does not exist during repositioning`);
        continue;
      }

      // Calculate new position
      const newPos = new hz.Vec3(
        entPos.x,
        entPos.y + YOffset / 2 + i * YOffset,
        entPos.z
      );

      // Update position
      waffleEntity.position.set(newPos);

      // Reapply texture (get from player upgrade config)
      const houseUpgrade = playerManager?.getHouseUpgrade(this.houseOwner!);
      if (houseUpgrade && houseUpgrade.waffles[i]) {
        const texture = this.getWaffleTexture(houseUpgrade.waffles[i].color);
        if (texture) {
          waffleEntity.as(hz.MeshEntity)?.setTexture(texture);
        }
      }
    }

    console.log(`Component_House: Repositioned ${this.waffleEntities.length} waffles`);
  }

  /**
   * Reposition all scoops and reapply their textures
   */
  private async repositionScoops(): Promise<void> {
    const entPos = this.entity.position.get();
    const wafflesOffset = this.waffleEntities.length * YOffset;

    for (let i = 0; i < this.scoopEntities.length; i++) {
      const scoopEntity = this.scoopEntities[i];

      if (!scoopEntity || !scoopEntity.exists()) {
        console.warn(`Component_House: Scoop at index ${i} does not exist during repositioning`);
        continue;
      }

      // Calculate new position
      const newPos = new hz.Vec3(
        entPos.x,
        entPos.y + YOffset / 2 + i * 4.5 + wafflesOffset,
        entPos.z
      );

      // Update position
      scoopEntity.position.set(newPos);

      // Reapply texture (get from player upgrade config)
      const houseUpgrade = playerManager?.getHouseUpgrade(this.houseOwner!);
      if (houseUpgrade && houseUpgrade.scoops[i]) {
        const texture = this.getScoopTexture(houseUpgrade.scoops[i].assetId);
        if (texture) {
          scoopEntity.as(hz.MeshEntity)?.setTexture(texture);
        }
      }
    }

    console.log(`Component_House: Repositioned ${this.scoopEntities.length} scoops`);
  }

}
hz.Component.register(Component_HouseV2);