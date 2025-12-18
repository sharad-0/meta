import { Items, ITEM_VALUES } from "Enums_Game";
import { Component } from "horizon/core";

interface InventorySlot {
  maxCapacity: number;
  currentAmount: number;
}

export default class Manager_Inventory extends Component<typeof Manager_Inventory> {
  static propsDefinition = {};

  private inventory = new Map<Items, InventorySlot>();

  start(): void {
    // Initialize all known item types with default capacity
    for (const item of ITEM_VALUES) {
      if (!this.inventory.has(item)) {
        this.inventory.set(item, {
          maxCapacity: 5, // Default capacity per item type
          currentAmount: 0,
        });
      }
    }
  }

  /** Add items to inventory, respecting the max capacity. Returns number added. */
  add(itemKey: Items, amount: number): number {
    const slot = this.inventory.get(itemKey);
    if (!slot || amount <= 0) return 0;

    const space = slot.maxCapacity - slot.currentAmount;
    const added = Math.min(space, amount);
    slot.currentAmount += added;
    return added;
  }

  /** Remove items from inventory, ensuring no negatives. Returns number removed. */
  remove(itemKey: Items, amount: number): number {
    const slot = this.inventory.get(itemKey);
    if (!slot || amount <= 0) return 0;

    const removed = Math.min(slot.currentAmount, amount);
    slot.currentAmount -= removed;
    return removed;
  }

  /** Get the number of available items. */
  getAmount(itemKey: Items): number {
    return this.inventory.get(itemKey)?.currentAmount ?? 0;
  }

  /** Get remaining space before hitting max. */
  getRemaining(itemKey: Items): number {
    const slot = this.inventory.get(itemKey);
    if (!slot) return 0;
    return slot.maxCapacity - slot.currentAmount;
  }

  /** Get the max capacity of the item slot. */
  getMaxCapacity(itemKey: Items): number {
    return this.inventory.get(itemKey)?.maxCapacity ?? 0;
  }

  /** Manually update max capacity of a given item. */
  setMaxCapacity(itemKey: Items, newCapacity: number): void {
    const slot = this.inventory.get(itemKey);
    if (slot && newCapacity >= 0) {
      slot.maxCapacity = newCapacity;
      slot.currentAmount = Math.min(slot.currentAmount, newCapacity);
    }
  }

  getInventory(): Map<Items, InventorySlot> {
    return this.inventory;
  }

  onParlourClosed() {
    this.inventory.clear();
    // Re-initialize inventory slots
    for (const item of ITEM_VALUES) {
      if (!this.inventory.has(item)) {
        this.inventory.set(item, {
          maxCapacity: 5, // Default capacity per item type
          currentAmount: 0,
        });
      }
    }
  }
} 

Component.register(Manager_Inventory);
