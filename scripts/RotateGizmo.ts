import { Component, PropTypes, World, Quaternion, Vec3 } from 'horizon/core';

/**
 * Continuously rotates the attached entity around its local axes.
 */
class RotateGizmo extends Component<typeof RotateGizmo> {
  static propsDefinition = {
    // The speed of rotation in degrees per second.
    rotationSpeed: { type: PropTypes.Number, default: 30 },
    // Whether to rotate around the local X-axis.
    rotateX: { type: PropTypes.Boolean, default: true },
    // Whether to rotate around the local Y-axis.
    rotateY: { type: PropTypes.Boolean, default: false },
    // Whether to rotate around the local Z-axis.
    rotateZ: { type: PropTypes.Boolean, default: false },
  };

  override start() {
    // Connect to the world's update loop to apply rotation every frame.
    this.connectLocalBroadcastEvent(
      World.onUpdate,
      (data: { deltaTime: number }) => {
        this.rotateEntity(data.deltaTime);
      }
    );
  }

  /**
   * Calculates and applies the rotation for the current frame based on the enabled axes.
   * @param deltaTime The time elapsed since the last frame.
   */
  private rotateEntity(deltaTime: number) {
    const rotationThisFrame = this.props.rotationSpeed * deltaTime;

    // Determine rotation for each axis based on the boolean properties.
    const xRot = this.props.rotateX ? rotationThisFrame : 0;
    const yRot = this.props.rotateY ? rotationThisFrame : 0;
    const zRot = this.props.rotateZ ? rotationThisFrame : 0;

    // Create a quaternion representing the rotation to apply this frame.
    const deltaRotation = Quaternion.fromEuler(new Vec3(xRot, yRot, zRot));

    // Combine the new local rotation with the current world rotation.
    // Post-multiplying (current * delta) applies the rotation in local space.
    const currentRotation = this.entity.rotation.get();
    const newRotation = currentRotation.mul(deltaRotation);

    this.entity.rotation.set(newRotation);
  }
}

Component.register(RotateGizmo);