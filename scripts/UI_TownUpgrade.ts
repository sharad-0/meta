import { Analytics, AnalyticsManager } from "AnalyticsManager";
import {
  backgroundImage,
  colorConfig,
  colorHexCombination,
  decorationConfig,
  itemAffordableCosts,
  itemBgImageSourceAssetIds,
  itemButtonCard,
  itemCard,
  scoopIconAssetIds,
  selectedCustomizationItemInterface,
  TownUpgradeTabTypes,
  TownUpgradeUiHeader,
  TownUpgradeUiTabs,
  waffleIconAssetIds,
  waffleItemCardConfig,
  waffleTabContentConfig,
} from "Constants_TownHouse";
import {
  ColorCombinations,
  CustomAnalyticsEvents,
  Items,
  PlayerHouseConfig,
  ScoopDecoration,
  UpgradeInfo,
  UpgradeType,
  WaffleUpgradeCost,
} from "Enums_Game";
import {
  getScoopTextureId,
  getWaffleTextureId,
  playerHouseToScrollItemCards,
} from "Helper_TownHouseUpgrade";
import { TextureAsset } from "horizon/2p";
import { CustomEventPayload, Turbo, TurboEvents } from "horizon/analytics";
import { Asset, Player } from "horizon/core";
import {
  Binding,
  Callback,
  FontFamily,
  Image,
  ImageSource,
  Pressable,
  ScrollView,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { ParlourClosedEvent } from "Manager_Events";
import { hapticsManager, playerManager, townManager } from "Managers_Instance";
import {
  customizationTabContent,
  scoopTabContent,
  waffleTabContent,
} from "UIComponent_TownUpgradeBody";
import {
  itemCustomizationLeftContainerContent,
  scoopLeftContainerContent,
  topScrollViewContainerContent,
  waffleLeftContainerContent,
} from "UIComponent_TownUpgradeLeftContainer";
import {
  sideTabButton,
  switchTabSelection,
} from "UIComponent_TownUpgradeSideButtons";

export default class UI_TownUpgrade extends UIComponent<typeof UI_TownUpgrade> {
  /* Bindings */
  headerTextBinding: Binding<string> = new Binding(
    TownUpgradeUiHeader[TownUpgradeTabTypes.Customization].title
  );

  tab1SelectedBinding: Binding<boolean> = new Binding(false);
  tab1WithWaffleSelectedBinding: Binding<boolean> = new Binding(false);
  tab2SelectedBinding: Binding<boolean> = new Binding(false);
  tab2WithScoopSelectedBinding: Binding<boolean> = new Binding(false);
  tab3SelectedBinding: Binding<boolean> = new Binding(true);
  tab3WithoutItemSelectedBinding: Binding<boolean> = new Binding(true);
  tab3WithWaffleSelectedBinding: Binding<boolean> = new Binding(false);
  tab3WithScoopSelectedBinding: Binding<boolean> = new Binding(false);
  costBinding: Binding<string> = new Binding("");
  selectedItemImageSourceBinding: Binding<ImageSource> = new Binding(
    ImageSource.fromTextureAsset(new Asset(BigInt(0)) as TextureAsset)
  );
  isBuildButtonVisible: Binding<boolean> = new Binding(false);
  waffleItemsLength = waffleIconAssetIds.length;
  scoopItemsLength = scoopIconAssetIds.length;
  colorItemLength = Object.keys(ColorCombinations).length;
  lockedWafflesIndexBindings: Binding<boolean>[] = Array.from(
    { length: this.waffleItemsLength },
    () => new Binding(false)
  );
  lockedScoopIndexBindings: Binding<boolean>[] = Array.from(
    { length: this.scoopItemsLength },
    () => new Binding(false)
  );
  selectedWaffleIndexBindings: Binding<boolean>[] = Array.from(
    { length: this.waffleItemsLength },
    () => new Binding(false)
  );
  selectedScoopIndexBindings: Binding<boolean>[] = Array.from(
    { length: this.scoopItemsLength },
    () => new Binding(false)
  );
  selectedWaffleColorIndexBinding: Binding<boolean>[] = Array.from(
    { length: this.colorItemLength },
    () => new Binding(false)
  );
  prevUsedWaffleIndexBinding: Binding<boolean>[] = Array.from(
    { length: this.waffleItemsLength },
    () => new Binding(false)
  );

  prevUsedScoopIndexBinding: Binding<boolean>[] = Array.from(
    { length: this.scoopItemsLength },
    () => new Binding(false)
  );

  playerHouseItemCardsBinding: Binding<itemButtonCard[]> = new Binding<
    itemButtonCard[]
  >([]);

  topScrollItemSelectionBindings: Binding<boolean>[] = Array.from(
    {
      length: 17,
    },
    () => new Binding(false)
  );

  itemBgImageSourceBinding: Binding<ImageSource> = new Binding(
    ImageSource.fromTextureAsset(
      new Asset(BigInt("1484131886060339")) as TextureAsset
    )
  );
  itemClickableBinding: Binding<boolean>[] = Array.from(
    { length: this.waffleItemsLength },
    () => new Binding(true)
  );

  canAfford: Binding<boolean> = new Binding(false);
  isPurchasable: Binding<boolean> = new Binding(false);

  /* State Variables */
  selectedTab: TownUpgradeTabTypes = TownUpgradeTabTypes.Customization;
  selectedItemAssetId: string = "";
  selectedItemTextureId: string = "";
  selectedItemColor: ColorCombinations = ColorCombinations.Blue;
  selectedItemDecoration: string = "";
  isWaffleItemSelected: boolean = false;
  isScoopItemSelected: boolean = false;
  selectedColor: ColorCombinations = ColorCombinations.Pink;
  previousSelectedItemId: string = "";
  static propsDefinition = {};
  selectedCustomizationItem: selectedCustomizationItemInterface | null = null;

  player: Player | null = null;

  private playerHouseData: PlayerHouseConfig = {
    waffles: [
      {
        assetId: "waffle1",
        yRotation: 0,
        color: ColorCombinations.Blue,
        decoration: undefined,
      },
      {
        assetId: "waffle2",
        yRotation: 0,
        color: ColorCombinations.Pink,
        decoration: undefined,
      },
      {
        assetId: "waffle2",
        yRotation: 0,
        color: ColorCombinations.Pink,
        decoration: undefined,
      },
      {
        assetId: "waffle2",
        yRotation: 0,
        color: ColorCombinations.Pink,
        decoration: undefined,
      },
    ],
    scoops: [
      {
        assetId: "scoop1",
        yRotation: 0,
        color: ColorCombinations.Pink,
        decoration: undefined,
      },
      {
        assetId: "scoop2",
        yRotation: 0,
        color: ColorCombinations.Blue,
        decoration: undefined,
      },
      {
        assetId: "scoop2",
        yRotation: 0,
        color: ColorCombinations.Blue,
        decoration: undefined,
      },
      {
        assetId: "scoop2",
        yRotation: 0,
        color: ColorCombinations.Blue,
        decoration: undefined,
      },
    ],
  };

  private itemCards: itemButtonCard[] = [];

  start() {
    // const player = playerManager?.getCurrentPlayers()[0];
    // if (player) {
    //   this.setPlayer(player);
    //   this.refreshTownUpgradeUI();
    // }

    this.connectLocalBroadcastEvent(ParlourClosedEvent, () => {
      this.onClosePressed?.();
    });
  }

  public setPlayer(player: Player) {
    this.player = player;
    const playerHouseData = playerManager?.getHouseUpgrade(this.player!)!;
    if (this.player && playerHouseData) {
      this.playerHouseData = JSON.parse(JSON.stringify(playerHouseData));
    }
    this.refreshTownUpgradeUI();
  }

  public refreshTownUpgradeUI() {
    this.itemCards = playerHouseToScrollItemCards(this.playerHouseData);
    this.playerHouseItemCardsBinding.set(this.itemCards);
  }

  initializeUI(): UINode {
    this.itemCards = playerHouseToScrollItemCards(this.playerHouseData);
    this.playerHouseItemCardsBinding.set(this.itemCards);
    return View({
      style: {
        width: "100%",
        height: "100%",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000000de",
        zIndex: 1000,
      },
      children: [this.backgroundImage()],
    });
  }

  backgroundImage(): UINode {
    const backgroundImageAsset = new Asset(
      BigInt(backgroundImage.assetId)
    ) as TextureAsset;
    return View({
      style: {
        width: "auto",
        height: `${backgroundImage.heightPercent}%`,
        aspectRatio: backgroundImage.aspectRatio,
        position: "absolute",
        bottom: `${backgroundImage.bottomPercent}%`,
        justifyContent: "center",
        alignItems: "center",
        // backgroundColor: "#000000",
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(backgroundImageAsset),
          style: {
            width: "auto",
            height: "100%",
            aspectRatio: backgroundImage.aspectRatio,
          },
        }),

        this.leftContentContainer(),
        this.topScrollContainer(),
        this.tabContentContainer(),
        this.closeButton(),
      ],
    });
  }

  headerText() {
    return Text({
      text: this.headerTextBinding,
      style: {
        position: "absolute",
        top: `${TownUpgradeUiHeader[TownUpgradeTabTypes.Customization].top}%`,
        left: `${TownUpgradeUiHeader[TownUpgradeTabTypes.Customization].left}%`,
        fontSize:
          TownUpgradeUiHeader[TownUpgradeTabTypes.Customization].fontSize,
        color: TownUpgradeUiHeader[TownUpgradeTabTypes.Customization].color,
        fontFamily: TownUpgradeUiHeader[TownUpgradeTabTypes.Customization]
          .fontFamily as FontFamily,
      },
    });
  }

  topScrollContainer() {
    return View({
      style: {
        // backgroundColor: "rgba(141, 17, 199, 0.8)",
        height: "24%",
        width: "auto",
        aspectRatio: 1242 / 182,
        top: "4%",
        position: "absolute",
        zIndex: 1003,
        borderRadius: 32,
      },
      children: topScrollViewContainerContent(
        this.playerHouseItemCardsBinding,
        this.playerHouseData.waffles.length +
        this.playerHouseData.scoops.length,
        this.onScrollPanelItemClick.bind(this, this.itemCards),
        this.topScrollItemSelectionBindings
      ),
    });
  }

  leftContentContainer() {
    return View({
      style: {
        // backgroundColor: "#257343ff",
        height: "60%",
        width: "auto",
        aspectRatio: 584 / 462,
        top: "33%",
        left: "10%",
        position: "absolute",
        zIndex: 1003,
        borderRadius: 20,
      },
      children: [
        UINode.if(this.tab1SelectedBinding, waffleLeftContainerContent()),
        UINode.if(
          this.tab1WithWaffleSelectedBinding,
          itemCustomizationLeftContainerContent(
            this.selectedItemImageSourceBinding,
            this.isBuildButtonVisible,
            this.onBuildButtonClick.bind(this),
            this.canAfford,
            this.isPurchasable,
            this.costBinding
          )
        ),
        UINode.if(this.tab2SelectedBinding, scoopLeftContainerContent()),
        UINode.if(
          this.tab2WithScoopSelectedBinding,
          itemCustomizationLeftContainerContent(
            this.selectedItemImageSourceBinding,
            this.isBuildButtonVisible,
            this.onBuildButtonClick.bind(this),
            this.canAfford,
            this.isPurchasable,
            this.costBinding
          )
        ),
        // UINode.if(
        //   this.tab3WithoutItemSelectedBinding,
        //   leftScrollViewContainerContent(
        //     this.playerHouseItemCardsBinding,
        //     this.onLeftPanelItemClick.bind(this, this.itemCards)
        //   )
        // ),
        UINode.if(
          this.tab3WithWaffleSelectedBinding,
          itemCustomizationLeftContainerContent(
            this.selectedItemImageSourceBinding,
            this.isBuildButtonVisible,
            this.onBuildButtonClick.bind(this),
            this.canAfford,
            this.isPurchasable,
            this.costBinding
          )
        ),
        UINode.if(
          this.tab3WithScoopSelectedBinding,
          itemCustomizationLeftContainerContent(
            this.selectedItemImageSourceBinding,
            this.isBuildButtonVisible,
            this.onBuildButtonClick.bind(this),
            this.canAfford,
            this.isPurchasable,
            this.costBinding
          )
        ),
      ],
    });
  }

  tabContentContainer() {
    return View({
      style: {
        height: "66%",
        width: "auto",
        aspectRatio: 1410 / 513,
        top: "30%",
        position: "absolute",
        zIndex: 1001,
        justifyContent: "center",
        alignItems: "center",
        // backgroundColor: "rgba(255, 255, 255, 0.8)",
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("807223228339654")) as TextureAsset
          ),
          style: {
            width: "100%",
            height: "100%",
            position: "absolute",
          },
        }),
        ...this.tabContent(),
      ],
    });
  }
  tabContent() {
    return [
      UINode.if(
        this.tab1SelectedBinding,
        waffleTabContent(
          this.onColorSelected.bind(this),
          this.onItemBuy.bind(this),
          this.lockedWafflesIndexBindings,
          this.selectedWaffleIndexBindings,
          this.selectedWaffleColorIndexBinding,
          this.prevUsedWaffleIndexBinding!,
          this.itemBgImageSourceBinding,
          this.itemClickableBinding
        ),
        undefined
      ),
      UINode.if(
        this.tab1WithWaffleSelectedBinding,
        waffleTabContent(
          this.onColorSelected.bind(this),
          this.onItemBuy.bind(this),
          this.lockedWafflesIndexBindings,
          this.selectedWaffleIndexBindings,
          this.selectedWaffleColorIndexBinding,
          this.prevUsedWaffleIndexBinding!,
          this.itemBgImageSourceBinding,
          this.itemClickableBinding
        ),
        undefined
      ),
      UINode.if(
        this.tab2SelectedBinding,
        scoopTabContent(
          this.onDecorationSelected.bind(this),
          this.onItemBuy.bind(this),
          this.lockedScoopIndexBindings,
          this.selectedScoopIndexBindings,
          this.prevUsedScoopIndexBinding!
        ),
        undefined
      ),

      UINode.if(
        this.tab2WithScoopSelectedBinding,
        scoopTabContent(
          this.onDecorationSelected.bind(this),
          this.onItemBuy.bind(this),
          this.lockedScoopIndexBindings,
          this.selectedScoopIndexBindings,
          this.prevUsedScoopIndexBinding!
        ),
        undefined
      ),
      UINode.if(this.tab3WithoutItemSelectedBinding, customizationTabContent()),
      UINode.if(
        this.tab3WithWaffleSelectedBinding,
        waffleTabContent(
          this.onColorSelected.bind(this),
          this.onItemBuy.bind(this),
          this.lockedWafflesIndexBindings,
          this.selectedWaffleIndexBindings!,
          this.selectedWaffleColorIndexBinding,
          this.prevUsedWaffleIndexBinding!,
          this.itemBgImageSourceBinding,
          this.itemClickableBinding
        ),
        undefined
      ),
      UINode.if(
        this.tab3WithScoopSelectedBinding,
        scoopTabContent(
          this.onDecorationSelected.bind(this),
          this.onItemBuy.bind(this),
          this.lockedScoopIndexBindings,
          this.selectedScoopIndexBindings!,
          this.prevUsedScoopIndexBinding!
        ),
        undefined
      ),
    ];
  }

  public onClosePressed?: () => void;

  closeButton() {
    return Pressable({
      onPress: () => {
        // console.log.*$
        hapticsManager?.playLightTap(this.player!)
        this.resetAllBindings();
        this.selectedTab = TownUpgradeTabTypes.Customization;
        this.updateTabBindings();
        this.onClosePressed?.();
      },
      style: {
        position: "absolute",
        top: "7%",
        right: 0,
        width: "auto",
        height: "16%",
        aspectRatio: 103 / 125,
        // backgroundColor: "rgba(255, 0, 0, 0.6)",
        borderTopRightRadius: 30,
        borderBottomRightRadius: 30,
      },
      children: [
        View({
          style: {
            width: "100%",
            height: "100%",
            borderTopRightRadius: 35,
            borderBottomLeftRadius: 35,
            // backgroundColor: "rgba(11, 164, 224, 1)",
            justifyContent: "center",
            alignItems: "center",
          },
        }),
      ],
    });
  }

  onTabClick(buttonKey: TownUpgradeTabTypes) {
    hapticsManager?.playLightTap(this.player!);

    // console.log.*$
    this.selectedTab = buttonKey;
    this.resetAllBindings();
    this.updateTabBindings();
    switchTabSelection(
      buttonKey,
      this.tab1SelectedBinding,
      this.tab2SelectedBinding,
      this.tab3SelectedBinding,
      this.headerTextBinding
    );
  }

  onScrollPanelItemClick(
    itemCards: itemButtonCard[],
    itemId: string,
    itemIndex: number
  ) {
    // console.log.*$
    //   `Item Clicked: ${itemId}, index: ${itemIndex}, itemCards: ${JSON.stringify(
    //     itemCards
    //   )}`
    // );
    // console.log.*$
    //   `Item Clicked player data: ${JSON.stringify(this.playerHouseData)}`
    // );
    this.topScrollItemSelectionBindings.forEach((binding, i) =>
      binding.set(false)
    );

    const waffleLengths = this.playerHouseData.waffles.length;
    const scoopLengths = this.playerHouseData.scoops.length;

    if (itemId === "add_waffle") {
      this.onTabClick(TownUpgradeTabTypes.Waffles);
      this.topScrollItemSelectionBindings.forEach((binding, i) =>
        binding.set(i === waffleLengths + scoopLengths)
      );
      this.onAddButtonClicked("waffle1");
      return;
    } else if (itemId === "add_scoop") {
      this.onTabClick(TownUpgradeTabTypes.Scoops);
      this.topScrollItemSelectionBindings.forEach((binding, i) =>
        binding.set(i === waffleLengths + scoopLengths + 1)
      );
      this.onAddButtonClicked("scoop1");
      return;
    } else {
      this.onCustomizationItemClick(itemId, itemIndex);
    }
  }

  onCustomizationItemClick(itemId: string, itemIndex: number) {

    const isScoop = itemId?.startsWith("scoop");
    const waffleLengths = this.playerHouseData.waffles.length;
    const scoopLengths = this.playerHouseData.scoops.length;

    this.onTabClick(TownUpgradeTabTypes.Customization);
    this.resetAllBindings();
    let item = this.playerHouseData.waffles[0];
    let color: ColorCombinations | undefined;
    let decor: ScoopDecoration | undefined;
    let textureId = "";
    let type: "waffle" | "scoop" = "waffle";

    if (isScoop) {
      item = this.playerHouseData.scoops[itemIndex];
      color = item?.color;
      decor = item?.decoration;
      textureId = getScoopTextureId(item.assetId)!;
      type = "scoop";
      this.topScrollItemSelectionBindings.forEach((binding, i) =>
        binding.set(i === waffleLengths + itemIndex)
      );
      this.lockedScoopIndexBindings.forEach((binding, i) => {
        const affordableData =
          itemAffordableCosts[
          scoopIconAssetIds[i] as keyof typeof itemAffordableCosts
          ];
        if (affordableData) {
          const canAfford = playerManager?.canAffordUpgrade(
            this.player!,
            affordableData.level,
            0
          );
          binding.set(!canAfford);
        } else {
          binding.set(true);
        }
      });
    } else {
      item = this.playerHouseData.waffles[itemIndex];
      color = item?.color;
      decor = item?.decoration;
      textureId = getWaffleTextureId(item.assetId, color!)!;
      type = "waffle";
      this.topScrollItemSelectionBindings.forEach((binding, i) =>
        binding.set(i === itemIndex)
      );
      const idx = waffleIconAssetIds.indexOf(item.assetId);
      this.lockedWafflesIndexBindings.forEach((binding, i) => {
        const check = i > idx + 1;
        binding.set(check);
      });
      this.itemBgImageSourceBinding.set(
        ImageSource.fromTextureAsset(
          new Asset(BigInt(itemBgImageSourceAssetIds[idx + 1])) as TextureAsset
        )
      );
      this.itemClickableBinding.forEach((binding, i) => {
        if (i < idx) {
          binding.set(false);
        } else {
          binding.set(true);
        }
      });
    }

    this.isScoopItemSelected = isScoop!;
    this.isWaffleItemSelected = !isScoop;
    this.selectedItemAssetId = item!.assetId;
    this.previousSelectedItemId = item!.assetId;

    // console.log.*$
    this.selectedItemTextureId = textureId;
    this.selectedCustomizationItem = {
      type,
      index: itemIndex,
      textureId,
      itemId: item.assetId,
      color,
    };

    if (type === "waffle") {
      const itemIndexInConfig = waffleIconAssetIds.indexOf(item.assetId);
      this.prevUsedWaffleIndexBinding.forEach((binding, i) =>
        binding.set(i === itemIndexInConfig)
      );
    } else {
      const itemIndexInConfig = scoopIconAssetIds.indexOf(item.assetId);
      this.prevUsedScoopIndexBinding.forEach((binding, i) =>
        binding.set(i === itemIndexInConfig)
      );
    }

    this.setItemSelected(item.assetId, type, color);
    this.updateImageSourceBinding();
    this.updateTabBindings();
    // console.log.*$
    // this.refreshUI();
  }

  onAddButtonClicked(itemId: string) {
    {
      hapticsManager?.playLightTap(this.player!);
      const isScoop = itemId?.startsWith("scoop");
      const waffleLengths = this.playerHouseData.waffles.length;
      const scoopLengths = this.playerHouseData.scoops.length;

      const color = ColorCombinations.Orange;
      const textureId = isScoop
        ? getScoopTextureId(itemId)!
        : getWaffleTextureId(itemId, color!)!;
      const type = isScoop ? "scoop" : "waffle";

      this.isScoopItemSelected = isScoop!;
      this.isWaffleItemSelected = !isScoop;
      this.selectedItemAssetId = itemId;

      // console.log.*$
      this.selectedItemTextureId = textureId;
      this.selectedCustomizationItem = {
        type,
        index: -1,
        textureId,
        itemId: itemId,
        color,
      };
      const affordableData =
        itemAffordableCosts[itemId as keyof typeof itemAffordableCosts];
      this.isPurchasable.set(true);
      this.costBinding.set(
        (affordableData ? affordableData.cost : 254).toString()
      );
      // console.log.*$
      const canAfford = affordableData
        ? playerManager?.canAffordUpgrade(
          this.player!,
          affordableData.level,
          affordableData.cost
        ) || false
        : false;
      this.canAfford.set(canAfford);
      this.isBuildButtonVisible.set(true);
      this.setItemSelected(itemId, type, color);
      this.updateImageSourceBinding();
      this.updateTabBindings();
      if (type === "waffle") {
        this.lockedWafflesIndexBindings.forEach((binding, i) => {
          if (i === 0) {
            binding.set(false);
          } else {
            binding.set(true);
          }
        });
        this.itemBgImageSourceBinding.set(
          ImageSource.fromTextureAsset(
            new Asset(BigInt(itemBgImageSourceAssetIds[0])) as TextureAsset
          )
        );
      }
      if (type === "scoop") {
        this.lockedScoopIndexBindings.forEach((binding, i) => {
          const affordableData =
            itemAffordableCosts[
            scoopIconAssetIds[i] as keyof typeof itemAffordableCosts
            ];
          if (affordableData) {
            const canAfford = playerManager?.canAffordUpgrade(
              this.player!,
              affordableData.level,
              0
            );
            binding.set(!canAfford);
          } else {
            binding.set(true);
          }
        });
      }
      // console.log.*$
      // this.refreshUI();
    }
  }

  setItemSelected(
    itemId: string,
    type: "waffle" | "scoop",
    color?: ColorCombinations
  ) {
    const idx =
      type === "waffle"
        ? waffleIconAssetIds.indexOf(itemId)
        : scoopIconAssetIds.indexOf(itemId);
    if (idx !== -1) {
      if (type === "waffle") {
        this.selectedWaffleIndexBindings.forEach((binding, i) =>
          binding.set(i === idx)
        );

        if (color) {
          const colorIdx = colorHexCombination.findIndex(
            (item) => item.color === color
          );
          this.selectedWaffleColorIndexBinding.forEach((binding, i) =>
            binding.set(i === colorIdx)
          );
        }
        // this.selectedWaffleIndexBindings[idx].set(true);
      } else {
        this.selectedScoopIndexBindings.forEach((binding, i) =>
          binding.set(i === idx)
        );
        // this.selectedScoopIndexBindings[idx].set(true);
      }
    }
  }

  updateImageSourceBinding() {
    if (this.selectedItemTextureId) {
      this.selectedItemImageSourceBinding.set(
        ImageSource.fromTextureAsset(
          new Asset(BigInt(this.selectedItemTextureId)) as TextureAsset
        )
      );
    }
  }

  updateTabBindings() {
    if (this.selectedTab === TownUpgradeTabTypes.Customization) {
      this.tab3SelectedBinding.set(true);
      this.tab1SelectedBinding.set(false);
      this.tab2SelectedBinding.set(false);

      if (this.isWaffleItemSelected) {
        this.tab3WithWaffleSelectedBinding.set(true);
        this.tab3WithScoopSelectedBinding.set(false);
        this.tab3WithoutItemSelectedBinding.set(false);
        this.tab1WithWaffleSelectedBinding.set(false);
        this.tab2WithScoopSelectedBinding.set(false);
      } else if (this.isScoopItemSelected) {
        this.tab3WithWaffleSelectedBinding.set(false);
        this.tab3WithScoopSelectedBinding.set(true);
        this.tab3WithoutItemSelectedBinding.set(false);
        this.tab1WithWaffleSelectedBinding.set(false);
        this.tab2WithScoopSelectedBinding.set(false);
      } else {
        this.tab3WithWaffleSelectedBinding.set(false);
        this.tab3WithScoopSelectedBinding.set(false);
        this.tab3WithoutItemSelectedBinding.set(true);
        this.tab1WithWaffleSelectedBinding.set(false);
        this.tab2WithScoopSelectedBinding.set(false);
      }
    } else if (this.selectedTab === TownUpgradeTabTypes.Waffles) {
      if (this.isWaffleItemSelected) {
        // this.isWaffleItemSelected = false;
        this.isScoopItemSelected = false;
        this.tab1SelectedBinding.set(false);
        this.tab1WithWaffleSelectedBinding.set(true);
        this.tab2SelectedBinding.set(false);
        this.tab2WithScoopSelectedBinding.set(false);
        this.tab3SelectedBinding.set(false);
        this.tab3WithWaffleSelectedBinding.set(false);
        this.tab3WithScoopSelectedBinding.set(false);
        this.tab3WithWaffleSelectedBinding.set(false);
        this.tab3WithScoopSelectedBinding.set(false);
        this.tab3WithoutItemSelectedBinding.set(false);
      } else {
        this.isWaffleItemSelected = false;
        this.isScoopItemSelected = false;
        this.tab1SelectedBinding.set(true);
        this.tab2SelectedBinding.set(false);
        this.tab3SelectedBinding.set(false);
        this.tab3WithWaffleSelectedBinding.set(false);
        this.tab3WithScoopSelectedBinding.set(false);
        this.tab3WithWaffleSelectedBinding.set(false);
        this.tab3WithScoopSelectedBinding.set(false);
        this.tab3WithoutItemSelectedBinding.set(false);
      }
    } else if (this.selectedTab === TownUpgradeTabTypes.Scoops) {
      if (this.isScoopItemSelected) {
        this.isWaffleItemSelected = false;
        this.isScoopItemSelected = false;
        this.tab2SelectedBinding.set(false);
        this.tab2WithScoopSelectedBinding.set(true);
        this.tab1SelectedBinding.set(false);
        this.tab1WithWaffleSelectedBinding.set(false);
        this.tab3SelectedBinding.set(false);
        this.tab3WithWaffleSelectedBinding.set(false);
        this.tab3WithScoopSelectedBinding.set(false);
        this.tab3WithWaffleSelectedBinding.set(false);
        this.tab3WithScoopSelectedBinding.set(false);
        this.tab3WithoutItemSelectedBinding.set(false);
      } else {
        this.isWaffleItemSelected = false;
        this.isScoopItemSelected = false;
        this.tab2SelectedBinding.set(true);
        this.tab2WithScoopSelectedBinding.set(false);
        this.tab1SelectedBinding.set(false);
        this.tab1WithWaffleSelectedBinding.set(false);
        this.tab3SelectedBinding.set(false);
        this.tab3WithWaffleSelectedBinding.set(false);
        this.tab3WithScoopSelectedBinding.set(false);
        this.tab3WithWaffleSelectedBinding.set(false);
        this.tab3WithScoopSelectedBinding.set(false);
        this.tab3WithoutItemSelectedBinding.set(false);
      }
    }
  }

  onColorSelected = (color: string) => {
    // console.log.*$
    // console.log.*$
    //   `Current selection: ${JSON.stringify(this.selectedCustomizationItem)}`
    // );
    this.selectedColor = ColorCombinations.Orange; // Default to Orange if not found
    colorHexCombination.forEach((item, index) => {
      if (item.hex === color) {
        this.selectedColor = item.color;
      }

      if (this.selectedColor) {
        const colorIdx = colorHexCombination.findIndex(
          (item) => item.color === this.selectedColor
        );
        this.selectedWaffleColorIndexBinding.forEach((binding, i) =>
          binding.set(i === colorIdx)
        );
      }
      this.selectedItemTextureId = getWaffleTextureId(
        this.selectedItemAssetId,
        this.selectedColor
      )!;
      const prevSelectedData = this.selectedCustomizationItem;
      this.selectedCustomizationItem = {
        type: prevSelectedData?.type || "waffle",
        index: prevSelectedData?.index!,
        textureId: prevSelectedData?.textureId || this.selectedItemTextureId,
        itemId: prevSelectedData?.itemId || this.selectedItemAssetId,
        color: this.selectedColor,
      };

      // console.log.*$
      //   `Selected color: ${color}, color enum: ${this.selectedColor}`
      // );
    });
    if (this.previousSelectedItemId !== this.selectedItemAssetId) {
      this.isPurchasable.set(true);
    } else {
      this.isPurchasable.set(false);
    }

    if (this.previousSelectedItemId !== this.selectedItemAssetId) {
      const affordableData =
        itemAffordableCosts[
        this.selectedItemAssetId as keyof typeof itemAffordableCosts
        ];
      const canAfford = affordableData
        ? playerManager?.canAffordUpgrade(
          this.player!,
          affordableData.level,
          affordableData.cost
        ) || false
        : false;
      // console.log.*$
      this.isPurchasable.set(true);
      this.costBinding.set(
        (affordableData ? affordableData.cost : 254).toString()
      );
      this.canAfford.set(canAfford);
    } else {
      this.isPurchasable.set(false);
      this.costBinding.set("");
      this.canAfford.set(true);
    }
    this.isBuildButtonVisible.set(true);
    this.updateImageSourceBinding();
  };

  onDecorationSelected = (decor: decorationConfig) => {
    // console.log.*$
    // console.log.*$
    this.selectedColor = ColorCombinations.Pink; // Default to Pink if not found
  };
  onItemBuy(itemId: string) {
    // Find out if it's a waffle or a scoop
    const isScoop = itemId.startsWith("scoop");
    const type = isScoop ? "scoop" : "waffle";

    this.setItemSelected(itemId, type);
    if (isScoop) {
      this.isScoopItemSelected = true;
      this.isWaffleItemSelected = false;
    } else {
      this.isWaffleItemSelected = true;
      this.isScoopItemSelected = false;
    }
    this.selectedItemAssetId = itemId;
    this.selectedItemTextureId = isScoop
      ? getScoopTextureId(itemId)!
      : getWaffleTextureId(
        itemId,
        this.selectedCustomizationItem?.color || ColorCombinations.Blue // Default color if not set
      )!;

    const oldSelectedData = this.selectedCustomizationItem;

    // console.log.*$

    this.selectedCustomizationItem = {
      type,
      index: oldSelectedData?.index!,
      textureId: this.selectedItemTextureId,
      itemId,
      color: this.selectedColor,
    };
    // console.log.*$
    //   `item clicked: ${JSON.stringify(this.selectedCustomizationItem)}`
    // );
    const affordableData =
      itemAffordableCosts[
      this.selectedItemAssetId as keyof typeof itemAffordableCosts
      ];
    const canAfford = affordableData
      ? playerManager?.canAffordUpgrade(
        this.player!,
        affordableData.level,
        affordableData.cost
      ) || false
      : false;
    // console.log.*$

    if (this.previousSelectedItemId !== this.selectedItemAssetId) {
      this.isPurchasable.set(true);
      this.costBinding.set(
        (affordableData ? affordableData.cost : 254).toString()
      );
      this.canAfford.set(canAfford);
    } else {
      this.isPurchasable.set(false);
      this.costBinding.set("");
      this.canAfford.set(true);
    }

    this.isBuildButtonVisible.set(true);
    this.updateImageSourceBinding();
    this.updateTabBindings();
  }

  resetAllBindings() {
    this.tab1SelectedBinding.set(false);
    this.tab1WithWaffleSelectedBinding.set(false);
    this.tab2SelectedBinding.set(false);
    this.tab2WithScoopSelectedBinding.set(false);
    this.tab3SelectedBinding.set(false);
    this.tab3WithWaffleSelectedBinding.set(false);
    this.tab3WithScoopSelectedBinding.set(false);
    this.tab3WithoutItemSelectedBinding.set(false);

    this.isWaffleItemSelected = false;
    this.isScoopItemSelected = false;
    this.lockedWafflesIndexBindings.forEach((binding) => binding.set(false));
    this.selectedWaffleIndexBindings.forEach((binding) => binding.set(false));
    this.selectedScoopIndexBindings.forEach((binding) => binding.set(false));
    this.selectedWaffleColorIndexBinding.forEach((binding) =>
      binding.set(false)
    );
    this.costBinding.set("");
    this.canAfford.set(false);
    this.isBuildButtonVisible.set(false);

    this.prevUsedWaffleIndexBinding.forEach((binding, i) => binding.set(false));

    this.prevUsedScoopIndexBinding.forEach((binding, i) => binding.set(false));
    this.isPurchasable.set(false);

    this.topScrollItemSelectionBindings.forEach((binding, i) =>
      binding.set(false)
    );

    this.itemClickableBinding.forEach((binding, i) => binding.set(true));
    this.resetAllVariables();
  }

  resetAllVariables() {
    this.selectedCustomizationItem = null;
    this.selectedItemAssetId = "";
    this.selectedItemTextureId = "";
    this.isWaffleItemSelected = false;
    this.isScoopItemSelected = false;
    this.previousSelectedItemId = "";
  }

  onBuildButtonClick() {
    // console.log.*$
    //   `Build button old player house data:` +
    //   JSON.stringify(this.playerHouseData)
    // );
    // // console.log.*$
    //   `Build button selectedCustomizationItem:` +
    //   JSON.stringify(this.selectedCustomizationItem)
    // );
    let deductCoins = false;
    if (this.selectedCustomizationItem) {
      let newFloor: UpgradeInfo | undefined = undefined;
      const tab = this.selectedTab;
      const selected = this.selectedCustomizationItem;
      if (!selected) return; // No item selected, do nothing

      if (tab === TownUpgradeTabTypes.Customization) {
        if (selected.type === "waffle") {
          // console.log.*$
          //   "Updating waffle at index ",
          //   selected.index,
          //   JSON.stringify(this.playerHouseData)
          // );
          const idx = selected.index;
          if (idx !== -1) {
            this.playerHouseData.waffles[idx].assetId =
              this.selectedItemAssetId;
            this.playerHouseData.waffles[idx].color =
              this.selectedCustomizationItem.color || ColorCombinations.Blue;

            newFloor = {
              assetId: this.selectedItemAssetId,
              yRotation: 0,
              color:
                this.selectedCustomizationItem.color || ColorCombinations.Blue,
            };
            if (this.previousSelectedItemId !== this.selectedItemAssetId) {
              deductCoins = true;
            }
          }
        } else if (selected.type === "scoop") {
          const idx = selected.index;
          if (idx !== -1) {
            this.playerHouseData.scoops[idx].assetId = this.selectedItemAssetId;
            newFloor = {
              assetId: this.selectedItemAssetId,
              yRotation: 0,
              color:
                this.selectedCustomizationItem.color || ColorCombinations.Pink,
            };
            if (this.previousSelectedItemId !== this.selectedItemAssetId) {
              deductCoins = true;
            }
          }
        }
      } else if (tab === TownUpgradeTabTypes.Waffles) {
        if (selected.type === "waffle") {
          this.playerHouseData.waffles.push({
            assetId: this.selectedItemAssetId,
            yRotation: 0, // default, or get from selected
            color: selected.color ?? ColorCombinations.Blue,
          });

          newFloor = {
            assetId: this.selectedItemAssetId,
            yRotation: 0,
            color: selected.color ?? ColorCombinations.Blue,
          };
          if (this.previousSelectedItemId !== this.selectedItemAssetId) {
            deductCoins = true;
          }
        }
      } else if (tab === TownUpgradeTabTypes.Scoops) {
        if (selected.type === "scoop") {
          this.playerHouseData.scoops.push({
            assetId: this.selectedItemAssetId,
            yRotation: 0, // default, or get from selected
            color: selected.color ?? ColorCombinations.Pink,
          });
          newFloor = {
            assetId: this.selectedItemAssetId,
            yRotation: 0,
            color: selected.color ?? ColorCombinations.Pink,
          };

          if (this.previousSelectedItemId !== this.selectedItemAssetId) {
            deductCoins = true;
          }
        }
      }
      // console.log.*$
      //   `Build button new playerHouseData: `,
      //   JSON.stringify(this.playerHouseData)
      // );
      if (newFloor === undefined) return;
      this.updatePlayerHouseData(
        newFloor!,
        selected.type === "waffle" ? UpgradeType.Waffle : UpgradeType.Scoop,
        selected.index,
        deductCoins
      );
      this.resetAllBindings();
      this.selectedTab = TownUpgradeTabTypes.Customization;
      this.updateTabBindings();
      this.refreshTownUpgradeUI();
      // this.entity.visible.set(false);
    }
  }

  updatePlayerHouseData(
    upgrade: UpgradeInfo,
    upgradeType: UpgradeType,
    index: number = -1,
    deductCoins: boolean = false
  ) {
    // console.log.*$
    //   `Updating player house data... ${JSON.stringify(upgrade)}, ${index}, ${UpgradeType[upgradeType]
    //   }, ${deductCoins}`
    // );
    townManager?.upgradeHouseForPlayer(
      this.player!,
      upgrade,
      upgradeType,
      index,
      deductCoins
    );
    this.onClosePressed?.();

  }
}

UIComponent.register(UI_TownUpgrade);
