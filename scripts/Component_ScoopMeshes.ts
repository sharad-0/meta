import { Items } from 'Enums_Game';
import * as hz from 'horizon/core';
import { OnPlayerInventoryItemQuantityChanged } from 'Manager_Events';

class Component_ScoopMeshes extends hz.Component<typeof Component_ScoopMeshes> {
  static propsDefinition = {
    itemKey: { type: hz.PropTypes.String },
    scoopMesh1: { type: hz.PropTypes.Entity },
    scoopMesh2: { type: hz.PropTypes.Entity },
  };

  start() {
    this.connectLocalBroadcastEvent(OnPlayerInventoryItemQuantityChanged, this.onInventoryItemQuantityChanged.bind(this));
  }

  onInventoryItemQuantityChanged(event: { itemKey: Items, quantityChange: number, currentQuantity: number }) {
    console.log(`ScoopMeshes: ${event.itemKey} , ${event.currentQuantity}, ${event.itemKey !== this.props.itemKey}`);
    if (event.itemKey.toString() !== this.props.itemKey) return;
    if (event.currentQuantity > 2) {
      this.props.scoopMesh1!.visible.set(true);
      this.props.scoopMesh2!.visible.set(true);
    } else if (event.currentQuantity > 0 && event.currentQuantity <= 2) {
      this.props.scoopMesh1!.visible.set(true);
      this.props.scoopMesh2!.visible.set(false);
    } else {
      this.props.scoopMesh1!.visible.set(false);
      this.props.scoopMesh2!.visible.set(false);
    }
  }
}
hz.Component.register(Component_ScoopMeshes);