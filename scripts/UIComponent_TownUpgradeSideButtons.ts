import {
  backgroundImage,
  colorConfig,
  decorationConfig,
  itemButtonCard,
  TownUpgradeTabTypes,
  TownUpgradeUiHeader,
  TownUpgradeUiTabs,
} from "Constants_TownHouse";
import { TextureAsset } from "horizon/2p";
import { Asset } from "horizon/core";
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

export function sideTabButton(
  buttonKey: TownUpgradeTabTypes,
  onClick: (buttonKey: TownUpgradeTabTypes) => void,
  tab1Selected: Binding<boolean>,
  tab1WithWaffleSelectedBinding: Binding<boolean>,
  tab2Selected: Binding<boolean>,
  tab2WithScoopSelectedBinding: Binding<boolean>,
  tab3Selected: Binding<boolean>
): UINode {
  const tabInfo = TownUpgradeUiTabs[buttonKey];
  const tabSelectedBgAsset = new Asset(
    BigInt(tabInfo.selectedBackgroundAssetId)
  ) as TextureAsset;
  const tabSelectedIconAsset = new Asset(
    BigInt(tabInfo.selectedIconImageAssetId)
  ) as TextureAsset;
  const tabUnselectedIconAsset = new Asset(
    BigInt(tabInfo.unselectedIconImageAssetId)
  ) as TextureAsset;
  const unselectedBackgroundAssetId = new Asset(
    BigInt(tabInfo.unselectedBackgroundAssetId!)
  ) as TextureAsset;

  let showBgBinding = tab1Selected || tab1WithWaffleSelectedBinding;

  switch (buttonKey) {
    case TownUpgradeTabTypes.Waffles:
      showBgBinding = tab1Selected || tab1WithWaffleSelectedBinding;
      break;
    case TownUpgradeTabTypes.Scoops:
      showBgBinding = tab2Selected || tab2WithScoopSelectedBinding;
      break;
    case TownUpgradeTabTypes.Customization:
      showBgBinding = tab3Selected;
      break;
  }

  return Pressable({
    style: {
      justifyContent: "center",
      alignItems: "center",
      height: "30.6%",
    },
    children: [
      UINode.if(
        showBgBinding,
        Image({
          source: ImageSource.fromTextureAsset(tabSelectedBgAsset),
          style: {
            width: "auto",
            height: "86%",
            aspectRatio: tabInfo.backgroundAspectRatio,
            position: "absolute",
          },
        }),
        Image({
          source: ImageSource.fromTextureAsset(unselectedBackgroundAssetId),
          style: {
            width: "auto",
            height: "86%",
            aspectRatio: tabInfo.backgroundAspectRatio,
            position: "absolute",
          },
        })
      ),
      UINode.if(
        showBgBinding,

        Image({
          source: ImageSource.fromTextureAsset(tabSelectedIconAsset),
          style: {
            width: "auto",
            height: `${tabInfo.iconAssetHeightPercent}%`,
            aspectRatio: tabInfo.iconAspectRatio,
          },
        }),
        Image({
          source: ImageSource.fromTextureAsset(tabUnselectedIconAsset),
          style: {
            width: "auto",
            height: `${tabInfo.iconAssetHeightPercent}%`,
            aspectRatio: tabInfo.iconAspectRatio,
          },
        })
      ),
    ],
    onPress: () => onClick(buttonKey),
  });
}

export function switchTabSelection(
  buttonKey: TownUpgradeTabTypes,
  tab1Selected: Binding<boolean>,
  tab2Selected: Binding<boolean>,
  tab3Selected: Binding<boolean>,
  headerTextBinding: Binding<string>
) {
  switch (buttonKey) {
    case TownUpgradeTabTypes.Waffles:
      tab1Selected.set(true);
      tab2Selected.set(false);
      tab3Selected.set(false);
      headerTextBinding.set(
        TownUpgradeUiHeader[TownUpgradeTabTypes.Waffles].title
      );
      break;
    case TownUpgradeTabTypes.Scoops:
      tab1Selected.set(false);
      tab2Selected.set(true);
      tab3Selected.set(false);
      headerTextBinding.set(
        TownUpgradeUiHeader[TownUpgradeTabTypes.Scoops].title
      );
      break;
    case TownUpgradeTabTypes.Customization:
      tab1Selected.set(false);
      tab2Selected.set(false);
      tab3Selected.set(true);
      headerTextBinding.set(
        TownUpgradeUiHeader[TownUpgradeTabTypes.Customization].title
      );
      break;
  }
}
