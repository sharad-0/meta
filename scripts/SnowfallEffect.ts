import { Component, PropTypes, Vec3, World } from "horizon/core";

export class SnowfallEffect extends Component<typeof SnowfallEffect> {
  static propsDefinition = {
    fallSpeed: { type: PropTypes.Number, default: 2.0 },
    radius: { type: PropTypes.Number, default: 10.0 },
    fallHeight: { type: PropTypes.Number, default: 10.0 },
    resetHeight: { type: PropTypes.Number, default: 0.0 },
  };

  private origin: Vec3 = new Vec3(0, 0, 0);

  override start() {
    // Store the initial position of the entity as the center of the snowfall area.
    this.origin = this.entity.position.get();
    // Set the initial random position for the snowflake.
    this.resetParticlePosition();
    // Connect to the world update event to move the particle each frame.
    this.connectLocalBroadcastEvent(World.onUpdate, (data) => {
      this.update(data.deltaTime);
    });
  }

  /**
   * Moves the particle downwards and resets it if it reaches the ground.
   * @param deltaTime The time elapsed since the last frame.
   */
  private update(deltaTime: number) {
    const currentPosition = this.entity.position.get();
    const newY = currentPosition.y - this.props.fallSpeed * deltaTime;

    // Check if the particle has reached or passed the reset height.
    if (newY <= this.props.resetHeight) {
      this.resetParticlePosition();
    } else {
      this.entity.position.set(new Vec3(currentPosition.x, newY, currentPosition.z));
    }
  }

  /**
   * Resets the particle to a new random position at the top of the fall height.
   */
  private resetParticlePosition() {
    // Generate a random angle and distance within the specified radius.
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * this.props.radius;

    // Calculate the new X and Z coordinates based on the origin.
    const newX = this.origin.x + Math.cos(angle) * distance;
    const newZ = this.origin.z + Math.sin(angle) * distance;

    // Set the new position at the defined fall height.
    this.entity.position.set(new Vec3(newX, this.props.fallHeight, newZ));
  }
}

Component.register(SnowfallEffect);