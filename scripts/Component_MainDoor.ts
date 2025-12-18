import * as hz from "horizon/core";
import { ParlourClosedEvent, ParlourOpenedEvent } from "Manager_Events";

class Component_MainDoor extends hz.Component<typeof Component_MainDoor> {
  static propsDefinition = {
    door1: {
      type: hz.PropTypes.Entity,
    },
    door2: {
      type: hz.PropTypes.Entity,
    },
  };

  start() {
    this.connectLocalBroadcastEvent(ParlourOpenedEvent, () => {
      this.entity.visible.set(false);
      this.props.door1?.visible.set(false);
      this.props.door2?.visible.set(false);
    });

    this.connectLocalBroadcastEvent(ParlourClosedEvent, () => {
      this.entity.visible.set(true);
      this.props.door1?.visible.set(true);
      this.props.door2?.visible.set(true);
    });
  }
}
hz.Component.register(Component_MainDoor);
