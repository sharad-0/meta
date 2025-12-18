import * as hz from 'horizon/core';
import { Binding, Text, UIComponent, UINode, View } from 'horizon/ui';

export default class UI_HouseOwnerName extends UIComponent<typeof UI_HouseOwnerName> {
  static propsDefinition = {};

  private nameBinding: Binding<string> = new Binding("");

  initializeUI(): UINode {
    return View({
      style: {
        flexGrow: 1,                  // take full space
        justifyContent: "center",     // center vertically
        alignItems: "center",         // center horizontally
      },
      children: [
        Text({
          text: this.nameBinding,
          style: {
            fontSize: 70,
            color: "#ffffffff",
            fontFamily: "Bangers",
            textAlign: "center",
          },
        }),
      ],
    });
  }

  updateOwnerName(name: string) {
    this.nameBinding.set(name);
  }
}
UIComponent.register(UI_HouseOwnerName);