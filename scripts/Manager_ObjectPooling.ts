2; // Manager_SpawnPool.ts
// -----------------------------------------------------------------------------
// Purpose: Centralized spawn service with object pooling for Horizon Worlds.
// Attach ONE instance of this component to an always-loaded entity (server-only).
// Register assets per item key (e.g., Items enum). Consumers request/release.
// -----------------------------------------------------------------------------

import * as hz from "horizon/core";
import { Items, PlayerRoles } from "Enums_Game";

// Utility type for pool entries
type PoolBucket = {
  asset: hz.Asset;
  free: hz.Entity[]; // pooled, hidden entities ready to reuse
  inUse: Set<hz.Entity>; // currently given out
  preloadCount: number;
};

export default class Manager_ObjectPooling extends hz.Component<
  typeof Manager_ObjectPooling
> {
  static propsDefinition = {
    // Example mappings for your use-case (ice cream game)
    itemCone: { type: hz.PropTypes.Asset },
    itemVanilla: { type: hz.PropTypes.Asset },
    itemStrawberry: { type: hz.PropTypes.Asset },
    itemChocolate: { type: hz.PropTypes.Asset },

    // Preload counts (how many to create at start)
    preloadItem: { type: hz.PropTypes.Number, default: 12 },

    roleScooper: { type: hz.PropTypes.Asset },
    roleServer: { type: hz.PropTypes.Asset },
    roleFetcher: { type: hz.PropTypes.Asset },

    preloadProps: { type: hz.PropTypes.Number, default: 16 },

    // Optional: Concurrency for batch spawn (to avoid long sequential awaits)
    batchSpawnConcurrency: { type: hz.PropTypes.Number, default: 4 },

    santaHat: { type: hz.PropTypes.Asset },
  };

  // Singleton plumbing --------------------------------------------------------
  private static _instance: Manager_ObjectPooling | null = null;
  static get(): Manager_ObjectPooling {
    if (!this._instance) throw new Error("[SpawnPool] No instance in scene.");
    return this._instance;
  }
  preStart(): void {
    Manager_ObjectPooling._instance = this;
  }
  onDestroy(): void {
    if (Manager_ObjectPooling._instance === this)
      Manager_ObjectPooling._instance = null;
  }

  // Internal state ------------------------------------------------------------
  private itemBuckets = new Map<Items, PoolBucket>();
  private rolePropBuckets = new Map<PlayerRoles, PoolBucket>();

  // Small reusable objects to reduce short-lived allocations
  // (safe because we only use them to set positions/rotations for stash/reset)
  private readonly _stashPos = new hz.Vec3(0, -1000, 0);
  private readonly _resetRot = new hz.Quaternion(0, 0, 0, 1);

  start(): void {
    // Register item → asset mapping from props
    // if (this.props.itemCone) this.registerItem(Items.Cone, this.props.itemCone, this.props.preloadItem ?? 0);
    if (this.props.itemVanilla)
      this.registerItem(
        Items.Vanilla,
        this.props.itemVanilla,
        this.props.preloadItem ?? 0
      );
    if (this.props.itemStrawberry)
      this.registerItem(
        Items.Strawberry,
        this.props.itemStrawberry,
        this.props.preloadItem ?? 0
      );
    if (this.props.itemChocolate)
      this.registerItem(
        Items.Chocolate,
        this.props.itemChocolate,
        this.props.preloadItem ?? 0
      );

    if (this.props.roleScooper)
      this.registerRole(
        PlayerRoles.Scooper,
        this.props.roleScooper,
        this.props.preloadProps ?? 0
      );
    if (this.props.roleServer)
      this.registerRole(
        PlayerRoles.Server,
        this.props.roleServer,
        this.props.preloadProps ?? 0
      );
    if (this.props.roleFetcher)
      this.registerRole(
        PlayerRoles.Fetcher,
        this.props.roleFetcher,
        this.props.preloadProps ?? 0
      );
    if (this.props.santaHat)
      this.registerRole(
        PlayerRoles.Unknown,
        this.props.santaHat,
        this.props.preloadProps ?? 8
      );

    // Preload entities for each bucket
    this.preloadAll();
  }

  // Public API ---------------------------------------------------------------

  /** Map an item key to an asset and (optionally) a preload count */
  public registerItem(key: Items, asset: hz.Asset, preloadCount = 0): void {
    this.itemBuckets.set(key, {
      asset,
      free: [],
      inUse: new Set(),
      preloadCount,
    });
  }

  /** Map a role prop to an asset and (optionally) a preload count */
  public registerRole(
    role: PlayerRoles,
    asset: hz.Asset,
    preloadCount = 0
  ): void {
    this.rolePropBuckets.set(role, {
      asset,
      free: [],
      inUse: new Set(),
      preloadCount,
    });
  }

  /** Pre-instantiate entities for each registered bucket */
  private async preloadAll(): Promise<void> {
    // Collect promises so we can await them in a controlled way
    const preloadPromises: Promise<void>[] = [];

    // Use forEach to avoid relying on iteration downlevel features
    this.itemBuckets.forEach((bucket, key) => {
      if (bucket.preloadCount > 0) {
        preloadPromises.push(
          this.spawnItemsBatchToPool(key, bucket.preloadCount)
        );
      }
    });

    this.rolePropBuckets.forEach((bucket, role) => {
      if (bucket.preloadCount > 0) {
        preloadPromises.push(
          this.spawnPropsBatchToPool(role, bucket.preloadCount)
        );
      }
    });

    // Await sequentially to preserve predictable startup ordering; switch to Promise.all(...) for concurrency if desired.
    for (const p of preloadPromises) {
      try {
        await p;
      } catch (err) {
        console.error("[SpawnPool] preloadAll error:", err);
      }
    }
  }

  // Items Pooling -----------------------------------------------------------------

  /** Acquire an entity for a given item key. Spawns if pool is empty. */
  public async acquireItem(
    key: Items,
    where?: { position?: hz.Vec3; rotation?: hz.Quaternion; parent?: hz.Entity }
  ): Promise<hz.Entity> {
    const b = this.itemBuckets.get(key);
    if (!b) throw new Error(`[SpawnPool] No bucket registered for key ${key}`);

    // pop in O(1)
    let ent: hz.Entity | undefined = b.free.shift();
    if (!ent) {
      // spawn one on demand
      ent = await this.spawnOneItemToPool(key);
    }

    // Mark in-use and place
    b.inUse.add(ent);

    // Position/Parent if provided
    // If you want to attach as child, uncomment and validate API:
    // if (where?.parent) ent.setParent(where.parent);
    if (where?.position) {
      try {
        ent.position.set(where.position);
      } catch {
        /* defensive: ignore if API differs */
      }
    }
    if (where?.rotation) {
      try {
        ent.rotation.set(where.rotation);
      } catch {
        /* defensive */
      }
    }

    // Make visible/interactive again
    try {
      ent.visible.set(true);
    } catch {}

    return ent;
  }

  /** Release an entity back to its pool. Clears grabs and hides entity. */
  public releaseItem(key: Items, ent: hz.Entity): void {
    const b = this.itemBuckets.get(key);
    if (!b) {
      // If we can't resolve bucket, just hide entity to avoid leaks
      try {
        ent.visible.set(false);
      } catch {}
      return;
    }

    // Ensure not grabbed
    const grab = ent.as(hz.GrabbableEntity);
    try {
      grab?.forceRelease();
    } catch {}

    // Reset parent/pose and move to stash point (or far away)
    try {
      // if (this.props.stashPoint) ent.setParent(this.props.stashPoint);
      ent.position.set(this._stashPos);
      ent.rotation.set(this._resetRot);
      ent.visible.set(false);
    } catch {}

    // Mark back into pool
    b.inUse.delete(ent);
    b.free.push(ent);
  }

  // Role Props Pooling -----------------------------------------------------------------

  /** Acquire an entity for a role prop. Spawns if pool is empty. */
  public async acquireProps(
    role: PlayerRoles,
    where?: { position?: hz.Vec3; rotation?: hz.Quaternion; parent?: hz.Entity }
  ): Promise<hz.Entity> {
    const b = this.rolePropBuckets.get(role);
    if (!b)
      throw new Error(`[SpawnPool] No bucket registered for role ${role}`);

    let ent: hz.Entity | undefined = b.free.shift();
    if (!ent) {
      ent = await this.spawnOnePropToPool(role); // create a new one if none available
    }

    // Mark in-use and place
    b.inUse.add(ent);

    // Position/Parent if provided
    // if (where?.parent) ent.setParent(where.parent);
    if (where?.position) {
      try {
        ent.position.set(where.position);
      } catch {}
    }
    if (where?.rotation) {
      try {
        ent.rotation.set(where.rotation);
      } catch {}
    }

    // Make visible/interactive again
    try {
      ent.visible.set(true);
    } catch {}

    return ent;
  }

  /** Release an entity back to its pool. Clears grabs and hides entity. */
  public releaseProp(role: PlayerRoles, ent: hz.Entity): void {
    const b = this.rolePropBuckets.get(role);
    if (!b) {
      // If we can't resolve bucket, just hide entity to avoid leaks
      try {
        ent.visible.set(false);
      } catch {}
      return;
    }

    // Ensure not grabbed
    const grab = ent.as(hz.GrabbableEntity);
    try {
      grab?.forceRelease();
    } catch {}

    // Reset parent/pose and move to stash point (or far away)
    try {
      // if (this.props.stashPoint) ent.setParent(this.props.stashPoint);
      ent.position.set(this._stashPos);
      ent.rotation.set(this._resetRot);
      ent.visible.set(false);
    } catch {}

    // Mark back into pool
    b.inUse.delete(ent);
    b.free.push(ent);
  }

  /** Convenience: Release by entity only (attempts to infer key). */
  public releaseUnknown(ent: hz.Entity): void {
    // First check inUse sets (O(1))
    let found = false;
    this.itemBuckets.forEach((bucket, key) => {
      if (found) return;
      if (bucket.inUse.has(ent)) {
        this.releaseItem(key, ent);
        found = true;
      }
    });
    if (found) return;

    this.rolePropBuckets.forEach((bucket, role) => {
      if (found) return;
      if (bucket.inUse.has(ent)) {
        this.releaseProp(role, ent);
        found = true;
      }
    });
    if (found) return;

    // Fallback: check free lists (rare; O(n) scan)
    this.itemBuckets.forEach((bucket, key) => {
      if (found) return;
      if (bucket.free.includes(ent)) {
        this.releaseItem(key, ent);
        found = true;
      }
    });
    if (found) return;

    this.rolePropBuckets.forEach((bucket, role) => {
      if (found) return;
      if (bucket.free.includes(ent)) {
        this.releaseProp(role, ent);
        found = true;
      }
    });
    if (found) return;

    // Fallback if not found
    try {
      ent.visible.set(false);
    } catch {}
  }

  // Spawning helpers ----------------------------------------------------------
  private async spawnOneItemToPool(key: Items): Promise<hz.Entity> {
    const b = this.itemBuckets.get(key)!;
    const spawnPos = this.getStashPosition();
    const rot = this._resetRot;

    const entities = await this.world.spawnAsset(b.asset, spawnPos, rot);
    const ent = entities[0];
    if (!ent)
      throw new Error(`[SpawnPool] Failed to spawn entity for key ${key}`);

    // Immediately hide + send to stash
    try {
      // if (this.props.stashPoint) ent.setParent(this.props.stashPoint);
      ent.visible.set(false);
      ent.position.set(this._stashPos);
      ent.rotation.set(this._resetRot);
    } catch {}

    b.free.push(ent);
    return ent;
  }

  private async spawnOnePropToPool(role: PlayerRoles): Promise<hz.Entity> {
    const b = this.rolePropBuckets.get(role)!;
    const spawnPos = this.getStashPosition();
    const rot = this._resetRot;

    const entities = await this.world.spawnAsset(b.asset, spawnPos, rot);
    const ent = entities[0];
    if (!ent)
      throw new Error(`[SpawnPool] Failed to spawn entity for role ${role}`);

    // Immediately hide + send to stash
    try {
      // if (this.props.stashPoint) ent.setParent(this.props.stashPoint);
      ent.visible.set(false);
      ent.position.set(this._stashPos);
      ent.rotation.set(this._resetRot);
    } catch {}

    b.free.push(ent);
    return ent;
  }

  /**
   * Spawn batch of items into pool. Uses limited concurrency to avoid very-long
   * sequential waits or unbounded parallelism. This returns after all requested
   * spawns complete.
   */
  private async spawnItemsBatchToPool(
    key: Items,
    count: number
  ): Promise<void> {
    const concurrency = Math.max(
      1,
      Math.floor(this.props.batchSpawnConcurrency ?? 4)
    );
    await this.spawnBatchToPool(
      /* getBucket */ () => this.itemBuckets.get(key)!,
      /* spawnOne */ async () => await this.spawnOneItemToPool(key),
      count,
      concurrency
    );
  }

  private async spawnPropsBatchToPool(
    role: PlayerRoles,
    count: number
  ): Promise<void> {
    const concurrency = Math.max(
      1,
      Math.floor(this.props.batchSpawnConcurrency ?? 4)
    );
    await this.spawnBatchToPool(
      /* getBucket */ () => this.rolePropBuckets.get(role)!,
      /* spawnOne */ async () => await this.spawnOnePropToPool(role),
      count,
      concurrency
    );
  }

  /**
   * General-purpose concurrency-limited batch spawner.
   * - getBucket: returns PoolBucket (caller must ensure bucket exists)
   * - spawnOne: function that spawns one and handles pushing to bucket.free
   */
  private async spawnBatchToPool(
    getBucket: () => PoolBucket,
    spawnOne: () => Promise<hz.Entity>,
    count: number,
    concurrency: number
  ): Promise<void> {
    if (count <= 0) return;
    const bucket = getBucket();

    // Simple concurrency-limited queue
    let inFlight = 0;
    let started = 0;
    const errors: any[] = [];

    return new Promise<void>((resolve) => {
      const startNext = () => {
        while (inFlight < concurrency && started < count) {
          started++;
          inFlight++;
          spawnOne()
            .catch((err) => {
              errors.push(err);
              // continue anyway
            })
            .finally(() => {
              inFlight--;
              if (started < count) {
                startNext();
              } else if (inFlight === 0) {
                if (errors.length > 0) {
                  // Log aggregated error but still resolve so system keeps running
                  console.error(
                    "[SpawnPool] Errors during batch spawn:",
                    errors
                  );
                }
                resolve();
              }
            });
        }
      };
      startNext();
    });
  }

  private getStashPosition(): hz.Vec3 {
    // Return a copy-safe reference for callers that mutate the Vec3 param; we
    // prefer callers to pass their own Vec3 or use the shared stash only for set().
    // To avoid allocations, return the reusable stash vec directly when only used as read-only.
    return this._stashPos;
  }
}

hz.Component.register(Manager_ObjectPooling);
