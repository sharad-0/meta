import * as hz from 'horizon/core';

class HideOnStart extends hz.Component<typeof HideOnStart> {
  static propsDefinition = {};

  start() {
    this.entity.visible.set(false);
  }
}
hz.Component.register(HideOnStart);
