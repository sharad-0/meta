import * as hz from "horizon/core";
import { Player } from "horizon/core";
import {
  addPlayersToUseTrash,
  pickedItemFromTray,
  playerPickedItem,
  PlayerSwitchedRoleEvent,
  removePlayersFromUseTrash,
} from "Manager_Events";
import {
  botManager,
  inventoryManager,
  objectPoolManager,
  orderManager,
  playerManager,
  scooperHandManager,
  serverManager,
  themeSessionManager,
} from "Managers_Instance";
import { IceCream, Items, PlayerRoles } from "Enums_Game";
import { MeshEntity, TextureAsset } from "horizon/2p";

export type Status = "Under Process" | "Ready To Serve";

class Component_IceCreamCone extends hz.Component<
  typeof Component_IceCreamCone
> {
  static propsDefinition = {
    scoop_1: { type: hz.PropTypes.Entity },
    scoop_2: { type: hz.PropTypes.Entity },
    scoop_3: { type: hz.PropTypes.Entity },

    item1Texture: { type: hz.PropTypes.Asset },
    item2Texture: { type: hz.PropTypes.Asset },
    item3Texture: { type: hz.PropTypes.Asset },

    scoop1_AddOn: { type: hz.PropTypes.Entity },
    scoop2_AddOn: { type: hz.PropTypes.Entity },
    scoop3_AddOn: { type: hz.PropTypes.Entity },

    addonTexture1: { type: hz.PropTypes.Asset },
    addonTexture2: { type: hz.PropTypes.Asset },
    addonTexture3: { type: hz.PropTypes.Asset },

    pickupSound: { type: hz.PropTypes.Entity },

    vfx: { type: hz.PropTypes.Entity },

    trayObject: { type: hz.PropTypes.Entity },
    coneObject: { type: hz.PropTypes.Entity },
  };

  private iceCreamData: IceCream = {
    orderId: 0,
    items: [],
  };
  private conePickupSound: hz.AudioGizmo | null = null;
  private grabbableEntity: hz.GrabbableEntity | null = null;
  private playersAbleToGrab: Player[] = [];

  start() {
    this.hideAllScoop();
    this.hideAllAddons();
    this.grabbableEntity = this.entity.as(hz.GrabbableEntity);
    if (!this.grabbableEntity) {
      console.warn(
        `[IceCreamConeScript] GrabbableEntity not found for ${this.entity.id}`
      );
    }

    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnGrabStart,
      (isRightHand, player) => {
        this.handleGrab(player);
      }
    );

    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnGrabEnd,
      (player) => {
        this.handleDrop(player);
      }
    );

    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, () =>
      this.makeConeGrabbable()
    );

    this.conePickupSound = this.props.pickupSound?.as(hz.AudioGizmo) ?? null;
  }

  public setIceCreamCone() {
    this.iceCreamData.items.push(Items.Cone);
    this.makeConeUngrabbable();
  }

  getConeOrderId(): number | null {
    return this.iceCreamData?.orderId ?? null;
  }

  setConeOrderId(orderId: number): void {
    if (this.iceCreamData) {
      this.iceCreamData.orderId = orderId;
    }

    this.makeIceCreamUngrabbableByPlayers();
  }

  getConeItems(): Items[] {
    return this.iceCreamData?.items;
  }

  addScoopToCone(item: Items): void {
    if (!this.iceCreamData || this.iceCreamData.items.length >= 4) {
      return;
    }

    this.setScoopTexAndVisibilty(item);
    this.iceCreamData.items.push(item);
  }

  setScoopTexAndVisibilty(item: Items): void {
    if (item === Items.Cone || item === Items.None) {
      return;
    }

    const itemLength = this.iceCreamData?.items.length ?? 0;
    const scoop =
      itemLength === 1
        ? this.props.scoop_1
        : itemLength === 2
          ? this.props.scoop_2
          : this.props.scoop_3;
    const texture = (
      item === Items.Vanilla
        ? this.props.item1Texture
        : item === Items.Strawberry
          ? this.props.item2Texture
          : this.props.item3Texture
    ) as TextureAsset | null;

    if (scoop && texture) {
      // console.log.*$
      //   `[IceCreamConeScript] Setting scoop texture ${texture} and visibility for item: ${item}`
      // );
      scoop
        .as(MeshEntity)
        .setTexture(texture)
        .then(() => {
          scoop?.visible.set(true);
        });
    }
  }

  setAddonToScoop(): void {
    if (!themeSessionManager?.isChristmasSessionActive()) return;
    const itemLength = this.iceCreamData?.items.length ?? 0;
    if (itemLength <= 1) {
      return;
    }
    const addOn =
      itemLength === 2
        ? this.props.scoop1_AddOn
        : itemLength === 3
          ? this.props.scoop2_AddOn
          : this.props.scoop3_AddOn;

    if (!addOn) return;
    const tray = this.props.trayObject;
    let additionalItem: hz.Entity | null = null;
    if (tray) {
      const trayChildren = tray.children.get();
      const randomIndex = Math.floor(Math.random() * trayChildren.length - 1);
      additionalItem = trayChildren[randomIndex];
      if (!additionalItem) {
        additionalItem = trayChildren[0];
      }
    }

    if (additionalItem) {
      additionalItem.visible.set(true);
      tray?.visible.set(true);
    }
    const lastItem = this.iceCreamData.items[itemLength - 1];

    switch (lastItem) {
      case Items.Vanilla:
        if (this.props.addonTexture1) {
          addOn
            .as(MeshEntity)
            .setTexture(this.props.addonTexture1 as TextureAsset);
        }
        break;
      case Items.Strawberry:
        if (this.props.addonTexture2) {
          addOn
            .as(MeshEntity)
            .setTexture(this.props.addonTexture2 as TextureAsset);
        }
        break;
      case Items.Chocolate:
        if (this.props.addonTexture3) {
          addOn
            .as(MeshEntity)
            .setTexture(this.props.addonTexture3 as TextureAsset);
        }
        break;
    }

    this.props.vfx?.as(hz.ParticleGizmo).play();
    addOn.visible.set(true);
  }
  hideAllScoop(): void {
    this.props.scoop_1?.visible.set(false);
    this.props.scoop_2?.visible.set(false);
    this.props.scoop_3?.visible.set(false);
  }
  hideAllAddons(): void {
    this.props.scoop1_AddOn?.visible.set(false);
    this.props.scoop2_AddOn?.visible.set(false);
    this.props.scoop3_AddOn?.visible.set(false);
  }

  /********************************************** Grabbable ***********************************************************/
  // Handle grab events for the ice cream cone
  // only server and scooper can grab a cone
  // if a server or scooper grabs the cone and the order is not set, server should be able to put it back it back in the tray if the tray is empty
  private handleGrab(player: Player) {
    const playerRec = playerManager?.getPlayerRecord(player);
    if (!playerRec) {
      console.warn(
        `[IceCreamConeScript] Player role not found for player ${player.id}`
      );
      return;
    }

    switch (playerRec.role) {
      case PlayerRoles.Fetcher:
        this.grabbableEntity?.forceRelease();
        player.clearAvatarGripPoseOverride();
        return;
      case PlayerRoles.Server:
        if (this.iceCreamData === null) {
          console.warn(
            `[IceCreamConeScript] Ice cream data not set for player ${player.id}`
          );
          return;
        }

        if (!serverManager?.playerPickedCone(player, this)) {
          console.warn(
            `[IceCreamConeScript] Player ${player.id} already has cone in hand`
          );
          this.sendLocalBroadcastEvent(playerPickedItem, {
            player: player,
            orderId: this.iceCreamData?.orderId,
            entityId: this.entity.id,
          });
          return;
        }

        this.sendLocalBroadcastEvent(playerPickedItem, {
          player: player,
          orderId: this.iceCreamData?.orderId,
          entityId: this.entity.id,
        });

        if (this.conePickupSound) {
          this.conePickupSound.play();
        } else {
          console.warn(
            "Cone pick up sound not found for the ice cream component"
          );
        }

        break;
      case PlayerRoles.Scooper:
        // if (this.props.coneObject) {

        player.setAvatarGripPoseOverride(hz.AvatarGripPose.CarryHeavy);
        scooperHandManager?.activeEntityInHand.set(player, this.entity);
        inventoryManager?.remove(Items.Cone, 1);
        this.entity.visible.set(true);
        this.sendLocalBroadcastEvent(addPlayersToUseTrash, { player });
        // }
        break;
    }

    this.sendLocalBroadcastEvent(addPlayersToUseTrash, { player: player });
  }

  private handleDrop(player: Player) {
    const playerRec = playerManager?.getPlayerRecord(player);
    if (!playerRec) {
      console.warn(
        `[IceCreamConeScript] Player role not found for player ${player.id}`
      );
      return;
    }

    switch (playerRec.role) {
      case "Server":
        serverManager?.removeConeForPlayer(player, false);
    }
    this.sendLocalBroadcastEvent(removePlayersFromUseTrash, { player: player });
  }

  private makeConeUngrabbable() {
    if (this.grabbableEntity) {
      this.playersAbleToGrab = [];

      this.handleGrabTrigger();
    }
  }

  public makeConeGrabbable() {
    if (this.iceCreamData.orderId === 0) {
      return;
    }

    if (this.grabbableEntity) {
      const bots = botManager?.getBotPlayersFromRole(PlayerRoles.Server);
      if (bots) {
        this.playersAbleToGrab = bots;
      }

      this.handleGrabTrigger();
    }
  }

  private handleGrabTrigger() {
    if (this.grabbableEntity) {
      // console.log.*$
      //   `[IceCreamConeScript] Handle grab trigger for cone ${
      //     this.entity.id
      //   } for players: ${this.playersAbleToGrab.map((p) => p.id).join(", ")}`
      // );
      try {
        this.grabbableEntity.setWhoCanGrab(this.playersAbleToGrab);
      } catch {
        // console.log.*$
      }
    }
  }

  public resetCone() {
    this.iceCreamData = {
      orderId: 0,
      items: [],
    };
    this.playersAbleToGrab = [];

    this.props.scoop_1?.visible.set(false);
    this.props.scoop_2?.visible.set(false);
    this.props.scoop_3?.visible.set(false);

    objectPoolManager?.releaseItem(Items.Cone, this.entity);
  }

  public destroyIceCream() {
    if (this.iceCreamData) {
      this.entity.visible.set(false);
      this.world.deleteAsset(this.entity);
    }
  }

  makeIceCreamGrabbableByPlayer(player: Player | undefined) {
    if (this.grabbableEntity) {
      if (player) {
        this.playersAbleToGrab = [player];
      } else {
        this.playersAbleToGrab = [];
      }
      this.handleGrabTrigger();
    }
  }

  makeIceCreamUngrabbableByPlayers() {
    const bots = botManager?.getBotPlayersFromRole(PlayerRoles.Server);
    if (bots) {
      this.playersAbleToGrab = bots;
    }
    if (this.grabbableEntity) {
      this.handleGrabTrigger();
    }
  }
}
hz.Component.register(Component_IceCreamCone);
export default Component_IceCreamCone;
