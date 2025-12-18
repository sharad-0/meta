import {
  AudioGizmo,
  CodeBlockEvents,
  Component,
  DefaultPopupOptions,
  Player,
  PropTypes,
  TextGizmo,
  Vec3,
} from "horizon/core";
import * as hz from "horizon/core";
import {
  itemPickedFromScooper,
  ParlourClosedEvent,
  PlayerSwitchedRoleEvent,
} from "Manager_Events";
import {
  CustomAnalyticsEvents,
  getEnumKeyFromValue,
  Items,
  NotificationTypes,
  parseItem,
  PlayerRoles,
} from "Enums_Game";
import {
  gameManager,
  hudManager,
  inventoryManager,
  playerAnimations,
  playerManager,
  scooperHandManager,
  trainingManager,
  utilityManager,
} from "Managers_Instance";
import SquarePlateProgress from "Component_CollectorProgressBar";
import { AnalyticsManager } from "AnalyticsManager";
import { Npc } from "horizon/npc";

export default class Trigger_ScooperInteraction extends Component<
  typeof Trigger_ScooperInteraction
> {
  static propsDefinition = {
    itemKey: { type: PropTypes.String, default: "item1" }, // which slot to drain
    progressBar: { type: PropTypes.Entity },
  } as const;

  private triggerGizmo: hz.TriggerGizmo | null = null;
  private textGizmo: TextGizmo | null = null;
  private scoopSound: AudioGizmo | null = null;
  private offInv?: hz.EventSubscription;
  private playersActivatedTriggers: Player[] = [];

  start(): void {
    this.async.setInterval(() => {
      this.updateProgressBar();
    }, 1000); // Update every second

    this.handleTrigger();
  }
  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  preStart(): void {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.onPlayerEnter.bind(this)
    );

    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, () =>
      this.handleTrigger()
    );

    this.connectLocalBroadcastEvent(ParlourClosedEvent, () =>
      this.updateProgressBar()
    );

    this.triggerGizmo = this.entity.as(hz.TriggerGizmo);
    this.updateProgressBar();

    const tag = `Scoop${this.props.itemKey}`;
    this.scoopSound = this.world.getEntitiesWithTags([tag])[0]?.as(AudioGizmo);
  }

  Start() { }

  onDestroy(): void {
    this.offInv?.disconnect();
  }

  // -------------------------------------------------------------------------
  // Trigger handler
  // -------------------------------------------------------------------------
  public onPlayerEnter(player: Player): void {
    if (playerManager?.getRole(player) !== PlayerRoles.Scooper) {
      utilityManager?.ConsoleLogFailure("you arent scooper", player);
      return;
    }
    if (this.playersActivatedTriggers.includes(player)) {
      utilityManager?.ConsoleLogFailure("already in the list", player);
      return;
    }

    if (scooperHandManager?.isHandFull(player)) {
      hudManager?.showPopupNotifToPlayer(
        NotificationTypes.PlaceItemFirst,
        player,
        2
      );
      return;
    }

    this.playersActivatedTriggers.push(player);
    const item = parseItem(this.props.itemKey) ?? Items.Cone;

    const remaining = inventoryManager?.getRemaining(item) ?? 0;
    const maxCapacity = inventoryManager?.getMaxCapacity(item) ?? 0;

    // const stringToDisplay =
    //   this.props.itemKey == Items.Cone
    //     ? "Picking up cone"
    //     : `Scooping ${getEnumKeyFromValue(item)}`;

    try {
      let popupOptions = {
        ...DefaultPopupOptions,
        position: new Vec3(0, 0.3, 0),
        fontSize: 2.2,
        backgroundColor: hz.Color.fromHex("#5ef55e"),
      };

      if (maxCapacity - remaining > 0) {
        playerAnimations?.playScooperPickAnim(player, 3);
        scooperHandManager?.addItem(player, this.props.itemKey as Items);
        this.updateProgressBar();
        this.handleTrigger();
        AnalyticsManager?.s_instance.sendScooperPickup(player, item);

        // Play the scoop sound
        if (this.scoopSound) {
          this.scoopSound.play();
        } else {
          console.warn(
            "Scoop sound entity does not have an AudioGizmo component."
          );
        }
        // this.sendLocalBroadcastEvent(itemPickedFromScooper, { player });
        // if (gameManager?.isThisTrainingSession()) {
        //   this.checkForFTUETrigger(player);
        // }
      } else {
        // if (gameManager?.isThisTrainingSession()) {
        //   this.checkFTUEFailureTrigger(player);
        // } else {
        // this.world.ui.showPopupForPlayer(
        //   player,
        //   `No more ${getEnumKeyFromValue(item)} to scoop.`,
        //   3,
        //   popupOptions
        // );
        hudManager?.showPopupNotifToPlayer(
          NotificationTypes.outOfStock,
          player,
          3
        );
      }
      this.async.setTimeout(() => {
        this.playersActivatedTriggers = this.playersActivatedTriggers.filter(
          (p) => p !== player
        );
      }, 2000); // 2 second delay before the player can trigger again
    } catch (err) {
      // console.log.*$
    }
  }

  updateProgressBar() {
    const item = parseItem(this.props.itemKey) ?? Items.Cone;
    const remaining = inventoryManager?.getRemaining(item) ?? 0;
    const maxCapacity = inventoryManager?.getMaxCapacity(item) ?? 0;

    const progressBar =
      this.props.progressBar?.getComponents(SquarePlateProgress)[0];
    progressBar?.emptyProgress((maxCapacity - remaining) / maxCapacity);
  }

  handleTrigger(): void {
    let scoopers: Player[] = [];
    const item = parseItem(this.props.itemKey) ?? Items.Cone;

    scoopers = playerManager?.getRolePlayers(PlayerRoles.Scooper) ?? [];
    if (item === Items.Cone) {
      scoopers.filter((p) => p.isValidReference && !Npc.playerIsNpc(p) && p.deviceType.get() === hz.PlayerDeviceType.VR);
    }

    this.triggerGizmo?.setWhoCanTrigger(scoopers);

    // console.log.*$
    //   `Scooper Trigger for ${this.props.itemKey} set to ${scoopers.length} players`
    // );
  }

  public overrideTriggerForPlayer(player: hz.Player) {
    this.triggerGizmo?.setWhoCanTrigger([player]);
  }

  checkForFTUETrigger(player: hz.Player) {
    switch (this.props.itemKey) {
      case Items.Cone:
        trainingManager?.triggerNextFTUETask(player, 1, "Success");
        break;
      case Items.Vanilla:
        trainingManager?.triggerNextFTUETask(player, 3, "Success");
        break;
    }
  }

  checkFTUEFailureTrigger(player: hz.Player) {
    // if (this.props.itemKey === Items.Strawberry) {
    //   trainingManager?.triggerNextFTUETask(player, 5, "Failure");
    //   trainingManager?.triggerNextFTUEPrompt(player, 2);
    // }
  }
}

Component.register(Trigger_ScooperInteraction);
