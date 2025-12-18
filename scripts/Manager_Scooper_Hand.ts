// Manager_Scooper_Hand (patched excerpt) -------------------------------------
// Replace the spawn logic to use Manager_SpawnPool.acquire/release

import Component_IceCreamCone from "Component_IceCreamCone";
import { IceCream, Items, parseItem, PlayerRoles } from "Enums_Game";
import * as hz from "horizon/core";
import { Player } from "horizon/core";
import { Npc } from "horizon/npc";
import {
  botManager,
  coneMachineHandler,
  inventoryManager,
  objectPoolManager,
  playerAnimations,
} from "Managers_Instance";
import {
  addPlayersToUseTrash,
  OnPlayerGrabStatusChanged,
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

    if (this.props.coneSpawnPoint) {
      this.coneSpawnPoint = this.props.coneSpawnPoint;
    } else {
      this.coneSpawnPoint = this.world.getEntitiesWithTags([
        "ConeSpawnPoint",
      ])[0];
    }
  }

  private playerHandEntity = new Map<Player, hz.Entity>(); // main reference if player is holding anything or not
  private playerHandEntityType = new Map<Player, Items>(); // entity type just for tracking item type

  private subscribers = new Set<(player: Player) => void>();

  async addItem(player: Player, key: Items): Promise<boolean> {
    if (this.isHandFull(player)) {
      // already holding something ignore it
      return false;
    }
    await this.getAndAddItemToHand(player, key);
    this._notify(player);
    return true;
  }

  // use pool to acquire entity for the item
  private async getAndAddItemToHand(player: Player, key: Items): Promise<void> {
    if (key === Items.Cone) {
      // in case of bot
      const ent = coneMachineHandler?.GetTopCone()!;
      await this.addAssetToHand(player, ent, key);
      return;
    } else {
      // Ask pool for an entity for this item key
      const ent = await objectPoolManager?.acquireItem(key, {
        position: new hz.Vec3(0, 0, 0),
        rotation: new hz.Quaternion(0, 0, 0, 1),
      });

      await this.addAssetToHand(player, ent!, key);
    }
  }

  addIceCreamToHand(player: Player, iceCream: Component_IceCreamCone): void {
    if (!this.isHandFull(player)) {
      this.addAssetToHand(player, iceCream.entity, Items.Cone);
    }
  }

  private async addAssetToHand(player: Player, entity: hz.Entity, item: Items) {
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
          // player.setAvatarGripPoseOverride(hz.AvatarGripPose.CarryHeavy);
          this.setHand(player, entity, item);
          // this.sendLocalBroadcastEvent(addPlayersToUseTrash, { player });
        }
      } else {
        // console.log.*$
        //   `[ScooperMgr] Player ${player.id} is a human. Using human grab logic.`
        // );
        grab.forceHold(player, hz.Handedness.Right, true);
        if (item && item !== Items.Cone) {
          // player.setAvatarGripPoseOverride(hz.AvatarGripPose.CarryHeavy);
          this.setHand(player, entity, item);
          inventoryManager?.remove(item, 1);
          this.sendLocalBroadcastEvent(addPlayersToUseTrash, { player });
        }
      }
    }
  }

  public getEntityInHand(player: Player): hz.Entity | undefined {
    return this.playerHandEntity.get(player);
  }

  public getItemTypeInHand(player: Player): Items {
    return this.playerHandEntityType.get(player) ?? Items.None;
  }
  public setHand(player: Player, entity: hz.Entity, itemType: Items) {
    this.playerHandEntityType.set(player, itemType);
    this.assignEntityToPlayerHand(player, entity);
  }
  public emptyHand(player: Player, deleteAssetInHand: boolean): void {
    if (deleteAssetInHand) {
      this.destroyItemAsset(player);
    } else {
      this.releaseItemAsset(player);
    }
    this.playerHandEntityType.delete(player);
    this.removeEntityFromPlayerHand(player);
    this._notify(player);
  }

  public isHandFull(player: Player): boolean {
    return this.playerHandEntity.has(player);
  }
  private assignEntityToPlayerHand(player: Player, entity: hz.Entity) {
    this.playerHandEntity.set(player, entity);
    this.sendLocalBroadcastEvent(OnPlayerGrabStatusChanged, { player });
  }
  private removeEntityFromPlayerHand(player: Player) {
    this.playerHandEntity.delete(player);
    this.sendLocalBroadcastEvent(OnPlayerGrabStatusChanged, { player });
  }

  private releaseItemAsset(player: Player): void {
    const ent = this.playerHandEntity.get(player);
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
    this.sendLocalBroadcastEvent(removePlayersFromUseTrash, { player });
  }

  // return the entity to pool instead of deleting it
  destroyItemAsset(player: Player) {
    const ent = this.playerHandEntity.get(player);
    if (Npc.playerIsNpc(player)) {
      const botComp = botManager?.getBotComponentFromRole(PlayerRoles.Scooper);
      if (botComp && ent) {
        botComp.dropObject();
      }
    } else {
      ent?.as(hz.GrabbableEntity)?.forceRelease();
    }
    if (ent) {
      const key = this.playerHandEntityType.get(player) ?? Items.None;
      // Ensure release even if key is missing
      if (key !== Items.None) {
        if (key === Items.Cone) {
          ent.visible.set(false);
          this.world.deleteAsset(ent);
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
    this.sendLocalBroadcastEvent(removePlayersFromUseTrash, { player });
  }

  resetAllHands() {
    this.playerHandEntity.forEach((_, player) => {
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
