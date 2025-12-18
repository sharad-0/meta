import { Image, ImageSource, UIComponent, UINode, View } from 'horizon/ui';
import { PropTypes, Component, TextureAsset } from 'horizon/core';

class UI_DisplayIcon extends UIComponent<typeof UI_DisplayIcon> {
  static propsDefinition = {
    iconTexture : { type: PropTypes.Asset }
  };

  initializeUI(): UINode {
    return View({
      style: {
        alignSelf: "center",
        width: "100%",
        height: "100%"
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(this.props.iconTexture!.as(TextureAsset)),
          style: {
            resizeMode: "contain",
            width: "100%",
            height: "100%",
            position: 'absolute'
          }
        })
        
      ]
    })
  }
}
Component.register(UI_DisplayIcon);