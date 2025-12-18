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
import { Asset, Player, PropTypes, TextureAsset } from "horizon/core";
import { Items, PlayerRoles, getItems } from "Enums_Game";
import { bagManager, playerManager } from "Managers_Instance";
import { PlayerSwitchedRoleEvent } from "Manager_Events";

const PANEL_H = "18%";

const ACTIVEBGCOLOR = "rgba(255, 255, 255, 0.5)";
const INACTIVEBGCOLOR = "rgba(217, 217, 217, 0.25)";
const ACTIVEBORDERCOLOR = "rgba(255, 255, 255, 1)";
const INACTIVEBORDERCOLOR = "rgba(255, 255, 255, 0.7)";

const SLOT_COUNT = 5;

export default class HUD_FetcherNonVr extends UIComponent<typeof HUD_FetcherNonVr> {
  static propsDefinition = {
    vacuumIcon: { type: PropTypes.Asset },
    // Item icons mapped to getItems() order
    item1Icon: { type: PropTypes.Asset },
    item2Icon: { type: PropTypes.Asset },
    item3Icon: { type: PropTypes.Asset },
    item4Icon: { type: PropTypes.Asset },
    // Bar level icons
    bar0Icon: { type: PropTypes.Asset },
    bar1Icon: { type: PropTypes.Asset },
    bar2Icon: { type: PropTypes.Asset },
    bar3Icon: { type: PropTypes.Asset },
    bar4Icon: { type: PropTypes.Asset },
    bar5Icon: { type: PropTypes.Asset },
    itemBgActive: { type: PropTypes.Asset },
    itemBgInactive: { type: PropTypes.Asset },
  };

  private unsubscribeBag: (() => void) | undefined;

  // Five slot indices: -1 empty; 0..3 map to getItems() index
  private slotIndexBindings: Array<Binding<number>> = Array.from(
    { length: SLOT_COUNT },
    () => new Binding<number>(-1)
  );

  private slotBgBindings: Array<Binding<ColorValue>> = Array.from(
    { length: SLOT_COUNT },
    () => new Binding<ColorValue>(INACTIVEBGCOLOR)
  );

  private slotBorderBindings: Array<Binding<ColorValue>> = Array.from(
    { length: SLOT_COUNT },
    () => new Binding<ColorValue>(INACTIVEBORDERCOLOR)
  );

  private bagBinding = new Binding<string>("0/5");
  private barLevelBinding = new Binding<number>(0);
  private bagFullTextBinding = new Binding<boolean>(true);

  // Prebuilt static sources for icons (no bindings carry ImageSource)
  private getItemIconSources(): (ImageSource | undefined)[] {
    const assets = [
      this.props.item1Icon,
      this.props.item2Icon,
      this.props.item3Icon,
      this.props.item4Icon,
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
        UINode.if(this.bagFullTextBinding, this.bagFullTextComp()),
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
            // Bag label + vertical bar + vacuum icon
            View({
              style: {
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
                marginBottom: 10,
                bottom: 20,
                position: "relative",
              },
              children: [
                Text({
                  text: this.bagBinding,
                  style: {
                    color: "#ffffffff",
                    fontFamily: "Roboto",
                    fontWeight: "900",
                    fontSize: 16,
                    marginBottom: 6,
                  },
                }),
                Image({
                  source: this.barLevelBinding.derive((level) => {
                    const assets = [
                      this.props.bar0Icon,
                      this.props.bar1Icon,
                      this.props.bar2Icon,
                      this.props.bar3Icon,
                      this.props.bar4Icon,
                      this.props.bar5Icon,
                    ];
                    const idx = Math.max(0, Math.min(5, level));
                    const asset = assets[idx];
                    return asset
                      ? ImageSource.fromTextureAsset(asset.as(TextureAsset))
                      : undefined;
                  }),
                  style: { width: 15, height: 52, marginBottom: 15 },
                }),
                Image({
                  source: ImageSource.fromTextureAsset(
                    this.props.vacuumIcon?.as(TextureAsset)!
                  ),
                  style: {
                    width: 22,
                    height: 30,
                    position: "absolute",
                    bottom: -10,
                    left: "50%",
                    marginLeft: -12,
                  },
                }),
              ],
            }),

            // Five fixed slots
            View({
              style: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                width: "80%",
              },
              children: Array.from({ length: SLOT_COUNT }, (_, i) =>
                this.slotCell(
                  this.slotIndexBindings[i],
                  this.slotBgBindings[i],
                  this.slotBorderBindings[i],
                  itemSources,
                  i === SLOT_COUNT - 1
                )
              ),
            }),
          ],
        }),
      ],
    });
  }

  private bagFullTextComp() {
    const imgAsset = new Asset(BigInt("1319154189376827")) as TextureAsset;
    return View({
      children: Image({
        source: ImageSource.fromTextureAsset(imgAsset),
        style: {
          width: "auto",
          height: "50%",
          aspectRatio: 161 / 33,
        },
      }),
      style: {
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        width: "18%",
        height: "5%",
        bottom: 110,
        marginLeft: 20,
      },
    });
  }

  private slotCell(
    indexBinding: Binding<number>,
    bgColor: Binding<ColorValue>,
    borderColor: Binding<ColorValue>,
    itemSources: (ImageSource | undefined)[],
    isLast: boolean
  ): UINode {
    return View({
      style: {
        width: 65,
        height: 65,
        marginRight: isLast ? 0 : 13,
        borderRadius: 16,
        backgroundColor: bgColor, // pass binding directly (no extra derive)
        borderWidth: 2,
        borderColor: borderColor, // pass binding directly
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      },
      children: [
        // Render exactly one icon per slot based on indexBinding
        // 0..3 correspond to itemSources entries; -1 renders nothing
        UINode.if(
          indexBinding.derive((idx) => idx === 0),
          Image({
            source: itemSources[0],
            style: {
              width: 56,
              height: 56,
              marginLeft: 6,
              transform: [{ translateY: -10 }],
            },
          })
        ),
        UINode.if(
          indexBinding.derive((idx) => idx === 1),
          Image({
            source: itemSources[1],
            style: {
              width: 56,
              height: 56,
              marginLeft: 6,
              transform: [{ translateY: -10 }],
            },
          })
        ),
        UINode.if(
          indexBinding.derive((idx) => idx === 2),
          Image({
            source: itemSources[2],
            style: {
              width: 56,
              height: 56,
              marginLeft: 6,
              transform: [{ translateY: -10 }],
            },
          })
        ),
        UINode.if(
          indexBinding.derive((idx) => idx === 3),
          Image({
            source: itemSources[3],
            style: {
              width: 56,
              height: 56,
              marginLeft: 6,
              transform: [{ translateY: -10 }],
            },
          })
        ),
      ],
    });
  }

  start(): void {
    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, () => {
      playerManager
        ?.getRolePlayers(PlayerRoles.Fetcher, true)
        .forEach((player) => {
          this.refreshBag(player);
        });
    });
  }

  refreshBag(player: Player): void {
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
      while (indices.length < SLOT_COUNT) indices.push(-1);

      // Apply to slots + visuals
      for (let i = 0; i < SLOT_COUNT; i++) {
        const filled = indices[i] >= 0;
        this.slotIndexBindings[i].set(indices[i], [player]);
        if (filled) {
          this.slotBgBindings[i].set(ACTIVEBGCOLOR, [player]);
          this.slotBorderBindings[i].set(ACTIVEBORDERCOLOR, [player]);
        } else {
          this.slotBgBindings[i].set(INACTIVEBGCOLOR, [player]);
          this.slotBorderBindings[i].set(INACTIVEBORDERCOLOR, [player]);
        }
      }

      // Capacity / label / bar
      const capRaw = bagManager?.getBagCapacity(player) ?? SLOT_COUNT;
      const totalRaw = bagManager?.getTotalItemCount(player) ?? 0;
      this.bagFullTextBinding.set(totalRaw >= capRaw, [player]);
      this.bagBinding.set(`${totalRaw}/${capRaw}`, [player]);
      this.barLevelBinding.set(Math.min(totalRaw, 5), [player]);
    });
  }

  onDestroy(): void {
    if (this.unsubscribeBag) {
      this.unsubscribeBag();
      this.unsubscribeBag = undefined;
    }
  }
}

UIComponent.register(HUD_FetcherNonVr);
