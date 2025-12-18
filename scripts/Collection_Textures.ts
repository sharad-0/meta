import { Component, PropTypes } from "horizon/core";

export default class Collection_Textures extends Component<typeof Collection_Textures> {
  private static _instance: Collection_Textures | null = null;
  static get(): Collection_Textures {
    if (!Collection_Textures._instance) {
      throw new Error(
        "Collection Textures not initialised – attach it to an always‑loaded entity."
      );
    }
    return Collection_Textures._instance;
  }

  static propsDefinition = {
    item1Icon: { type: PropTypes.Asset },
    item2Icon: { type: PropTypes.Asset },
    item3Icon: { type: PropTypes.Asset },
    item4Icon: { type: PropTypes.Asset },
  };

  preStart(): void {
    Collection_Textures._instance = this;
  }

  start() {

  }
}
Component.register(Collection_Textures);