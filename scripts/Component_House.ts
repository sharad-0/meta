import {
  ColorCombinations,
  Items,
  PlayerHouseConfig,
  ScoopUpgradeCost,
  UpgradeInfo,
  UpgradeType,
  WaffleUpgradeCost,
} from "Enums_Game";
import * as hz from "horizon/core";
import { DefaultPopupOptions } from "horizon/core";
import {
  hudManager,
  playerManager,
  townManager,
  utilityManager,
} from "Managers_Instance";
import UI_HouseUpgrade from "UI_HouseUpgrade";
import Component_FloorMesh from "Component_FloorMesh";
import UI_TownUpgrade from "UI_TownUpgrade";
import UI_HouseOwnerName from "UI_HouseOwnerName";
import { PlayerJoinedEvent } from "Manager_Events";
import { AreaEnterPayload, Turbo, TurboEvents } from "horizon/analytics";
import { itemAffordableCosts } from "Constants_TownHouse";
import { AnalyticsManager } from "AnalyticsManager";

const YOffset = 5.2;

export default class Component_House extends hz.Component<
  typeof Component_House
> {
  static propsDefinition = {
    waffleFloorAsset: { type: hz.PropTypes.Asset },

    pinkWaffleTextureAsset: { type: hz.PropTypes.Asset },
    orangeWaffleTextureAsset: { type: hz.PropTypes.Asset },
    blueWaffleTextureAsset: { type: hz.PropTypes.Asset },
    greenWaffleTextureAsset: { type: hz.PropTypes.Asset },

    pinkWaffleAsset: { type: hz.PropTypes.Asset },
    orangeWaffleAsset: { type: hz.PropTypes.Asset },
    blueWaffleAsset: { type: hz.PropTypes.Asset },
    greenWaffleAsset: { type: hz.PropTypes.Asset },

    scoopFloorAsset: { type: hz.PropTypes.Asset },

    chocoScoopTextureAsset: { type: hz.PropTypes.Asset },
    pinkScoopTextureAsset: { type: hz.PropTypes.Asset },
    vanillaScoopTextureAsset: { type: hz.PropTypes.Asset },

    chocoScoopAsset: { type: hz.PropTypes.Asset },
    pinkScoopAsset: { type: hz.PropTypes.Asset },
    vanillaScoopAsset: { type: hz.PropTypes.Asset },

    decorAsset: { type: hz.PropTypes.Asset },

    // groundFloorEntity: { type: hz.PropTypes.Entity },
    // baseScoopFloorEntity: { type: hz.PropTypes.Entity },

    houseBoardEntity: { type: hz.PropTypes.Entity },
    selfHouseBoardEntity: { type: hz.PropTypes.Entity },
    ownerNameUI: { type: hz.PropTypes.Entity },

    upgradeUI: { type: hz.PropTypes.Entity },
    houseIconUI: { type: hz.PropTypes.Entity },
    smokeFX: { type: hz.PropTypes.Entity },
  };

  // private houseUpgrade: PlayerHouseConfig | null = null;
  private waffleEntities: hz.Entity[] = [];
  private scoopEntities: hz.Entity[] = [];
  private decorEntities: Map<number, hz.Entity> = new Map();

  private houseOwner: hz.Player | null = null;
  private upgradeUI: UI_TownUpgrade | null = null;
  private isSpawningFloor: boolean = false;
  preStart(): void {
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterTrigger,
      this.onPlayerEnter.bind(this)
    );
  }

  start() {
    this.upgradeUI =
      this.props.upgradeUI?.getComponents(UI_TownUpgrade)[0] ?? null;
    if (!this.upgradeUI) {
      console.warn("UI_HouseUpgrade component not found.");
    }

    this.connectLocalBroadcastEvent(PlayerJoinedEvent, ({ player }) => {
      this.refreshBoardVisibility();
    });

    // this.props.groundFloorEntity?.visible.set(false);
    // this.props.baseScoopFloorEntity?.visible.set(false);

    // if (this.props.groundFloorEntity) {
    //   this.waffleEntities.push(this.props.groundFloorEntity);
    //   // NEW – apply saved texture to base waffle
    //   const baseColor = playerManager?.getHouseUpgrade(this.houseOwner!)
    //     ?.waffles[0].color;
    //   if (baseColor !== undefined) {
    //     var groundWaffleAsset = this.getFloorAsset(baseColor);
    //     if (!groundWaffleAsset) {
    //       console.error(`Component_House: No waffle asset found for base color ${baseColor}.`);
    //     } else {
    //       // respawn the ground waffle with correct color asset
    //       var respawnPos = this.props.groundFloorEntity.position.get();
    //       var respawnRot = this.props.groundFloorEntity.rotation.get();

    //       // remove the entity and respawn with new color
    //       this.world.spawnAsset(
    //         groundWaffleAsset,
    //         respawnPos,
    //         respawnRot
    //       ).then((entities) => {
    //         entities.forEach((element) => {
    //           this.waffleEntities[0] = element;
    //         });
    //       });
    //       this.world.deleteAsset(this.props.groundFloorEntity);
    //     }
    //     // this.setWaffleTexture(this.props.groundFloorEntity, baseColor);
    //   }
    // }

    // if (this.props.baseScoopFloorEntity) {
    //   this.scoopEntities.push(this.props.baseScoopFloorEntity);
    //   // NEW – apply saved texture to base scoop
    //   const baseColor = playerManager?.getHouseUpgrade(this.houseOwner!)
    //     ?.scoops[0].color;
    //   if (baseColor !== undefined) {
    //     var baseScoopAsset = this.getScoopAsset(baseColor);
    //     if (!baseScoopAsset) {
    //       console.error(`Component_House: No scoop asset found for base color ${baseColor}.`);
    //     } else {
    //       // respawn the base scoop with correct color asset
    //       var respawnPos = this.props.baseScoopFloorEntity.position.get();
    //       var respawnRot = this.props.baseScoopFloorEntity.rotation.get();

    //       // remove the entity and respawn with new color
    //       this.world.spawnAsset(
    //         baseScoopAsset,
    //         respawnPos,
    //         respawnRot
    //       ).then((entities) => {
    //         entities.forEach((element) => {
    //           this.scoopEntities[0] = element;
    //         });
    //       });
    //       this.world.deleteAsset(this.props.baseScoopFloorEntity);
    //     }
    //     // this.setScoopTexture(this.props.baseScoopFloorEntity, baseColor);
    //   }
    // }
  }

  async initialiseHouse(player: hz.Player) {
    this.isSpawningFloor = true;
    this.houseOwner = player;
    const playersExceptOwner =
      playerManager?.getCurrentPlayers().filter((p) => p !== player) ?? [];

    const houseUpgrade = playerManager?.getHouseUpgrade(player);
    await this.setupHouse(houseUpgrade!, player);

    this.entity!.as(hz.TriggerGizmo)?.setWhoCanTrigger([player]);

    this.props.houseIconUI?.visible.set(true);
    this.props.houseIconUI?.setVisibilityForPlayers(
      [],
      hz.PlayerVisibilityMode.VisibleTo
    );
    this.props.houseIconUI?.setVisibilityForPlayers(
      [player],
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
      [this.houseOwner],
      hz.PlayerVisibilityMode.VisibleTo
    );

    this.props.ownerNameUI
      ?.getComponents(UI_HouseOwnerName)[0]
      ?.updateOwnerName(player.name.get());
    this.props.ownerNameUI?.visible.set(true);

    this.isSpawningFloor = false;
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

  upgradeHouse(
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
    const nextLevel =
      upgradeType === UpgradeType.Waffle
        ? currentUpgrade?.waffles.length ?? 0
        : currentUpgrade?.scoops.length ?? 0;

    // const upgradeCost =
    //   upgradeType === UpgradeType.Waffle
    //     ? WaffleUpgradeCost.get(nextLevel)
    //     : ScoopUpgradeCost.get(nextLevel);
    // if (!upgradeCost) {
    //   console.warn("Invalid house level.");
    //   return;
    // }

    // const [lvlReq, cashCost] = upgradeCost;
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

    this.addFloor(upgrade, upgradeType, index!);

    if (index >= 0) {
      // updating existing floor color or adding decoration
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
    // this.props.smokeFX?.as(hz.ParticleGizmo)?.play();
    // this.setupHouse(currentUpgrade!);
  }

  closeUpgradeUI() {
    this.upgradeUI?.entity.visible.set(false);
    this.entity!.as(hz.TriggerGizmo)?.setWhoCanTrigger([this.houseOwner!]);
  }

  async setupHouse(
    upgradeInfo: PlayerHouseConfig,
    player: hz.Player
  ): Promise<void> {
    const entPos = this.entity.position.get();
    const entRot = this.entity.rotation.get();
    // console.log.*$

    // this.resetHouse();
    const waffles = upgradeInfo.waffles;
    for (let i = 0; i < waffles.length; i++) {
      const spawnPos = new hz.Vec3(entPos.x, entPos.y + i * YOffset, entPos.z);
      // Use axis-angle quaternion for Y-axis rotation
      const randomYRotation = waffles[i].yRotation;
      const yAxis = new hz.Vec3(0, 1, 0);
      const spawnRot =
        i === 0 ? entRot : hz.Quaternion.fromAxisAngle(yAxis, randomYRotation);

      const waffleAsset = this.getFloorAsset(
        waffles[i].color as ColorCombinations
      );
      if (!waffleAsset) {
        console.error(
          `Component_House: No waffle asset found for color ${waffles[i].color} at index ${i}.`
        );
        continue;
      }
      if (townManager?.playerJoinedEventAck.includes(player)) {
        await this.world
          .spawnAsset(waffleAsset, spawnPos, spawnRot)
          .then((entities) => {
            entities.forEach((element) => {
              this.waffleEntities.push(element);
              element.tags.set([`${this.houseOwner!.name.get()}_waffle`]);
              // this.setWaffleTexture(
              //   element,
              //   waffles[i].color as ColorCombinations
              // );
            });
          });

        // console.log.*$
        //   `[House Comp] Spawned waffle entities at Setup ${this.waffleEntities.length}`
        // );
      }
    }

    const wafflesOffset = waffles.length * YOffset;

    // move the base scoop floor up if there are waffles
    // if (this.props.baseScoopFloorEntity && waffles.length > 1) {
    //   const baseScoopPos = new hz.Vec3(
    //     entPos.x,
    //     entPos.y + wafflesOffset,
    //     entPos.z
    //   );
    //   this.props.baseScoopFloorEntity.position.set(baseScoopPos);
    // }

    const scoops = upgradeInfo.scoops;
    for (let i = 0; i < scoops.length; i++) {
      const spawnPos = new hz.Vec3(
        entPos.x,
        entPos.y + i * YOffset + wafflesOffset,
        entPos.z
      );
      // Use axis-angle quaternion for Y-axis rotation
      const randomYRotation = scoops[i].yRotation;
      const yAxis = new hz.Vec3(0, 1, 0);
      const spawnRot = hz.Quaternion.fromAxisAngle(yAxis, randomYRotation);

      const scoopAsset = this.getScoopAsset(scoops[i].assetId);
      if (!scoopAsset) {
        console.error(
          `Component_House: No scoop asset found for color ${scoops[i].color} at index ${i}.`
        );
        continue;
      }
      if (townManager?.playerJoinedEventAck.includes(player)) {
        await this.world
          .spawnAsset(scoopAsset, spawnPos, spawnRot)
          .then((entities) => {
            entities.forEach((element) => {
              this.scoopEntities.push(element);
              element.tags.set([`${this.houseOwner!.name.get()}_scoop`]);
              // this.setScoopTexture(element, scoops[i].color as ColorCombinations);
            });
          });

        // console.log.*$
        //   `[House Comp] Spawned scoop entities at Setup ${this.scoopEntities.length}`
        // );
      }
    }

    // console.log.*$
    //   `Component_House: Finished setting up house with ${this.waffleEntities.length} waffles and ${this.scoopEntities.length} scoops for player ${this.houseOwner?.name}`
    // );

    // this.props.smokeFX?.as(hz.ParticleGizmo)?.stop();
  }

  async addFloor(
    upgradeInfo: UpgradeInfo,
    upgradeType: UpgradeType,
    index: number
  ) {
    const entPos = this.entity.position.get();
    const entRot = this.entity.rotation.get();

    // this.props.smokeFX?.as(hz.ParticleGizmo)?.play();
    // console.log.*$
    //   `Component_House: Adding floor of type ${UpgradeType[upgradeType]} for player ${this.houseOwner?.name}`
    // );

    if (upgradeType === UpgradeType.Waffle) {
      if (index >= 0) {
        // change the color of the waffle at the index
        const waffleEntity = this.waffleEntities[index];
        if (waffleEntity) {
          var respawnPos = waffleEntity.position.get();
          var respawnRot = waffleEntity.rotation.get();
          if (townManager?.playerJoinedEventAck.includes(this.houseOwner!)) {
            // remove the entity and respawn with new color
            this.world
              .spawnAsset(
                this.getFloorAsset(upgradeInfo.color as ColorCombinations)!,
                respawnPos,
                respawnRot
              )
              .then((entities) => {
                entities.forEach((element) => {
                  this.waffleEntities[index] = element;
                  element.tags.set([`${this.houseOwner?.name.get()}_waffle`]);
                  // this.setWaffleTexture(
                  //   element,
                  //   upgradeInfo.color as ColorCombinations
                  // );
                });
              });
            waffleEntity.visible.set(false);
            this.world.deleteAsset(waffleEntity, true);

            // this.setWaffleTexture(
            //   waffleEntity,
            //   upgradeInfo.color as ColorCombinations
            // );
            this.playFX(waffleEntity);
            // console.log.*$
            //   `Component_House: Changed color of waffle at index ${index} for player ${this.houseOwner?.name}`
            // );
          }
        }

        return;
      }

      const spawnPos = new hz.Vec3(
        entPos.x,
        entPos.y + this.waffleEntities.length * YOffset,
        entPos.z
      );
      // Use axis-angle quaternion for Y-axis rotation
      const randomYRotation = Math.random() * 360;
      const yAxis = new hz.Vec3(0, 1, 0);
      const spawnRot = hz.Quaternion.fromAxisAngle(yAxis, randomYRotation);

      // console.log.*$
      //   `Spawning waffle floor with axis-angle Y rotation: ${randomYRotation}`
      // );

      var waffleAsset = this.getFloorAsset(
        upgradeInfo.color as ColorCombinations
      );
      if (!waffleAsset) {
        console.error(
          `Component_House: No waffle asset found for color ${upgradeInfo.color}.`
        );
        return;
      }
      if (townManager?.playerJoinedEventAck.includes(this.houseOwner!)) {
        await this.world
          .spawnAsset(waffleAsset, spawnPos, spawnRot)
          .then((entities) => {
            entities.forEach((element) => {
              this.waffleEntities.push(element);
              upgradeInfo.yRotation = randomYRotation;
              // this.setWaffleTexture(
              //   element,
              //   upgradeInfo.color as ColorCombinations
              // );
              this.playFX(element);
              element.tags.set([`${this.houseOwner?.name.get()}_waffle`]);
            });
          });
        // console.log.*$
        //   `[House Comp] Spawned waffle entities ${this.waffleEntities.length}`
        // );

        const waffleOffset = this.waffleEntities.length * YOffset;
        for (let i = 0; i < this.scoopEntities.length; i++) {
          const scoopPos = new hz.Vec3(
            entPos.x,
            entPos.y + (i * YOffset + waffleOffset),
            entPos.z
          );
          this.scoopEntities[i].position.set(scoopPos);

          if (this.decorEntities.has(i)) {
            const decorEntity = this.decorEntities.get(i);
            if (decorEntity) {
              decorEntity.position.set(scoopPos);
            }
          }
        }
      }
    }

    if (upgradeType === UpgradeType.Scoop) {
      if (index >= 0) {
        // change the color of the scoop at the index
        const scoopEntity = this.scoopEntities[index];
        if (scoopEntity) {
          var respawnPos = scoopEntity.position.get();
          var respawnRot = scoopEntity.rotation.get();
          if (townManager?.playerJoinedEventAck.includes(this.houseOwner!)) {
            // remove the entity and respawn with new color
            this.world
              .spawnAsset(
                this.getScoopAsset(upgradeInfo.assetId)!,
                respawnPos,
                respawnRot
              )
              .then((entities) => {
                entities.forEach((element) => {
                  this.scoopEntities[index] = element;
                  element.tags.set([`${this.houseOwner?.name.get()}_scoop`]);
                });
              });
            scoopEntity.visible.set(false);
            this.world.deleteAsset(scoopEntity, true);

            this.playFX(scoopEntity);

            // this.setScoopTexture(
            //   scoopEntity,
            //   upgradeInfo.color as ColorCombinations
            // );

            // console.log.*$
            //   `Component_House: Changed color of scoop at index ${index} for player ${this.houseOwner?.name}`
            // );
          }
        }
        return;
      }

      const offset =
        (this.waffleEntities.length + this.scoopEntities.length) * YOffset;
      const spawnPos = new hz.Vec3(entPos.x, entPos.y + offset, entPos.z);
      // Use axis-angle quaternion for Y-axis rotation
      const randomYRotation = Math.random() * 360;
      const yAxis = new hz.Vec3(0, 1, 0);
      const spawnRot = hz.Quaternion.fromAxisAngle(yAxis, randomYRotation);

      var scoopAsset = this.getScoopAsset(upgradeInfo.assetId);
      if (!scoopAsset) {
        console.error(
          `Component_House: No scoop asset found for color ${upgradeInfo.color}.`
        );
        return;
      }
      if (townManager?.playerJoinedEventAck.includes(this.houseOwner!)) {
        await this.world
          .spawnAsset(scoopAsset, spawnPos, spawnRot)
          .then((entities) => {
            entities.forEach((element) => {
              this.scoopEntities.push(element);
              upgradeInfo.yRotation = randomYRotation;
              element.tags.set([`${this.houseOwner?.name.get()}_scoop`]);
              // this.setScoopTexture(
              //   element,
              //   upgradeInfo.color as ColorCombinations
              // );
            });
          });

        // console.log.*$
        //   `[House Comp] Spawned scoop entities ${this.scoopEntities.length}`
        // );
      }
    }

    if (upgradeType === UpgradeType.Decor) {
      const scoopToDecorate = this.scoopEntities[index];
      if (!scoopToDecorate) {
        console.warn(
          `Component_House: No scoops available on index ${index} to place decoration on.`
        );
        return;
      }

      const lastScoopPos = scoopToDecorate.position.get();
      const randomYRotation = Math.random() * 360;
      const yAxis = new hz.Vec3(0, 1, 0);
      const decorRot = hz.Quaternion.fromAxisAngle(yAxis, randomYRotation);
      if (townManager?.playerJoinedEventAck.includes(this.houseOwner!)) {
        await this.world
          .spawnAsset(this.props.decorAsset!, lastScoopPos, decorRot)
          .then((entities) => {
            entities.forEach((element) => {
              element.tags.set([`${this.houseOwner?.name.get()}_decor`]);
              this.decorEntities.set(index, element);
              if (upgradeInfo.decoration) {
                upgradeInfo.decoration.rotation = randomYRotation;
              }
              // element.as(hz.MeshEntity)?.setTexture(this.props.textureAsset!);
            });
          });
      }
    }

    // this.props.smokeFX?.as(hz.ParticleGizmo)?.stop();
  }

  playFX(entity: hz.Entity) {
    const floorEntity = entity.getComponents(Component_FloorMesh)[0];
    if (floorEntity) {
      floorEntity.playFX();
    }
  }

  getFloorAsset(color: ColorCombinations): hz.Asset | null {
    switch (color) {
      case ColorCombinations.Pink:
        return this.props.pinkWaffleAsset ?? null;
      case ColorCombinations.Orange:
        return this.props.orangeWaffleAsset ?? null;
      case ColorCombinations.Blue:
        return this.props.blueWaffleAsset ?? null;
      case ColorCombinations.Green:
        return this.props.greenWaffleAsset ?? null;
      default:
        return null;
    }
  }

  setWaffleTexture(entity: hz.Entity, color: ColorCombinations) {
    const meshEntity = entity.getComponents(Component_FloorMesh)[0];
    const waffleTexture = this.getWaffleTexture(color);
    if (meshEntity && waffleTexture) {
      meshEntity.setTexture(waffleTexture);
    } else if (!meshEntity) {
      console.warn(
        `Component_House: Unable to set waffle texture - mesh entity not found.`
      );
    } else {
      console.warn(
        `Component_House: Unable to set waffle texture - texture asset not found.`
      );
    }
  }

  getWaffleTexture(color: ColorCombinations): hz.TextureAsset | null {
    // console.log.*$
    //   `Waffle Texture Color: ${ColorCombinations[color]}, color: ${color}`
    // );

    switch (color) {
      case ColorCombinations.Pink:
        return this.props.pinkWaffleTextureAsset?.as(hz.TextureAsset) ?? null;
      case ColorCombinations.Orange:
        return this.props.orangeWaffleTextureAsset?.as(hz.TextureAsset) ?? null;
      case ColorCombinations.Blue:
        return this.props.blueWaffleTextureAsset?.as(hz.TextureAsset) ?? null;
      case ColorCombinations.Green:
        return this.props.greenWaffleTextureAsset?.as(hz.TextureAsset) ?? null;
      default:
        return null;
    }
  }

  getScoopAsset(id: string): hz.Asset | null {
    switch (id) {
      case "scoop1":
        return this.props.pinkScoopAsset ?? null;
      case "scoop2":
        return this.props.vanillaScoopAsset ?? null;
      case "scoop3":
        return this.props.chocoScoopAsset ?? null;
      default:
        return null;
    }
  }

  setScoopTexture(entity: hz.Entity, color: ColorCombinations) {
    const meshEntity = entity.getComponents(Component_FloorMesh)[0];
    const scoopTexture = this.getScoopTexture(color);
    if (meshEntity && scoopTexture) {
      meshEntity.setTexture(scoopTexture);
    } else if (!meshEntity) {
      console.warn(
        `Component_House: Unable to set scoop texture - mesh entity not found.`
      );
    } else {
      console.warn(
        `Component_House: Unable to set scoop texture - texture asset not found.`
      );
    }
  }

  getScoopTexture(color: ColorCombinations): hz.TextureAsset | null {
    switch (color) {
      case ColorCombinations.Pink:
        return this.props.pinkScoopTextureAsset?.as(hz.TextureAsset) ?? null;
      case ColorCombinations.Brown:
        return this.props.chocoScoopTextureAsset?.as(hz.TextureAsset) ?? null;
      case ColorCombinations.White:
        return this.props.vanillaScoopTextureAsset?.as(hz.TextureAsset) ?? null;
      default:
        return null;
    }
  }

  async dispose(): Promise<void> {
    utilityManager
      ?.delayUntil(() => !this.isSpawningFloor)
      .then(async () => {
        await this.resetHouse();
        this.props.houseIconUI?.visible.set(false);
        this.props.smokeFX?.as(hz.ParticleGizmo)?.stop();
      });
  }

  async resetHouse(): Promise<void> {
    await Promise.all(
      this.waffleEntities.map(async (entity) => {
        if (entity.exists()) {
          entity.visible.set(false);
          await this.world.deleteAsset(entity, true);
        }
      })
    );
    await Promise.all(
      this.scoopEntities.map(async (entity) => {
        if (entity.exists()) {
          entity.visible.set(false);
          await this.world.deleteAsset(entity, true);
        }
      })
    );

    await Promise.all(
      Array.from(this.decorEntities.values()).map(async (entity) => {
        if (entity.exists()) {
          entity.visible.set(false);
          await this.world.deleteAsset(entity, true);
        }
      })
    );
    this.props.houseBoardEntity?.visible.set(false);
    this.props.selfHouseBoardEntity?.visible.set(false);
    this.props.ownerNameUI?.visible.set(false);
    this.waffleEntities = [];
    this.scoopEntities = [];
    this.decorEntities.clear();
  }
}
hz.Component.register(Component_House);
