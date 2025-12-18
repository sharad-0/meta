import * as hz from "horizon/core";
import { NavMeshAgent, NavMeshAgentAlignment } from "horizon/navmesh";
import {
  AssetBundleGizmo,
  AssetBundleInstanceReference,
} from "horizon/unity_asset_bundles";

/**
 * Minimal dummy NPC that loops through up to 3 waypoint entities.
 * Assign 2–3 waypoints; the agent will walk between them forever.
 */
const LAYER_PLAYERS = 1 << 30; // players/human avatars
const LAYER_NPCS = 1 << 28; // NPC layer
export default class Component_DummyNPC extends hz.Component<
  typeof Component_DummyNPC
> {
  /* Props */
  static propsDefinition = {
    waypointA: { type: hz.PropTypes.Entity }, // required
    waypointB: { type: hz.PropTypes.Entity }, // required
    waypointC: { type: hz.PropTypes.Entity, default: null }, // optional
    walkSpeed: { type: hz.PropTypes.Number, defaultValue: 1.0 },
    arriveEpsilon: { type: hz.PropTypes.Number, defaultValue: 0.05 },
    isDebug: { type: hz.PropTypes.Boolean, default: false },
  };

  /* Private fields */
  private agent?: NavMeshAgent;
  private assetRef_?: AssetBundleInstanceReference;
  private waypoints: hz.Entity[] = [];
  private currentIdx: number = -1;
  private currentTarget?: hz.Vec3 | null = null;
  private updateSub?: hz.EventSubscription;
  private _printedMoveDebug: boolean = false;
  private isWalking: boolean = false;

  /* Debug helpers */
  private log(...args: unknown[]) {
  //   if (this.props.isDebug)
  //     // console.log.*$
  }
  private warn(...args: unknown[]) {
    if (this.props.isDebug)
      console.warn("[DummyNPC]", `-${this.entity.id}:`, ...args);
  }

  /* Animation helpers */
  private startMovingAnim() {
    this.assetRef_?.setAnimationParameterBool("Moving", true);
    this.assetRef_?.setAnimationParameterFloat("Speed", this.props.walkSpeed);
    this.agent?.alignmentMode.set(NavMeshAgentAlignment.CurrentVelocity);
    this.isWalking = true;
  }

  private stopMovingAnim() {
    this.assetRef_?.setAnimationParameterBool("Moving", false);
    this.assetRef_?.setAnimationParameterFloat("Speed", 0);
    this.agent?.alignmentMode.set(NavMeshAgentAlignment.None);
    this.isWalking = false;
  }

  /* Lifecycle */
  start = async () => {
    this.agent = this.entity.as(NavMeshAgent)!;
    this.assetRef_ = this.entity.as(AssetBundleGizmo)?.getRoot();
    this.agent.avoidanceLayer.set(LAYER_NPCS); // who am I?
    this.agent.avoidanceMask.set(LAYER_NPCS); // who do I avoid?
    // this.agent.avoidanceEnabled.set(true); // make sure it’s on
    this.agent.avoidanceRadius.set(0.6); // ≈ shoulder width in meters
    if (!this.agent) {
      this.warn("No NavMeshAgent on this entity");
      return;
    }

    // Idle on start
    this.stopMovingAnim();

    // Collect waypoints
    const { waypointA, waypointB, waypointC } = this.props as {
      waypointA?: hz.Entity;
      waypointB?: hz.Entity;
      waypointC?: hz.Entity | null;
    };
    this.waypoints = [waypointA, waypointB, waypointC].filter(
      (e): e is hz.Entity => !!e
    );

    if (this.waypoints.length < 2) {
      this.warn("Needs at least 2 waypoint entities to loop");
      return;
    }

    // Update loop
    if (!this.updateSub) {
      this.updateSub = this.connectLocalBroadcastEvent(
        hz.World.onUpdate,
        (data) => {
          this.update(data.deltaTime);
        }
      );
    }

    this.async.setTimeout(() => {
    // Begin roaming
    this.goToNext();
    }, 3000);

    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      () => {
        if (this.isWalking) {
          this.startMovingAnim();
        }
      }
    );
  };

  onDestroy(): void {
    this.stopMovingAnim();
    if (this.updateSub) {
      this.updateSub.disconnect();
      this.updateSub = undefined;
    }
  }

  /* Movement core */
  private goToIndex(idx: number) {
    const wp = this.waypoints[idx];
    const pos = wp.position.get();
    this.currentIdx = idx;
    this.currentTarget = new hz.Vec3(pos.x, pos.y, pos.z);
    this._printedMoveDebug = false;

    // Drive agent and start walking anim
    this.agent?.destination.set(this.currentTarget);
    this.agent?.maxSpeed.set(this.props.walkSpeed);
    this.startMovingAnim();
    this.log(
      `Moving to WP#${idx} at (${pos.x.toFixed(2)}, ${pos.y.toFixed(
        2
      )}, ${pos.z.toFixed(2)})`
    );
  }

  private goToNext() {
    if (this.waypoints.length === 0) return;
    const next = (this.currentIdx + 1) % this.waypoints.length;
    this.goToIndex(next);
  }

  /* Arrival checks */
  private _xzDist(a: hz.Vec3, b: hz.Vec3) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  private isArrived(): boolean {
    if (!this.currentTarget) return false;

    const pos = this.entity.position.get();
    const distXZ = this._xzDist(pos, this.currentTarget);

    // Planar check first
    const stop =
      (this.agent?.stoppingDistance.get?.() ?? 0) +
      (this.props.arriveEpsilon ?? 0.05);
    if (distXZ <= stop) return true;

    // Fallback to remainingDistance if sensible
    try {
      const rem = this.agent?.remainingDistance.get?.();
      if (typeof rem === "number" && isFinite(rem) && rem > 0.001) {
        return rem <= stop;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  /* Per-frame update */
  update(_: number): void {
    if (!this.currentTarget) return;

    if (this.props.isDebug && !this._printedMoveDebug) {
      const pos = this.entity.position.get();
      const rem = this.agent?.remainingDistance.get?.();
      const stop = this.agent?.stoppingDistance.get?.();
      const distXZ = this._xzDist(pos, this.currentTarget);
      // // console.log.*$
      //   "[DummyNPC]",
      //   `-${this.entity.id}: pos=(${pos.x.toFixed(2)},${pos.y.toFixed(
      //     2
      //   )},${pos.z.toFixed(2)}) target=(${this.currentTarget.x.toFixed(
      //     2
      //   )},${this.currentTarget.y.toFixed(2)},${this.currentTarget.z.toFixed(
      //     2
      //   )}) distXZ=${distXZ.toFixed(3)} stopping=${String(stop)} rem=${String(
      //     rem
      //   )}`
      // );
      this._printedMoveDebug = true;
    }

    if (this.isArrived()) {
      // Stop anim on arrival, then continue after a small pause
      this.stopMovingAnim();
      this.currentTarget = null;
      this.async.setTimeout(() => this.goToNext(), 250);
    }
  }
}

hz.Component.register(Component_DummyNPC);
