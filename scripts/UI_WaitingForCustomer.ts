import * as hz from "horizon/core";
import * as ui from "horizon/ui";

class WaitingForCustomerUI extends ui.UIComponent<typeof WaitingForCustomerUI> {
  static propsDefinition = {};

  initializeUI(): ui.UINode {
    return ui.View({
      children: [
        ui.Text({
          text: "Waiting for customers",
          style: {
            fontSize: 36,
            color: hz.Color.white,
          },
        }),
      ],
      style: {
        backgroundColor: "rgba(0, 0, 0, 0.63)",
        borderRadius: 12,
        top: "50%",
        width: "100%",
        height: "10%",
        position: "absolute",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "space-evenly",
      },
    });
  }

  public scaleOpenWithInterval(durationMs = 300, stepMs = 16): void {
    // start collapsed
    this.entity.scale.set(new hz.Vec3(0, 0, 0));

    const steps = Math.ceil(durationMs / stepMs);
    let current = 0;

    const handle = this.async.setInterval(() => {
      current++;
      // linear progress 0 → 1
      const t = Math.min(current / steps, 1);
      this.entity.scale.set(new hz.Vec3(t, t, t));

      if (t >= 1) this.async.clearInterval(handle); // done
    }, stepMs);
  }
}
hz.Component.register(WaitingForCustomerUI);
export default WaitingForCustomerUI;
