import * as hz from "horizon/core";
import { DefaultPopupOptions, Vec3 } from "horizon/core";

export default class Manager_Utility extends hz.Component<
  typeof Manager_Utility
> {
  static propsDefinition = {};

  private _lock: Promise<void> = Promise.resolve();

  start() {}

  // ---------------- Small helpers for timing and flow control ----------------------- //
  /**
   * Pause for N seconds.
   * Usage: await AsyncUtils.sleep(1.5);
   */
  sleep(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      this.async.setTimeout(() => resolve(), seconds * 1000);
    });
  }

  /**
   * Wait until a condition function returns true, checking every `intervalMs`.
   * Usage: await AsyncUtils.delayUntil(() => player.isReady, 100);
   */
  delayUntil(
    condition: () => boolean,
    intervalMs: number = 100
  ): Promise<void> {
    return new Promise((resolve) => {
      const id = this.async.setInterval(() => {
        if (condition()) {
          this.async.clearInterval(id);
          resolve();
        }
      }, intervalMs);
    });
  }

  /**
   * Run `fn` only when no other run is in progress.
   * If another call comes in, it queues and waits.
   */
  async runLocked<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;

    const wait = new Promise<void>((resolve) => (release = resolve));
    const prev = this._lock;
    this._lock = (async () => {
      await prev; // wait for previous call to finish
      await wait; // hold lock until this call is done
    })();

    try {
      return await fn();
    } finally {
      release!(); // allow next queued call
    }
  }

  // --------------------------- Position related utilities ------------------------- //

  spawnEntity(
    spawnAsset: hz.Asset,
    position: hz.Vec3,
    rotation: hz.Quaternion,
    onSpawned: (entity: hz.Entity) => void
  ): void {
    this.world.spawnAsset(spawnAsset, position, rotation).then((entities) => {
      entities.forEach((spawnedEntity) => {
        onSpawned(spawnedEntity);
      });
    });
  }

  getRandomPointInEntityBounds(entity: hz.Entity): hz.Vec3 {
    // Local half-extents (assuming trigger gizmo is a cube scaled by entity.scale)
    const halfSize = entity.scale.get().mul(0.5);

    // Random local position inside [-half, half] on each axis
    const local = new hz.Vec3(
      (Math.random() * 2 - 1) * halfSize.x,
      (Math.random() * 2 - 1) * halfSize.y,
      (Math.random() * 2 - 1) * halfSize.z
    );

    // Rotate it by the trigger's world rotation
    const rot = entity.rotation.get(); // Quaternion
    const rotated = hz.Quaternion.mulVec3(rot, local);

    return entity.position.get().add(rotated);
  }
  ConsoleLogSuccess(message: string, player: hz.Player) {
    //
    return;
    let popupOptions = {
      ...DefaultPopupOptions,
      position: new Vec3(0.7, 0.3, 0),
      fontSize: 2.2,
      backgroundColor: hz.Color.fromHex("#5ef55e"),
    };
    this.world.ui.showPopupForPlayer(player, message, 3, popupOptions);
  }
  ConsoleLogFailure(message: string, player: hz.Player) {
    //
    return;
    let popupOptions = {
      ...DefaultPopupOptions,
      position: new Vec3(0.7, -0.3, 0),
      fontSize: 2.2,
      backgroundColor: hz.Color.fromHex("#f55e5eff"),
    };
    this.world.ui.showPopupForPlayer(player, message, 3, popupOptions);
  }
}
hz.Component.register(Manager_Utility);
