import { Component, PropTypes, Entity, Color } from "horizon/core";

export class Animation_Markers extends Component<typeof Animation_Markers> {
  static propsDefinition = {
    activeColor: { type: PropTypes.Color, default: new Color(0.9, 0, 1) },
    defaultColor: { type: PropTypes.Color, default: new Color(0.5, 0.5, 0.5) },
    animationSpeed: { type: PropTypes.Number, default: 0.1 },
  };

  private markers: Entity[] = [];
  private currentIndex = 0;
  private animationInterval?: number;

  override start() {
    // Collect all valid marker entities from props

    const potentialMarkers = this.entity.children.get();
    this.markers = potentialMarkers.filter((m): m is Entity => m !== undefined);

    if (this.markers.length === 0) {
      console.warn("MarkerColorAnimator: No marker entities provided.");
      return;
    }

    // Set all markers to the default color initially
    this.markers.forEach((marker) => {
      marker.color.set(this.props.defaultColor);
    });

    // // Start the animation loop
    // const animationSpeedMs = this.props.animationSpeed * 1000;
    // this.animationInterval = this.async.setInterval(() => {
    //   this.animateNextMarker();
    // }, animationSpeedMs);

    // // Animate the first marker immediately
    // this.animateNextMarker();
  }

  public startAnimation() {
    // Start the animation loop
    const animationSpeedMs = this.props.animationSpeed * 1000;
    this.animationInterval = this.async.setInterval(() => {
      this.animateNextMarker();
    }, animationSpeedMs);

    // Animate the first marker immediately
    this.animateNextMarker();
  }

  public stopAnimation() {
    if (this.animationInterval) {
      this.async.clearInterval(this.animationInterval);
    }
  }
  private animateNextMarker() {
    // Set the previous marker back to the default color
    const previousIndex =
      (this.currentIndex - 1 + this.markers.length) % this.markers.length;
    const previousMarker = this.markers[previousIndex];
    if (previousMarker) {
      previousMarker.color.set(this.props.defaultColor);
    }

    // Set the current marker to the active color
    const currentMarker = this.markers[this.currentIndex];
    if (currentMarker) {
      currentMarker.color.set(this.props.activeColor);
    }

    // Move to the next marker for the next cycle
    this.currentIndex = (this.currentIndex + 1) % this.markers.length;
  }

  override dispose() {
    if (this.animationInterval) {
      this.async.clearInterval(this.animationInterval);
    }
  }
}

Component.register(Animation_Markers);
