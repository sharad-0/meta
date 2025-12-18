import { EntryTypes, NotificationTypes, PlayerRoles, Role } from "Enums_Game";
import {
  AttachableEntity,
  AttachablePlayerAnchor,
  AudioGizmo,
  CodeBlockEvents,
  Component,
  Entity,
  ParticleGizmo,
  Player,
  PropTypes,
  Quaternion,
  SpawnPointGizmo,
} from "horizon/core";
import {
  playerManager,
  hudManager,
  serverManager,
  bagManager,
  scooperHandManager,
  trainingManager,
  gameManager,
  objectPoolManager,
  propsManager,
  hapticsManager,
  vacuumController,
} from "Managers_Instance";
import { Color, Vec3 } from "horizon/core";
import { ROLE_MAX_PLAYERS } from "Constants_SwitchRoleConfig";
import { PlayerCameraEvents } from "PlayerCamera";
import { CameraMode } from "horizon/camera";
import { Npc } from "horizon/npc";

export default class Trigger_SwitchRoleAuto extends Component<
  typeof Trigger_SwitchRoleAuto
> {
  static propsDefinition = {
    /** Role this trigger assigns */
    targetRole: { type: PropTypes.String as any, required: true }, // "Fetcher", "Scooper", "Server", "Cashier"
    spawnPoint: { type: PropTypes.Entity, required: false }, // optional spawn point
    roleSwitchAudio: { type: PropTypes.Entity, required: false },
    particleFx: { type: PropTypes.Entity, required: false },
  };

  private PlayerProps: Map<Player, Entity> = new Map();

  private isRoleFull(roleId: Role): boolean {
    const current =
      playerManager?.getRolePlayers(roleId as PlayerRoles, false).length ?? 0;
    const limit =
      ROLE_MAX_PLAYERS[roleId as keyof typeof ROLE_MAX_PLAYERS] ?? 0;
    return current >= limit;
  }

  /** Core role switching (adapted from UI_SwitchRole.selectRole) */
  private selectRole(player: Player, role: Role): void {
    if (this.isRoleFull(role) || playerManager?.getRole(player) === role)
      return;

    // Play role switch audio
    this.props.roleSwitchAudio?.as(AudioGizmo)?.play();

    this.updateRole(player, PlayerRoles[role as keyof typeof PlayerRoles]);
    this.showRoleSelectionPopup(player, role);
    this.props.particleFx?.as(ParticleGizmo).play();
    hudManager?.refreshHUD();

    // this.async.setTimeout(() => {
    //   const ftueData = playerManager?.getFTUEData(player);
    //   if (!ftueData) return;
    //   const entryType = this.getEntryType(
    //     PlayerRoles[role as keyof typeof PlayerRoles]
    //   );
    //   if (ftueData[entryType] === false) {
    //     hudManager?.showFTUEUiToPlayer(player, entryType);
    //   }
    // }, 200);
    // Teleport if spawn point provided
    // if (this.props.spawnPoint) {
    //   this.props.spawnPoint.as(SpawnPointGizmo)?.teleportPlayer(player);
    // }
  }

  getEntryType(role: PlayerRoles): EntryTypes {
    switch (role) {
      case PlayerRoles.Fetcher:
        return EntryTypes.fetcher;
      case PlayerRoles.Scooper:
        return EntryTypes.scooper;
      case PlayerRoles.Server:
        return EntryTypes.server;
      default:
        return EntryTypes.main;
    }
  }
  /** Same updateRole logic from UI_SwitchRole */
  private updateRole(player: Player, role: PlayerRoles): void {
    const currRole = playerManager?.getRole(player);
    propsManager?.attachRoleProps(player, PlayerRoles[role], currRole!);

    switch (currRole) {
      case PlayerRoles.Scooper:
        scooperHandManager?.destroyItemAsset(player);
        break;
      case PlayerRoles.Server:
        // serverManager?.resetConePosition(player);
        serverManager?.onPlayerExitWorld(player, true); // Reset any server-specific state
        break;
      case PlayerRoles.Fetcher:
        bagManager?.dumpAllItems(player);
        break;
    }
    hapticsManager?.playStrongRumble(player);
    playerManager?.setRole(player, role);
    // this.checkAndMarkPromptForFtue(currRole!, role, player);
    // console.log.*$
  }

  private showRoleSelectionPopup(player: Player, role: Role) {
    // this.world.ui.showPopupForPlayer(player, `${role} role selected!`, 3, {
    //   position: new Vec3(0, 0.3, 0),
    //   fontSize: 3.5,
    //   backgroundColor: Color.fromHex("#5ef55e"),
    // });
    if (!Npc.playerIsNpc(player)) {
      vacuumController?.DeactivateFetcherControls(player);
    }
    switch (role) {
      case PlayerRoles.Scooper:
        hudManager?.showPopupNotifToPlayer(
          NotificationTypes.ScooperRoleSelected,
          player,
          3
        );
        break;
      case PlayerRoles.Server:
        hudManager?.showPopupNotifToPlayer(
          NotificationTypes.ServerRoleSelected,
          player,
          3
        );
        break;
      case PlayerRoles.Fetcher:
        if (!Npc.playerIsNpc(player)) {
          vacuumController?.ActivateFetcherControls(player);
        }
        hudManager?.showPopupNotifToPlayer(
          NotificationTypes.FetcherRoleSelected,
          player,
          3
        );
        break;
    }
  }

  // Track per-player timeout handles
  private enterTimeouts = new Map<Player, any>();

  // ... (Your existing code here)

  // ----- HOOK: On Trigger Enter -----
  onPlayerEnter(player: Player) {
    const targetRole = this.props.targetRole as Role;
    const currentRole = playerManager?.getRole(player);
    if (!targetRole) {
      console.warn("Trigger_SwitchRoleAuto: targetRole not set in props!");
      return;
    }

    if (currentRole === targetRole) {
      return;
    }

    if (this.isRoleFull(targetRole)) {
      return;
    }

    // Start timer only if not already pending
    if (this.enterTimeouts.has(player)) return;

    // Inform player they're standing by for role switch
    // this.world.ui.showPopupForPlayer(player, `Switching to ${targetRole}`, 3, {
    //   position: new Vec3(0, 0.3, 0),
    //   fontSize: 2.8,
    //   backgroundColor: Color.fromHex("#e7e743"),
    //   showTimer: false,
    // });
    hudManager?.showPopupNotifToPlayer(
      NotificationTypes.SwitchingRole,
      player,
      3
    );
    this.checkAndMarkTaskForFtue(currentRole!, targetRole!, player);
    // if (this.props.particleEffect) {
    //   this.props.particleEffect.as(ParticleGizmo)?.play();
    // }
    if (this.props.spawnPoint) {
      const playerFace = player.rootRotation.get()!;
      this.props.spawnPoint.rotation.set(playerFace);
    }

    let timer = 700;
    if (gameManager?.isThisTrainingSession()) {
      timer = 1500; // Faster role switch in training
    }
    const timeout = this.async.setTimeout(() => {
      this.enterTimeouts.delete(player); // Important: cleanup
      // Recheck role (in case it changed in the meantime)
      if (playerManager?.getRole(player) !== targetRole) {
        this.selectRole(player, targetRole);
      }
      // if (this.props.particleEffect) {
      //   this.props.particleEffect.as(ParticleGizmo)?.stop();
      // }
    }, timer);

    this.enterTimeouts.set(player, timeout);
  }

  // ----- HOOK: On Trigger Exit -----
  onPlayerExit(player: Player) {
    // Cancel timer if running
    const timeout = this.enterTimeouts.get(player);
    if (timeout !== undefined) {
      this.async.clearTimeout(timeout);
      this.enterTimeouts.delete(player);
      // this.world.ui.showPopupForPlayer(player, "Role switch canceled", 2, {
      //   position: new Vec3(0, 0.3, 0),
      //   fontSize: 2.8,
      //   backgroundColor: Color.fromHex("#f56d6d"),
      // });
      hudManager?.showPopupNotifToPlayer(
        NotificationTypes.RoleSwitchingCancelled,
        player,
        2
      );
    }
  }

  start() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.onPlayerEnter.bind(this)
    );

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitTrigger,
      this.onPlayerExit.bind(this)
    );
  }

  checkAndMarkTaskForFtue(
    currentRole: PlayerRoles,
    targetRole: Role,
    player: Player
  ) {
    const ftueMappings = [
      {
        current: PlayerRoles.Scooper,
        target: PlayerRoles.Server,
        taskId: 5,
      },
      {
        current: PlayerRoles.Unknown,
        target: PlayerRoles.Server,
        taskId: 1,
      },
      {
        current: PlayerRoles.Server,
        target: PlayerRoles.Fetcher,
        taskId: 2,
      },
      {
        current: PlayerRoles.Fetcher,
        target: PlayerRoles.Scooper,
        taskId: 3,
      },
    ];

    if (gameManager?.isThisTrainingSession()) {
      for (const { current, target, taskId } of ftueMappings) {
        if (currentRole === current && targetRole === target) {
          // console.log.*$
          trainingManager?.triggerNextFTUETask(player, taskId, "Success");
          break;
        }
      }
    }
  }

  checkAndMarkPromptForFtue(
    currentRole: PlayerRoles,
    targetRole: PlayerRoles,
    player: Player
  ) {
    const ftueMappings = [
      {
        current: PlayerRoles.Scooper,
        target: PlayerRoles.Server,
        promptId: 3,
      },
      {
        current: PlayerRoles.Unknown,
        target: PlayerRoles.Server,
        promptId: 1,
      },
      {
        current: PlayerRoles.Server,
        target: PlayerRoles.Fetcher,
        promptId: 1,
      },
      {
        current: PlayerRoles.Fetcher,
        target: PlayerRoles.Scooper,
        promptId: 1,
      },
    ];

    if (gameManager?.isThisTrainingSession()) {
      for (const { current, target, promptId } of ftueMappings) {
        if (currentRole === current && targetRole === target) {
          trainingManager?.triggerNextFTUEPrompt(player, promptId);
          break;
        }
      }
    }
  }

  // markServerTaskSuccess(player: Player) {
  //   trainingManager?.triggerNextFTUETask(player, 1, "Success");
  // }
}

Component.register(Trigger_SwitchRoleAuto);
