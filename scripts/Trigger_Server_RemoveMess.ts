import { AnalyticsManager } from "AnalyticsManager";
import { CustomAnalyticsEvents, PlayerRoles } from "Enums_Game";
import * as hz from "horizon/core";
import {
  AudioGizmo,
  CodeBlockEvents,
  PropTypes,
  Component,
} from "horizon/core";
import { Npc } from "horizon/npc";
import { PlayerSwitchedRoleEvent } from "Manager_Events";
import {
  hapticsManager,
  playerManager,
  tableManager,
  trainingManager,
  utilityManager,
} from "Managers_Instance";

export default class Trigger_Server_RemoveMess extends Component<
  typeof Trigger_Server_RemoveMess
> {
  static propsDefinition = {
    messEntity: { type: PropTypes.Entity },
    cleaningAudio: { type: PropTypes.Entity },
  };

  public tableId: string = "0";
  private messCleaningAudio: AudioGizmo | null = null;

  private isMessVisible: boolean = false;
  private isButtonPressed: boolean = false;
  preStart(): void {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.onPlayerEnterTrigger.bind(this)
    );

    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, () => {
      this.handleTrigger();
    });

    this.messCleaningAudio = this.props.cleaningAudio?.as(AudioGizmo) ?? null;
  }

  start() {
    this.handleTrigger();
  }

  enableMessOnTable(tableId: string) {
    this.tableId = tableId;
    if (this.props.messEntity) {
      this.props.messEntity.visible.set(true);
      this.isMessVisible = true;
      this.handleTrigger();
    }
  }

  handleTrigger() {
    let players: hz.Player[] = [];
    if (this.isMessVisible) {
      players = playerManager?.getRolePlayers(PlayerRoles.Server) ?? [];
    }

    this.entity.as(hz.TriggerGizmo).setWhoCanTrigger(players);
  }

  async onPlayerEnterTrigger(player: hz.Player) {
    // Fast‑fail non‑Servers without taking the guard
    if (playerManager?.getPlayerRecord(player)?.role !== PlayerRoles.Server)
      return;

    if (this.isButtonPressed) return;
    this.isButtonPressed = true;
    // console.log.*$
    //   `[RemoveMessTrigger] Player ${player.id}  at table ${this.tableId} entity ${this.entity.id}`
    // );
    const trigger = this.entity.as(hz.TriggerGizmo);
    try {
      // Hard‑disable during processing
      trigger.enabled.set(false);

      this.messCleaningAudio?.play();

      tableManager?.onTableMessCleaned(this.tableId, player);

      // Hide mess and remove eligibility immediately
      this.props.messEntity?.visible.set(false);
      this.isMessVisible = false;
      trigger.setWhoCanTrigger([]); // or keep disabled

      await utilityManager?.sleep(1);
      playerManager?.addServerAction(player);
    } finally {
      // Re‑enable only if mess is visible again
      if (this.isMessVisible) {
        this.handleTrigger();
        trigger.enabled.set(true);
      } else {
        trigger.enabled.set(true); // keep enabled but with empty allowlist
      }
      this.isButtonPressed = false;
      if (!Npc.playerIsNpc(player)) {
        AnalyticsManager.s_instance.sendServerCleanTable(player, this.tableId);
      }
    }
  }
  cleanTable() {
    if (this.props.messEntity) {
      this.props.messEntity.visible.set(false);
      this.isMessVisible = false;
      const trigger = this.entity.as(hz.TriggerGizmo);
      trigger.setWhoCanTrigger([]); // or keep disabled
    }
    // tableManager?.onTableMessCleaned(this.tableId);

  }
}
Component.register(Trigger_Server_RemoveMess);
