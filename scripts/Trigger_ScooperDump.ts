import { AnalyticsManager } from "AnalyticsManager";
import Component_IceCreamCone from "Component_IceCreamCone";
import { CustomAnalyticsEvents, PlayerRoles } from "Enums_Game";
import {
  AudioGizmo,
  CodeBlockEvents,
  Component,
  Entity,
  Player,
  PlayerVisibilityMode,
  PropTypes,
  TriggerGizmo,
} from "horizon/core";
import { Npc } from "horizon/npc";
import {
  AssetBundleGizmo,
  AssetBundleInstanceReference,
} from "horizon/unity_asset_bundles";
import {
  addPlayersToUseTrash,
  onPlayerTrashedItem,
  PlayerJoinedEvent,
  removePlayersFromUseTrash,
} from "Manager_Events";
import {
  bagManager,
  playerManager,
  scooperHandManager,
  scooperManager,
  serverManager,
} from "Managers_Instance";

export default class ScooperDump extends Component<typeof ScooperDump> {
  static propsDefinition = {
    trashBinAsset: { type: PropTypes.Entity, required: true },
  };

  private triggerGizmo: TriggerGizmo | null = null;
  private dumpAudio: AudioGizmo | null = null;
  private playersToUseTrashCan: Set<Player> = new Set();

  preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.OnPlayerEnterTrigger.bind(this)
    );

    this.connectLocalBroadcastEvent(PlayerJoinedEvent, () =>
      this.handleTrashCanCollision()
    );
    this.connectLocalBroadcastEvent(addPlayersToUseTrash, ({ player }) => {
      this.playersToUseTrashCan.add(player);
      this.handleTrashCanCollision();
    });

    this.connectLocalBroadcastEvent(removePlayersFromUseTrash, ({ player }) => {
      this.playersToUseTrashCan.delete(player);
      this.handleTrashCanCollision();
    });

    const tag = `ScooperDump`;
    this.dumpAudio = this.world.getEntitiesWithTags([tag])[0]?.as(AudioGizmo);
  }

  start() {
    this.triggerGizmo = this.entity?.as(TriggerGizmo);
    this.handleTrashCanCollision();
  }

  OnPlayerEnterTrigger(player: Player) {
    // // console.log.*$

    // Play the dump audio
    if (this.dumpAudio) {
      this.dumpAudio.play();
    } else {
      console.warn("Dump audio entity does not have an AudioGizmo component.");
    }
    if (playerManager?.getRole(player) === PlayerRoles.Scooper) {
      this.animateAsset();
      scooperHandManager
        ?.getEntityInHand(player)
        ?.getComponents(Component_IceCreamCone)[0]
        ?.resetCone();
      scooperHandManager?.emptyHand(player, true);

      this.sendLocalBroadcastEvent(onPlayerTrashedItem, {
        player: player,
      });

      if (!Npc.playerIsNpc(player)) {
        AnalyticsManager.s_instance.sendScooperTrash(player);
      }
    }

    if (playerManager?.getRole(player) === PlayerRoles.Fetcher) {
      this.animateAsset();
      bagManager?.dumpAllItems(player);
      if (!Npc.playerIsNpc(player)) {
        AnalyticsManager.s_instance.sendFetcherTrash(player);
      }
    }

    if (playerManager?.getRole(player) === PlayerRoles.Server) {
      if (serverManager?.getConeForPlayer(player)) {
        this.animateAsset();
        serverManager?.onPlayerTrashedCone(player);
        if (!Npc.playerIsNpc(player)) {
          AnalyticsManager.s_instance.sendServerTrash(player);
        }
      }
    }
  }

  handleTrashCanCollision() {
    if (!this.triggerGizmo) {
      return;
    }

    this.triggerGizmo.setWhoCanTrigger(Array.from(this.playersToUseTrashCan));
    // console.log.*$
    //   "Trash can collision handled for players:",
    //   Array.from(this.playersToUseTrashCan)
    // );
  }

  animateAsset() {
    // Get the AssetBundleGizmo from this entity.
    const assetBundle = this.props.trashBinAsset!.as(AssetBundleGizmo);
    // Get the root instance to control animation parameters.
    const assetRoot = assetBundle?.getRoot();
    // console.log.*$
    //   `animation parameters ${JSON.stringify(
    //     assetRoot.getAnimationParameters()
    //   )}`
    // );

    this.startAnimation(assetRoot);
    this.async.setTimeout(() => {
      this.stopAnimation(assetRoot);
    }, 2000);
  }

  startAnimation(assetRoot: AssetBundleInstanceReference) {
    if (assetRoot) {
      assetRoot.setAnimationParameterBool("trash_bin", true);
    }
  }
  stopAnimation(assetRoot: AssetBundleInstanceReference) {
    if (assetRoot) {
      assetRoot.setAnimationParameterBool("trash_bin", false);
    }
  }
}
Component.register(ScooperDump);
