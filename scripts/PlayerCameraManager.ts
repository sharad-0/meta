import * as hz from "horizon/core";
import { Npc } from "horizon/npc";

class PlayerCameraManager extends hz.Component<typeof PlayerCameraManager> {
  static propsDefinition = {
    playerCameraEntity: { type: hz.PropTypes.Asset },
  };

  private spawnedAssets: hz.Entity[] = [];

  preStart(): void {}

  start() {
    // // When a web/mobile player enters the world, assign them a camera.
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      (player: hz.Player) => {
        if (!Npc.playerIsNpc(player)) {
          this.spawnCameraEntity(player);
        }
      }
    );
    // When a web/mobile player leaves the world, reassign their camera to the server player.
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitWorld,
      (player: hz.Player) => {
        // console.log.*$
        this.despawnCameraEntity(player);
      }
    );
  }

  spawnCameraEntity(player: hz.Player): void {
    if (this.props.playerCameraEntity) {
      const cameraEntity = this.world
        .spawnAsset(
          this.props.playerCameraEntity,
          new hz.Vec3(-100, -100, -100),
          new hz.Quaternion(0, 0, 0, 1)
        )
        .then((entities) => {
          if (entities.length > 0) {
            this.spawnedAssets.push(entities[0]);
            // console.log.*$
            entities[0].owner.set(player);
          }
        });
    }
  }

  despawnCameraEntity(player: hz.Player): void {
    let index = -1;

    this.spawnedAssets.forEach((entity, idx) => {
      if (entity.owner.get() === player) {
        // console.log.*$
        index = idx;
        this.world.deleteAsset(entity);
      }
    });
    if (index != -1) {
      this.spawnedAssets.splice(index, 1);
      // console.log.*$
    } else {
      console.warn("No camera entity found for player to despawn");
    }
  }
}
hz.Component.register(PlayerCameraManager);
