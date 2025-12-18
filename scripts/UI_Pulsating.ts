import { PropTypes, TextureAsset } from "horizon/core";
import { Binding, Image, ImageSource, Text, UIComponent, UINode, View } from "horizon/ui";

export class UI_Pulsating extends UIComponent<typeof UI_Pulsating> {
  static propsDefinition = {
    imageAsset: { type: PropTypes.Asset },
  };
  widthBinding = new Binding<string>("0%");
  private interval: number | null = null;

  initializeUI(): UINode {
    // Return a UINode to specify the contents of your UI.
    // For more details and examples go to:
    // https://developers.meta.com/horizon-worlds/learn/documentation/typescript/api-references-and-examples/custom-ui

    return View({
      children: Image({
        source: ImageSource.fromTextureAsset(
          this.props.imageAsset! as TextureAsset
        ),
        style: {
          height: "auto",
          width: this.widthBinding,
        },
      }),
      style: {
        width: "100%",
        height: "100%",
      },
    });
  }

  start(){}

  startPulsating() {
    this.stopPulsating();
    this.interval = this.async.setInterval(() => {
      this.pulsatingStep();
    }, 1000);
  }

  stopPulsating() {
    if (this.interval !== null) {
      this.async.clearInterval(this.interval);
      this.interval = null;
    }
  }

  pulsatingStep() {
    this.widthBinding.set("100%");
    this.async.setTimeout(() => {
      this.widthBinding.set("0%");
    }, 500);
  }
}
UIComponent.register(UI_Pulsating);
