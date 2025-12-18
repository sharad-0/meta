import { Asset, Component, MeshEntity, PropTypes, TextureAsset } from "horizon/core";

class AnimatedGIF extends Component<typeof AnimatedGIF> {

  static propsDefinition = {
    //Adjust the speedSeconds default here, or for each animation individually from the properties panel
    speedSeconds: { type: PropTypes.Number, default: 1 },
    texture0: { type: PropTypes.Asset },
    texture1: { type: PropTypes.Asset },
    texture2: { type: PropTypes.Asset },
    texture3: { type: PropTypes.Asset },
//     texture4: { type: PropTypes.Asset },
//     texture5: { type: PropTypes.Asset },
//     texture6: { type: PropTypes.Asset },
//     texture7: { type: PropTypes.Asset },
//     texture8: { type: PropTypes.Asset },
//     texture9: { type: PropTypes.Asset },
//     texture10: { type: PropTypes.Asset },
//     texture11: { type: PropTypes.Asset },
//     texture12: { type: PropTypes.Asset },
//     texture13: { type: PropTypes.Asset },
//     texture14: { type: PropTypes.Asset },
//     texture15: { type: PropTypes.Asset },
  };

  //create texture array, starting index of 0
  textures: TextureAsset[] = [];
  index = 0;

  //This value is set in start using this.props.speedSeconds
  delaySpeedMs = 0;

  start() {
    //Add Textures To Array In Correct Order (Skips Unassigned Values)
    this.addTextureToArray(this.props.texture0);
    this.addTextureToArray(this.props.texture1);
    this.addTextureToArray(this.props.texture2);
    this.addTextureToArray(this.props.texture3);
//     this.addTextureToArray(this.props.texture4);
//     this.addTextureToArray(this.props.texture5);
//     this.addTextureToArray(this.props.texture6);
//     this.addTextureToArray(this.props.texture7);
//     this.addTextureToArray(this.props.texture8);
//     this.addTextureToArray(this.props.texture9);
//     this.addTextureToArray(this.props.texture10);
//     this.addTextureToArray(this.props.texture11);
//     this.addTextureToArray(this.props.texture12);
//     this.addTextureToArray(this.props.texture13);
//     this.addTextureToArray(this.props.texture14);
//     this.addTextureToArray(this.props.texture15);

    //Value can be changed from the properties panel, maximum speed of 100x per second
    this.delaySpeedMs = Math.max(Math.floor(this.props.speedSeconds * 1000), 10);

    //Create meshEntity variable to make sure the script is attached to a MeshEntity
    const meshEntity = this.entity.as(MeshEntity);
if (meshEntity) {
      //Create looping event with setInterval
      this.async.setInterval(() => { this.loop(meshEntity); }, this.delaySpeedMs);
    }

    else {
      // console.log.*$
    }
  }


  loop(meshEntity: MeshEntity) {
    meshEntity.setTexture(this.textures[this.index]);

    //update the index and loop back to 0 when reaching the length of the array
    this.index = (this.index + 1) % this.textures.length;

  }

  addTextureToArray(prop: Asset | undefined) {
    if (prop) {
      this.textures.push(prop.as(TextureAsset));
    }
  }
}

Component.register(AnimatedGIF);