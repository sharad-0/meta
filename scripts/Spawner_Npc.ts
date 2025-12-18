import * as hz from "horizon/core";
import Manager_Order from "Manager_Order";

export default class NpcSpawnerManager extends hz.Component<typeof NpcSpawnerManager> {
  static propsDefinition = {
    asset: { type: hz.PropTypes.Asset },
    spawnArea: { type: hz.PropTypes.Entity },
    spawnInterval: { type: hz.PropTypes.Number, default: 60000 }, // in milliseconds
    maxSpawnedEntities: { type: hz.PropTypes.Number, default: 10 },
  };

  private spawnedEntities: hz.Entity[] = [];
  private spawnDelay: number = 3000; // Default spawn delay in milliseconds

  start() {
    // Check if required props are set
    this.spawnDelay = this.props.spawnInterval; // Default to 3000ms if not set
    if (!this.props.asset! || !this.props.spawnArea!) {
      console.error("Asset or Spawn Area not set");
      return;
    }

    this.async.setInterval(() => {
      this.spawnEntities(1);
    }, this.spawnDelay);

    // this.async.setInterval(() => {
    //   const players = this.world.getPlayers().filter((player) => {
    //     return player.name.get() !== "Customer"; // Skip customers
    //   });

    //   let completedOrdersCount = 1;
    //   let completedOrders = OrderManager.getDeliveredOrders?.() || [];

    //   if (completedOrders.length > 0) {
    //     completedOrdersCount = completedOrders.length / 2;
    //   }

    //   const rateMultiplier = Math.min(8, completedOrdersCount);

    //   // switch (players.length) {
    //   //   case 1:
    //   //     this.spawnDelay = this.props.spawnInterval; // Faster spawn interval for 1 player
    //   //     break;
    //   //   case 2:
    //   //     this.spawnDelay = this.props.spawnInterval / 2; // Even faster for 2 players
    //   //     break;
    //   //   case 3:
    //   //     this.spawnDelay = this.props.spawnInterval / 3; // Fastest for 3 players
    //   //     break;
    //   //   case 4:
    //   //     this.spawnDelay = this.props.spawnInterval / 4; // Fastest for 4 players
    //   //     break;
    //   //   case 5:
    //   //     this.spawnDelay = this.props.spawnInterval / 5; // Fastest for 5 players
    //   //     break;
    //   //   default:
    // this.spawnDelay = this.props.spawnInterval / rateMultiplier; // Fastest for 3 or more players
    //   // break;
    // }, 5000); // Update spawn delay every 5 seconds
  }

  spawnEntities(count: number) {
    this.spawnedEntities = this.spawnedEntities.filter((e) => e.exists());
    if (this.spawnedEntities.length >= this.props.maxSpawnedEntities!) {
      return; // Do not spawn more than the max limit
    }
    this.world
      .spawnAsset(
        this.props.asset!,
        this.getRandomPositionInSpawnArea(),
        this.entity.rotation.get()
      )
      .then((entities) => {
        this.spawnedEntities.push(...entities);
        // console.log.*$
      });
  }

  updateSpawnDelay(delay: number) {
    this.spawnDelay = delay;
  }

  getRandomPositionInSpawnArea(): hz.Vec3 {
    const spawnArea = this.props.spawnArea!.as(hz.PhysicalEntity);
    if (!spawnArea) return this.entity.position.get();

    const bounds = spawnArea.getPhysicsBounds();
    const min = bounds.min();
    const max = bounds.max();

    const x = Math.random() * (max.x - min.x) + min.x;
    const y = Math.random() * (max.y - min.y) + min.y;
    const z = Math.random() * (max.z - min.z) + min.z;

    return new hz.Vec3(x, y, z);
  }

  despawnEnity(entity: hz.Entity) {
    // // console.log.*$
    const index = this.spawnedEntities.indexOf(entity);
    // // console.log.*$
    if (index > -1) {
      // // console.log.*$
      this.spawnedEntities.splice(index, 1);
      // // console.log.*$
    } else {
      console.warn("Entity not found in spawned entities list");
    }
  }
}
hz.Component.register(NpcSpawnerManager);
