import { Player, Component } from "horizon/core";
import { Items, ITEM_VALUES, CustomAnalyticsEvents } from "Enums_Game";
import {
  addPlayersToUseTrash,
  removePlayersFromUseTrash,
} from "Manager_Events";
import { playerManager } from "Managers_Instance";
import { AnalyticsManager } from "AnalyticsManager";
import { Npc } from "horizon/npc";

/** A 4-slot bag keyed by the enum from Enums_Game. */
type Bag = Record<Items, number>;
type BagListener = (snapshot: Bag) => void;
type PlayerId = number;

export default class Manager_Bag extends Component<typeof Manager_Bag> {
  static propsDefinition = {};

  private _bags = new Map<PlayerId, Bag>();
  private _listeners = new Map<PlayerId, Set<BagListener>>();
  private _capacities = new Map<PlayerId, number>();
  private player1AttachedToBag: Player | null = null;
  private player2AttachedToBag: Player | null = null;

  start(): void {}

  // Helpers -------------------------------------------------------------------
  private _ensureBag(player: Player): Bag {
    const id = player.id;
    let bag = this._bags.get(id);
    if (!bag) {
      bag = { none: 0, item1: 0, item2: 0, item3: 0, item4: 0 };
      this._bags.set(id, bag);
      if (!this._capacities.has(id)) this._capacities.set(id, 5);
    }
    return bag;
  }

  private _emit(player: Player): void {
    const id = player.id;
    const bag = { ...this._ensureBag(player) }; // shallow copy
    const set = this._listeners.get(id);
    if (!set) return;

    set.forEach((cb) => {
      try {
        cb(bag);
      } catch (err) {
        console.error("BagComponent listener threw:", err);
      }
    });
  }

  // Public API ----------------------------------------------------------------

  getBag(player: Player): Bag {
    return { ...this._ensureBag(player) };
  }

  getItem(player: Player, key: Items): number {
    return this._ensureBag(player)[key] ?? 0;
  }

  getBagCapacity(player: Player): number {
    return this._capacities.get(player.id) ?? 5;
  }

  getTotalItemCount(player: Player): number {
    const bag = this._ensureBag(player);
    let total = 0;
    for (const key of ITEM_VALUES) total += bag[key] ?? 0;
    return total;
  }

  getIfBagFull(player: Player): boolean {
    return this.getTotalItemCount(player) >= this.getBagCapacity(player);
  }

  getIfBagEmpty(player: Player): boolean {
    return this.getTotalItemCount(player) === 0;
  }

  setItem(player: Player, key: Items, value: number): void {
    const bag = this._ensureBag(player);
    bag[key] = Math.max(0, value);
    this._emit(player);
  }

  increaseItem(player: Player, key: Items, delta = 1): void {
    const bag = this._ensureBag(player);
    bag[key] = (bag[key] ?? 0) + delta;

    this.sendLocalBroadcastEvent(addPlayersToUseTrash, { player: player });

    this._emit(player);
    if (!Npc.playerIsNpc(player)) {
      AnalyticsManager.s_instance.sendFetcherPickup(player, key, delta);
    }
  }

  decreaseItem(player: Player, key: Items, delta = 1): void {
    const bag = this._ensureBag(player);
    bag[key] = Math.max(0, (bag[key] ?? 0) - delta);

    if (this.getIfBagEmpty(player)) {
      this.sendLocalBroadcastEvent(removePlayersFromUseTrash, {
        player: player,
      });
    }

    this._emit(player);
  }

  dumpAllItems(player: Player): void {
    const bag = this._ensureBag(player);
    ITEM_VALUES.forEach((key) => (bag[key] = 0));
    this._emit(player);
  }

  setBagCapacity(player: Player, capacity: number): void {
    this._capacities.set(player.id, Math.max(0, capacity));
  }

  subscribe(player: Player, listener: BagListener): () => void {
    const id = player.id;
    let set = this._listeners.get(id);
    if (!set) {
      set = new Set<BagListener>();
      this._listeners.set(id, set);
    }
    set.add(listener);
    listener({ ...this._ensureBag(player) });
    return () => set!.delete(listener);
  }

  assignBagEntityToPlayer(player: Player): void {
    if (this.player1AttachedToBag === null) {
      this.player1AttachedToBag = player;
    } else if (this.player2AttachedToBag === null) {
      this.player2AttachedToBag = player;
    } else {
      console.warn("BagComponent: Both players already have bags assigned.");
    }
  }

  getPlayerAttachedToBag1(): Player | null {
    return this.player1AttachedToBag;
  }

  getPlayerAttachedToBag2(): Player | null {
    return this.player2AttachedToBag;
  }

  removeBagEntityFromPlayer(player: Player): void {
    if (this.player1AttachedToBag === player) {
      this.player1AttachedToBag = null;
    } else if (this.player2AttachedToBag === player) {
      this.player2AttachedToBag = null;
    }
  }
}
Component.register(Manager_Bag);
