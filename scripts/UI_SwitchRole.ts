import {
  AudioGizmoTags,
  Items,
  NotificationTypes,
  PlayerRoles,
  Role,
  toPlayerRole,
} from "Enums_Game";
import {
  Asset,
  AttachableEntity,
  AttachablePlayerAnchor,
  AudioGizmo,
  AvatarGripPose,
  Color,
  Component,
  DefaultPopupOptions,
  Entity,
  Player,
  PropTypes,
  Quaternion,
  SpawnPointGizmo,
  Vec3,
} from "horizon/core";
import {
  Binding,
  ColorValue,
  Image,
  ImageSource,
  Pressable,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import {
  ButtonStates,
  ROLE_CONFIG,
  ROLE_MAX_PLAYERS,
  RoleEntry,
} from "Constants_SwitchRoleConfig";
import { playersOnTrigger } from "Trigger_SwitchRole";
import {
  objectPoolManager,
  orderManager,
  playerManager,
  propsManager,
  scooperHandManager,
  scooperManager,
  serverManager,
  trainingManager,
} from "Managers_Instance";
import { bagManager, hudManager } from "Managers_Instance";
import {
  PlayerJoinedEvent,
  PlayerSwitchedRoleEvent,
  RoleSwitched,
  spawnPointReady,
} from "Manager_Events";

export default class UI_SwitchRole extends UIComponent<typeof UI_SwitchRole> {
  static propsDefinition = {
    imageBackground: { type: PropTypes.Asset },
    fetcherRoleIcon: { type: PropTypes.Asset },
    cashierRoleIcon: { type: PropTypes.Asset },
    serverRoleIcon: { type: PropTypes.Asset },
    scooperRoleIcon: { type: PropTypes.Asset },
    roleCountIcon: { type: PropTypes.Asset, required: true },
  };

  /** Quick lookup: roleId → Asset */
  private assetMap: Map<Role, Asset> = new Map();
  private fetcherRoleTextBinding: Binding<ColorValue> = new Binding<ColorValue>(
    ButtonStates.DEFAULT.roleTextColor
  );
  private scooperRoleTextBinding: Binding<ColorValue> = new Binding<ColorValue>(
    ButtonStates.DEFAULT.roleTextColor
  );
  private serverRoleTextBinding: Binding<ColorValue> = new Binding<ColorValue>(
    ButtonStates.DEFAULT.roleTextColor
  );
  private cashierRoleTextBinding: Binding<ColorValue> = new Binding<ColorValue>(
    ButtonStates.DEFAULT.roleTextColor
  );

  private fetcherImageOpacityBinding: Binding<number> = new Binding<number>(
    ButtonStates.DEFAULT.imageOpacity
  );
  private scooperImageOpacityBinding: Binding<number> = new Binding<number>(
    ButtonStates.DEFAULT.imageOpacity
  );
  private serverImageOpacityBinding: Binding<number> = new Binding<number>(
    ButtonStates.DEFAULT.imageOpacity
  );
  private cashierImageOpacityBinding: Binding<number> = new Binding<number>(
    ButtonStates.DEFAULT.imageOpacity
  );

  private fetcherButtonImageColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.buttonImageColor);
  private scooperButtonImageColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.buttonImageColor);
  private serverButtonImageColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.buttonImageColor);
  private cashierButtonImageColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.buttonImageColor);

  private fetcherBtnTextColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.btnTextColor);
  private scooperBtnTextColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.btnTextColor);
  private serverBtnTextColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.btnTextColor);
  private cashierBtnTextColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.btnTextColor);

  private fetcherBtnTextBinding: Binding<string> = new Binding<string>(
    ButtonStates.DEFAULT.btnText
  );
  private scooperBtnTextBinding: Binding<string> = new Binding<string>(
    ButtonStates.DEFAULT.btnText
  );
  private serverBtnTextBinding: Binding<string> = new Binding<string>(
    ButtonStates.DEFAULT.btnText
  );
  private cashierBtnTextBinding: Binding<string> = new Binding<string>(
    ButtonStates.DEFAULT.btnText
  );

  private fetcherCardBgColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.cardBgColor);
  private scooperCardBgColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.cardBgColor);
  private serverCardBgColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.cardBgColor);
  private cashierCardBgColorBinding: Binding<ColorValue> =
    new Binding<ColorValue>(ButtonStates.DEFAULT.cardBgColor);

  private fetcherRoleCountBinding: Binding<string> = new Binding<string>("");
  private scooperRoleCountBinding: Binding<string> = new Binding<string>("");
  private serverRoleCountBinding: Binding<string> = new Binding<string>("");
  private cashierRoleCountBinding: Binding<string> = new Binding<string>("");

  private btn1ScaleBinding = new Binding<number>(1);
  private btn2ScaleBinding = new Binding<number>(1);
  private btn3ScaleBinding = new Binding<number>(1);
  // ───────────────────────────────────────────────────────────────────────────
  private readonly bindings: Record<
    Role,
    {
      roleText: Binding<ColorValue>;
      imageOp: Binding<number>;
      btnBg: Binding<ColorValue>;
      btnLabel: Binding<string>;
      btnLabelCl: Binding<ColorValue>;
      cardBg: Binding<ColorValue>;
      count: Binding<string>;
    }
  > = {
    Fetcher: {
      roleText: this.fetcherRoleTextBinding,
      imageOp: this.fetcherImageOpacityBinding,
      btnBg: this.fetcherButtonImageColorBinding,
      btnLabel: this.fetcherBtnTextBinding,
      btnLabelCl: this.fetcherBtnTextColorBinding,
      cardBg: this.fetcherCardBgColorBinding,
      count: this.fetcherRoleCountBinding,
    },
    Scooper: {
      roleText: this.scooperRoleTextBinding,
      imageOp: this.scooperImageOpacityBinding,
      btnBg: this.scooperButtonImageColorBinding,
      btnLabel: this.scooperBtnTextBinding,
      btnLabelCl: this.scooperBtnTextColorBinding,
      cardBg: this.scooperCardBgColorBinding,
      count: this.scooperRoleCountBinding,
    },
    Server: {
      roleText: this.serverRoleTextBinding,
      imageOp: this.serverImageOpacityBinding,
      btnBg: this.serverButtonImageColorBinding,
      btnLabel: this.serverBtnTextBinding,
      btnLabelCl: this.serverBtnTextColorBinding,
      cardBg: this.serverCardBgColorBinding,
      count: this.serverRoleCountBinding,
    },
  };

  private fetcherSpawnPoint?: Entity;
  private serverSpawnPoint?: Entity;
  private scooperSpawnPoint?: Entity;
  // ───────────────────────────────────────────────────────────────────────────

  start() {
    this.connectLocalBroadcastEvent(spawnPointReady, (data) => {
      this.registerSpawnPoints(data.spawnPointEntity, data.spawnPointType);
    });
    this.refreshUI();
    this.connectLocalBroadcastEvent(PlayerJoinedEvent, () => this.refreshUI());
    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, () =>
      this.refreshUI()
    );
  }

  initializeUI(): UINode {
    this.populateAssetMap();

    // Full-screen overlay with header image and role buttons
    return View({
      style: {
        position: "absolute",
        backgroundColor: "rgba(0, 0, 0, 0.9)", // overlay
        height: "100%",
        width: "100%",
        zIndex: 50,
        alignItems: "center",
        justifyContent: "flex-start",
        flexDirection: "column",
      },
      children: [
        // Header image (contains "CHOOSE YOUR ROLE" text)
        Image({
          source: ImageSource.fromTextureAsset(this.props.imageBackground!),
          style: {
            marginTop: "3%",
            width: "30%",
            height: "18%",
            borderRadius: 24,
          },
        }),

        // Role cards row
        View({
          children: [this.roleButtons()],
          style: {
            // backgroundColor: "rgba(8, 33, 88, 0.5)", // semi-transparent background
            marginTop: "3%",
            width: "75%",
            height: "60%",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
          },
        }),
      ],
    });
  }

  private roleButtons(): UINode {
    return View({
      children: ROLE_CONFIG.map((entry) => this.roleCard(entry)),
      style: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        width: "100%",
        height: "100%",
      },
    });
  }

  private roleCard(entry: RoleEntry): UINode {
    const {
      imageOp: roleImageOpacity,
      btnBg: buttonImageColor,
      cardBg: roleCardBgColor,
      count: roleCountText,
    } = this.bindings[entry.id];

    const icon = this.assetMap.get(entry.id)! as Asset;

    return View({
      style: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "30%",
        height: "100%",
        paddingTop: 6,
        left: 0,
        transform: [{ scale: this.getBindingScaleBinding(entry) }],
      },
      children: [
        // Card container
        View({
          style: {
            width: "100%",
            height: "100%",
            borderRadius: 18,
            // backgroundColor: "rgba(16, 218, 66, 0.1)", // was a light/white color
            alignItems: "center",
            justifyContent: "center",
          },
          children: [
            Pressable({
              onClick: (p: Player) => {
                this.setBtnScaleBinding(entry.id, 0.95);
                this.async.setTimeout(() => {
                  this.setBtnScaleBinding(entry.id, 1);
                  this.handleRoleClick(p, entry.id);
                }, 200);
              },
              style: {
                width: "100%",
                height: "100%",
              },
              children: [
                Image({
                  source: ImageSource.fromTextureAsset(icon),
                  style: {
                    position: "absolute",
                    width: "100%",
                    aspectRatio: 406 / 488,
                    opacity: roleImageOpacity,
                  },
                }),
              ],
            }),
          ],
        }),

        this.roleCountBadge(roleCountText),
      ],
    });
  }

  roleCountBadge(roleCountText: Binding<string>): UINode {
    return View({
      style: {
        position: "absolute",
        top: 15,
        right: 15,
        width: "32%",
        height: "12%",
        alignItems: "center",
        justifyContent: "space-evenly",
        flexDirection: "row",
        // backgroundColor: "rgba(57, 59, 59, 0.5)",
        padding: 4,
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(this.props.roleCountIcon!),
          style: {
            aspectRatio: 1,
            height: "60%",
            justifyContent: "flex-start",
            marginLeft: "2%",
          },
        }),
        Text({
          text: roleCountText,
          style: {
            fontSize: 30,
            fontWeight: "bold",
            color: "#ffffffff",
            fontFamily: "Roboto",
            textAlign: "center",
            textAlignVertical: "center",
          },
        }),
      ],
    });
  }

  private isRoleFull(roleId: Role): boolean {
    const current =
      playerManager?.getRolePlayers(roleId as PlayerRoles, false).length ?? 0;
    const limit = ROLE_MAX_PLAYERS[roleId];
    // // console.log.*$
    return current >= limit;
  }

  /** Called when a player selects a role (and the role is NOT full). */
  public selectRole(player: Player, role: Role): void {
    const currentRole = playerManager?.getRole(player);

    if (this.isRoleFull(role as Role) || currentRole === role) return;
    this.world
      .getEntitiesWithTags([AudioGizmoTags.RoleSwitch])[0]!
      .as(AudioGizmo)!
      .play(); // play role switch sound
    this.world
      .getEntitiesWithTags([AudioGizmoTags.RoleSwitch])[1]!
      .as(AudioGizmo)!
      .play();
    // this.props.roleSwitchAudio!.as(AudioGizmo).play(); // play role switch sound
    this.updateRole(player, role as PlayerRoles);
    this.showRoleSelectionPopup(player, role);

    propsManager?.attachRoleProps(player, PlayerRoles[role], currentRole!);
    hudManager?.refreshHUD();

    this.sendLocalBroadcastEvent(PlayerSwitchedRoleEvent, {
      player,
      newRole: PlayerRoles[role],
    });

    switch (role) {
      case PlayerRoles.Fetcher:
        this.fetcherSpawnPoint!.as(SpawnPointGizmo).teleportPlayer(player);
        break;
      case PlayerRoles.Scooper:
        this.scooperSpawnPoint!.as(SpawnPointGizmo).teleportPlayer(player);
        break;
      case PlayerRoles.Server:
        this.serverSpawnPoint!.as(SpawnPointGizmo).teleportPlayer(player);
        break;
      default:
        console.warn(`Unknown role: ${role}`);
        return;
    }
    const timer = this.async.setTimeout(() => {
      this.sendNetworkBroadcastEvent(RoleSwitched, { player });
      this.async.clearTimeout(timer);
    }, 1000);
  }

  private showRoleSelectionPopup(player: Player, role: Role) {
    let popupOptions = {
      ...DefaultPopupOptions,
      position: new Vec3(0, 0.3, 0),
      fontSize: 3.5,
      backgroundColor: Color.fromHex("#5ef55e"),
    };
    // this.world.ui.showPopupForPlayer(
    //   player,
    //   `${role} role selected!`,
    //   3,
    //   popupOptions
    // );

    switch (role) {
      case "Fetcher":
        hudManager?.showPopupNotifToPlayer(
          NotificationTypes.FetcherRoleSelected,
          player,
          3,
          role
        );
        break;
      case "Scooper":
        hudManager?.showPopupNotifToPlayer(
          NotificationTypes.ScooperRoleSelected,
          player,
          3,
          role
        );
        break;
      case "Server":
        hudManager?.showPopupNotifToPlayer(
          NotificationTypes.ServerRoleSelected,
          player,
          3,
          role
        );
        break;
      default:
        console.warn(`Unknown role for popup: ${role}`);
    }
  }

  /** Handles the UX logic: regular pick *or* swap when card shows “Switch”. */
  private handleRoleClick(player: Player, targetRole: Role): void {
    // console.log.*$
    const trigger = playersOnTrigger ?? [];
    const roleIsFull = this.isRoleFull(targetRole);
    const holder = trigger.find(
      (p) => playerManager?.getRole(p) === targetRole
    ); // player queued to switch
    const isSwitch = roleIsFull && holder && holder !== player;

    /* ───── swap branch ───── */
    if (isSwitch) {
      const myOldRole = playerManager?.getRole(player) as Role | undefined;
      // 1) give clicking player the targetRole
      this.selectRole(player, targetRole);

      // 2) give the previous holder my old role (or clear it if I had none)
      if (myOldRole) {
        this.selectRole(holder!, myOldRole);
      } else {
        // “None” role – clear via direct update
        this.updateRole(holder!, PlayerRoles.Unknown);
      }
      return;
    }

    /* ───── normal pick branch ───── */
    this.selectRole(player, targetRole);
  }

  /** Map role IDs to the icon Assets provided via props. */
  private populateAssetMap(): void {
    if (this.assetMap.size) return; // ensure idempotent

    this.assetMap.set("Fetcher", this.props.fetcherRoleIcon!);
    this.assetMap.set("Scooper", this.props.scooperRoleIcon!);
    this.assetMap.set("Server", this.props.serverRoleIcon!);
  }

  refreshUI(): void {
    const roles = ["Fetcher", "Scooper", "Server"] as Role[];

    roles.forEach((role) => {
      const roleIsFull = this.isRoleFull(role);
      // const holderOnTrigger = trigger.some((p) => playerManager?.getRole(p) === roleId); // ✓
      const b = this.bindings[role];

      playersOnTrigger.forEach((player) => {
        const isMine = playerManager?.getRole(player) === role;

        const state = roleIsFull
          ? ButtonStates.Unavailable
          : ButtonStates.Available;

        b.roleText.set(state.roleTextColor, [player]);
        b.imageOp.set(state.imageOpacity, [player]);
        b.btnBg.set(state.buttonImageColor, [player]);
        b.btnLabel.set(state.btnText, [player]);
        b.btnLabelCl.set(state.btnTextColor, [player]);
        b.cardBg.set(state.cardBgColor, [player]);
      });
      const roleCount =
        playerManager?.getRolePlayers(toPlayerRole(role), false).length ?? 0;
      const roleCountText = `${roleCount}/${ROLE_MAX_PLAYERS[role]}`;
      b.count.set(roleCountText);
    });
  }

  public updateRole(player: Player, role: PlayerRoles): void {
    switch (playerManager?.getRole(player)) {
      case PlayerRoles.Scooper:
        scooperHandManager?.emptyHand(player, true);
        break;
      case PlayerRoles.Server:
        serverManager?.resetConePosition(player);
        break;
      case PlayerRoles.Fetcher:
        bagManager?.dumpAllItems(player); // Clear any items in the bag when switching to Fetcher
    }

    playerManager?.setRole(player, role);
    // console.log.*$
    //   `Player role set ${JSON.stringify(
    //     player.id
    //   )} has been assigned the role: ${role}`
    // );
  }

  setBtnScaleBinding(item: Role, scale: number) {
    switch (item) {
      case PlayerRoles.Fetcher:
        // console.log.*$
        this.btn1ScaleBinding.set(scale);
        break;
      case PlayerRoles.Scooper:
        // console.log.*$
        this.btn2ScaleBinding.set(scale);
        break;
      case PlayerRoles.Server:
        // console.log.*$
        this.btn3ScaleBinding.set(scale);
        break;
      default:
        this.btn1ScaleBinding.set(1);
    }
  }

  getBindingScaleBinding(item: RoleEntry): Binding<number> {
    switch (item.id) {
      case PlayerRoles.Fetcher:
        // console.log.*$
        return this.btn1ScaleBinding;
      case PlayerRoles.Scooper:
        // console.log.*$
        return this.btn2ScaleBinding;
      case PlayerRoles.Server:
        // console.log.*$
        return this.btn3ScaleBinding;
      default:
        return this.btn1ScaleBinding;
    }
  }

  public registerSpawnPoints(entity: Entity, spawnPointType: PlayerRoles) {
    switch (spawnPointType) {
      case PlayerRoles.Fetcher:
        this.fetcherSpawnPoint = entity;
        break;
      case PlayerRoles.Server:
        this.serverSpawnPoint = entity;
        break;
      case PlayerRoles.Scooper:
        this.scooperSpawnPoint = entity;
        break;
      default:
        console.warn(`Unknown spawn point type: ${spawnPointType}`);
    }
  }
}

Component.register(UI_SwitchRole);
