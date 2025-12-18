import * as hz from "horizon/core";
import LocalCamera from "horizon/camera";
import {
  pickedItemFromTray,
  PlayerDroppedSnowball,
  PlayerEnteredSnowfightArea,
  PlayerExitedSnowfightArea,
  PlayerGrabbedSnowball,
  SnowballThrowEvent,
} from "Manager_Events";
import { playerAnimations } from "Managers_Instance";
import { Player, World } from "horizon/core";

// Network payload contracts (must be serializable)
type ExplodePayload = {
  origin: { x: number; y: number; z: number };
  radius: number;
  duration: number;
  ownerId?: number;
};
type EffectForPlayerPayload = {
  playerId: number;
  duration: number;
  state: "start" | "end" | "cancel";
};
type ScreenShakePayload = {
  playerId: number;
  duration: number;
  state: "start" | "end" | "cancel";
};

// State Machine for Party Bomb
enum BombState {
  IDLE = "idle", // Spawned, can be grabbed
  HELD = "held", // Being held by player
  ARMED = "armed", // Thrown, collision active, can explode
  EXPLODED = "exploded", // Exploded, cleanup phase
  RESPAWNING = "respawning", // Resetting to spawn location
}

class Component_Snowball extends hz.Component<typeof Component_Snowball> {
  // Configurable properties shown on the component
  static propsDefinition = {
    radius: {
      type: hz.PropTypes.Number,
      default: 2,
      displayName: "Explosion Radius (m)",
      min: 0.5,
      max: 30,
    },
    duration: {
      type: hz.PropTypes.Number,
      default: 10.0,
      displayName: "Dance Duration (s)",
      min: 0.5,
      max: 15,
    },
    fuseSeconds: {
      type: hz.PropTypes.Number,
      default: 1.25,
      displayName: "Fuse (s)",
      min: 0.1,
      max: 10,
    },
    affectOwner: {
      type: hz.PropTypes.Boolean,
      default: true,
      displayName: "Affect Thrower",
    },
    allowFriendlyFire: {
      type: hz.PropTypes.Boolean,
      default: true,
      displayName: "Affect Teammates",
    },
    mobileAimAssist: {
      type: hz.PropTypes.Boolean,
      default: true,
      displayName: "Mobile Aim Assist",
    },
    debugMode: {
      type: hz.PropTypes.Boolean,
      default: false,
      displayName: "Debug console"
    },
    explosionVFX: { type: hz.PropTypes.Entity },
    explosionSFX: { type: hz.PropTypes.Entity },
    // Following VFX that tracks affected players
    followingVFX: {
      type: hz.PropTypes.Entity,
      displayName: "Following VFX (ParticleGizmo)",
    },
    // New tuning knobs for consistent forward throws
    engineThrowSpeed: {
      type: hz.PropTypes.Number,
      default: 0.5,
      displayName: "Engine Throw Speed",
      min: 0,
      max: 25,
    },
    impulseStrength: {
      type: hz.PropTypes.Number,
      default: 16.0,
      displayName: "Impulse Strength",
      min: 0,
      max: 60,
    },
    upwardBias: {
      type: hz.PropTypes.Number,
      default: 0.1,
      displayName: "Upward Bias (0-0.5)",
      min: 0,
      max: 0.5,
    },
    impulseMinSpeedThreshold: {
      type: hz.PropTypes.Number,
      default: 0.5,
      displayName: "Impulse Min Speed (m/s)",
      min: 0,
      max: 5,
    },
    forwardDotThreshold: {
      type: hz.PropTypes.Number,
      default: 0.2,
      displayName: "Forward Dot Threshold",
      min: -1,
      max: 1,
    },
    releaseDelayMs: {
      type: hz.PropTypes.Number,
      default: 40,
      displayName: "ForceRelease Delay (ms)",
      min: 0,
      max: 200,
    },
    debugTrajectory: {
      type: hz.PropTypes.Boolean,
      default: true,
      displayName: "Debug Trajectory Logs",
    },
    // Detonation behavior
    explodeOnImpact: {
      type: hz.PropTypes.Boolean,
      default: true,
      displayName: "Explode On Impact",
    },
    armDelayMs: {
      type: hz.PropTypes.Number,
      default: 50,
      displayName: "Arming Delay (ms)",
      min: 10,
      max: 2000,
    },
    despawnOnExplode: {
      type: hz.PropTypes.Boolean,
      default: true,
      displayName: "Hide/Despawn On Explode",
    },
    despawnDelayMs: {
      type: hz.PropTypes.Number,
      default: 800,
      displayName: "Despawn Delay (ms)",
      min: 0,
      max: 5000,
    },
    // Follow-up audio after the initial explosion SFX
    followupAudio: {
      type: hz.PropTypes.Entity,
      displayName: "Follow-up Audio (AudioGizmo)",
    },
    followupAudioDelayMs: {
      type: hz.PropTypes.Number,
      default: 1000,
      displayName: "Follow-up Audio Delay (ms)",
      min: 0,
      max: 10000,
    },
    // Collision prevention settings
    collisionDelayMs: {
      type: hz.PropTypes.Number,
      default: 0,
      displayName: "Collision Delay (ms)",
      min: 0,
      max: 1000,
    },
    minThrowerDistance: {
      type: hz.PropTypes.Number,
      default: 0.1,
      displayName: "Min Thrower Distance (m)",
      min: 0.0,
      max: 5.0,
    },
    // Timer fallback settings
    enableTimerFallback: {
      type: hz.PropTypes.Boolean,
      default: true,
      displayName: "Enable Timer Fallback",
    },
    fallbackTimerSeconds: {
      type: hz.PropTypes.Number,
      default: 3.0,
      displayName: "Fallback Timer (s)",
      min: 1.0,
      max: 10.0,
    },
    snowballManager: {
      type: hz.PropTypes.Entity,
      displayName: "Snowball Manager Entity",
    },
    pickAnimation: { type: hz.PropTypes.Asset },
    snowPileEntity: { type: hz.PropTypes.Entity },
  } as const;

  // Local and network events
  private static readonly EVT_Explode = new hz.NetworkEvent<ExplodePayload>(
    "PB:Explode"
  );
  private static readonly EVT_EffectForPlayer =
    new hz.NetworkEvent<EffectForPlayerPayload>("PB:EffectForPlayer");
  // Explicit event sent to the SERVER to run authoritative target selection
  private static readonly EVT_ExplodeToServer =
    new hz.NetworkEvent<ExplodePayload>("PB:ExplodeToServer");
  // Screen shake event - matches ScreenShakeEffect component
  private static readonly EVT_ScreenShake =
    new hz.NetworkEvent<ScreenShakePayload>("ScreenShake:Effect");

  // State Machine - Single source of truth
  private _currentState: BombState = BombState.IDLE;
  private _stateEnteredAt: number = 0;

  // Internal state
  private _activePlayerTimers: Map<number, number> = new Map();
  private _holderId?: number;
  private _localThrowInput?: hz.PlayerInput;
  private _lastHand?: hz.Handedness;
  private _bindTries: number = 0;
  private _lastThrowDir?: hz.Vec3;
  private _pendingImpulse: boolean = false;
  private _throwCooldownUntil: number = 0;
  private _aimUpdateSub?: hz.EventSubscription | null;
  private _lastAimDir?: hz.Vec3;
  private _lastThrowOrigin?: hz.Vec3;
  private _landingTrackerSub?: hz.EventSubscription | null;
  private _landingLogged: boolean = false;
  private _playedLocalVFXSFX: boolean = false;
  private _pendingImpactPos?: hz.Vec3;
  private _throwerPosition?: hz.Vec3;
  private _throwerId?: number;
  private _throwInitiatedAt: number = 0;
  private _originalSpawnPosition?: hz.Vec3;
  private _originalSpawnRotation?: hz.Quaternion;
  private _lastVelocity?: number;
  private _fallbackTimer?: number;
  private _activeFollowingVFX: Map<number, hz.Entity> = new Map(); // playerId -> VFX entity
  private _activeScreenShake: Map<number, boolean> = new Map(); // playerId -> shake active
  private _serverPlayer?: hz.Player;
  private fallbackTimer: number | null = null;
  private isSfxPlaying: boolean = false;
  private pickingAnimAsset: hz.Asset | null = null;
  private playersInZone: Player[] = [];
  // Debug logging helper
  private debug(message: string): void {
    if (this.props.debugMode) {
      // console.log.*$
    }
  }

  start() {
    // Store original spawn position and rotation
    try {
      const p = this.entity.position.get().clone();
      const r = this.entity.rotation.get().clone();
      // Take immutable snapshots instead of storing live references
      this._originalSpawnPosition = new hz.Vec3(p.x, p.y, p.z);
      this._originalSpawnRotation = new hz.Quaternion(r.x, r.y, r.z, r.w);
      this.debug(
        `✅ Spawn position stored: (${this._originalSpawnPosition.x.toFixed(
          2
        )},${this._originalSpawnPosition.y.toFixed(
          2
        )},${this._originalSpawnPosition.z.toFixed(2)})`
      );
    } catch (e) {
      this.debug(
        `Failed to store spawn position/rotation: ${(e as Error).message}`
      );
    }

    // Local execution mode - no ownership management needed
    this.entity.visible.set(false);
    // Reset ALL state variables on start
    this.resetBombState();

    // Ensure visible and grabbable at startup (in case a prior run hid/locked it)
    // this.entity.as(hz.GrabbableEntity)?.setWhoCanGrab(this.world.getPlayers());
    // try {
    //   (this.entity.as(hz.PhysicalEntity) as any)?.locked?.set?.(false);
    // } catch {
    //   /* ignore */
    // }

    // Broadcast listeners (both server and clients receive for visuals/effects)
    // this.connectNetworkBroadcastEvent(Component_Snowball.EVT_Explode, (p) =>
    //   this.onExplodeBroadcast(p)
    // );
    // this.connectNetworkBroadcastEvent(
    //   Component_Snowball.EVT_EffectForPlayer,
    //   (p) => this.onEffectForPlayer(p)
    // );

    // Server-only: receive explode requests and apply effects
    // const isServer =
    //   this.world.getLocalPlayer() === this.world.getServerPlayer();
    // if (isServer) {
    //   this.connectNetworkBroadcastEvent(
    //     Component_Snowball.EVT_ExplodeToServer,
    //     (p) => this.onExplodeServer(p)
    //   );
    // }

    // Ensure the entity supports physics + grabbing at runtime
    // try {
    //   this.debug("Setting up entity physics properties...");

    //   // Try different property names for physics
    //   (this.entity as any).simulated?.set?.(true);
    //   (this.entity as any).collidable?.set?.(true);
    //   (this.entity as any).isCollidable?.set?.(true);

    //   // Try to enable physics entity
    //   const physEntity = this.entity.as(hz.PhysicalEntity);
    //   if (physEntity) {
    //     this.debug("PhysicalEntity found - enabling collision");
    //     (physEntity as any).collidable?.set?.(true);
    //     (physEntity as any).simulated?.set?.(true);
    //   } else {
    //     this.debug(
    //       "WARNING: Entity is not a PhysicalEntity - collision may not work"
    //     );
    //   }

    //   // Set interaction mode
    //   (this.entity as any).interactionMode?.set?.(
    //     hz.EntityInteractionMode.Both
    //   );

    //   this.debug("Entity physics setup completed");
    // } catch (e) {
    //   this.debug(`Entity setup failed: ${(e as Error).message}`);
    // }

    // Input: grab/trigger/button
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnGrabStart,
      (isRightHand: boolean, player: hz.Player) => {
        this.onGrabStart(isRightHand, player);
      }
    );
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnGrabEnd,
      (player: hz.Player) => {
        this.onGrabEnd(player);
      }
    );
    // this.connectCodeBlockEvent(
    //   this.entity,
    //   hz.CodeBlockEvents.OnIndexTriggerDown,
    //   (player: hz.Player) => {
    //     this.onIndexTriggerDown(player);
    //   }
    // );
    // this.connectCodeBlockEvent(
    //   this.entity,
    //   hz.CodeBlockEvents.OnIndexTriggerUp,
    //   (player: hz.Player) => {
    //     this.onIndexTriggerUp(player);
    //   }
    // );
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnButton1Down,
      (player: hz.Player) => {
        this.onPrimaryActionDown(player);
      }
    );

    this.connectNetworkEvent(
      this.entity.owner.get(),
      SnowballThrowEvent,
      ({ player }) => {
        // console.log.*$
        //   "Received SnowballThrowEvent from player:",
        //   player?.name.get()
        // );
        this.onPrimaryActionDown(player);
      }
    );

    // Collision logs and optional impact detonation
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnEntityCollision,
      (
        other: hz.Entity,
        hit: hz.Vec3,
        _normal: hz.Vec3,
        relVel: hz.Vec3,
        localCol: string,
        otherCol: string
      ) => {
        this.debug(
          `OnEntityCollision TRIGGERED - currentState=${this._currentState}`
        );
        if (this.props.debugTrajectory) {
          const hitPos = `(${hit.x.toFixed(2)},${hit.y.toFixed(
            2
          )},${hit.z.toFixed(2)})`;
          const spd = relVel ? relVel.magnitude().toFixed(2) : "n/a";
          const from = this._lastThrowOrigin;
          let msg = `OnEntityCollision -> other=${other?.toString?.() ?? "Entity"
            } at ${hitPos} relSpeed=${spd} localCol=${localCol} otherCol=${otherCol}`;
          if (from) {
            const dist = hit.distance(from);
            const horiz = new hz.Vec3(
              hit.x - from.x,
              0,
              hit.z - from.z
            ).magnitude();
            msg += `; fromThrow: d3=${dist.toFixed(2)} dh=${horiz.toFixed(2)}`;
          }
          this.debug(msg);
          this._landingLogged = true;
        }
        // Check if collision should be processed (includes thrower distance checks)
        if (this.shouldProcessCollision(undefined, hit)) {
          this.debug(`Entity collision approved - immediate detonation`);
          this.explodeNow(hit, this.entity.owner.get());
        }
      }
    );
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerCollision,
      (
        player: hz.Player,
        hit: hz.Vec3,
        _normal: hz.Vec3,
        relVel: hz.Vec3,
        localCol: string,
        otherCol: string
      ) => {
        this.debug(
          `OnPlayerCollision TRIGGERED - currentState=${this._currentState}`
        );
        if (player === this.entity.owner.get()) return;
        if (this.props.debugTrajectory) {
          const hitPos = `(${hit.x.toFixed(2)},${hit.y.toFixed(
            2
          )},${hit.z.toFixed(2)})`;
          const spd = relVel ? relVel.magnitude().toFixed(2) : "n/a";
          const from = this._lastThrowOrigin;
          let msg = `OnPlayerCollision -> playerId=${player?.id} at ${hitPos} relSpeed=${spd} localCol=${localCol} otherCol=${otherCol}`;
          if (from) {
            const dist = hit.distance(from);
            const horiz = new hz.Vec3(
              hit.x - from.x,
              0,
              hit.z - from.z
            ).magnitude();
            msg += `; fromThrow: d3=${dist.toFixed(2)} dh=${horiz.toFixed(2)}`;
          }
          this.debug(msg);
          this._landingLogged = true;
        }

        // COLLISION SOURCE ANALYSIS: Use localCol/otherCol to determine collision type
        // OnPlayerCollision means: "A PLAYER collided with something"
        // If the thrower collides with the bomb during throw animation, we must ignore it
        this.debug(
          `Collision analysis: localCol="${localCol}", otherCol="${otherCol}"`
        );

        // Check if this is the thrower colliding with bomb during throw animation
        const isThrowerCollision =
          player && this._throwerId && player.id === this._throwerId;

        if (isThrowerCollision) {
          this.debug(
            `Collision ignored - thrower (${player.id}) colliding with bomb during throw animation`
          );
          this.debug(
            `Collision details: localCol="${localCol}", otherCol="${otherCol}"`
          );
          return; // Block thrower collision completely
        }

        // Any other player collision (other players hitting bomb) should trigger explosion
        this.debug(`Player collision approved - player ${player.id} hit bomb`);
        if (this.shouldProcessCollision(player, hit)) {
          this.debug(`Player collision detonation approved`);
          this.explodeNow(hit, player);
          this.applyLocalEffects(player, 2);
        }
      }
    );
    // this.connectCodeBlockEvent(
    //   this.entity,
    //   hz.CodeBlockEvents.OnPlayerEnterWorld,
    //   () => {
    //     try {
    //       this.entity
    //         .as(hz.GrabbableEntity)
    //         ?.setWhoCanGrab(this.world.getPlayers());
    //     } catch {
    //       /* ignore */
    //     }
    //   }
    // );

    // this.connectCodeBlockEvent(
    //   this.entity,
    //   hz.CodeBlockEvents.OnPlayerEnterWorld,
    //   () => {
    //     try {
    //       this.entity
    //         .as(hz.GrabbableEntity)
    //         ?.setWhoCanGrab(this.world.getPlayers());
    //     } catch {
    //       /* ignore */
    //     }
    //   }
    // );
    // this.connectCodeBlockEvent(
    //   this.entity,
    //   hz.CodeBlockEvents.OnPlayerExitAFK,
    //   () => {
    //     try {
    //       this.entity
    //         .as(hz.GrabbableEntity)
    //         ?.setWhoCanGrab(this.world.getPlayers());
    //     } catch {
    //       /* ignore */
    //     }
    //   }
    // );

    this.connectNetworkBroadcastEvent(
      PlayerExitedSnowfightArea,
      ({ player }) => {
        if (player.id === this.entity.owner.get().id) {
          player.clearAvatarGripPoseOverride();
          this.entity.as(hz.GrabbableEntity)?.forceRelease();
          this.respawnBomb();
          const index = this.playersInZone.indexOf(player);
          if (index > -1) {
            this.playersInZone.splice(index, 1);
            this.setGrabbable();
          }
        }
      }
    );

    this.connectNetworkBroadcastEvent(
      PlayerEnteredSnowfightArea,
      ({ player }) => {
        if (!this.playersInZone.includes(player)) {
          this.playersInZone.push(player);
          this.setGrabbable();
        }
      }
    );

    this.makeNonGrabbable();
  }

  setGrabbable() {
    if (this._currentState == BombState.IDLE) {
      this.entity.as(hz.GrabbableEntity)?.setWhoCanGrab(this.playersInZone);
    }
  }

  makeNonGrabbable() {
    this.entity.as(hz.GrabbableEntity)?.setWhoCanGrab([]);
  }

  playePickUpAnimation(player: hz.Player) {
    if (this.pickingAnimAsset) {
      player.playAvatarAnimation(this.pickingAnimAsset);

      const playerPos = player.position.get();
      const worldUpdate = this.connectLocalBroadcastEvent(
        World.onUpdate,
        () => {
          const playerPosNow = player.position.get();
          if (playerPosNow && playerPos) {
            if (playerPosNow.distance(playerPos) > 0.3) {
              // console.log.*$
              player.stopAvatarAnimation();
              worldUpdate.disconnect();
            }
          }
        }
      );
    }
  }

  // ===== Throw and input handling =====
  private onGrabStart(isRightHand: boolean, player: hz.Player) {
    // Transition to HELD state
    // this.playePickUpAnimation(player);
    this._holderId = player.id;
    this.entity.owner.set(player);
    this._lastHand = isRightHand ? hz.Handedness.Right : hz.Handedness.Left;
    this.transitionTo(BombState.HELD);
    this.entity.visible.set(true);
    this.entity.interactionMode.set(hz.EntityInteractionMode.Both);
    this.sendNetworkBroadcastEvent(PlayerGrabbedSnowball, {
      player: player,
    });
    this.makeNonGrabbable();

    // Transfer ownership to grabber
    try {
      // this.entity.owner.set(player);
      this.debug(`Ownership set to grabber (playerId=${player.id})`);
    } catch (e) {
      this.debug(`owner.set(player) failed: ${(e as Error).message}`);
    }
    // If local player grabbed, bind local input once we're owner
    // const local = this.entity.owner.get();
    // if (local && local.id === player.id) {
    //   this.tryBindLocalThrowWhenOwned();
    //   // if (this.props.mobileAimAssist) this.startAimUpdate(local);
    // }
    // Stop any lingering audio and ensure visibility when picked up
    // try {
    //   this.entity.visible.set(true);
    // } catch {
    //   /* ignore */
    // }
    try {
      const sfx = this.props.explosionSFX?.as(hz.AudioGizmo);
      sfx?.stop();
    } catch {
      /* ignore */
    }
    try {
      const follow = this.props.followupAudio?.as(hz.AudioGizmo);
      follow?.stop();
    } catch {
      /* ignore */
    }
    if (this.fallbackTimer) this.async.clearTimeout(this.fallbackTimer);

    // this.temporarilyDisableGrabFor(player, 0);
  }

  private onGrabEnd(player: hz.Player) {
    if (this._holderId === player.id) this._holderId = undefined;
    if (this._localThrowInput) {
      try {
        this._localThrowInput.disconnect();
      } catch { }
      this._localThrowInput = undefined;
    }

    // Always classify as thrown
    this._pendingImpulse = true;
    if (this._currentState !== BombState.ARMED)
      this.transitionTo(BombState.ARMED);

    // Guaranteed kick shortly after release
    this.async.setTimeout(() => this.applyImpulseIfNeeded(true), 20);
    this.sendNetworkBroadcastEvent(PlayerDroppedSnowball, {
      player: player,
    });
    // player.stopAvatarAnimation();
  }

  private onPrimaryActionDown(player: hz.Player) {
    if (!this.isLocalClient()) return;
    const local = this.entity.owner.get();
    if (!local || local.id !== player.id) return;
    if (this._holderId !== player.id) {
      this.debug(
        "[Component_Snowball] Primary action pressed but not holding this item"
      );
      return;
    }
    this.debug("[Component_Snowball] Primary action down -> throw");
    this.tryThrow(local);
  }

  private tryThrow(local: hz.Player) {
    if (this._currentState !== BombState.HELD) return;

    // Optional: remove or relax cooldown to never suppress throws
    // const now = Date.now();
    // if (now < this._throwCooldownUntil) return;
    // this._throwCooldownUntil = now + 250;

    this._pendingImpulse = true;

    // Capture aim
    let aimDir: hz.Vec3 | null = null;
    try {
      const lookAt = LocalCamera ? LocalCamera.lookAtPosition.get() : null;
      const myPos = this.entity.position.get();
      if (lookAt) {
        const v = lookAt.sub(myPos);
        if (v.magnitude() > 0.001) aimDir = v.normalize();
      }
    } catch { }
    if (!aimDir) {
      const f = local.forward.get();
      aimDir = f ? f.normalize() : new hz.Vec3(0, 0, 1);
    }
    const upBias = (this.props.upwardBias as number) ?? 0.1;
    this._lastAimDir = aimDir.add(new hz.Vec3(0, upBias, 0)).normalize();
    this._lastThrowDir = this._lastAimDir;
    this._lastThrowOrigin = this.entity.position.get();
    this._throwerPosition = local.position.get();
    this._throwerId = local.id;

    // Transition to ARMED immediately for collision gating
    this.transitionTo(BombState.ARMED);

    // Use the actual held hand; keep engine speed modest—physics will supply real velocity
    const hand = this._lastHand ?? hz.Handedness.Right;
    try {
      local.throwHeldItem({
        speed: 0.5,
        pitch: 0,
        yaw: 0,
        playThrowAnimation: true,
        hand,
      });
    } catch { }

    // Prevent instant re-grab and ensure detach
    // this.temporarilyDisableGrabFor(local, 500);
    // const releaseDelay = Math.max(
    //   0,
    //   (this.props.releaseDelayMs as number) ?? 60
    // );
    // this.async.setTimeout(() => {
    //   if (this._holderId === local.id) {
    //     try {
    //       this.entity.as(hz.GrabbableEntity)?.forceRelease();
    //     } catch {}
    //   }
    // }, releaseDelay);

    // Guaranteed forced impulse shortly after release
    this.async.setTimeout(() => this.applyImpulseIfNeeded(true), 20);
    this.fallbackTimer = this.async.setTimeout(() => {
      this.respawnBomb();
    }, 3500);
    // Keep your explodeOnImpact/fuse logic as-is
  }

  private schedulePhysicsImpulseFallback(tryCount: number = 0) {
    const MAX_TRIES = 20;
    const phys = this.entity.as(hz.PhysicalEntity);
    if (!phys) return;

    if (this._holderId !== undefined) {
      if (tryCount < MAX_TRIES) {
        this.async.setTimeout(
          () => this.schedulePhysicsImpulseFallback(tryCount + 1),
          40
        );
      }
      return;
    }

    // Force the impulse when free
    this.applyImpulseIfNeeded(true);
  }

  // Replace existing helper with a forced variant
  private applyImpulseIfNeeded(force: boolean = false) {
    const phys = this.entity.as(hz.PhysicalEntity);
    if (!phys) return;

    // Resolve a forward/up throw direction
    const upBias = (this.props.upwardBias as number) ?? 0.1;
    let dir = this._lastAimDir ?? this._lastThrowDir ?? new hz.Vec3(0, 0, 1);
    dir = new hz.Vec3(dir.x, dir.y + upBias, dir.z).normalize();

    // When forced, ignore existing velocity and kick forward strongly
    if (force) {
      try {
        phys.zeroVelocity();
      } catch { }
      const impulseMag = (this.props.impulseStrength as number) ?? 16.0;
      try {
        phys.applyForce(dir.mul(impulseMag), hz.PhysicsForceMode.Impulse);
      } catch { }
      this._pendingImpulse = false;
      this.debug(`[Snowball] Forced impulse applied`); // optional
      return;
    }

    // Optional assist path (kept for non-forced cases)
    if (!this._pendingImpulse) return;
    let speed = 0,
      forwardDot = -1;
    try {
      const vel = phys.velocity.get();
      speed = vel ? vel.magnitude() : 0;
      forwardDot = speed > 0.001 ? vel.normalize().dot(dir) : -1;
    } catch { }
    const minSpeed = (this.props.impulseMinSpeedThreshold as number) ?? 0.5;
    const fwdDotThreshold = (this.props.forwardDotThreshold as number) ?? 0.2;
    if (speed > minSpeed && forwardDot > fwdDotThreshold) {
      this._pendingImpulse = false;
      return;
    }
    if (speed > minSpeed && forwardDot < 0) {
      try {
        phys.zeroVelocity();
      } catch { }
    }

    const impulseMag = (this.props.impulseStrength as number) ?? 16.0;
    try {
      phys.applyForce(dir.mul(impulseMag), hz.PhysicsForceMode.Impulse);
    } catch { }
    this._pendingImpulse = false;
  }

  // private beginLandingTracker() {
  //   if (!this.props.debugTrajectory && !(this.props.explodeOnImpact as boolean))
  //     return;
  //   this._landingLogged = false;
  //   const origin = this._lastThrowOrigin;
  //   const phys = this.entity.as(hz.PhysicalEntity);
  //   // Track for a short window after throw
  //   this._landingTrackerSub = this.connectLocalBroadcastEvent(
  //     hz.World.onUpdate,
  //     () => {
  //       if (this._landingLogged && !(this.props.explodeOnImpact as boolean))
  //         return;
  //       const pos = this.entity.position.get();
  //       // Alternative collision detection if OnEntityCollision fails
  //       // This can happen if Physics Material is not assigned or collision layers conflict
  //       if (
  //         (this.props.explodeOnImpact as boolean) &&
  //         this._currentState === BombState.ARMED
  //       ) {
  //         // Check for sudden velocity changes (impact detection)
  //         if (phys) {
  //           const vel = phys.velocity.get();
  //           const speed = vel.magnitude();

  //           // If bomb suddenly slows down significantly, it likely hit something
  //           if (
  //             this._lastVelocity &&
  //             speed < this._lastVelocity * 0.3 &&
  //             this._lastVelocity > 3.0
  //           ) {
  //             this.debug(
  //               `[Component_Snowball] IMPACT DETECTED via velocity change - prev: ${this._lastVelocity.toFixed(
  //                 2
  //               )}, curr: ${speed.toFixed(2)}`
  //             );
  //             this.explodeNow(pos, this.entity.owner.get());
  //             return;
  //           }

  //           this._lastVelocity = speed;
  //         }
  //       }
  //       if (pos.y <= 0) {
  //         if (this.props.debugTrajectory) {
  //           const d3 = origin ? pos.distance(origin) : NaN;
  //           const dh = origin
  //             ? new hz.Vec3(pos.x - origin.x, 0, pos.z - origin.z).magnitude()
  //             : NaN;
  //           const spd = phys ? phys.velocity.get().magnitude() : NaN;
  //           this.debug(
  //             `[Component_Snowball] Crossed ground plane (y<=0) at (${pos.x.toFixed(
  //               2
  //             )},${pos.y.toFixed(2)},${pos.z.toFixed(2)}) d3=${
  //               isNaN(d3) ? "n/a" : d3.toFixed(2)
  //             } dh=${isNaN(dh) ? "n/a" : dh.toFixed(2)} speed=${
  //               isNaN(spd) ? "n/a" : spd.toFixed(2)
  //             }`
  //           );
  //           this._landingLogged = true;
  //         }
  //         // Check if ground collision should be processed
  //         if (this.shouldProcessCollision(undefined, pos)) {
  //           this.debug(
  //             "[Component_Snowball] Ground impact -> immediate detonation"
  //           );
  //           this.explodeNow(pos, this.entity.owner.get());
  //         }
  //         this.endLandingTracker();
  //       }
  //     }
  //   );
  //   // Safety timeout to stop tracking after 5s
  //   this.async.setTimeout(() => this.endLandingTracker(), 5000);
  // }

  private onExplodeServer(p: ExplodePayload) {
    const origin = new hz.Vec3(p.origin.x, p.origin.y, p.origin.z);
    const players = this.world.getPlayers();
    const targets: hz.Player[] = [];

    this.debug(
      `[Component_Snowball] 💥 Explosion at (${origin.x.toFixed(
        1
      )}, ${origin.y.toFixed(1)}, ${origin.z.toFixed(1)}) radius=${p.radius}m`
    );

    for (const pl of players) {
      const playerPos = pl.position.get();
      const dist = playerPos.distance(origin);
      const isAffected = this.isPlayerAffectedByRules(pl, p);
      const inRange = dist <= 2;

      if (isAffected && inRange) {
        targets.push(pl);
        this.debug(
          `[Component_Snowball] 🎯 TARGET: Player ${pl.id
          } (${pl.name.get()}) at ${dist.toFixed(1)}m - WILL DANCE!`
        );
      }
    }

    this.debug(
      `[Component_Snowball] 🎯 FINAL: ${targets.length} player(s) affected`
    );

    // Apply effects to all targets via ownership-based communication
    for (const t of targets) {
      this.debug(
        `[Component_Snowball] 🎯 Processing target: Player ${t.id
        } (${t.name.get()})`
      );

      // TRIGGER POSITIONING: Move the immobilization trigger to explosion location
      try {
        // Note: The PlayerImmobilizationManager should be on a trigger entity
        // We'll position that trigger entity at the explosion location
        this.debug(
          `[Component_Snowball] 🎯 Explosion affects player ${t.id} - trigger system will handle immobilization`
        );
        this.debug(
          `[Component_Snowball] 📍 Explosion at (${this.entity.position
            .get()
            .x.toFixed(1)}, ${this.entity.position
              .get()
              .y.toFixed(1)}, ${this.entity.position.get().z.toFixed(1)})`
        );

        // The trigger-based manager will detect players in range automatically
      } catch (e) {
        this.debug(
          `[Component_Snowball] ❌ Trigger positioning failed: ${(e as Error).message
          }`
        );
      }

      // Apply local effects (VFX, animations, popups)
      try {
        this.debug(
          `[Component_Snowball] 🎨 Applying local effects for player ${t.id}`
        );
        this.applyLocalEffects(t, p.duration);
      } catch (e) {
        this.debug(
          `[Component_Snowball] ❌ Local effects failed: ${(e as Error).message
          }`
        );
      }
    }
  }

  private onEffectForPlayer(p: EffectForPlayerPayload) {
    const local = this.entity.owner.get();

    this.debug(
      `[Component_Snowball] 📨 EffectForPlayer received: playerId=${p.playerId}, state=${p.state}, localId=${local?.id}`
    );
    this.debug(
      `[Component_Snowball] 🔧 Event received on execution context - processing for all players`
    );

    // In Default execution mode, we need to handle all players, not just local
    const allPlayers = this.world.getPlayers();
    const targetPlayer = allPlayers.find((player) => player.id === p.playerId);

    if (!targetPlayer) {
      this.debug(
        `[Component_Snowball] ❌ Target player ${p.playerId} not found in world`
      );
      return;
    }

    this.debug(
      `[Component_Snowball] 🎯 Found target player ${targetPlayer.id
      } (${targetPlayer.name.get()})`
    );
    this.debug(
      `[Component_Snowball] 🎭 Applying ${p.state} effect to player ${targetPlayer.id} for ${p.duration}s`
    );

    // if (p.state === "start") {
    //   this.applyDanceEffect(targetPlayer, p.duration);
    // } else if (p.state === "end" || p.state === "cancel") {
    //   this.clearDanceEffect(targetPlayer);
    // }
  }

  private isPlayerAffectedByRules(
    player: hz.Player,
    exp: ExplodePayload
  ): boolean {
    if (
      !this.props.affectOwner &&
      exp.ownerId !== undefined &&
      player.id === exp.ownerId
    )
      return false;
    // TODO: integrate team checks; for now allowFriendlyFire gates nothing
    return true;
  }

  // ===== Local effects (VFX, animations, popups) =====
  private applyLocalEffects(player: hz.Player, duration: number) {
    const isMobile = false;

    this.debug(
      `[Component_Snowball] 🎨 Applying local effects to ${isMobile ? "mobile" : "VR"
      } player ${player.id} (${duration}s)`
    );

    // Apply device-specific effects (no movement restrictions - handled by manager)
    // if (isMobile) {
    //   this.applyMobileDanceEffect(player, duration);
    // } else {
    //   this.applyVRDanceEffect(player, duration);
    // }

    // Start following VFX
    this.startFollowingVFX(player, duration);

    // Start screen shake effect for affected player
    this.startScreenShakeForPlayer(player, duration);

    // Set cleanup timer for local effects
    this.clearTimerFor(player.id);
    const ms = duration * 1000;
    const timer = this.async.setTimeout(() => {
      this.debug(
        `[Component_Snowball] ⏰ Local effects timer expired for player ${player.id}`
      );
      this.clearLocalEffects(player);
    }, ms);
    this._activePlayerTimers.set(player.id, timer);

    this.debug(
      `[Component_Snowball] 🎭 Local effects setup COMPLETE for player ${player.id}`
    );
  }

  // Legacy method for compatibility - now redirects to hybrid approach
  private applyDanceEffect(player: hz.Player, duration: number) {
    const isMobile = false;

    this.debug(
      `[Component_Snowball] 🔒 STARTING dance effect for ${isMobile ? "mobile" : "VR"
      } player ${player.id} (${duration}s)`
    );

    // Apply COMPLETE IMMOBILIZATION with multiple approaches
    try {
      // Primary immobilization
      const originalLocoSpeed = player.locomotionSpeed.get();
      const originalSprintMult = player.sprintMultiplier.get();
      const originalJumpSpeed = player.jumpSpeed.get();

      this.debug(
        `[Component_Snowball] 📊 Original speeds: loco=${originalLocoSpeed}, sprint=${originalSprintMult}, jump=${originalJumpSpeed}`
      );

      // DANCE-FRIENDLY IMMOBILIZATION: Preserve emote functionality
      // player.locomotionSpeed.set(0.1); // Minimal movement (not 0 to preserve emote functionality)
      // player.sprintMultiplier.set(0.1); // Minimal sprint (not 0 to preserve interactions)
      // player.jumpSpeed.set(0.5); // Very limited jumping (not 0 to preserve some vertical movement for emotes)

      // Verify the settings were applied
      const newLocoSpeed = player.locomotionSpeed.get();
      const newSprintMult = player.sprintMultiplier.get();
      const newJumpSpeed = player.jumpSpeed.get();

      this.debug(
        `[Component_Snowball] 📊 New speeds: loco=${newLocoSpeed}, sprint=${newSprintMult}, jump=${newJumpSpeed}`
      );

      if (newLocoSpeed <= 0.1 && newSprintMult <= 0.1 && newJumpSpeed <= 0.5) {
        this.debug(
          `[Component_Snowball] ✅ DANCE-FRIENDLY IMMOBILIZATION CONFIRMED for player ${player.id} - emotes preserved!`
        );
      } else {
        this.debug(
          `[Component_Snowball] ⚠️ IMMOBILIZATION PARTIAL - adjusting values...`
        );

        // Try alternative immobilization approach with dance-friendly values
        try {
          this.debug(
            `[Component_Snowball] 🔄 Attempting dance-friendly immobilization...`
          );

          // Force set multiple times to ensure it sticks
          for (let i = 0; i < 3; i++) {
            player.locomotionSpeed.set(0.1);
            player.sprintMultiplier.set(0.1);
            player.jumpSpeed.set(0.5);
          }

          // Additional immobilization attempts
          // Note: gravityEnabled is not available on Player objects in Horizon Worlds API

          this.debug(
            `[Component_Snowball] 🔄 Alternative immobilization applied`
          );
        } catch (altError) {
          this.debug(
            `[Component_Snowball] ❌ Alternative immobilization failed: ${(altError as Error).message
            }`
          );
        }
      }
    } catch (e) {
      this.debug(
        `[Component_Snowball] ❌ Immobilization failed: ${(e as Error).message}`
      );
    }

    // Apply device-specific effects
    // if (isMobile) {
    //   this.applyMobileDanceEffect(player, duration);
    // } else {
    //   this.applyVRDanceEffect(player, duration);
    // }

    // Start following VFX
    this.startFollowingVFX(player, duration);

    // Start screen shake effect for affected player
    this.startScreenShakeForPlayer(player, duration);

    // Set cleanup timer
    this.clearTimerFor(player.id);
    const ms = duration * 1000;
    const timer = this.async.setTimeout(() => {
      this.debug(
        `[Component_Snowball] ⏰ Dance effect timer expired for player ${player.id}`
      );
      const msg: EffectForPlayerPayload = {
        playerId: player.id,
        duration: 0,
        state: "end",
      };
      // this.sendNetworkBroadcastEvent(
      //   Component_Snowball.EVT_EffectForPlayer,
      //   msg
      // );
    }, ms);
    this._activePlayerTimers.set(player.id, timer);

    // Start continuous immobilization enforcement
    // this.startContinuousImmobilization(player, duration);

    this.debug(
      `[Component_Snowball] 🎭 Dance effect setup COMPLETE for player ${player.id}`
    );
  }

  // Continuously enforce immobilization to prevent movement
  // private startContinuousImmobilization(player: hz.Player, duration: number) {
  //   const startTime = Date.now();
  //   const durationMs = duration * 1000;

  //   const enforceImmobilization = () => {
  //     const elapsed = Date.now() - startTime;

  //     if (elapsed >= durationMs) {
  //       this.debug(
  //         `[Component_Snowball] 🔓 Continuous immobilization ended for player ${player.id}`
  //       );
  //       return; // Duration complete
  //     }

  //     // Re-apply dance-friendly immobilization
  //     try {
  //       player.locomotionSpeed.set(0.1); // Minimal movement to preserve emotes
  //       player.sprintMultiplier.set(0.1); // Minimal sprint to preserve interactions
  //       player.jumpSpeed.set(0.5); // Limited jumping to preserve emote vertical movement

  //       // Schedule next enforcement
  //       this.async.setTimeout(enforceImmobilization, 500); // Every 0.5 seconds
  //     } catch (e) {
  //       this.debug(
  //         `[Component_Snowball] ❌ Continuous immobilization failed: ${
  //           (e as Error).message
  //         }`
  //       );
  //     }
  //   };

  //   // Start enforcement loop
  //   this.debug(
  //     `[Component_Snowball] 🔒 Starting continuous immobilization enforcement for player ${player.id}`
  //   );
  //   enforceImmobilization();
  // }

  private applyMobileDanceEffect(player: hz.Player, duration: number) {
    // Show instructional popup for mobile players
    try {
      const instructionText =
        "🕺 You've been BOOGIE BOMBED! 💃\n\n" +
        "Tap the EMOTE button to dance!\n" +
        "• Tap your avatar\n" +
        "• Select 'Emote'\n" +
        "• Choose your dance!\n\n" +
        `Effect lasts ${duration} seconds`;

      this.world.ui.showPopupForPlayer(
        player,
        instructionText,
        Math.min(duration, 8),
        {
          fontColor: new hz.Color(1, 1, 0),
          backgroundColor: new hz.Color(0.2, 0.1, 0.8),
          fontSize: 4,
          position: new hz.Vec3(0, -0.2, 0),
        }
      );

      this.debug("[Component_Snowball] 📱 Mobile popup displayed");
    } catch (e) {
      this.debug(
        `[Component_Snowball] ❌ Mobile popup failed: ${(e as Error).message}`
      );
    }

    // Add haptic feedback rhythm
    try {
      this.playHapticFeedback(
        player,
        200,
        hz.HapticStrength.Medium,
        hz.HapticSharpness.Soft
      );

      const hapticInterval = 2000;
      const hapticCount = Math.floor((duration * 1000) / hapticInterval);

      for (let i = 1; i <= hapticCount; i++) {
        this.async.setTimeout(() => {
          try {
            this.playHapticFeedback(
              player,
              150,
              hz.HapticStrength.Light,
              hz.HapticSharpness.Soft
            );
          } catch {
            /* ignore */
          }
        }, i * hapticInterval);
      }

      this.debug("[Component_Snowball] 📳 Mobile haptic rhythm started");
    } catch (e) {
      this.debug(
        `[Component_Snowball] ❌ Mobile haptics failed: ${(e as Error).message}`
      );
    }
  }

  private applyVRDanceEffect(player: hz.Player, duration: number) {
    // Try available dance animations for VR players
    try {
      player.playAvatarGripPoseAnimationByName(
        hz.AvatarGripPoseAnimationNames.ReadyThrow
      );
      this.debug("[Component_Snowball] 🥽 VR animation: ReadyThrow");
    } catch {
      try {
        player.playAvatarGripPoseAnimationByName(
          hz.AvatarGripPoseAnimationNames.Throw
        );
        this.debug("[Component_Snowball] 🥽 VR animation: Throw");
      } catch {
        try {
          player.playAvatarGripPoseAnimationByName(
            hz.AvatarGripPoseAnimationNames.ChargeThrow
          );
          this.debug("[Component_Snowball] 🥽 VR animation: ChargeThrow");
        } catch (e) {
          this.debug(
            `[Component_Snowball] ❌ VR animations failed: ${(e as Error).message
            }`
          );
        }
      }
    }

    // Add haptic feedback for VR players
    try {
      this.playHapticFeedback(
        player,
        300,
        hz.HapticStrength.Strong,
        hz.HapticSharpness.Sharp
      );
      this.debug("[Component_Snowball] 🎮 VR haptics applied");
    } catch (e) {
      this.debug(
        `[Component_Snowball] ❌ VR haptics failed: ${(e as Error).message}`
      );
    }
  }

  // Clear local effects only (movement handled by manager)
  private clearLocalEffects(player: hz.Player) {
    this.debug(
      `[Component_Snowball] 🔓 CLEARING local effects for player ${player.id}`
    );

    this.clearTimerFor(player.id);
    this.stopFollowingVFX(player.id);
    this.stopScreenShakeForPlayer(player.id);

    try {
      player.clearAvatarGripPoseOverride();
      this.debug(
        `[Component_Snowball] ✅ Avatar pose cleared for player ${player.id}`
      );
    } catch (e) {
      this.debug(
        `[Component_Snowball] ❌ Avatar pose clear failed: ${(e as Error).message
        }`
      );
    }

    // Ownership-based cleanup communication
    try {
      // Signal cleanup by briefly transferring ownership
      // this.entity.owner.set(player);
      // this.async.setTimeout(() => {
      //   const serverPlayer = this.world.getServerPlayer();
      //   if (serverPlayer) {
      //     this.entity.owner.set(serverPlayer);
      //   }
      // }, 50);
      this.debug(
        `[Component_Snowball] 🔄 Cleanup signal sent via ownership for player ${player.id}`
      );
    } catch (e) {
      this.debug(
        `[Component_Snowball] ❌ Failed to send cleanup signal: ${(e as Error).message
        }`
      );
    }

    this.debug(
      `[Component_Snowball] 🔓 Local effects clearing COMPLETE for player ${player.id}`
    );
  }

  // Legacy method for compatibility
  private clearDanceEffect(player: hz.Player) {
    this.debug(
      `[Component_Snowball] 🔄 Legacy clearDanceEffect called - redirecting to clearLocalEffects`
    );
    this.clearLocalEffects(player);
  }

  private clearTimerFor(playerId: number) {
    const t = this._activePlayerTimers.get(playerId);
    if (t) {
      this.async.clearTimeout(t);
      this._activePlayerTimers.delete(playerId);
    }
  }

  private playExplosionVFXSFX(pos: hz.Vec3) {
    // Only play these as part of an explosion, not on pickup/hold
    this.debug(`[Component_Snowball] ===== EXPLOSION VFX/SFX START =====`);
    this.debug(
      `[Component_Snowball] Playing VFX/SFX at position (${pos.x.toFixed(
        2
      )},${pos.y.toFixed(2)},${pos.z.toFixed(2)})`
    );
    this.debug(
      `[Component_Snowball] explosionVFX assigned: ${!!this.props.explosionVFX}`
    );
    this.debug(
      `[Component_Snowball] explosionSFX assigned: ${!!this.props.explosionSFX}`
    );

    if (this.props.explosionVFX) {
      try {
        this.debug(
          `[Component_Snowball] Setting VFX position to (${pos.x.toFixed(
            2
          )},${pos.y.toFixed(2)},${pos.z.toFixed(2)})`
        );
        this.props.explosionVFX.position.set(pos);
        const vfx = this.props.explosionVFX.as(hz.ParticleGizmo);
        if (vfx) {
          this.debug(
            "[Component_Snowball] VFX ParticleGizmo found, calling play()..."
          );
          vfx.play();
          this.debug("[Component_Snowball] VFX played successfully");
        } else {
          this.debug(
            "[Component_Snowball] ERROR: VFX entity is not a ParticleGizmo"
          );
          this.debug(
            `[Component_Snowball] VFX entity type: ${this.props.explosionVFX.constructor.name}`
          );
        }
      } catch (e) {
        this.debug(
          `[Component_Snowball] VFX play failed: ${(e as Error).message}`
        );
        this.debug(
          `[Component_Snowball] VFX error stack: ${(e as Error).stack}`
        );
      }
    }

    if (this.props.explosionSFX) {
      try {
        this.debug(
          `[Component_Snowball] Setting SFX position to (${pos.x.toFixed(
            2
          )},${pos.y.toFixed(2)},${pos.z.toFixed(2)})`
        );
        this.props.explosionSFX.position.set(pos);
        const sfx = this.props.explosionSFX.as(hz.AudioGizmo);
        if (sfx && !this.isSfxPlaying) {
          this.debug(
            "[Component_Snowball] SFX AudioGizmo found, calling play()..."
          );
          sfx.play();
          this.isSfxPlaying = true;
          this.debug("[Component_Snowball] SFX played successfully");
        } else {
          this.debug(
            "[Component_Snowball] ERROR: SFX entity is not an AudioGizmo"
          );
          this.debug(
            `[Component_Snowball] SFX entity type: ${this.props.explosionSFX.constructor.name}`
          );
        }
      } catch (e) {
        this.debug(
          `[Component_Snowball] SFX play failed: ${(e as Error).message}`
        );
        this.debug(
          `[Component_Snowball] SFX error stack: ${(e as Error).stack}`
        );
      }
    }

    // Schedule optional follow-up audio after the initial SFX
    if (this.props.followupAudio) {
      try {
        this.props.followupAudio.position.set(pos);
        this.debug("[Component_Snowball] Follow-up audio position set");
      } catch {
        /* ignore */
      }
      const delay = Math.max(
        0,
        (this.props.followupAudioDelayMs as number) ?? 0
      );
      this.debug(
        `[Component_Snowball] Scheduling follow-up audio in ${delay}ms`
      );
      this.async.setTimeout(() => {
        try {
          const follow = this.props.followupAudio!.as(hz.AudioGizmo);
          if (follow) {
            follow.play();
            this.debug(
              "[Component_Snowball] Follow-up audio played successfully"
            );
          }
        } catch (e) {
          this.debug(
            `[Component_Snowball] Follow-up audio failed: ${(e as Error).message
            }`
          );
        }
      }, delay);
    } else {
      this.debug("[Component_Snowball] No follow-up audio assigned");
    }

    this.debug(`[Component_Snowball] ===== EXPLOSION VFX/SFX END =====`);
  }

  // Immediate detonation used by impact/ground triggers
  private explodeNow(at: hz.Vec3, owner?: hz.Player) {
    this.debug(`[Component_Snowball] ===== EXPLODE NOW START =====`);
    this.debug(
      `[Component_Snowball] explodeNow called at (${at.x.toFixed(
        2
      )},${at.y.toFixed(2)},${at.z.toFixed(2)}), owner: ${owner?.id ?? "none"}`
    );

    // Check if already exploded via state
    if (this._currentState === BombState.EXPLODED) {
      this.debug(
        `[Component_Snowball] Already exploded, ignoring duplicate explosion`
      );
      return;
    }

    // Cancel timer fallback since we're exploding now
    this.clearTimerFallback();

    // Transition to EXPLODED state
    this.transitionTo(BombState.EXPLODED);

    // Play local VFX/SFX immediately to avoid network delay
    this.debug(`[Component_Snowball] Calling playExplosionVFXSFX...`);
    this.playExplosionVFXSFX(at);
    this._playedLocalVFXSFX = true;
    this.afterExplodeCleanup();

    const payload: ExplodePayload = {
      origin: { x: at.x, y: at.y, z: at.z },
      radius: this.props.radius as number,
      duration: this.props.duration as number,
      ownerId: owner?.id,
    };
    this.debug(
      `[Component_Snowball] Explosion payload: radius=${payload.radius}, duration=${payload.duration}, ownerId=${payload.ownerId}`
    );
    this.debug(
      `[Component_Snowball] Impact detonate at (${at.x.toFixed(
        2
      )},${at.y.toFixed(2)},${at.z.toFixed(2)})`
    );

    this.debug(`[Component_Snowball] Sending network broadcast events...`);
    // this.sendNetworkBroadcastEvent(Component_Snowball.EVT_Explode, payload);
    // this.sendNetworkBroadcastEvent(
    //   Component_Snowball.EVT_ExplodeToServer,
    //   payload
    // );

    this.debug(`[Component_Snowball] Calling afterExplodeCleanup...`);

    // Clear throw data after successful explosion
    this.clearThrowData();

    this.debug(`[Component_Snowball] ===== EXPLODE NOW END =====`);
  }

  private afterExplodeCleanup() {
    try {
      if (this.props.despawnOnExplode) {
        // Freeze immediately so it doesn't keep rolling while effects play
        const phys = this.entity.as(hz.PhysicalEntity);
        try {
          phys?.zeroVelocity();
        } catch { }
        try {
          (phys as any)?.locked?.set?.(true);
        } catch { }
        // const grab = this.entity.as(hz.GrabbableEntity);
        try {
          // grab?.setWhoCanGrab([this.entity.owner.get()]); // only owner can grab (usually server)
        } catch { }
        // Delay visibility hide so child VFX/SFX can finish playing
        const delay = Math.max(0, (this.props.despawnDelayMs as number) ?? 800);
        this.async.setTimeout(() => {
          try {
            this.entity.visible.set(false);
          } catch { }
          // Reset state and respawn at original location
          this.async.setTimeout(() => {
            this.respawnBomb();
          }, 1000);
        }, delay);
      }
    } catch {
      /* ignore */
    }
  }

  public cancelForPlayer(player: hz.Player) {
    const msg: EffectForPlayerPayload = {
      playerId: player.id,
      duration: 0,
      state: "cancel",
    };
    // this.sendNetworkBroadcastEvent(Component_Snowball.EVT_EffectForPlayer, msg);
  }

  // Test method to trigger screen shake manually (for debugging)
  public testScreenShake() {
    this.debug(`[Component_Snowball] 🧪 TEST: Manual screen shake test`);
    const local = this.entity.owner.get();
    if (local) {
      this.debug(
        `[Component_Snowball] 🧪 TEST: Triggering screen shake for local player ${local.id}`
      );
      this.startScreenShakeForPlayer(local, 5.0); // 5 second test
    } else {
      this.debug(`[Component_Snowball] 🧪 TEST: No local player found`);
    }
  }

  // Helper function to play haptic feedback on both hands
  private playHapticFeedback(
    player: hz.Player,
    duration: number,
    strength: hz.HapticStrength,
    sharpness: hz.HapticSharpness
  ) {
    try {
      // Play haptics on both hands for maximum effect
      player.rightHand.playHaptics(duration, strength, sharpness);
      player.leftHand.playHaptics(duration, strength, sharpness);
    } catch (e) {
      this.debug(
        `[Component_Snowball] Haptic feedback failed: ${(e as Error).message}`
      );
    }
  }

  // Following VFX System - tracks affected players with visual effects
  private startFollowingVFX(player: hz.Player, duration: number) {
    if (!this.props.followingVFX) {
      this.debug(`[Component_Snowball] ❌ No followingVFX entity assigned`);
      return;
    }

    try {
      const playerPos = player.position.get();
      const vfxEntity = this.props.followingVFX;

      vfxEntity.position.set(playerPos);

      const vfx = vfxEntity.as(hz.ParticleGizmo);
      if (vfx) {
        vfx.play();
        this.debug(
          `[Component_Snowball] 🎨 Following VFX started for player ${player.id}`
        );
      }

      this._activeFollowingVFX.set(player.id, vfxEntity);
      this.trackPlayerVFX(player, duration);
    } catch (e) {
      this.debug(
        `[Component_Snowball] ❌ Following VFX failed: ${(e as Error).message}`
      );
    }
  }

  private trackPlayerVFX(hitPlayer: Player, duration: number) {
    const startTime = Date.now();
    const durationMs = duration * 1000;

    const updateLoop = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= durationMs) {
        this.stopFollowingVFX(hitPlayer.id);
        return;
      }

      const player = hitPlayer;
      const vfxEntity = this._activeFollowingVFX.get(hitPlayer.id);

      if (!player || !vfxEntity) {
        this.stopFollowingVFX(hitPlayer.id);
        return;
      }

      try {
        const playerPos = player.position.get();
        vfxEntity.position.set(playerPos);
        this.async.setTimeout(updateLoop, 50); // 20fps update
      } catch (e) {
        this.debug(
          `[Component_Snowball] ❌ VFX tracking error: ${(e as Error).message}`
        );
        this.stopFollowingVFX(hitPlayer.id);
      }
    };

    updateLoop();
  }

  private stopFollowingVFX(playerId: number) {
    const vfxEntity = this._activeFollowingVFX.get(playerId);
    if (vfxEntity) {
      try {
        const vfx = vfxEntity.as(hz.ParticleGizmo);
        if (vfx) {
          vfx.stop();
        }
        this.debug(
          `[Component_Snowball] 🎨 Following VFX stopped for player ${playerId}`
        );
      } catch (e) {
        this.debug(
          `[Component_Snowball] ❌ VFX stop failed: ${(e as Error).message}`
        );
      }

      this._activeFollowingVFX.delete(playerId);
    }
  }

  // Screen Shake System - provides disorienting camera shake for affected players
  private startScreenShakeForPlayer(player: hz.Player, duration: number) {
    try {
      this.debug(
        `[Component_Snowball] 🎥 Starting OWNERSHIP-BASED screen shake for player ${player.id} (${duration}s)`
      );

      // Note: Screen shake now handled by PlayerImmobilizationManager's ownership management
      // This is a placeholder - the actual screen shake is triggered by the trigger-based system
      this.debug(
        `[Component_Snowball] 📡 Screen shake will be handled by trigger-based ownership system`
      );

      // Mark player as having active screen shake for tracking
      this._activeScreenShake.set(player.id, true);

      // Set up cleanup timer
      this.async.setTimeout(() => {
        this.stopScreenShakeForPlayer(player.id);
      }, duration * 1000);

      this.debug(
        `[Component_Snowball] 🎥 Screen shake tracking initiated for player ${player.id}`
      );
    } catch (e) {
      this.debug(
        `[Component_Snowball] ❌ Screen shake tracking failed for player ${player.id
        }: ${(e as Error).message}`
      );
    }
  }

  private stopScreenShakeForPlayer(playerId: number) {
    if (!this._activeScreenShake.has(playerId)) {
      return; // No active shake for this player
    }

    try {
      this.debug(
        `[Component_Snowball] 🎥 Stopping OWNERSHIP-BASED screen shake tracking for player ${playerId}`
      );

      // Note: Actual screen shake stop is handled by ownership transfer back to server
      this.debug(
        `[Component_Snowball] 📡 Screen shake stop handled by ownership management system`
      );

      this._activeScreenShake.delete(playerId);

      this.debug(
        `[Component_Snowball] 🎥 Screen shake tracking stopped for player ${playerId}`
      );
    } catch (e) {
      this.debug(
        `[Component_Snowball] ❌ Failed to stop screen shake tracking for player ${playerId}: ${(e as Error).message
        }`
      );
    }
  }

  // Helper function to check if collision should be processed
  private shouldProcessCollision(
    collidingPlayer?: hz.Player,
    impactPosition?: hz.Vec3
  ): boolean {
    const now = Date.now();

    const throwAge =
      this._throwInitiatedAt > 0 ? Date.now() - this._throwInitiatedAt : -1;
    this.debug(
      `[Component_Snowball] shouldProcessCollision: currentState=${this._currentState
      }, stateAge=${Date.now() - this._stateEnteredAt
      }ms, throwAge=${throwAge}ms`
    );

    // SIMPLIFIED: Allow collision in ARMED state OR if throw data exists (bomb was thrown)
    const isArmed = this._currentState === BombState.ARMED;
    const hasThrowData = !!(this._throwerId && this._throwerPosition);

    if (!isArmed && !hasThrowData) {
      this.debug(
        `[Component_Snowball] Collision ignored - bomb not ready (state: ${this._currentState}, hasThrowData: ${hasThrowData})`
      );
      return false;
    }

    // Collision is approved - thrower exclusion handled in collision event handlers
    const conditionUsed = isArmed ? "ARMED state" : "throw data exists";
    const targetInfo = collidingPlayer
      ? `player ${collidingPlayer.id}`
      : "environment";
    this.debug(
      `[Component_Snowball] Collision approved - ${conditionUsed} vs ${targetInfo}, ready to explode`
    );
    return true;
  }

  private tryBindLocalThrowWhenOwned() {
    const local = this.entity.owner.get();
    if (!local) return;
    const owner = this.entity.owner.get();
    const ownerId = owner ? owner.id : undefined;
    this.debug(
      `[Component_Snowball] tryBindLocalThrowWhenOwned: ownerId=${ownerId} localId=${local.id} tries=${this._bindTries}`
    );
    if (ownerId === local.id) {
      if (this._localThrowInput) return;
      try {
        this._localThrowInput = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.RightTrigger,
          hz.ButtonIcon.Throw,
          this
        );
        this._localThrowInput.registerCallback((action, pressed) => {
          if (action !== hz.PlayerInputAction.RightTrigger || !pressed) return;
          if (this._holderId === local.id) {
            this.debug(
              "[Component_Snowball] Throw button pressed (RightTrigger)"
            );
            this.tryThrow(local);
          }
        });
        this.debug(
          "[Component_Snowball] Input bound after ownership confirmed"
        );
      } catch (e) {
        this.debug(
          "[Component_Snowball] Failed to bind Throw input after ownership: " +
          (e as Error).message
        );
      }
      this._bindTries = 0;
    } else {
      if (this._bindTries < 30) {
        this._bindTries++;
        this.async.setTimeout(() => this.tryBindLocalThrowWhenOwned(), 100);
      } else {
        this.debug(
          "[Component_Snowball] Gave up waiting for local ownership to bind input"
        );
        this._bindTries = 0;
      }
    }
  }

  // State Machine Management
  private transitionTo(newState: BombState): void {
    const oldState = this._currentState;
    this._currentState = newState;
    this._stateEnteredAt = Date.now();

    this.debug(
      `[Component_Snowball] STATE TRANSITION: ${oldState} → ${newState}`
    );

    // State entry actions
    this.onStateEnter(newState, oldState);
  }

  private onStateEnter(newState: BombState, oldState: BombState): void {
    switch (newState) {
      case BombState.IDLE:
        this.onEnterIdle();
        break;
      case BombState.HELD:
        this.onEnterHeld();
        break;
      case BombState.ARMED:
        this.onEnterArmed();
        break;
      case BombState.EXPLODED:
        this.onEnterExploded();
        break;
      case BombState.RESPAWNING:
        this.onEnterRespawning();
        break;
    }
  }

  private onEnterIdle(): void {
    this.debug(`[Component_Snowball] IDLE: Ready to be grabbed`);
    try {
      // this.entity.visible.set(true);
      // const grab = this.entity.as(hz.GrabbableEntity);
      // grab?.setWhoCanGrab([this.entity.owner.get()]);
    } catch {
      /* ignore */
    }
  }

  private onEnterHeld(): void {
    this.debug(
      `[Component_Snowball] HELD: Being held by player ${this._holderId}`
    );
  }

  private onEnterArmed(): void {
    this.debug(
      `[Component_Snowball] ARMED: Collision detection active, can explode`
    );

    // Start timer fallback if enabled
    if (this.props.enableTimerFallback && this.props.explodeOnImpact) {
      const fallbackMs = (this.props.fallbackTimerSeconds as number) * 1000;
      this.debug(
        `[Component_Snowball] Starting timer fallback: ${fallbackMs}ms`
      );

      // this._fallbackTimer = this.async.setTimeout(() => {
      //   if (this._currentState === BombState.ARMED) {
      //     this.debug(
      //       `[Component_Snowball] ⏰ TIMER FALLBACK TRIGGERED - no collision detected within ${this.props.fallbackTimerSeconds}s`
      //     );
      //     const currentPos = this.entity.position.get();
      //     this.explodeNow(currentPos, this.entity.owner.get());
      //   } else {
      //     this.debug(
      //       `[Component_Snowball] Timer fallback cancelled - bomb already in state: ${this._currentState}`
      //     );
      //   }
      // }, fallbackMs);
    }
  }

  private onEnterExploded(): void {
    this.debug(`[Component_Snowball] EXPLODED: Cleanup phase`);

    // Cancel timer fallback if still running
    this.clearTimerFallback();
  }

  private onEnterRespawning(): void {
    this.debug(`[Component_Snowball] RESPAWNING: Returning to spawn location`);
  }

  private isLocalClient(): boolean {
    return true;
  }

  // Reset all bomb state - call this on start and after each explosion
  private resetBombState() {
    this.debug(`[Component_Snowball] RESETTING BOMB STATE`);
    this.entity.interactionMode.set(hz.EntityInteractionMode.Grabbable); // Disable physics during repositioning

    // Clear all timers
    this._activePlayerTimers.forEach((timer, playerId) => {
      this.async.clearTimeout(timer);
    });
    this._activePlayerTimers.clear();

    // Clear timer fallback
    this.clearTimerFallback();

    // Clear all following VFX
    this.clearAllFollowingVFX();

    // Reset all state variables EXCEPT throw data (preserve for collision detection)
    this._holderId = undefined;
    this._localThrowInput = undefined;
    this._lastHand = undefined;
    this._bindTries = 0;
    this._lastThrowDir = undefined;
    this._pendingImpulse = false;
    this._throwCooldownUntil = 0;
    this._aimUpdateSub = undefined;
    this._lastAimDir = undefined;
    this._lastThrowOrigin = undefined;
    this._landingTrackerSub = undefined;
    this._landingLogged = false;
    this._playedLocalVFXSFX = false;
    this._pendingImpactPos = undefined;
    this.isSfxPlaying = false;

    // DON'T reset throw data - needed for collision detection:
    // this._throwerPosition = undefined;
    // this._throwerId = undefined;
    // this._throwInitiatedAt = 0;

    // Transition to IDLE state
    this.transitionTo(BombState.IDLE);

    this.debug(
      `[Component_Snowball] State reset complete - current state: ${this._currentState}`
    );
  }

  // Clear throw data after successful explosion
  private clearThrowData() {
    this.debug(`[Component_Snowball] Clearing throw data after explosion`);
    this._throwerPosition = undefined;
    this._throwerId = undefined;
    this._throwInitiatedAt = 0;
  }

  // Clear timer fallback
  private clearTimerFallback() {
    if (this._fallbackTimer) {
      this.debug(`[Component_Snowball] Clearing timer fallback`);
      this.async.clearTimeout(this._fallbackTimer);
      this._fallbackTimer = undefined;
    }
  }

  // Clear all following VFX and screen shake effects
  private clearAllFollowingVFX() {
    if (this._activeFollowingVFX.size > 0) {
      this.debug(
        `[Component_Snowball] 🎨 Clearing ${this._activeFollowingVFX.size} active VFX`
      );
      const playerIds = Array.from(this._activeFollowingVFX.keys());
      for (const playerId of playerIds) {
        this.stopFollowingVFX(playerId);
      }
      this._activeFollowingVFX.clear();
    }

    // Also clear all screen shake effects
    if (this._activeScreenShake.size > 0) {
      this.debug(
        `[Component_Snowball] 🎥 Clearing ${this._activeScreenShake.size} active screen shake effects`
      );
      const shakePlayerIds = Array.from(this._activeScreenShake.keys());
      for (const playerId of shakePlayerIds) {
        this.stopScreenShakeForPlayer(playerId);
      }
      this._activeScreenShake.clear();
    }
  }

  // Respawn bomb at original location
  private respawnBomb() {
    this.debug(`[Component_Snowball] RESPAWNING BOMB at original location`);
    this.entity.position.set(this._originalSpawnPosition!); // Move to owner position first to avoid glitches
    this.entity.rotation.set(this._originalSpawnRotation!);
    // Reset all state first
    this.resetBombState();
    const grab = this.entity.as(hz.GrabbableEntity);
    this.async.setTimeout(() => {
      grab?.setWhoCanGrab(this.playersInZone);
    }, 1000);
    this.sendNetworkBroadcastEvent(PlayerEnteredSnowfightArea, {
      player: this.entity.owner.get(),
    });
    // Move back to original spawn position
    if (this._originalSpawnPosition && this._originalSpawnRotation) {
      try {
        this.entity.position.set(this._originalSpawnPosition); // Move to owner position first to avoid glitches
        this.entity.rotation.set(this._originalSpawnRotation);
        this.entity.visible.set(false); // Hide during repositioning



      } catch (e) {
        this.debug(
          `[Component_Snowball] Failed to set spawn position/rotation: ${(e as Error).message
          }`
        );
      }
    }

    // Reset physics and make grabbable again
    try {
      const phys = this.entity.as(hz.PhysicalEntity);
      phys?.zeroVelocity();
      (phys as any)?.locked?.set?.(false);

      this.debug(
        `[Component_Snowball] Bomb respawned and ready for next throw!`
      );

      // Transition to IDLE state to complete the cycle
      this.transitionTo(BombState.IDLE);
      // this.props.snowballManager
      //   ?.getComponents(Manager_Snowball)[0]
      //   ?.giveNextBallToPlayer?.();
    } catch (e) {
      this.debug(
        `[Component_Snowball] Failed to reset physics/grabbable: ${(e as Error).message
        }`
      );
    }
  }
}

hz.Component.register(Component_Snowball);
