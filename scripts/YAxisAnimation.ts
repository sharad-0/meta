import { Component, PropTypes, Vec3, World } from 'horizon/core';

/**
 * Animates an entity up and down along its local y-axis using a sine wave.
 */
class YAxisAnimation extends Component<typeof YAxisAnimation> {
  static propsDefinition = {
    // The maximum height the entity will move up and down from its starting position.
    height: { type: PropTypes.Number, default: 1.0 },
    // The speed of the up and down animation.
    speed: { type: PropTypes.Number, default: 1.0 },
    // An offset for the start time of the animation, allowing for out-of-sync animations.
    timeOffset: { type: PropTypes.Number, default: 0.0 },
  };

  private initialPosition!: Vec3;
  private time: number = 0;

  override preStart() {
    // Connect to the world's update loop to animate every frame.
    this.connectLocalBroadcastEvent(World.onUpdate, (data) => {
      this.updateAnimation(data.deltaTime);
    });
  }

  override start() {
    // Store the starting position of the entity.
    this.initialPosition = this.entity.position.get();
    // Apply the initial time offset.
    this.time = this.props.timeOffset;
  }

  private updateAnimation(deltaTime: number) {
    // Increment time based on the speed property.
    this.time += deltaTime * this.props.speed;

    // Calculate the vertical offset using a sine wave for smooth oscillation.
    const verticalOffset = Math.sin(this.time) * this.props.height;

    // Apply the offset to the initial position and set the new position.
    const newPosition = this.initialPosition.add(new Vec3(0, verticalOffset, 0));
    this.entity.position.set(newPosition);
  }
}

Component.register(YAxisAnimation);