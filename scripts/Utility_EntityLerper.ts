import * as hz from "horizon/core";

export default class Utility_EntityLerper extends hz.Component<
  typeof Utility_EntityLerper
> {
  // internal state
  private moving = false;
  private t = 0; // normalized time [0..1]
  private duration = 1; // seconds
  private entityToMove: hz.Entity | null = null;
  private startPos!: hz.Vec3;
  private endPos!: hz.Vec3;
  private updateEventSub?: hz.EventSubscription;

  // current pending promise controls
  private _resolve?: (ok: boolean) => void;
  private _reject?: (reason?: any) => void;
  private _abortHandler?: () => void;

  start(): void {}
  /**
   * Begin a position interpolation.
   * @param target Target world position
   * @param durationSecs How long the move should take, in seconds
   * @param ease Optional: custom easing function (0..1 -> 0..1)
   */
  public moveTo(
    entity: hz.Entity,
    target: hz.Vec3,
    durationSecs: number,
    ease?: (x: number) => number
  ): Promise<boolean> {
    this.entityToMove = entity;
    this.duration = Math.max(0.0001, durationSecs);
    this.startPos = entity.position.get();
    this.endPos = target;
    this.t = 0;
    this.moving = true;
    if (ease) this._ease = ease;

    this.updateEventSub = this.connectLocalBroadcastEvent(
      hz.World.onUpdate,
      (data) => {
        this.onUpdate(data.deltaTime);
      }
    );

    return new Promise<boolean>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;

      // if (opts?.signal) {
      //   // If already aborted, cancel immediately
      //   if (opts.signal.aborted) {
      //     this.cancel();
      //     return;
      //   }
      //   // Wire up future aborts
      //   this._abortHandler = () => this.cancel();
      //   opts.signal.addEventListener("abort", this._abortHandler, { once: true });
      // }
    });
  }

  /** Cancel an in‑progress interpolation */
  public cancel() {
    this.moving = false;
    this.t = 0;

    if (this.updateEventSub) {
      this.updateEventSub.disconnect();
      this.updateEventSub = undefined;
    }
  }

  /** Called every frame */
  onUpdate(dt: number) {
    if (!this.moving) return;

    this.t += dt / this.duration;
    const u = this._ease(Math.min(1, Math.max(0, this.t)));

    // Lerp position
    const p = new hz.Vec3(
      this.startPos.x + (this.endPos.x - this.startPos.x) * u,
      this.startPos.y + (this.endPos.y - this.startPos.y) * u,
      this.startPos.z + (this.endPos.z - this.startPos.z) * u
    );

    this.entityToMove?.position.set(p);

    if (this.t >= 1) {
      if (this.updateEventSub) {
        this.updateEventSub.disconnect();
        this.updateEventSub = undefined;
      }

      this._finish(true); // reached target
    }
  }

  /** Complete or cancel the current promise and clean up listeners/state */
  private _finish(success: boolean) {
    if (!this.moving && !this._resolve) return;

    this.moving = false;
    this.t = 0;

    // detach abort listener if any
    if (this._abortHandler) {
      // The AbortSignal was passed in by the caller; we don’t have a direct ref here.
      // Listener was added with { once: true }, so removing is optional—but be tidy:
      try {
        // no-op: we can't remove without captured signal; leaving for clarity
      } catch {}
      this._abortHandler = undefined;
    }

    // resolve the pending promise
    const resolve = this._resolve;
    const reject = this._reject;
    this._resolve = undefined;
    this._reject = undefined;

    // resolve rather than reject on cancel/interruption to keep flow simple
    if (resolve) resolve(success);
    // never reject on normal flow—reserve reject for unexpected errors only
  }

  // Default easing: smoothstep-ish (ease in/out)
  private _ease(x: number) {
    // cubic smoothstep: 3x^2 - 2x^3
    return x * x * (3 - 2 * x);
  }
}
hz.Component.register(Utility_EntityLerper);
