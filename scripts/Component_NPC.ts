import Component_NPCWaypoint from "Component_NPCWaypoint";
import Component_Table from "Component_Table";
import { Items, TableStatus } from "Enums_Game";
import * as hz from "horizon/core";
import { INavMesh, NavMeshAgent, NavMeshAgentAlignment } from "horizon/navmesh";
import {
  AssetBundleGizmo,
  AssetBundleInstanceReference,
} from "horizon/unity_asset_bundles";
import {
  gameManager,
  mainArenaManager,
  navMeshManager,
  npcManager,
  orderManager,
  tableManager,
  utilityManager,
} from "Managers_Instance";
import UI_CustomerHeadsUp from "UI_CustomerHeadsUp";

/* ---------- Enums & Constants ---------- */
enum NPCAnimState {
  Idle,
  Walking,
}
enum NPCState {
  ToRoam = "ToRoam",
  AtWaypoint = "AtWaypoint",
  ToParlour = "ToParlour",
  AtWaitingArea = "AtWaitingArea",
  AtTable = "AtTable",
}

const CONE: Items = Items.Cone;
const EXTRAS: Items[] = [Items.Vanilla, Items.Strawberry, Items.Chocolate];
const DEBUG_PREFIX = `[UAP_NPC]`;

const LAYER_PLAYERS = 1 << 30; // players/human avatars
const LAYER_NPCS = 1 << 28; // NPC layer

/* ---------- Component ---------- */
export default class Component_NPC extends hz.Component<typeof Component_NPC> {
  /* Props */
  static propsDefinition = {
    startingState: { type: hz.PropTypes.String, defaultValue: "ToParlour" },
    walkSpeed: { type: hz.PropTypes.Number, defaultValue: 1.0 },
    runSpeed: { type: hz.PropTypes.Number, defaultValue: 3.0 },
    isDebug: { type: hz.PropTypes.Boolean, default: false },
    customerHudUi: { type: hz.PropTypes.Entity },
    isCustomer: { type: hz.PropTypes.Boolean, default: false },
  };

  /* Private fields */
  private assetRef_?: AssetBundleInstanceReference;
  private navMesh?: INavMesh;
  private agent?: NavMeshAgent;

  private currentState: NPCState = NPCState.ToRoam;
  private animState: NPCAnimState = NPCAnimState.Idle;

  private startingPos?: hz.Vec3;
  private startingRot?: hz.Quaternion;
  private currentWaypoint?: Component_NPCWaypoint | null = null;

  private onMoveComplete: () => void = () => {};
  private updateEventSub?: hz.EventSubscription;
  private currentTarget?: hz.Vec3 | null = null;

  // single-shot debug guard: print debug trace once per move (avoids spamming)
  private _printedMoveDebug: boolean = false;

  public tableComp?: Component_Table;

  /* ---------- Debug helpers (gated) ---------- */
  private log(...args: unknown[]) {
    // if (this.props.isDebug)
      // console.log.*$
  }
  private warn(...args: unknown[]) {
    if (this.props.isDebug)
      console.warn(DEBUG_PREFIX, `-${this.entity.id}: `, ...args);
  }
  private error(...args: unknown[]) {
    if (this.props.isDebug)
      console.error(DEBUG_PREFIX, `-${this.entity.id}: `, ...args);
  }

  /* ---------- Lifecycle (patched start) ---------- */
  start = async () => {
    // cache references
    this.assetRef_ = this.entity.as(AssetBundleGizmo)?.getRoot();
    this.agent = this.entity.as(NavMeshAgent)!;

    if (!this.agent || !this.assetRef_) {
      this.warn("Agent, or asset bundle.");
      return;
    }

    this.agent.avoidanceLayer.set(LAYER_NPCS); // who am I?
    this.agent.avoidanceMask.set(LAYER_NPCS); // who do I avoid?
    // this.agent.avoidanceEnabled.set(true); // make sure it’s on
    this.agent.avoidanceRadius.set(0.6); // ≈ shoulder width in meters
    // this.agent.quality.set(2);

    this.startingPos = this.entity.position.get();
    this.startingRot = this.entity.rotation.get();

    this.props.customerHudUi?.visible.set(false);

    const npcManagerInterval = this.async.setInterval(() => {
      if (npcManager) {
        npcManager?.addNPC(this);
        this.async.clearInterval(npcManagerInterval);
      }
    }, 1000);

    await this.getNavMesh();
    await utilityManager
      ?.delayUntil(() => navMeshManager?.navMeshBaked === true)
      .then(() => {
        this.goToNextWaypoint();
      });

    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      () => {
        if (this.isWalking()) {
          this.startMovingAnim();
        }
      }
    );
  };

  async getNavMesh() {
    const navMeshUpdateInterval = this.async.setInterval(async () => {
      const mesh = await this.agent!.getNavMesh();
      if (mesh) {
        this.navMesh = mesh;
        this.async.clearInterval(navMeshUpdateInterval);
      }
    }, 1000);
  }

  /* ---------- Parlour handlers ---------- */
  onParlourOpen() {
    // ensure any existing polling is stopped
    if (this.updateEventSub) {
      this.updateEventSub.disconnect();
      this.updateEventSub = undefined;
    }

    this.setState(NPCState.ToParlour);
    this.goToWaitingArea();
  }

  goToWaitingArea() {
    this.currentWaypoint?.removeNPC(this);
    this.currentWaypoint = null;
    this.goTo(npcManager?.getWaitingAreaPosition()!, NPCState.AtWaitingArea);
  }

  /* ---------- Waypoint / Roaming ---------- */
  async onWaypointReached() {
    this.log("Reached Waypoint");

    if (
      this.getState() !== NPCState.AtWaypoint &&
      this.getState() !== NPCState.ToRoam
    ) {
      this.log(
        "State changed before reaching waypoint - aborting waypoint handling"
      );
      return;
    }

    // stay a while
    await utilityManager?.sleep(5);

    if (this.currentWaypoint) {
      if (
        mainArenaManager?.isParlourOpen() &&
        npcManager?.isWaypointInWaitingArea(this.currentWaypoint) &&
        npcManager?.getWaitingQueueLength() < 1
      ) {
        this.goToWaitingArea();
      } else {
        // release and move on
        this.currentWaypoint?.release(this);
        this.goToNextWaypoint();
      }
    }
  }

  /**
   * Search the circular chain for an empty waypoint and reserve it before moving.
   * Will yield/retry when all are occupied. Returns the reserved waypoint or null on abort.
   *
   * NOTE: when startWp is not provided, we first attempt an atomic manager-side
   * getAndReserveClosestWaypoint(this) so we don't race with other NPCs.
   */
  private async findAndReserveNextWaypoint(
    startWp?: Component_NPCWaypoint | null
  ): Promise<Component_NPCWaypoint | null> {
    // If caller didn't supply a starting waypoint, attempt manager atomic closest-reserve first.
    if (!startWp) {
      try {
        const reservedByManager =
          npcManager?.getAndReserveClosestWaypoint?.(this) ?? null;
        if (reservedByManager) {
          return reservedByManager;
        }
      } catch (e) {
        // ignore and fall back to normal flow
      }
    }

    // choose start. If none, try closest waypoint (non-reserving)
    let wp: Component_NPCWaypoint | null =
      startWp ?? npcManager?.findClosestWaypoint(this) ?? null;
    if (!wp) return null;

    // iterate circularly until we can reserve
    while (true) {
      // abort if state changed (no longer roaming)
      if (this.getState() !== NPCState.ToRoam) return null;

      // attempt immediate reservation BUT DO NOT enqueue on failure (we will explicitly wait below)
      const reserved = wp.tryReserve(this, /*enqueueIfFull=*/ false);
      if (reserved) {
        return wp; // immediate success
      }

      // otherwise wait until this waypoint promotes us (this will enqueue us on that waypoint)
      try {
        await wp.waitForReservation(this);
        // sanity: ensure still roaming
        if (this.getState() !== NPCState.ToRoam) {
          // abort if our state changed
          return null;
        }
        // at this point the waypoint has promoted this NPC to occupant (or resolver resolved)
        return wp;
      } catch (err) {
        // if waitForReservation rejects or something weird occurs, fallback to continue searching
        const next = wp.getNextWaypoint();
        if (!next) return null;
        wp = next;
        continue;
      }
    }
  }

  /**
   * Find a free waypoint (reserving it first) then move to it.
   * If no waypoint free, this function waits & retries until one frees up or state changes.
   *
   * This version first attempts manager.getAndReserveNextWaypoint when we are advancing
   * from a known currentWaypoint, or manager.getAndReserveClosestWaypoint when no current.
   */
  async goToNextWaypoint() {
    // determine starting waypoint for search / try atomic reservation first
    try {
      if (this.currentWaypoint) {
        // attempt atomic reserve for the *next* waypoint
        const reservedByManagerNext =
          npcManager?.getAndReserveNextWaypoint?.(this.currentWaypoint, this) ??
          null;
        if (reservedByManagerNext) {
          // we reserved it via manager, set and move
          this.currentWaypoint = reservedByManagerNext;
          const wpPos = this.currentWaypoint.entity.position.get();
          this.log(
            `Reserved (manager) next waypoint ${
              this.currentWaypoint.entity.name
            } — moving to (${wpPos.x.toFixed(2)}, ${wpPos.y.toFixed(
              2
            )}, ${wpPos.z.toFixed(2)})`
          );
          this._printedMoveDebug = false;
          // PASS AtWaypoint so arrival triggers onWaypointReached
          this.goTo(
            new hz.Vec3(wpPos.x, wpPos.y, wpPos.z),
            NPCState.AtWaypoint
          );
          return;
        }

        // else, fall through to the older flow: remove from previous & search circularly
        const startFrom =
          this.currentWaypoint.getNextWaypoint() ?? this.currentWaypoint;
        this.currentWaypoint?.removeNPC(this);
        this.currentWaypoint = null;

        const reservedWp = await this.findAndReserveNextWaypoint(startFrom);
        if (!reservedWp) {
          this.log(
            "goToNextWaypoint: reservation aborted or no waypoint reserved"
          );
          return;
        }

        this.currentWaypoint = reservedWp;
        const wpPos = this.currentWaypoint.entity.position.get();
        this.log(
          `Reserved waypoint ${
            this.currentWaypoint.entity.name
          } — moving to (${wpPos.x.toFixed(2)}, ${wpPos.y.toFixed(
            2
          )}, ${wpPos.z.toFixed(2)})`
        );
        this._printedMoveDebug = false;
        this.goTo(new hz.Vec3(wpPos.x, wpPos.y, wpPos.z), NPCState.AtWaypoint);
        return;
      } else {
        // No current waypoint: try atomic manager closest-reserve first
        const reservedByManager =
          npcManager?.getAndReserveClosestWaypoint?.(this) ?? null;
        if (reservedByManager) {
          this.currentWaypoint = reservedByManager;
          const wpPos = this.currentWaypoint.entity.position.get();
          this.log(
            `Reserved (manager) closest waypoint ${
              this.currentWaypoint.entity.name
            } — moving to (${wpPos.x.toFixed(2)}, ${wpPos.y.toFixed(
              2
            )}, ${wpPos.z.toFixed(2)})`
          );
          this._printedMoveDebug = false;
          this.goTo(
            new hz.Vec3(wpPos.x, wpPos.y, wpPos.z),
            NPCState.AtWaypoint
          );
          return;
        }

        // fallback to findClosest -> findAndReserve flow
        const startFrom = npcManager?.findClosestWaypoint(this) ?? null;
        if (!startFrom) {
          this.log("goToNextWaypoint: no starting waypoint available");
          return;
        }

        const reservedWp = await this.findAndReserveNextWaypoint(startFrom);
        if (!reservedWp) {
          this.log(
            "goToNextWaypoint: reservation aborted or no waypoint reserved"
          );
          return;
        }

        this.currentWaypoint = reservedWp;
        const wpPos = this.currentWaypoint.entity.position.get();
        this.log(
          `Reserved waypoint ${
            this.currentWaypoint.entity.name
          } — moving to (${wpPos.x.toFixed(2)}, ${wpPos.y.toFixed(
            2
          )}, ${wpPos.z.toFixed(2)})`
        );
        this._printedMoveDebug = false;
        this.goTo(new hz.Vec3(wpPos.x, wpPos.y, wpPos.z), NPCState.AtWaypoint);
        return;
      }
    } catch (e) {
      this.error("Error in goToNextWaypoint:", e);
      return;
    }
  }

  /* ---------- Table / Order ---------- */
  onTableAssigned(tableId: string) {
    this._printedMoveDebug = false;
    this.tableComp = tableManager?.getTableCompFromId(tableId);
    const target = this.tableComp?.tableData.position;
    this.goTo(
      target!,
      NPCState.AtTable,
      this.tableComp?.tableData.tableCenter!
    );
  }

  async onOrderReceived() {
    await utilityManager?.sleep(5);
    this.leaveParlour();
  }

  leaveParlour(quietly: boolean = false) {
    this.props.customerHudUi?.visible.set(false);
    if (!quietly) {
      npcManager?.onNPCLeavesTable(this.entity.id);
    }
    this.tableComp?.removeOrderFromTable(this.tableComp?.props.tableId ?? "");
    this.tableComp = undefined;
    this.goToNextWaypoint();
  }


  /* ---------- State & Animation ---------- */
  setDestination(pos: hz.Vec3) {
    if (!this.agent) {
      this.warn("No NavMeshAgent available when calling setDestination");
      return;
    }

    // set agent destination and switch to walking animation
    this.agent.destination.set(pos);
    this.setAnimState(NPCAnimState.Walking);
  }

  getState(): NPCState {
    return this.currentState;
  }

  setState(state: NPCState) {
    if (state !== NPCState.ToRoam && this.currentState === state) return;

    // NOTE: avoid calling onWaypointReached() here; arrival should trigger it.
    if (state === NPCState.AtWaitingArea) {
      this.async.setTimeout(() => {
        npcManager?.onReachingWaitingZone(this.entity.id);
      }, 2000);
    }
    if (state === NPCState.AtTable) {
      this.setOrder();
      this.tableComp!.updateStatus(TableStatus.Occupied);
      this.tableComp!.indicateTheStation_cashier();
      this.props.customerHudUi?.visible.set(true);
    }

    this.currentState = state;
  }

  setAnimState(state: NPCAnimState) {
    if (!this.agent) return;

    switch (state) {
      case NPCAnimState.Idle:
        this.stopMovingAnim();
        this.agent.alignmentMode.set(NavMeshAgentAlignment.None);
        this.animState = NPCAnimState.Idle;

        if (this.updateEventSub) {
          this.updateEventSub.disconnect();
          this.updateEventSub = undefined;
        }
        break;

      case NPCAnimState.Walking:
        this.startMovingAnim();
        this.animState = NPCAnimState.Walking;
        this.agent.alignmentMode.set(NavMeshAgentAlignment.CurrentVelocity);

        if (!this.updateEventSub) {
          this.updateEventSub = this.connectLocalBroadcastEvent(
            hz.World.onUpdate,
            (data) => {
              this.update(data.deltaTime);
            }
          );
        }
        break;
    }
  }

  isWalking() {
    return this.animState === NPCAnimState.Walking;
  }
  isIdling() {
    return this.animState === NPCAnimState.Idle;
  }

  /* ---------- Arrival detection helpers ---------- */
  private _xzDistanceBetween(a: hz.Vec3, b: hz.Vec3) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Arrival detection: prefer deterministic XZ-distance test.
   * Only use agent.remainingDistance as a fallback **if** it is finite and > epsilon.
   */
  private isArrivedOrCloseEnough(stoppingDistanceOverride = 0.15): boolean {
    if (!this.currentTarget) return false;

    // Current position (use XZ plane only)
    const pos = this.entity.position.get();
    const dx = pos.x - this.currentTarget.x;
    const dz = pos.z - this.currentTarget.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);

    // Stopping threshold (small epsilon)
    const stop =
      (this.agent?.stoppingDistance.get() ?? stoppingDistanceOverride) + 0.05;

    // Primary check: XZ distance (most reliable)
    if (distXZ <= stop) {
      return true;
    }

    // Fallback: only if remainingDistance is a sensible positive number.
    // (Some agent implementations return 0 immediately while path is pending.)
    try {
      const rem = this.agent?.remainingDistance.get();
      const sensibleEpsilon = 0.001; // treat <= this as "no useful remainingDistance"
      if (typeof rem === "number" && isFinite(rem) && rem > sensibleEpsilon) {
        return rem <= stop;
      }
    } catch (e) {
      // Ignore navmesh oddities; fallback already handled by distXZ.
    }

    return false;
  }

  /* ---------- Update (polled each frame while walking) ---------- */
  update(_: number): void {
    // Only check arrival when walking and we have a target
    if (!this.isWalking() || !this.currentTarget) return;

    // Debug: print the deciding numbers once per move (if debug enabled)
    if (this.props.isDebug && !this._printedMoveDebug) {
      try {
        const pos = this.entity.position.get();
        const rem = this.agent?.remainingDistance.get();
        const stop = this.agent?.stoppingDistance.get();
        const distXZ = this._xzDistanceBetween(pos, this.currentTarget);
        // console.log.*$
        //   DEBUG_PREFIX,
        //   `-${this.entity.id}: update-check => pos=(${pos.x.toFixed(
        //     2
        //   )},${pos.y.toFixed(2)},${pos.z.toFixed(2)}), ` +
        //     `target=(${this.currentTarget.x.toFixed(
        //       2
        //     )},${this.currentTarget.y.toFixed(
        //       2
        //     )},${this.currentTarget.z.toFixed(2)}), ` +
        //     `distXZ=${distXZ.toFixed(3)}, stopping=${String(
        //       stop
        //     )}, rem=${String(rem)}`
        // );
      } catch (e) {
        /* ignore debug failures */
      }
      this._printedMoveDebug = true;
    }

    // arrival check
    if (this.isArrivedOrCloseEnough()) {
      this.log("Arrived at target");
      // clean up polling
      if (this.updateEventSub) {
        this.updateEventSub.disconnect();
        this.updateEventSub = undefined;
      }

      // run completion handler safely once
      const handler = this.onMoveComplete;
      this.onMoveComplete = () => {};
      try {
        handler();
      } catch (err) {
        this.error("Error in onMoveComplete:", err);
      }

      // clear target
      this.currentTarget = null;
    }
  }

  /* ---------- Animation helpers ---------- */
  private startMovingAnim() {
    this.assetRef_?.setAnimationParameterBool("Moving", true);
    this.assetRef_?.setAnimationParameterFloat("Speed", this.props.walkSpeed);
  }

  private stopMovingAnim() {
    this.assetRef_?.setAnimationParameterBool("Moving", false);
    this.assetRef_?.setAnimationParameterFloat("Speed", 0);
  }

  /* ---------- goTo: centralized movement ---------- */
  goTo(target: hz.Vec3, newState: NPCState, targetToRotate?: hz.Vec3) {
    // snapshot target
    this.currentTarget = new hz.Vec3(target.x, target.y, target.z);

    // define the on-move-complete handler FIRST (avoid races)
    this.onMoveComplete = () => {
      // ensure we go to Idle animation and run state transition
      this.setAnimState(NPCAnimState.Idle);
      this.setState(newState);
      // rotate toward optional look target
      if (targetToRotate) {
        const currentPos = this.entity.position.get();
        const dir = targetToRotate.sub(currentPos);
        dir.y = 0;
        dir.normalize();

        this.agent?.lookAt(currentPos.add(dir));
      }

      // If we've arrived at a waypoint, trigger waypoint-specific handling.
      if (newState === NPCState.AtWaypoint) {
        try {
          this.onWaypointReached();
        } catch (e) {
          this.error("Error in onWaypointReached:", e);
        }
      }
    };

    // ensure update listener is active so arrival is detected
    // if (!this.updateEventSub) {
    //   this.updateEventSub = this.connectLocalBroadcastEvent(hz.World.onUpdate, (data) => {
    //     this.update(data.deltaTime);
    //   });
    // }

    // send destination to agent (this triggers movement)
    this.setDestination(this.currentTarget);
  }

  /* ---------- Orders ---------- */
  setOrder() {
    const order = this.createRandomOrder();
    const orderId =
      orderManager?.addOrder(
        order,
        "Placeholder Name",
        this.entity.id,
        this.tableComp?.props.tableId ?? ""
      ) ?? 0;

    this.tableComp?.setOrderAtTable(this.tableComp.props.tableId);
    tableManager?.addCustomer(
      this.entity.id,
      orderId,
      this.tableComp?.props.tableId ?? ""
    );
    this.props.customerHudUi
      ?.getComponents(UI_CustomerHeadsUp)[0]
      ?.setOrder(order);
  }

  createRandomOrder(maxItems: number = 4): Items[] {
    if (gameManager?.isThisTrainingSession()) {
      return [CONE, Items.Vanilla, Items.Strawberry];
    }

    const maxExtras = Math.min(maxItems - 1, EXTRAS.length);
    const extraCount = 1 + Math.floor(Math.random() * maxExtras);

    const order: Items[] = [CONE];
    for (let i = 0; i < extraCount; i++) {
      let extra = EXTRAS[Math.floor(Math.random() * EXTRAS.length)];
      while (extra === CONE)
        extra = EXTRAS[Math.floor(Math.random() * EXTRAS.length)];
      order.push(extra);
    }
    return order;
  }

  /* ---------- Reset ---------- */
  async resetCustomer() {
    this.tableComp = undefined;
    await utilityManager?.sleep(5);

    if (mainArenaManager?.isParlourOpen()) {
      this.goTo(
        npcManager?.getWaitingAreaPosition()!,
        NPCState.AtWaitingArea,
        npcManager?.getWaitingAreaPosition()!
      );
    } else {
      this.goTo(this.startingPos!, NPCState.ToParlour);
    }
  }
}
hz.Component.register(Component_NPC);
