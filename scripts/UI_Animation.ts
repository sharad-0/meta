// // ─── ScaleOpen.ts – drop-in helper ───────────────────────────────────────────
// // Usage:   import { scaleOpen } from "./ScaleOpen";
// //          scaleOpen(this.entity);            // 300 ms default
// //          scaleOpen(panelEntity, 0.6);       // 0.6 s custom duration
// // ----------------------------------------------------------------------------

// import { Entity, Vec3, Easing } from "horizon/core";

// /**
//  * Animates an entity’s scale from (0,0,0) to (1,1,1) with a linear tween.
//  * @param entity   The entity that should “pop” into view.
//  * @param seconds  Duration of the animation (default 0.3 s).
//  */
// export function scaleOpen(entity: Entity, seconds = 0.3): void {
//   // start collapsed
//   entity.scale.set(new Vec3(0, 0, 0));

//   // smooth linear tween to full size
//   entity.scale.tweenTo(new Vec3(1, 1, 1), seconds, Easing.Linear);
// }
