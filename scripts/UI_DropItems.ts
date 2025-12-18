import * as hz from 'horizon/core';
import * as ui from 'horizon/ui'

class DropItemsUI extends ui.UIComponent<typeof DropItemsUI> {
  static propsDefinition = {};
  
  initializeUI(): ui.UINode {
    return ui.Text({
      text: 'Stand on colored platform to drop items',
      style: {
        fontSize: 48,
        color: hz.Color.black,
        textAlign: 'center',
        backgroundColor: hz.Color.white,
        padding: 50,
        borderRadius: 10
      }
    })
  }
}
hz.Component.register(DropItemsUI); 