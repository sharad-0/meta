import * as hz from "horizon/core";
import * as ui from "horizon/ui";

class FetcherInstructions extends ui.UIComponent<typeof FetcherInstructions> {
  static propsDefinition = {};

  start() {}
  initializeUI(): ui.UINode {
    return ui.Text({
      text: "Collect items and drop them in Item Collector area",
      style: {
        fontSize: 48,
        color: hz.Color.black,
        textAlign: "center",
        backgroundColor: hz.Color.white,
        padding: 50,
        borderRadius: 10,
      },
    });
  }
}
hz.Component.register(FetcherInstructions);
