import { TextureAsset } from 'horizon/2p';
import { PropTypes } from 'horizon/core';
import { Image, ImageSource, Text, UIComponent, UINode, View } from 'horizon/ui';

class UI_HoverScoopingMachine extends UIComponent<typeof UI_HoverScoopingMachine> {
  static propsDefinition = {
    iconAsset: { type: PropTypes.Asset },

  };
  initializeUI(): UINode {
    return View({
      children: [
        Image({
          source: ImageSource.fromTextureAsset(this.props.iconAsset! as TextureAsset),
          style: {
            width: "100%",
            height: "100%",
            position: "absolute"
          }
        })
      ],
      style: {
        height: "auto",
        aspectRatio: 1,
        width: "100%",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center"
      }
    });
  }
}
UIComponent.register(UI_HoverScoopingMachine);
