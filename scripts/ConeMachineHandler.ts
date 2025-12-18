import Component_IceCreamCone from "Component_IceCreamCone";
import { Items, PlayerRoles } from "Enums_Game";
import * as hz from "horizon/core";
import { Player } from "horizon/core";
import {
  OnPlayerGrabStatusChanged,
  OnPlayerInventoryItemQuantityChanged,
  PlayerSwitchedRoleEvent,
} from "Manager_Events";
import {
  mainArenaManager,
  objectPoolManager,
  playerManager,
  scooperHandManager,
} from "Managers_Instance";

export default class ConeMachineHandler extends hz.Component<
  typeof ConeMachineHandler
> {
  static propsDefinition = {
    coneAnchorPoint: { type: hz.PropTypes.Entity },
  };
  private spawnedCones: hz.Entity[] = [];
  private coneSpawningQueue: Promise<void> = Promise.resolve();
  private isRefillingCones: boolean = false;
  preStart(): void {
    this.connectLocalBroadcastEvent(
      OnPlayerInventoryItemQuantityChanged,
      (data) =>
        this.HandleConeQuantityChange(
          data.itemKey,
          data.quantityChange,
          data.currentQuantity
        )
    );
    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, () =>
      this.OnPlayerDataChaged()
    );
    this.connectLocalBroadcastEvent(OnPlayerGrabStatusChanged, () =>
      this.OnPlayerDataChaged()
    );
  }

  start() { }

  HandleConeQuantityChange(
    itemKey: Items,
    quantityChange: number,
    currentQuantity: number
  ) {
    if (itemKey !== Items.Cone) return;
    if (quantityChange > 0) {
      this.coneSpawningQueue = this.coneSpawningQueue.then(() =>
        this.spawnCone(quantityChange)
      );
    } else if (quantityChange < 0) {
      // Remove cones from the spawnedCones array and despawn them
      while (quantityChange < 0 && this.spawnedCones.length > 0) {
        const coneToRemove = this.spawnedCones.pop();
        var grabEnt = coneToRemove?.as(hz.GrabbableEntity)!;
        if (grabEnt) {
          grabEnt.setWhoCanGrab([]);
        }
        quantityChange++;
        this.OnPlayerDataChaged();
      }
    }
    // Logic to handle cone quantity change
  }
  private async spawnCone(numberToSpawn: number) {
    this.isRefillingCones = true;
    this.OnPlayerDataChaged();
    const prefab = scooperHandManager?.props.coneAsset;
    const anchorPos = this.props.coneAnchorPoint?.position;

    if (!prefab) {
      console.error("❌ coneAsset prefab missing from ScooperHandManager");
      return;
    }

    if (!anchorPos) {
      console.error("❌ coneAnchorPoint not assigned in props");
      return;
    }

    for (let i = 0; i < numberToSpawn; i++) {
      let pos = anchorPos.get();
      pos.y += this.spawnedCones.length * 0.05; // stack cones slightly higher
      const ent = await this.world.spawnAsset(
        prefab,
        pos, // spawn at machine
        hz.Quaternion.zero // same rotation
      );

      if (!mainArenaManager?.isParlourOpen()) {
        this.world.deleteAsset(ent[0], true);
        return;
      }

      if (ent) {
        this.spawnedCones.push(ent[0]);
        ent[0].visible.set(true);
        ent[0].collidable.set(true);
      }
    }
    this.isRefillingCones = false;
    this.OnPlayerDataChaged();
  }
  OnPlayerDataChaged() {
    if (this.spawnedCones.length === 0) return;

    for (let i = 0; i < this.spawnedCones.length; i++) {
      const cone = this.spawnedCones[i];
      var grabEnt = cone.as(hz.GrabbableEntity)!;
      if (grabEnt) {
        if (i === this.spawnedCones.length - 1 && !this.isRefillingCones) {
          cone.getComponents(Component_IceCreamCone)[0].AllowScoopersToGrab();
        } else {
          grabEnt.setWhoCanGrab([]);
        }
      }
    }
  }
  GetTopCone(): hz.Entity | undefined {
    if (this.spawnedCones.length === 0) return undefined;
    return this.spawnedCones[this.spawnedCones.length - 1];
  }
  ResetConeMachine(): void {
    this.spawnedCones = [];
    this.isRefillingCones = false;
    this.OnPlayerDataChaged();
  }
}
hz.Component.register(ConeMachineHandler);
