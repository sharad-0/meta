import * as hz from "horizon/core";

class SquarePlateProgress extends hz.Component<typeof SquarePlateProgress> {
  static propsDefinition = {
    plate1: { type: hz.PropTypes.Entity },
    plate2: { type: hz.PropTypes.Entity },
    plate3: { type: hz.PropTypes.Entity },
    plate4: { type: hz.PropTypes.Entity },
    plate5: { type: hz.PropTypes.Entity },
    activeColor: { type: hz.PropTypes.Color, default: hz.Color.green },
    inactiveColor: { type: hz.PropTypes.Color, default: hz.Color.red },
  };

  private plates!: hz.Entity[];

  preStart() {
    this.plates = [
      this.props.plate1!,
      this.props.plate2!,
      this.props.plate3!,
      this.props.plate4!,
      this.props.plate5!,
    ];

    // Initialize all plates to inactive color
    // this.plates.forEach((plate) => {
    //   plate.color.set(this.props.inactiveColor!);
    // });
  }

  start() {}

  /**
   * Sets the color of the square plates based on the progress percentage.
   * @param progress - A number between 0 and 100 representing the progress percentage.
   */
  public setProgress(progress: number) {
    const activePlates = Math.floor(progress * this.plates.length);
    for (let i = 0; i < this.plates.length; i++) {
      this.async.setTimeout(() => {
        if (i < activePlates) {
          this.plates[i].color.set(this.props.activeColor!);
        } else {
          this.plates[i].color.set(this.props.inactiveColor!);
        }
      }, (i + 1) * 500);
    }
  }
  public emptyProgress(progress: number) {
    const activePlates = Math.floor(progress * this.plates.length);
    for (let i = 0; i < this.plates.length; i++) {
      if (i < activePlates) {
        this.plates[i].color.set(this.props.activeColor!);
      } else {
        this.plates[i].color.set(this.props.inactiveColor!);
      }
    }
  }
}

hz.Component.register(SquarePlateProgress);
export default SquarePlateProgress;
