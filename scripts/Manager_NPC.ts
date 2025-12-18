import Component_NPC from "Component_NPC";
import Component_NPCWaypoint from "Component_NPCWaypoint";
import { TableStatus } from "Enums_Game";
import * as hz from "horizon/core";
import { tableManager, utilityManager } from "Managers_Instance";

export default class Manager_NPC extends hz.Component<typeof Manager_NPC> {
  static propsDefinition = {
    waitingAreaPos: { type: hz.PropTypes.Entity },
  };

  private npcEntities: Map<bigint, Component_NPC> = new Map();
  private waitingQueue: bigint[] = [];
  private waypoints: Set<Component_NPCWaypoint> = new Set<Component_NPCWaypoint>();
  private npcsAtTables: Set<bigint> = new Set();

  private waitingAreaPos!: hz.Vec3;
  private checkTimerId: number | null = null;

  start() {
    this.waitingAreaPos = this.props.waitingAreaPos
      ? utilityManager?.getRandomPointInEntityBounds(this.props.waitingAreaPos)!
      : hz.Vec3.zero;
  }

  getWaitingAreaPosition(): hz.Vec3 {
    this.waitingAreaPos = this.props.waitingAreaPos
      ? utilityManager?.getRandomPointInEntityBounds(this.props.waitingAreaPos)!
      : hz.Vec3.zero;
    return this.waitingAreaPos;
  }
  addNPC(npc: Component_NPC) {
    const id = npc.entity.id;
    if (!this.npcEntities.has(id)) {
      this.npcEntities.set(id, npc);
    }
  }

  removeNPC(npc: Component_NPC) {
    const id = npc.entity.id;
    if (this.npcEntities.has(id)) {
      this.npcEntities.delete(id);
    }
  }

  firstInLine(): bigint | undefined {
    const q = this.waitingQueue;
    if (q.length === 0) return; // nobody waiting

    const npcId = q.shift()!; // FIFO
    return npcId;
  }

  async checkForFreeTable() {
    await utilityManager?.runLocked(async () => {
      const nextInLine = this.firstInLine();
      if (nextInLine) {
        const availableTable = tableManager?.getNextAvailableTable();
        if (availableTable) {
          this.onTableAssigned(nextInLine, availableTable?.tableData.tableId);
        } else {
          // no table available, put them back
          this.waitingQueue.push(nextInLine);
        }
      }
    });
  }

  onNPCLeavesParlor(npc: Component_NPC) {
    // pick a random npc from the map to go to parlor
    const npcsArray = Array.from(this.npcEntities.values()).filter(
      (x) => x !== npc
    );
    if (npcsArray.length === 0) return;
    const randomNpc = npcsArray[Math.floor(Math.random() * npcsArray.length)];
    if (randomNpc) {
      randomNpc.onParlourOpen();
    }
  }

  getWaitingQueueLength(): number {
    return this.waitingQueue.length;
  }

  private startPeriodicCheck() {
    // Check every 30 seconds
    this.checkTimerId = this.async.setInterval(() => {
      this.checkAndInviteNPC();
    }, 30000); // 30 seconds in milliseconds
  }

  private checkAndInviteNPC() {
    // Get combined count
    const combinedCount = this.npcsAtTables.size + this.waitingQueue.length;
    
    // console.log.*$
    
    // If count is less than 6, invite a new NPC
    if (combinedCount < 6) {
      // Get all NPC IDs that are neither at table nor in queue
      const availableNPCs = Array.from(this.npcEntities.keys()).filter(
        (npcId) => !this.npcsAtTables.has(npcId) && !this.waitingQueue.includes(npcId)
      );
      
      if (availableNPCs.length > 0) {
        // Pick a random NPC from available ones
        const randomIndex = Math.floor(Math.random() * availableNPCs.length);
        const selectedNpcId = availableNPCs[randomIndex];
        const selectedNpc = this.npcEntities.get(selectedNpcId);
        
        if (selectedNpc) {
          // console.log.*$
          selectedNpc.onParlourOpen();
        }
      } else {
        // console.log.*$
      }
    }
  }

  // Call this to stop the periodic check (e.g., when component is destroyed)
  private stopPeriodicCheck() {
    if (this.checkTimerId !== null) {
      this.async.clearInterval(this.checkTimerId);
      this.checkTimerId = null;
    }
  }

  onParlourClose() {
    this.stopPeriodicCheck();
    
    this.waitingQueue = [];
    this.npcsAtTables.clear();
    
    this.npcEntities.forEach((npc) => {
      npc.leaveParlour(true);
    });
  }


  onParlourOpen() {
    // randomly pick half of the NPCs to enter the parlour
    const npcsArray = Array.from(this.npcEntities.values());
    const numToEnter = Math.floor(npcsArray.length / 2);

    // lightweight shuffle (not extremely optimal but fine for moderate N)
    for (let i = npcsArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = npcsArray[i];
      npcsArray[i] = npcsArray[j];
      npcsArray[j] = tmp;
    }

    const selected = npcsArray.slice(0, numToEnter);

    selected.forEach((npc) => {
      npc.onParlourOpen();
    });

    this.startPeriodicCheck();
  }

  /* ─────── waypoint handlers ───────────────────────────────────────── */
  registerWaypoint(waypoint: Component_NPCWaypoint) {
    this.waypoints.add(waypoint);
  }

  /**
   * Central helper: try to request a waypoint for an NPC.
   * Returns true if reservation succeeded immediately; false otherwise.
   * If reservation fails the waypoint may enqueue the NPC (internal queue).
   */
  requestWaypointForNpc(
    npc: Component_NPC,
    waypoint: Component_NPCWaypoint | null
  ): boolean {
    if (!waypoint) return false;
    return waypoint.tryReserve(npc);
  }

  releaseWaypointFromNpc(
    npc: Component_NPC,
    waypoint: Component_NPCWaypoint | null
  ): void {
    if (!waypoint) return;
    waypoint.release(npc);
  }

  /**
   * Get the next unoccupied waypoint following `current`.
   * Walks the linked list (via getNextWaypoint) until it finds one that isn't occupied,
   * or returns null if none found.
   *
   * NOTE: this function does NOT reserve the waypoint; it only returns the candidate.
   */
  getNextWaypoint(
    current: Component_NPCWaypoint
  ): Component_NPCWaypoint | null {
    let next: Component_NPCWaypoint | null = null;
    // loop through waypoints starting from current to find unoccupied next waypoint
    let wp: Component_NPCWaypoint | null = current;
    do {
      next = wp.getNextWaypoint();
      if (!next) break; // no next waypoint at all
      if (!next.isWaypointOccupied()) break; // found unoccupied waypoint
      wp = next;
    } while (wp !== current && wp !== null);
    return next;
  }

  /**
   * Atomic: walk the linked waypoints following `current` and try to reserve for `npc`.
   * Returns the first waypoint that was successfully reserved for `npc`, or null.
   *
   * This method centralizes the find+reserve operation so NPCs don't race when calling
   * findClosestWaypoint() then tryReserve() separately.
   */
  getAndReserveNextWaypoint(
    current: Component_NPCWaypoint,
    npc: Component_NPC
  ): Component_NPCWaypoint | null {
    if (!current) return null;

    let wp: Component_NPCWaypoint | null = current;
    do {
      const next: Component_NPCWaypoint | null = wp.getNextWaypoint();
      if (!next) break;

      try {
        // attempt immediate reservation WITHOUT enqueuing on failure.
        // check occupancy first to avoid unnecessary enqueue attempts.
        if (!next.isWaypointOccupied()) {
          const reserved = next.tryReserve(npc, /*enqueueIfFull=*/ false);
          if (reserved) return next;
        }
      } catch (e) {
        // ignore and continue to next
      }
      wp = next;
    } while (wp !== current && wp !== null);

    return null;
  }

  /**
   * Try to find and reserve the closest waypoint to the given NPC.
   * This sorts registered waypoints by XZ distance and attempts immediate reservation
   * in that order. Returns the reserved waypoint (or null if none could be reserved).
   *
   * Use this method from NPCs when you want a single atomic "find+reserve" operation.
   */
  getAndReserveClosestWaypoint(
    npc: Component_NPC
  ): Component_NPCWaypoint | null {
    if (this.waypoints.size === 0) return null;

    const waypointsArray = Array.from(this.waypoints);

    const npcPos = npc.entity.position.get();
    waypointsArray.sort((a, b) => {
      const pa = a.entity.position.get();
      const pb = b.entity.position.get();
      const da =
        (pa.x - npcPos.x) * (pa.x - npcPos.x) +
        (pa.z - npcPos.z) * (pa.z - npcPos.z);
      const db =
        (pb.x - npcPos.x) * (pb.x - npcPos.x) +
        (pb.z - npcPos.z) * (pb.z - npcPos.z);
      return da - db;
    });

    for (let i = 0; i < waypointsArray.length; i++) {
      const wp = waypointsArray[i];
      try {
        // don't call tryReserve that enqueues here; only attempt immediate reserve if not occupied
        if (!wp.isWaypointOccupied()) {
          if (wp.tryReserve(npc, /*enqueueIfFull=*/ false)) {
            return wp;
          }
        }
      } catch (e) {
        // ignore and continue
      }
    }

    return null;
  }

  isWaypointInWaitingArea(waypoint: Component_NPCWaypoint): boolean {
    return waypoint.isWaitingAreaPoint();
  }

  /**
   * Find the closest waypoint from this NPC.
   * Returns a Component_NPCWaypoint or null if none available.
   *
   * NOTE: this function does NOT reserve a waypoint; it only finds the closest candidate.
   * Prefer getAndReserveClosestWaypoint() when you want an atomic find+reserve.
   */
  findClosestWaypoint(npc: Component_NPC): Component_NPCWaypoint | null {
    let closest: Component_NPCWaypoint | null = null;
    let minSqrDist = Infinity;

    const npcPos = npc.entity.position.get();
    // convert Set -> Array once
    const waypointsArray = Array.from(this.waypoints);
    for (let i = 0; i < waypointsArray.length; i++) {
      const wp = waypointsArray[i];
      const wpPos = wp.entity.position.get();

      const dx = wpPos.x - npcPos.x;
      const dy = wpPos.y - npcPos.y;
      const dz = wpPos.z - npcPos.z;
      const sqrDist = dx * dx + dy * dy + dz * dz;

      if (sqrDist < minSqrDist) {
        minSqrDist = sqrDist;
        closest = wp;
      }
    }

    if (closest?.isWaypointOccupied()) {
      closest = this.getNextWaypoint(closest) ?? null;
    }

    return closest;
  }

  dispose(): void {
    this.stopPeriodicCheck();
    this.npcEntities.clear();
    this.waypoints.clear();
    this.waitingQueue = [];
    this.npcsAtTables.clear();
  }

  /* ─────── trigger handlers ───────────────────────────────────────── */
  onReachingWaitingZone(npcId: bigint) {
    // console.log.*$

    if (this.waitingQueue.length >= 1) {
      var npc = this.npcEntities.get(npcId);
      if (npc) {
        // console.log.*$
        //   `[WaitingArea] Player ${npcId} leaving parlour due to full capacity`
        // );
        npc.leaveParlour(true);
      }
      return;
    } 

    const id = npcId;
    const q = this.waitingQueue;
    if (q.includes(id)) {
      console.error(
        `[WaitingArea] Player ${id} is already in the waiting queue`
      );
      return;
    }
    q.push(id);

    this.checkForFreeTable();
  }

  onTableAssigned(npcId: bigint, tableId: string) {
    // console.log.*$
    
    // Failsafe: Verify table exists and is in correct state
    const table = tableManager?.getTableCompFromId(tableId);
    if (!table) {
      console.error(`[Manager_NPC] Table ${tableId} not found! Aborting assignment.`);
      this.waitingQueue.push(npcId); // Put back in queue
      return;
    }
    
    if (table.tableData.status !== TableStatus.Taken) {
      console.error(`[Manager_NPC] Table ${tableId} is not marked as Taken (status: ${table.tableData.status}). Aborting assignment.`);
      this.waitingQueue.push(npcId); // Put back in queue
      return;
    }
    
    // Safe to proceed
    this.npcsAtTables.add(npcId);
    const npc = this.npcEntities.get(npcId);
    if (npc) {
      npc.onTableAssigned(tableId);
    }
  }

  onOrderReceived(npcId: bigint) {
    // console.log.*$
    const npc = this.npcEntities.get(npcId);
    if (npc) {
      npc.onOrderReceived();
    }
  }

  onNPCLeavesTable(npcId: bigint) {
    // console.log.*$
    
    // Remove from tracking
    this.npcsAtTables.delete(npcId);
  }
}
hz.Component.register(Manager_NPC);
