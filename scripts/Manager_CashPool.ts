import * as hz from 'horizon/core';
import { CashPoolUpdatedEvent } from 'Manager_Events';
import { mainArenaManager, playerManager } from 'Managers_Instance';
import UI_CashPool from 'UI_CashPool';
import UI_ParlourSessionScore from 'UI_ParlourSessionScore';

export default class Manager_CashPool extends hz.Component<typeof Manager_CashPool> {
  static propsDefinition = {
    
    cashBlock: { type: hz.PropTypes.Asset, required: true },
    staticCashBlock: { type: hz.PropTypes.Asset, required: true },
    cashSpawnPoint: { type: hz.PropTypes.Entity, required: true },

    SessionScoreUI: { type: hz.PropTypes.Entity },

    cashBlockValue: { type: hz.PropTypes.Number, default: 10 },
  };

  private sessionScoreUI: UI_ParlourSessionScore | null = null;
  private cashBlocksInPool: hz.Entity[] = [];

  private cashAmount: number = 0;

  start() {
    this.sessionScoreUI = this.props.SessionScoreUI?.getComponents(UI_ParlourSessionScore)[0] ?? null;
    if (!this.sessionScoreUI) {
      console.warn("SessionScoreUI prop not set or missing UI_ParlourSessionScore component.");
    }

    // this.spawnCash(100);
  }

  spawnCash(spawnAmount: number = 1) {
    if (spawnAmount <= 0 || !mainArenaManager?.isParlourOpen()) {
      console.warn("spawnAmount must be greater than 0.");
      return;
    }
    if (!this.props.cashBlock || !this.props.cashSpawnPoint) {
      console.error("Cash block asset or spawn point is not defined.");
      return;
    }

    this.cashAmount += spawnAmount;

    const spawnCount = spawnAmount / this.props.cashBlockValue; // Assuming each cash block is worth 10 units
    for (let i = 0; i < spawnCount; i++) {
      this.spawnSingleCash();
    }

    this.updateCashPoolUI();
  }

  private async spawnSingleCash() {
    if (!this.props.cashBlock || !this.props.cashSpawnPoint) {
      console.error("Cash block asset or spawn point is not defined.");
      return;
    }

    // find random position inside the spawn point's bounding box
    const spawnPos = this.props.cashSpawnPoint.position.get();
    const scale = this.props.cashSpawnPoint.scale.get();

    const randomOffset = new hz.Vec3(
      (Math.random() - 0.5) * scale.x,
      (Math.random() - 0.5) * scale.y,
      (Math.random() - 0.5) * scale.z
    );

    const finalPos = spawnPos.add(randomOffset);

    // set random rotation for the cash block
    const randomYRotation = Math.random() * 360;
    const yAxis = new hz.Vec3(0, 1, 0);
    const spawnRot = hz.Quaternion.fromAxisAngle(yAxis, randomYRotation);
    
    this.world.spawnAsset(this.props.cashBlock!, finalPos, spawnRot).then((entity) => {
      const e = entity[0];
      if (!e) {
        console.error("Failed to spawn cash block entity.");
        return;
      }

      // After 3 seconds, replace with static version and disable physics
      this.async.setTimeout(async () => {
        // try reading position/rotation (will throw if entity was deleted)
        const pos = e.position.get();
        const rot = e.rotation.get();

        // spawn static asset at same transform (no physics)
        if (this.props.staticCashBlock) {
          try {
            await this.world.spawnAsset(this.props.staticCashBlock, pos, rot).then((staticEntities) => {
              const staticEntity = staticEntities[0];
              if (staticEntity) {
                this.cashBlocksInPool.push(staticEntity);
              } else {
                console.error("Failed to spawn staticCashBlock entity.");
              }
            });
          } catch (spawnErr) {
            console.error("Failed to spawn staticCashBlock:", spawnErr);
          }
        } else {
          console.warn("staticCashBlock prop not defined; skipping static spawn.");
        }

        // remove original entity
        this.world.deleteAsset(e);
      }, 3000);
      // console.log.*$
    }).catch((error) => {
      console.error("Failed to spawn cash block:", error);
    });
  }

  updateCashPoolUI() {
    this.sendLocalBroadcastEvent(CashPoolUpdatedEvent, {});
  }

  showSessionScoreUI() {
    this.sessionScoreUI?.showUI();
  }

  getAmountInCashPool(): number {
    return this.cashAmount;
  }

  onParlourOpened() {
    this.cashAmount = 0;
    this.updateCashPoolUI();
    // console.log.*$
  }

  onParlourClosed() {
    // Clear all cash blocks in the pool
    this.cashBlocksInPool.forEach((entity) => {
      this.world.deleteAsset(entity);
    });

    this.cashBlocksInPool = [];
    this.updateCashPoolUI();
    this.showSessionScoreUI();
    // console.log.*$
  }
}
hz.Component.register(Manager_CashPool);