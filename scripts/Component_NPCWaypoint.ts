import Component_NPC from "Component_NPC";
import * as hz from "horizon/core";
import { npcManager, utilityManager } from "Managers_Instance";

/**
 * Component_NPCWaypoint
 * - Maintains current occupants and a FIFO queue.
 * - Supports tryReserve(npc) for immediate reservation (returns boolean).
 * - Supports waitForReservation(npc): Promise<void> which resolves when the waypoint
 *   actually becomes reserved for that NPC (useful for awaiting promotion).
 * - release(npc) promotes the next queued NPC and resolves its waiter.
 */
export default class Component_NPCWaypoint extends hz.Component<typeof Component_NPCWaypoint> {
  static propsDefinition = {
    nextWaypoint: { type: hz.PropTypes.Entity, required: true },
    waitingAreaPoint: { type: hz.PropTypes.Boolean, default: false },
    capacity: { type: hz.PropTypes.Number, defaultValue: 1 }, // how many NPCs can occupy
  };

  private npcInWaypoint: Component_NPC[] = [];
  private nextWaypoint: Component_NPCWaypoint | null = null;
  private _queue: Component_NPC[] = [];
  private capacity = 1;

  // Map<npcId:string, resolverFn> used to wake waiting NPCs when they are promoted.
  private _pendingResolvers: Map<string, () => void> = new Map();

  start = async () => {
    this.nextWaypoint = this.props.nextWaypoint?.getComponents<Component_NPCWaypoint>()[0] ?? null;
    if (!this.nextWaypoint) {
      // keep this behind console.warn so devs notice but don't spam normal logs
      if (console && console.warn) console.warn(`NPC Waypoint ${this.entity.name} has no valid next waypoint.`);
    }

    await utilityManager?.delayUntil(() => npcManager != null).then(() => { 
      npcManager?.registerWaypoint(this);
    });
  }

  getNextWaypoint(): Component_NPCWaypoint | null {
    return this.nextWaypoint;
  }

  isWaypointOccupied(): boolean {
    return this.npcInWaypoint.length >= (this.props.capacity ?? this.capacity);
  }

  /**
   * Immediate reservation attempt.
   * If capacity available this NPC is appended to the occupant list and `true` is returned.
   * If full, the NPC is added to the internal queue and `false` is returned.
   *
   * NEW: second parameter `enqueueIfFull` (default true). When false, this call will
   * not push the NPC into the queue when the waypoint is full — useful for probing.
   */
  tryReserve(npc: Component_NPC, enqueueIfFull: boolean = true): boolean {
    // prevent duplicates in occupant list
    if (this.npcInWaypoint.indexOf(npc) !== -1) return true;

    const cap = this.props.capacity ?? this.capacity;
    if (this.npcInWaypoint.length < cap) {
      this.npcInWaypoint.push(npc);

      // if this NPC already had a pending resolver (defensive), resolve it immediately
      const key = String(npc.entity.id);
      const r = this._pendingResolvers.get(key);
      if (r) {
        this._pendingResolvers.delete(key);
        try { r(); } catch (e) { /* ignore */ }
      }

      // DEBUG (noisy): console.debug(`[NPCWaypoint] Reserved ${this.entity.name} for ${npc.entity.id}`);
      return true;
    }

    // full - enqueue if allowed (and not already queued)
    if (enqueueIfFull) {
      if (this._queue.indexOf(npc) === -1) {
        this._queue.push(npc);
      }
    }

    return false;
  }

  /**
   * Returns a Promise that resolves when the NPC becomes an occupant.
   * If it's already an occupant the promise resolves immediately.
   * If not an occupant, the npc is enqueued (if not present) and the resolver
   * will be invoked when release() promotes that npc.
   */
  waitForReservation(npc: Component_NPC): Promise<void> {
    // already reserved?
    if (this.npcInWaypoint.indexOf(npc) !== -1) return Promise.resolve();

    // ensure npc is queued
    if (this._queue.indexOf(npc) === -1) this._queue.push(npc);

    const key = String(npc.entity.id);

    // If a resolver already exists for this NPC, don't create duplicate; return a wrapper Promise.
    if (this._pendingResolvers.has(key)) {
      // there is already a pending resolver; return a promise that resolves when that resolver is called
      return new Promise((resolve) => {
        const existing = this._pendingResolvers.get(key)!;
        // wrap resolver to call existing then resolve
        this._pendingResolvers.set(key, () => {
          try { existing(); } catch (e) {}
          resolve();
        });
      });
    }

    // Create and store resolver that will be called in `release()` when this npc is promoted
    return new Promise((resolve) => {
      this._pendingResolvers.set(key, () => {
        this._pendingResolvers.delete(key);
        try { resolve(); } catch (e) { /* ignore */ }
      });
    });
  }

  /**
   * Release an npc from this waypoint. If releasing an occupant, promote the next queued npc
   * into the occupant list (and resolve its pending promise if any).
   */
  release(npc: Component_NPC): void {
    // Remove from occupant list if present
    const occIdx = this.npcInWaypoint.indexOf(npc);
    if (occIdx >= 0) {
      this.npcInWaypoint.splice(occIdx, 1);

      // Promote from queue (FIFO)
      const promoted = this._queue.shift();
      if (promoted) {
        this.npcInWaypoint.push(promoted);

        // Debug: log promotions so runtime traceable
        // if (console && // console.log.*$
        //   try {
        //     // console.log.*$
        //   } catch (e) { /* ignore debug failures */ }
        // }

        // If the promoted npc had a pending resolver, call it now:
        const key = String(promoted.entity.id);
        const resolver = this._pendingResolvers.get(key);
        if (resolver) {
          this._pendingResolvers.delete(key);
          try { resolver(); } catch (e) { /* ignore */ }
        }
      }
      return;
    }

    // Otherwise, if npc is in queue, remove it
    const qIdx = this._queue.indexOf(npc);
    if (qIdx >= 0) {
      this._queue.splice(qIdx, 1);

      // If there was a pending resolver for this NPC (we removed them from queue), clean it up
      const key = String(npc.entity.id);
      if (this._pendingResolvers.has(key)) {
        this._pendingResolvers.delete(key);
      }
    }
  }

  /**
   * Remove an NPC from both occupant list and queue, cleaning up pending resolvers.
   */
  removeNPC(npc: Component_NPC): void {
    const occIdx = this.npcInWaypoint.indexOf(npc);
    if (occIdx !== -1) this.npcInWaypoint.splice(occIdx, 1);

    const qIdx = this._queue.indexOf(npc);
    if (qIdx >= 0) this._queue.splice(qIdx, 1);

    const key = String(npc.entity.id);
    if (this._pendingResolvers.has(key)) this._pendingResolvers.delete(key);
  }

  isWaitingAreaPoint(): boolean {
    return this.props.waitingAreaPoint ?? false;
  }

  /**
   * For debug / external checks — who currently occupies the waypoint.
   * Returns a shallow array copy to avoid external mutation.
   */
  reservedBy(): Component_NPC | null {
    return this.npcInWaypoint.length > 0 ? this.npcInWaypoint[0] : null;
  }

  getOccupants(): Component_NPC[] {
    return this.npcInWaypoint.slice();
  }
}
hz.Component.register(Component_NPCWaypoint);
