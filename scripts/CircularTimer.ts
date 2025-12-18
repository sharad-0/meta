import * as hz from "horizon/core";
import * as ui from "horizon/ui";

class SegmentedCircularTimer extends ui.UIComponent<
  typeof SegmentedCircularTimer
> {
  static propsDefinition = {
    maxTime: { type: hz.PropTypes.Number, default: 10 },
    currentTime: { type: hz.PropTypes.Number, default: 10 },
  };

  private progress!: ui.Binding<number>;
  private timeRemaining!: ui.Binding<number>;
  private maxTimeValue!: number;
  private currentTimeValue!: number;
  private isRunning = false;
  private bgColorBinding = new ui.Binding<string>("rgba(0, 0, 0, 0)");
  bgBaseImageBinding = new ui.Binding<ui.ImageSource>(
    ui.ImageSource.fromTextureAsset(
      new hz.Asset(BigInt("799641609555331")) as hz.TextureAsset
    )
  );

  initializeUI(): ui.UINode {
    this.maxTimeValue = this.props.maxTime!;
    this.currentTimeValue = this.props.currentTime!;
    this.progress = new ui.Binding<number>(
      this.currentTimeValue / this.maxTimeValue
    );
    this.timeRemaining = new ui.Binding<number>(this.currentTimeValue);

    const size = 150;
    const thickness = 25;
    const radius = size / 2;
    const segmentCount = 10;
    const gapAngle = 2;
    const segmentAngle = 360 / segmentCount - gapAngle;

    return ui.View({
      style: {
        width: size * 1.4,
        height: size * 1.4,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: this.bgColorBinding,
        borderRadius: radius,
      },
      children: [
        ui.Image({
          style: {
            height: "100%",
            width: "100%",
            position: "absolute",
          },
          source: this.bgBaseImageBinding,
        }),
        // Proper wedge segments
        ...Array.from({ length: segmentCount }).map((_, i) => {
          const rotation = (360 / segmentCount) * i;
          const segmentLength = (radius - thickness) * 0.8; // reduced length
          return ui.View({
            style: {
              position: "absolute",
              width: segmentLength,
              height: thickness,
              backgroundColor: this.progress.derive((p) => {
                const filledSegments = Math.floor(p * segmentCount);
                return i < filledSegments
                  ? this.getColor(p)
                  : this.getEmptySegmentColor(p);
              }),
              transform: [
                { rotate: `${rotation + gapAngle / 2}deg` },
                { translateY: -(radius - thickness / 2) },
              ],
              borderRadius: thickness / 2,
              marginHorizontal: gapAngle / 4,
            },
          });
        }),
      ],
    });
  }

  start() {
    //TODO: Remove this test code
    // this.setMaxTime(30);
    // this.startTimer();
    // this.async.setInterval(() => {
    //   this.updateProgress(1);
    // }, 1000);
  }

  public updateProgress(deltaTime: number) {
    this.currentTimeValue -= deltaTime;
    // if (this.currentTimeValue <= 0) {
    //   this.currentTimeValue = 0;
    //   this.isRunning = false;
    //   this.bgColorBinding.set("rgba(255, 1, 1, 1)");
    // }
    const progress = this.currentTimeValue / this.maxTimeValue;
    if (progress <= 0.001) {
      this.currentTimeValue = 0;
      this.isRunning = false;
      // this.bgColorBinding.set("rgba(255, 1, 1, 1)");
    }
    this.progress.set(progress);
    this.timeRemaining.set(this.currentTimeValue);
    this.updateBase(progress);
  }

  private getEmptySegmentColor(progress: number): string {
    // if (progress < 0.1) {
    //   return "#ff0000";
    // } else {
    return "rgba(0, 0, 0, 0)";
    // }
  }
  private getColor(progress: number): string {
    if (progress == 1) return "rgba(0, 0, 0, 0)";
    if (progress > 0.5) return "#20D332";
    if (progress > 0.2) return "#FFD342";
    return "#D32020";
  }

  private updateBase(progress: number) {
    let imageId = "799641609555331"; // default image
    if (progress == 1) {
      imageId = "799641609555331"; // completed image
    } else if (progress > 0.5) {
      imageId = "2748155555528304"; // green image
    } else if (progress > 0.2) {
      imageId = "1225000222761025"; // yellow image
    } else {
      imageId = "1942700006293544"; // red image
    }

    this.bgBaseImageBinding.set(
      ui.ImageSource.fromTextureAsset(
        new hz.Asset(BigInt(imageId)) as hz.TextureAsset
      )
    );
  }

  /** Public API */
  public setMaxTime(max: number) {
    this.maxTimeValue = max;
    this.currentTimeValue = max;
    this.progress.set(1);
    this.timeRemaining.set(this.currentTimeValue);
    this.isRunning = false;
  }

  public startTimer(startValue?: number) {
    this.currentTimeValue = startValue ?? this.maxTimeValue;
    this.progress.set(this.currentTimeValue / this.maxTimeValue);
    this.timeRemaining.set(this.currentTimeValue);
    this.isRunning = true;
    // console.log.*$
    // this.async.setInterval(() => {
    //   if (this.isRunning) this.updateProgress(1000);
    // }, 1000);
  }

  public stopTimer() {
    this.isRunning = false;
    this.progress.set(1);
    this.bgColorBinding.set("rgba(0, 0, 0, 0)");
    this.updateBase(1);
  }
}

hz.Component.register(SegmentedCircularTimer);
export default SegmentedCircularTimer;
