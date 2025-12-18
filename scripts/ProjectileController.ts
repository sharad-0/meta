import { Component, PropTypes, Entity, Player, Vec3, World, CodeBlockEvents, EventSubscription, SpawnPointGizmo } from 'horizon/core';

// --- STUBS for external components ---
// These classes are placeholders to allow this script to compile.
// You should have the actual implementations of these components in your project.

// Assumes a HealthComponent exists on damageable entities.
class HealthComponent extends Component<typeof HealthComponent> {
  public TakeDamage(damage: number): void {}
  start() {}
}

// Assumes a PlayerDataManager singleton exists in the world.
class PlayerDataManager extends Component<typeof PlayerDataManager> {
  public static getInstance(): PlayerDataManager {
    return new PlayerDataManager();
  }
  public takeDamage(player: Player, damageAmount: number): void {}
  start() {}
}

// --- ProjectileController Script ---

class ProjectileController extends Component<typeof ProjectileController> {
  static propsDefinition = {
    speed: { type: PropTypes.Number, default: 25 },
    damage: { type: PropTypes.Number, default: 10 },
  };

  private isDestroyed: boolean = false;
  private lifetimeTimeout?: number;
  private updateSubscription?: EventSubscription;

  override preStart() {
    // Connect to collision events
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnEntityCollision,
      (collidedWith) => this.handleCollision(collidedWith)
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerCollision,
      (collidedWith) => this.handleCollision(collidedWith)
    );

    // Connect to the update loop for movement
    this.updateSubscription = this.connectLocalBroadcastEvent(
      World.onUpdate,
      (data) => this.onUpdate(data.deltaTime)
    );
  }

  override start() {
    // Set a timer to destroy the projectile after 3 seconds
    this.lifetimeTimeout = this.async.setTimeout(() => {
      this.destroyProjectile();
    }, 3000);
  }

  private onUpdate(deltaTime: number) {
    if (this.isDestroyed) {
      return;
    }
    // Move the projectile forward continuously
    const forwardVector = this.entity.forward.get();
    const movement = forwardVector.mul(this.props.speed * deltaTime);
    this.entity.position.set(this.entity.position.get().add(movement));
  }

  private handleCollision(target: Entity | Player) {
    if (this.isDestroyed) {
      return;
    }

    if (target instanceof Player) {
      // It's a player, find the PlayerDataManager
      const dataManager = PlayerDataManager.getInstance();
      if (dataManager) {
        dataManager.takeDamage(target, this.props.damage);
      } else {
        console.warn("ProjectileController: PlayerDataManager instance not found.");
      }
    } else if (target instanceof Entity) {
      // It's an entity, check for a HealthComponent
      const healthComponent = target.getComponents(HealthComponent)[0];
      if (healthComponent) {
        healthComponent.TakeDamage(this.props.damage);
      }
    }

    // Destroy the projectile after any collision
    this.destroyProjectile();
  }

  private destroyProjectile() {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;

    // Make the entity invisible and non-interactive
    this.entity.visible.set(false);
    this.entity.collidable.set(false);

    // Clean up timers and event listeners
    if (this.lifetimeTimeout) {
      this.async.clearTimeout(this.lifetimeTimeout);
    }
    this.updateSubscription?.disconnect();
  }
}

Component.register(ProjectileController);