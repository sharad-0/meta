// Manager_Scooper_Hand (patched excerpt) -------------------------------------
// Replace the spawn logic to use Manager_SpawnPool.acquire/release

import Component_IceCreamCone from "Component_IceCreamCone";
import { IceCream, Items, parseItem, PlayerRoles } from "Enums_Game";
import * as hz from "horizon/core";
import { Player } from "horizon/core";
import { Npc } from "horizon/npc";
import {
  botManager,
  inventoryManager,
  objectPoolManager,
  playerAnimations,
} from "Managers_Instance";
import {
  addPlayersToUseTrash,
  ParlourClosedEvent,
  ParlourOpenedEvent,
  PlayerLeftEvent,
  PlayerSwitchedRoleEvent,
  removePlayersFromUseTrash,
} from "Manager_Events";
import Manager_PlayerAnimations from "Manager_PlayerAnimations";

export default class Manager_Scooper_Hand extends hz.Component<
  typeof Manager_Scooper_Hand
> {
  static propsDefinition = {
    coneAsset: { type: hz.PropTypes.Asset },
    coneSpawnPoint: { type: hz.PropTypes.Entity },
  };
  spawnedConeItems: hz.Entity[] = [];
  coneSpawnPoint: hz.Entity | undefined;
  start(): void {
    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, ({ player }) =>
      this.emptyHand(player, true)
    );

    this.connectLocalBroadcastEvent(PlayerLeftEvent, ({ player }) =>
      this.emptyHand(player, true)
    );

    this.connectLocalBroadcastEvent(ParlourOpenedEvent, () => {
      this.preSpawnItems(1);
    });
    if (this.props.coneSpawnPoint) {
      this.coneSpawnPoint = this.props.coneSpawnPoint;
    } else {
      this.coneSpawnPoint = this.world.getEntitiesWithTags(["ConeSpawnPoint"])[0];
    }
  }

  private playerHand = new Map<Player, Items>();
  public activeEntityInHand: Map<Player, hz.Entity> = new Map();
  private subscribers = new Set<(player: Player) => void>();

  async addItem(player: Player, key: Items): Promise<boolean> {
    if (this.playerHand.has(player)) {
      // console.log.*$
      return false;
    }

    this.playerHand.set(player, key);
    await this.addItemToHand(player, key);
    this._notify(player);
    return true;
  }

  async preSpawnItems(itemCount: number) {
    for (let i = 0; i < itemCount; i++) {
      if (this.props.coneAsset) {
        await this.world
          .spawnAsset(
            this.props.coneAsset,
            this.coneSpawnPoint!.position.get()
          )
          .then(async (entities) => {
            const ent = entities[0];
            ent.visible.set(false);
            this.spawnedConeItems.push(ent);
          });
      }
    }
  }

  // use pool to acquire entity for the item
  async addItemToHand(player: Player, key: Items): Promise<void> {
    if (this.activeEntityInHand.has(player)) {
      console.warn(
        `[ScooperMgr] Player ${player.id} already has an item in hand. Cannot add another.`
      );
      return;
    }

    if (key === Items.Cone) {
      if (this.spawnedConeItems.length <= 0) {
        await this.preSpawnItems(1);
      }
      const ent = this.spawnedConeItems.shift()!;
      await this.addAssetToHand(player, ent, key);
      return;
    } else {
      // Ask pool for an entity for this item key
      const ent = await objectPoolManager?.acquireItem(key, {
        position: new hz.Vec3(0, 0, 0),
        rotation: new hz.Quaternion(0, 0, 0, 1),
      });

      this.addAssetToHand(player, ent!, key);
    }
  }

  addIceCreamToHand(player: Player, iceCream: Component_IceCreamCone): void {
    if (!this.isHandFull(player)) {
      this.addAssetToHand(player, iceCream.entity);
      this.playerHand.set(player, Items.Cone);
    }
  }

  private async addAssetToHand(
    player: Player,
    entity: hz.Entity,
    item?: Items
  ) {
    if (this.activeEntityInHand.has(player)) {
      console.warn(
        `[ScooperMgr] Player ${player.id} already has an item in hand. Cannot add another.`
      );
      return;
    }

    const grab = entity.as(hz.GrabbableEntity)!;

    if (grab) {
      if (Npc.playerIsNpc(player)) {
        // console.log.*$
        //   `[ScooperMgr] Player ${player.id} is an NPC. Using bot grab logic.`
        // );
        const botComp = botManager?.getBotComponentFromRole(
          PlayerRoles.Scooper
        );
        // grab.forceHold(player, hz.Handedness.Right, false);
        // player.setAvatarGripPoseOverride(hz.AvatarGripPose.Sword);
        // return true;
        grab.setWhoCanGrab([player]);

        if (botComp) {
          // console.log.*$
          //   `[ScooperMgr] Using bot component to grab entity for player ${player.id}`
          // );
          await botComp.grabObject(entity);
          player.setAvatarGripPoseOverride(hz.AvatarGripPose.CarryHeavy);
          this.activeEntityInHand.set(player, entity);
          // this.sendLocalBroadcastEvent(addPlayersToUseTrash, { player });
        }
      } else {
        // console.log.*$
        //   `[ScooperMgr] Player ${player.id} is a human. Using human grab logic.`
        // );
        grab.forceHold(player, hz.Handedness.Right, false);
        if (item && item !== Items.Cone) {
          player.setAvatarGripPoseOverride(hz.AvatarGripPose.CarryHeavy);
          this.activeEntityInHand.set(player, entity);
          inventoryManager?.remove(item, 1);
          this.sendLocalBroadcastEvent(addPlayersToUseTrash, { player });
        }
      }
    }
  }

  getEntityInHand(player: Player): hz.Entity | undefined {
    return this.activeEntityInHand.get(player);
  }

  public getItemInHand(player: Player): Items {
    return this.playerHand.get(player) ?? Items.None;
  }

  public emptyHand(player: Player, deleteAssetInHand: boolean): void {
    this.playerHand.delete(player);
    if (deleteAssetInHand) {
      this.destroyItemAsset(player);
    } else {
      this.releaseItemAsset(player);
    }
    this._notify(player);
  }

  public isHandFull(player: Player): boolean {
    return this.activeEntityInHand.has(player);
  }

  public releaseItemAsset(player: Player): void {
    const ent = this.activeEntityInHand.get(player);
    if (Npc.playerIsNpc(player)) {
      const botComp = botManager?.getBotComponentFromRole(PlayerRoles.Scooper);
      if (botComp && ent) {
        botComp.dropObject();
      }
    } else {
      ent?.as(hz.GrabbableEntity)?.forceRelease();
    }
    try {
      player.clearAvatarGripPoseOverride();
    } catch { }
    this.activeEntityInHand.delete(player);
    this.sendLocalBroadcastEvent(removePlayersFromUseTrash, { player });
  }

  // return the entity to pool instead of deleting it
  public destroyItemAsset(player: Player) {
    const ent = this.activeEntityInHand.get(player);
    if (Npc.playerIsNpc(player)) {
      const botComp = botManager?.getBotComponentFromRole(PlayerRoles.Scooper);
      if (botComp && ent) {
        botComp.dropObject();
      }
    } else {
      ent?.as(hz.GrabbableEntity)?.forceRelease();
    }
    if (ent) {
      const key = this.playerHand.get(player) ?? Items.None;
      // Ensure release even if key is missing
      if (key !== Items.None) {
        if (key === Items.Cone) {
          ent.visible.set(false);
          this.world.deleteAsset(ent);
          this.preSpawnItems(1);
        } else {
          objectPoolManager?.releaseItem(key, ent);
        }
      } else {
        objectPoolManager?.releaseUnknown(ent);
      }
    } else {
      console.warn("[ScooperMgr] item to detach from the player is not found");
    }

    try {
      player.clearAvatarGripPoseOverride();
    } catch { }
    this.activeEntityInHand.delete(player);
    this.sendLocalBroadcastEvent(removePlayersFromUseTrash, { player });
  }

  resetAllHands() {
    this.playerHand.forEach((_, player) => {
      this.emptyHand(player, true);
    });
  }

  public subscribe(fn: (player: Player) => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private _notify(player: Player) {
    this.subscribers.forEach((fn) => fn(player));
  }
}

hz.Component.register(Manager_Scooper_Hand);
