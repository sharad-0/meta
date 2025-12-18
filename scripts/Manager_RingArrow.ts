import * as hz from "horizon/core";
import ArrowPointer from "ArrowPointer";
import { playerManager } from "Managers_Instance";
import { PlayerJoinedEvent, PlayerLeftEvent } from "Manager_Events";
import { Npc } from "horizon/npc";

export default class Manager_RingArrow extends hz.Component<
  typeof Manager_RingArrow
> {
  static propsDefinition = {
    ringArrows: { type: hz.PropTypes.Asset },
  };

  private ringArrows: Map<hz.Player, ArrowPointer> = new Map();

  start() {
    this.connectLocalBroadcastEvent(PlayerJoinedEvent, ({ player }) => {
      if (!Npc.playerIsNpc(player)) {
        this.onPlayerJoined(player);
      }
    });

    this.connectLocalBroadcastEvent(PlayerLeftEvent, ({ player }) => {
      this.onPlayerLeft(player);
    });
  }

  private onPlayerJoined(player: hz.Player) {
    if (!this.ringArrows.has(player)) {
      this.world
        .spawnAsset(
          this.props.ringArrows!,
          new hz.Vec3(0, 0, 0),
          new hz.Quaternion(0, 0, 0, 1)
        )
        .then((entities) => {
          const arrowEntity = entities[0];
          const arrowComp = arrowEntity.getComponents(ArrowPointer)[0];
          this.ringArrows.set(player, arrowComp);
        });
    }
  }

  private onPlayerLeft(player: hz.Player) {
    const arrowComp = this.ringArrows.get(player);
    if (arrowComp) {
      this.world.deleteAsset(arrowComp.entity);
      this.ringArrows.delete(player);
    }
  }

  playerReachedArena(player: hz.Player) {
    const arrowComp = this.ringArrows.get(player);
    if (arrowComp) {
      arrowComp.disableArrow();
    }
  }

  onParlourOpened(mainDoor: hz.Entity) {
    const players = playerManager?.getCurrentPlayers() ?? [];
    for (const player of players) {
      this.ringArrows.get(player)?.setPointerTarget(mainDoor, player);
    }
  }
}
hz.Component.register(Manager_RingArrow);
