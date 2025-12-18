import * as hz from "horizon/core";
import { utilityManager } from "Managers_Instance";

/**
 * Sequential operation queue for player join/leave events
 */
export class PlayerOperationQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing: boolean = false;
  private pendingDeletions: Set<hz.Entity> = new Set();

  /**
   * Add operation to queue and process
   */
  async enqueue(operation: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await operation();
          resolve();
        } catch (error) {
          console.error("Queue operation failed:", error);
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error("Error processing queue operation:", error);
        }
        // Small delay for fairness
        await utilityManager?.sleep(100);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Mark entity for deletion to prevent duplicate deletion attempts
   */
  markForDeletion(entity: hz.Entity): boolean {
    if (this.pendingDeletions.has(entity)) {
      return false; // Already marked for deletion
    }
    this.pendingDeletions.add(entity);
    return true;
  }

  /**
   * Remove entity from deletion tracking after successful deletion
   */
  clearDeletionMark(entity: hz.Entity): void {
    this.pendingDeletions.delete(entity);
  }

  /**
   * Check if entity is already being deleted
   */
  isBeingDeleted(entity: hz.Entity): boolean {
    return this.pendingDeletions.has(entity);
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear all pending operations (use with caution)
   */
  clear(): void {
    this.queue = [];
    this.pendingDeletions.clear();
    this.isProcessing = false;
  }
}
