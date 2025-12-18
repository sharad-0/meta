import { Component } from "horizon/core";

export default class Manager_Timers extends Component<typeof Manager_Timers> {
  static propsDefinition = {};

  start() {}

  private intervals = new Map<string, number>();
  private timeouts = new Map<string, number>();

  /** Start an interval timer keyed by `key`. Ignores if already running. */
  setInterval(key: string, callback: () => void, interval: number): void {
    if (this.intervals.has(key)) return; // avoid duplicate interval
    const id = this.async.setInterval(() => {
      callback();
    }, interval);
    this.intervals.set(key, id);
  }

  /** Clear the interval identified by `key`. */
  clearInterval(key: string): void {
    const id = this.intervals.get(key);
    if (id !== undefined) {
      this.async.clearInterval(id);
      this.intervals.delete(key);
    }
  }

  /** Start a timeout timer keyed by `key`. Clears previous timeout if exists. */
  setTimeout(key: string, callback: () => void, timeout: number): void {
    if (this.timeouts.has(key)) {
      this.async.clearTimeout(this.timeouts.get(key)!);
      this.timeouts.delete(key);
    }
    const id = this.async.setTimeout(() => {
      callback();
      this.timeouts.delete(key);
    }, timeout);
    this.timeouts.set(key, id);
  }

  /** Clear the timeout identified by `key`. */
  clearTimeout(key: string): void {
    const id = this.timeouts.get(key);
    if (id !== undefined) {
      this.async.clearTimeout(id);
      this.timeouts.delete(key);
    }
  }

  /** Clear all timers (intervals and timeouts). Useful on cleanup/reset. */
  clearAll(): void {
    this.intervals.forEach((id) => this.async.clearInterval(id));
    this.intervals.clear();
    this.timeouts.forEach((id) => this.async.clearTimeout(id));
    this.timeouts.clear();
  }
}
Component.register(Manager_Timers);
