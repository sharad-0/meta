// TaskManager.ts – v1.1  (July 2025)
//
// HOW TO USE -----------------------------------------------------------
//
// import TaskManager, { ActionType, Role } from "./TaskManager";
//
// // 1) Record actions
// TaskManager.recordAction(player, ActionType.DepositIngredient);
//
// // 2) Display progress or coins as you like
// const tasks = TaskManager.getPlayerTasks(player);
//
// // 3) Show a concise objective string in a HUD panel
// const label = TaskManager.getCurrentTaskLabel(player, "Fetcher");
//
// -----------------------------------------------------------------------------
// IMPLEMENTATION
// -----------------------------------------------------------------------------

import { Player } from "horizon/core";

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

/** One of the low‑level atomic actions that advance tasks. */
export enum ActionType {
  DepositIngredient, // any ingredient
  DepositCone,
  DepositStrawberry,
  DepositVanilla,
  DepositChocolate,

  TakeOrder,
  CleanTable,

  ScoopOrder,
  ScoopDouble,
  ScoopTriple,

  ServeOrder,
}

export interface TaskDef {
  /** Unique numeric id inside its role bucket – used for save keys. */
  id: number;
  role: Role;
  description: string;
  target: number; // how many actions required
  reward: { cash: number; exp: number };
  gatedBy: ActionType; // which ActionType increments this task
}

interface TaskProgress {
  current: number;
  completed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static catalogue – tweak or extend here only
// ─────────────────────────────────────────────────────────────────────────────

const TASKS: TaskDef[] = [
  // Fetcher
  {
    id: 1,
    role: "Fetcher",
    description: "Deposit 20 ingredients",
    target: 20,
    reward: { cash: 10, exp: 5 },
    gatedBy: ActionType.DepositIngredient,
  },
  {
    id: 2,
    role: "Fetcher",
    description: "Deposit 50 ingredients",
    target: 50,
    reward: { cash: 20, exp: 10 },
    gatedBy: ActionType.DepositIngredient,
  },
  {
    id: 3,
    role: "Fetcher",
    description: "Deposit 100 ingredients",
    target: 100,
    reward: { cash: 30, exp: 15 },
    gatedBy: ActionType.DepositIngredient,
  },
  {
    id: 4,
    role: "Fetcher",
    description: "Deposit 50 cones",
    target: 50,
    reward: { cash: 30, exp: 20 },
    gatedBy: ActionType.DepositCone,
  },
  {
    id: 5,
    role: "Fetcher",
    description: "Deposit 50 strawberry",
    target: 50,
    reward: { cash: 30, exp: 20 },
    gatedBy: ActionType.DepositStrawberry,
  },
  {
    id: 6,
    role: "Fetcher",
    description: "Deposit 50 vanilla",
    target: 50,
    reward: { cash: 30, exp: 20 },
    gatedBy: ActionType.DepositVanilla,
  },
  {
    id: 7,
    role: "Fetcher",
    description: "Deposit 50 chocolate",
    target: 50,
    reward: { cash: 30, exp: 20 },
    gatedBy: ActionType.DepositChocolate,
  },

  // Cashier
  // {
  //   id: 1,
  //   role: "Cashier",
  //   description: "Take 10 orders",
  //   target: 10,
  //   reward: { cash: 10, exp: 5 },
  //   gatedBy: ActionType.TakeOrder,
  // },
  // {
  //   id: 2,
  //   role: "Cashier",
  //   description: "Take 30 orders",
  //   target: 30,
  //   reward: { cash: 20, exp: 10 },
  //   gatedBy: ActionType.TakeOrder,
  // },
  // {
  //   id: 3,
  //   role: "Cashier",
  //   description: "Take 100 orders",
  //   target: 100,
  //   reward: { cash: 30, exp: 20 },
  //   gatedBy: ActionType.TakeOrder,
  // },

  // Scooper
  {
    id: 1,
    role: "Scooper",
    description: "Scoop 5 orders",
    target: 10,
    reward: { cash: 10, exp: 5 },
    gatedBy: ActionType.ScoopOrder,
  },
  {
    id: 2,
    role: "Scooper",
    description: "Scoop 10 orders",
    target: 20,
    reward: { cash: 20, exp: 10 },
    gatedBy: ActionType.ScoopOrder,
  },
  {
    id: 3,
    role: "Scooper",
    description: "Scoop 20 orders",
    target: 30,
    reward: { cash: 30, exp: 15 },
    gatedBy: ActionType.ScoopOrder,
  },
  {
    id: 4,
    role: "Scooper",
    description: "Scoop 30 orders",
    target: 50,
    reward: { cash: 50, exp: 25 },
    gatedBy: ActionType.ScoopOrder,
  },
  {
    id: 5,
    role: "Scooper",
    description: "Scoop 10 double scoops",
    target: 10,
    reward: { cash: 50, exp: 25 },
    gatedBy: ActionType.ScoopDouble,
  },
  {
    id: 6,
    role: "Scooper",
    description: "Scoop 10 triple scoops",
    target: 10,
    reward: { cash: 60, exp: 30 },
    gatedBy: ActionType.ScoopTriple,
  },

  // Server
  {
    id: 1,
    role: "Server",
    description: "Serve 5 orders",
    target: 5,
    reward: { cash: 10, exp: 5 },
    gatedBy: ActionType.ServeOrder,
  },
  {
    id: 2,
    role: "Server",
    description: "Clean 5 tables",
    target: 5,
    reward: { cash: 10, exp: 5 },
    gatedBy: ActionType.CleanTable,
  },
  {
    id: 3,
    role: "Server",
    description: "Serve 10 orders",
    target: 10,
    reward: { cash: 10, exp: 5 },
    gatedBy: ActionType.ServeOrder,
  },
  {
    id: 4,
    role: "Server",
    description: "Clean 10 tables",
    target: 20,
    reward: { cash: 10, exp: 5 },
    gatedBy: ActionType.CleanTable,
  },
  {
    id: 5,
    role: "Server",
    description: "Serve 30 orders",
    target: 30,
    reward: { cash: 10, exp: 5 },
    gatedBy: ActionType.ServeOrder,
  },
];

// Build reverse index: ActionType → TaskDef[]
const TASKS_BY_ACTION: Map<ActionType, TaskDef[]> = (() => {
  const map = new Map<ActionType, TaskDef[]>();
  TASKS.forEach((t) => {
    if (!map.has(t.gatedBy)) map.set(t.gatedBy, []);
    map.get(t.gatedBy)!.push(t);
  });
  return map;
})();

// ─────────────────────────────────────────────────────────────────────────────
// In‑memory player data
// ─────────────────────────────────────────────────────────────────────────────

/** player‑id → task‑key → progress */
const _progress: Map<string, Map<string, TaskProgress>> = new Map();
/** player‑id → UI listeners */
const _listeners: Map<string, Set<() => void>> = new Map();
function syncProgressWithStored(player: Player): void {
  const pid = player.id.toString();
  if (!_progress.has(pid)) _progress.set(pid, new Map());
  const pmap = _progress.get(pid)!;

  const rec = playerManager?.getPlayerRecord(player);
  if (!rec) return;

  const stored = rec.completedTasks;
  Object.entries(stored).forEach(([role, ids]) => {
    ids.forEach((id) => {
      const def = TASKS.find((t) => t.role === role && t.id === id);
      if (!def) return; // skip unknown / obsolete tasks
      const key = taskKey(def);
      if (!pmap.has(key)) {
        pmap.set(key, { current: def.target, completed: true });
      }
    });
  });
}
// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export default {
  /** Increment progress for each task that listens to this action. */
  /** Increment progress for this player, but only on the
   *  first incomplete task in the chain.  Overflow is ignored. */
  recordAction(player: Player, action: ActionType, amount = 1): void {
    syncProgressWithStored(player);
    const all = TASKS_BY_ACTION.get(action);
    if (!all) return;

    const pid = player.id.toString();
    const role = playerManager?.getRole(player) as PlayerRoles; // "Fetcher", …
    if (!_progress.has(pid)) _progress.set(pid, new Map());
    const pmap = _progress.get(pid)!;

    /* ---- Find the first incomplete task for this role ------------- */
    const next = all
      .filter((t) => t.role === role) // ignore other roles
      .sort((a, b) => a.id - b.id) // 1 → 2 → 3 …
      .find((t) => !pmap.get(taskKey(t))?.completed);

    if (!next) return; // whole track finished

    /* ---- Update that single task ---------------------------------- */
    const key = taskKey(next);
    if (!pmap.has(key)) pmap.set(key, { current: 0, completed: false });
    const prog = pmap.get(key)!;

    prog.current += amount;

    if (prog.current >= next.target) {
      prog.current = next.target; // lock to max, don’t spill
      prog.completed = true;
      payOut(player, next.reward.cash,  next.reward.exp, next.id, role);
      showTaskCompletePopup(player, next);
    }

    notify(pid);
  },
  /** Return every task merged with this player’s live progress. */
  getPlayerTasks(player: Player): (TaskDef & TaskProgress)[] {
    syncProgressWithStored(player);
    const pid = player.id.toString();
    const pmap = _progress.get(pid) ?? new Map();
    return TASKS.map((t) => {
      const prog = pmap.get(taskKey(t)) ?? { current: 0, completed: false };
      return { ...t, ...prog };
    });
  },

  /** Subscribe to realtime updates for this player. */
  subscribe(player: Player, cb: () => void): () => void {
    syncProgressWithStored(player);
    const pid = player.id.toString();
    if (!_listeners.has(pid)) _listeners.set(pid, new Set());
    _listeners.get(pid)!.add(cb);
    cb();
    return () => _listeners.get(pid)?.delete(cb);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NEW API helpers – v1.1
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the next incomplete task for this role, or `null` if the player has
   * finished the full track.
   */
  getCurrentTask(player: Player, role: Role): (TaskDef & TaskProgress) | null {
    syncProgressWithStored(player);
    return (
      this.getPlayerTasks(player)
        .filter((t) => t.role === role && !t.completed)
        .sort((a, b) => a.id - b.id)[0] ?? null
    );
  },

  /**
   * Convenience: a human‑friendly label like
   *   "Deposit 20 ingredients (12/20)" or "All tasks complete!".
   */
  getCurrentTaskLabel(player: Player, role: Role): string {
    syncProgressWithStored(player);
    const t = this.getCurrentTask(player, role);
    return t
      ? `${t.description} (${t.current}/${t.target})`
      : "All tasks complete!";
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function taskKey(t: TaskDef): string {
  return `${t.role}:${t.id}`;
}

function payOut(
  player: Player,
  cash: number,
  exp: number,
  taskId: number,
  playerRole: PlayerRoles
): void {
  syncProgressWithStored(player);
  playerManager?.addCash(player, cash);
  playerManager?.addExp(player, exp);
  playerManager?.addCompletedTask(player, playerRole, taskId);

  // Optional: toast, sfx, analytics can be hooked here.
  // // console.log.*$
}
function showTaskCompletePopup(this: any, player: Player, task: TaskDef): void {
  let popupOptions = {
    ...hz.DefaultPopupOptions,
    position: new hz.Vec3(0, 0.5, 0),
    fontSize: 3,
  };
  this.world.ui.showPopupForPlayer(
    player,
    `Task completed, ${task.reward} scoop coins rewarded!`,
    3,
    popupOptions
  );

  // // console.log.*$
}
function notify(pid: string): void {
  _listeners.get(pid)?.forEach((cb) => cb());
}
import * as hz from "horizon/core";
import { PlayerRoles, Role } from "Enums_Game";
import { playerManager } from "Managers_Instance";

class TaskManager extends hz.Component<typeof TaskManager> {
  static propsDefinition = {};

  start() {}
}
hz.Component.register(TaskManager);
