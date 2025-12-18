import {
  UIComponent,
  View,
  Text,
  Binding,
  UINode,
  ImageSource,
  Image,
  ColorValue,
} from "horizon/ui";
import { Asset, Player, PlayerDeviceType, PropTypes, TextureAsset } from "horizon/core";
import { Items, PlayerRoles, getItems } from "Enums_Game";
import { bagManager, playerManager } from "Managers_Instance";
import { PlayerSwitchedRoleEvent } from "Manager_Events";
import { Npc } from "horizon/npc";

const PANEL_H = "18%";
const SLOT_COUNT = 5;
const VR_ICON_SIZE = 15;
const NON_VR_ICON_SIZE = 25; // Double the VR size
export default class HUD_Fetcher extends UIComponent<typeof HUD_Fetcher> {
  static propsDefinition = {
    item1Icon: { type: PropTypes.Asset },
    item2Icon: { type: PropTypes.Asset },
    item3Icon: { type: PropTypes.Asset },
    item4Icon: { type: PropTypes.Asset },
    itemInactiveIcon: { type: PropTypes.Asset },
  };

  private player: Player | undefined;
  private unsubscribeBag: (() => void) | undefined;
  iconSizeBinding: Binding<number> = new Binding<number>(15);
  radiusBinding: Binding<number> = new Binding<number>(50);
  iconSize = 15;
  radius = 50;
  leftBinding: Binding<number> = new Binding<number>(0);
  topBinding: Binding<number> = new Binding<number>(0);
  // Five slot indices: -1 empty (show inactive); 0..3 map to getItems() index
  private slotIndexBindings: Array<Binding<number>> = Array.from(
    { length: SLOT_COUNT },
    () => new Binding<number>(-1) // Default to -1 (inactive)
  );

  private getItemIconSources(): (ImageSource | undefined)[] {
    const assets = [
      this.props.item1Icon,
      this.props.item2Icon,
      this.props.item3Icon,
      this.props.item4Icon,
      this.props.itemInactiveIcon,
    ];
    return assets.map((a) =>
      a ? ImageSource.fromTextureAsset(a.as(TextureAsset)) : undefined
    );
  }

  initializeUI(): UINode {
    const itemSources = this.getItemIconSources();
    return View({
      style: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      },
      children: [
        View({
          style: {
            flexDirection: "row",
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            height: PANEL_H,
            width: "auto",
            bottom: 10,
            left: "30%",
          },
          children: [
            // Semi-circle slots container
            View({
              style: {
                position: "relative",
                width: 100,  // Adjust based on your desired radius
                height: 50,  // Half of width for semi-circle
                alignItems: "center",
                justifyContent: "center",
              },
              children: Array.from({ length: SLOT_COUNT }, (_, i) =>
                this.slotCellPositioned(
                  this.slotIndexBindings[i],
                  itemSources,
                  i
                )
              ),
            }),
          ],
        }),
      ],
    });
  }

  private slotCellPositioned(
    indexBinding: Binding<number>,
    itemSources: (ImageSource | undefined)[],
    slotIndex: number
  ): UINode {
    // Calculate position on semi-circle
    const radius = this.radius; // Distance from center
    const startAngle = Math.PI; // Left side (180°)
    const endAngle = Math.PI / 2; // Right side (0°)

    // Distribute slots evenly across semi-circle
    const angleStep = (endAngle - startAngle) / (SLOT_COUNT - 1);
    const angle = startAngle + angleStep * slotIndex;

    // Convert polar to Cartesian coordinates
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    const halfIcon = this.iconSize / 2;
    // this.leftBinding.set(x + radius - halfIcon);
    // this.topBinding.set(radius - y - halfIcon);
    // const leftBinding = this.iconSizeBinding.derive((size) => {
    //   const radius = this.radius;
    //   const x = radius * Math.cos(angle);
    //   const halfIcon = size / 2;
    //   return x + radius - halfIcon;
    // });

    // const topBinding = this.iconSizeBinding.derive((size) => {
    //   const radius = this.radius;
    //   const y = radius * Math.sin(angle);
    //   const halfIcon = size / 2;
    //   return radius - y - halfIcon;
    // });
    return View({
      style: {
        position: "absolute",
        left: x + radius - halfIcon,
        top: radius - y - halfIcon,
        width: this.iconSizeBinding,
        height: this.iconSizeBinding,
        alignItems: "center",
        justifyContent: "center",
      },
      children: [
        // Show item icon if index is 0-3, otherwise show inactive icon
        Image({
          source: indexBinding.derive((idx) => {
            if (idx >= 0 && idx <= 3) {
              return itemSources[idx];
            }
            return itemSources[4]; // itemInactiveIcon
          }),
          style: {
            width: "100%",
            height: "100%",
          },
        }),
      ],
    });
  }

  start(): void {
    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, ({ player, newRole }) => {
      if (newRole === PlayerRoles.Fetcher && player === this.player) {
        this.refreshBag(player);
      }
    });
  }

  setPlayer(player: Player | undefined) {
    if (!player) {
      this.resetUI();
      return;
    }
    this.player = player;
    this.detectPlatform(player);
    this.refreshBag(player);
  }

  refreshBag(player: Player): void {
    this.detectPlatform(player);
    this.unsubscribeBag = bagManager?.subscribe(player, (bag) => {
      // Flatten bag into up to five indices in getItems() order
      const items = getItems();
      const indices: number[] = [];
      items.forEach((item, idx) => {
        const qty = bag[item] ?? 0;
        for (let i = 0; i < qty && indices.length < SLOT_COUNT; i++) {
          indices.push(idx);
        }
      });
      // Fill remaining slots with -1 (inactive)
      while (indices.length < SLOT_COUNT) indices.push(-1);

      // Apply to slots
      for (let i = 0; i < SLOT_COUNT; i++) {
        this.slotIndexBindings[i].set(indices[i], [player]);
      }
    });
  }

  resetUI(): void {
    for (let i = 0; i < SLOT_COUNT; i++) {
      this.slotIndexBindings[i].set(-1, []); // Reset to inactive
    }
  }

  onDestroy(): void {
    if (this.unsubscribeBag) {
      this.unsubscribeBag();
      this.unsubscribeBag = undefined;
    }
  }

  private detectPlatform(player: Player): void {
    if (Npc.playerIsNpc(player)) return;
    const deviceType = player.deviceType.get();
    const isVR = deviceType === PlayerDeviceType.VR;

    this.iconSize = isVR ? VR_ICON_SIZE : VR_ICON_SIZE;
    this.radius = isVR ? 50 : 50; // Scale radius proportionally

    this.iconSizeBinding.set(this.iconSize);
    this.radiusBinding.set(this.radius);

    if (isVR) {
      this.entity.visible.set(true);
    } else {
      this.entity.visible.set(false);
    }
  }
}

UIComponent.register(HUD_Fetcher);
