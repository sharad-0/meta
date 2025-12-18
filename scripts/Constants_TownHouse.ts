import { ColorCombinations } from "Enums_Game";
import { getScoopTextureId, getWaffleTextureId } from "Helper_TownHouseUpgrade";
import { Vec3 } from "horizon/core";

interface ScoopDecoration {
  id: string;
  posOffset: Vec3;
  rotation: Vec3;
}

enum UpgradeType {
  Waffle = 1,
  Scoop = 2,
}

interface UpgradeInfo {
  assetId: string;
  yOffset: number;
  color?: ColorCombinations;
  decoration?: ScoopDecoration;
}

interface PlayerHouseConfig {
  waffles: UpgradeInfo[];
  scoops: UpgradeInfo[];
}

interface TownUpgradeUiHeader {
  title: string;
  top: number;
  left: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface TownUpgradeUiTabs {
  name: TownUpgradeTabTypes;
  selectedIconImageAssetId: string;
  unselectedIconImageAssetId: string;
  selectedBackgroundAssetId: string;
  unselectedBackgroundAssetId?: string;
  iconAssetTop: number;
  iconAssetLeft: number;
  iconAssetWidth: string | number;
  iconAssetHeightPercent: number;
  iconAspectRatio?: number;
  backgroundAssetTop: number;
  backgroundAssetLeft: number;
  backgroundAssetWidth: string | number;
  backgroundAssetHeightPercent: string | number;
  backgroundAspectRatio?: number;
}

export const backgroundImage = {
  assetId: "1780640745917224",
  heightPercent: 75,
  aspectRatio: 1703 / 775,
  bottomPercent: 5,
};

export enum TownUpgradeTabTypes {
  Waffles = "waffles",
  Scoops = "scoops",
  Customization = "customization",
}

export const TownUpgradeUiTabs: { [key: string]: TownUpgradeUiTabs } = {
  waffles: {
    name: TownUpgradeTabTypes.Waffles,
    selectedIconImageAssetId: "1850822289189034",
    unselectedIconImageAssetId: "2031017187716565",
    selectedBackgroundAssetId: "1538654924170597",
    unselectedBackgroundAssetId: "1506397113706082",
    iconAssetTop: 0,
    iconAssetLeft: 0,
    iconAssetWidth: "auto",
    iconAssetHeightPercent: 66,
    iconAspectRatio: 140 / 121,
    backgroundAssetTop: 0,
    backgroundAssetLeft: 0,
    backgroundAssetWidth: "auto",
    backgroundAssetHeightPercent: 85,
    backgroundAspectRatio: 203 / 152,
  },
  scoops: {
    name: TownUpgradeTabTypes.Scoops,
    selectedIconImageAssetId: "25022250390714839",
    unselectedIconImageAssetId: "811283018123361",
    selectedBackgroundAssetId: "1538654924170597",
    unselectedBackgroundAssetId: "1506397113706082",
    iconAssetTop: 0,
    iconAssetLeft: 0,
    iconAssetWidth: "auto",
    iconAssetHeightPercent: 66,
    iconAspectRatio: 140 / 121,
    backgroundAssetTop: 0,
    backgroundAssetLeft: 0,
    backgroundAssetWidth: "auto",
    backgroundAssetHeightPercent: 85,
    backgroundAspectRatio: 203 / 152,
  },
  customization: {
    name: TownUpgradeTabTypes.Customization,
    selectedIconImageAssetId: "1835028244060562",
    unselectedIconImageAssetId: "1147111280706407",
    selectedBackgroundAssetId: "1538654924170597",
    unselectedBackgroundAssetId: "1506397113706082",
    iconAssetTop: 0,
    iconAssetLeft: 0,
    iconAssetWidth: "auto",
    iconAssetHeightPercent: 66,
    iconAspectRatio: 140 / 121,
    backgroundAssetTop: 0,
    backgroundAssetLeft: 0,
    backgroundAssetWidth: "auto",
    backgroundAssetHeightPercent: 85,
    backgroundAspectRatio: 203 / 152,
  },
};

export const TownUpgradeUiHeader: {
  [K in TownUpgradeTabTypes]: TownUpgradeUiHeader;
} = {
  [TownUpgradeTabTypes.Customization]: {
    title: "Customization",
    top: 5,
    left: 3.5,
    fontSize: 44,
    color: "#A8C3FA",
    fontFamily: "Bangers",
  },
  [TownUpgradeTabTypes.Waffles]: {
    title: "Waffles",
    top: 5,
    left: 6,
    fontSize: 36,
    color: "#FFFFFF",
    fontFamily: "Bangers",
  },
  [TownUpgradeTabTypes.Scoops]: {
    title: "Scoops",
    top: 5,
    left: 6,
    fontSize: 36,
    color: "#FFFFFF",
    fontFamily: "Bangers",
  },
};

export interface itemCard {
  iconAssetId: string;
  widthPercent: string | number;
  heightPercent: string | number;
  aspectRatio?: number;
  topPercent?: number;
  leftPercent?: number;
  itemId?: string;
}
interface tickMark {
  assetId: string;
  widthPercent: string | number;
  heightPercent: string | number;
  aspectRatio?: number;
  topPercent: number;
  leftPercent: number;
}

interface buyButton {
  assetId: string;
  widthPercent: string | number;
  heightPercent: string | number;
  aspectRatio?: number;
  topPercent: number;
  leftPercent: number;
}

interface itemCardBackground {
  assetId: string;
  widthPercent: string | number;
  heightPercent: string | number;
  aspectRatio?: number;
  topPercent: number;
  leftPercent: number;
}

export interface itemButtonCard {
  iconAsset: itemCard;
  tickMarkAsset: tickMark;
  buyButtonAsset: buyButton;
  unselectedBackgroundAsset: itemCardBackground;
  selectedBackgroundAsset: itemCardBackground;
  itemIndex?: number;
}

export const waffleIconAssetIds = ["waffle1", "waffle2", "waffle3"];
export const scoopIconAssetIds = ["scoop1", "scoop2", "scoop3"];
export const itemBgImageSourceAssetIds = [
  "1484131886060339",
  "780604897910664",
  "1110114367909484",
  "1727204794621159",
];
export const scoopLevels = [1, 3, 6, 10];
export const scoopCosts = [200, 450, 500, 650];
export const waffleCosts = [300, 1500, 2000];

export const itemAffordableCosts = {
  waffle1: {
    cost: 300,
    level: 1,
  },
  waffle2: {
    cost: 1500,
    level: 1,
  },
  waffle3: {
    cost: 2000,
    level: 1,
  },
  scoop1: {
    cost: 200,
    level: 1,
  },
  scoop2: {
    cost: 450,
    level: 3,
  },
  scoop3: {
    cost: 500,
    level: 6,
  },
  scoop4: {
    cost: 650,
    level: 10,
  },
};

export const scoopTextureIdMap: Record<string, string> = {
  scoop1_1: "1968599027249340",
  scoop2_1: "2401210350334504",
  scoop3_1: "832901392502286",
  // Add more scoops as needed

  scoop1_2: "757984060454852",
  scoop2_2: "650768711023357",
  scoop3_2: "1336585314716532",
};
export const waffleTabContentTextureIdMap: Record<string, string> = {
  // waffle1 textures
  waffle1: "815702990898977",
  waffle2: "1873360683617716",
  waffle3: "24503005666031116",
};
export const waffleTextureIdMap: Record<string, string> = {
  // waffle1 textures
  waffle1_1: "1178037057488311",
  waffle1_2: "1172159898162526",
  waffle1_3: "781726974787722",
  waffle1_4: "4085077341807511",

  // waffle2 textures
  waffle2_1: "1178037057488311",
  waffle2_2: "1172159898162526",
  waffle2_3: "781726974787722",
  waffle2_4: "4085077341807511",

  // waffle3 textures
  waffle3_1: "1178037057488311",
  waffle3_2: "1172159898162526",
  waffle3_3: "781726974787722",
  waffle3_4: "4085077341807511",
};

const commonIconCardProps: Omit<itemCard, "iconAssetId"> = {
  widthPercent: "auto",
  heightPercent: "33",
  aspectRatio: 182 / 150,
  topPercent: 10,
  leftPercent: 0,
};

const commonTickMark: tickMark = {
  assetId: "1515747299437339",
  widthPercent: "auto",
  heightPercent: 25,
  aspectRatio: 1,
  topPercent: 50,
  leftPercent: 90,
};

const commonBuyButton: buyButton = {
  assetId: "1884130482169338",
  widthPercent: "auto",
  heightPercent: "27.5",
  aspectRatio: 200 / 75,
  topPercent: 55,
  leftPercent: 37.5,
};

const commonUnselectedBackground: itemCardBackground = {
  assetId: "970761655195806",
  widthPercent: "auto",
  heightPercent: "85",
  aspectRatio: 200 / 200,
  topPercent: 0,
  leftPercent: 0,
};

const commonSelectedBackground: itemCardBackground = {
  assetId: "1487334765937585",
  widthPercent: "auto",
  heightPercent: "85",
  aspectRatio: 200 / 200,
  topPercent: 0,
  leftPercent: 0,
};
// const waffleSizes = ["30", "35", "40"];

export function waffleItemCardConfig(): itemButtonCard[] {
  let waffleIconTextureIds: { textureId: string; itemId: string }[] = [];
  waffleIconAssetIds.forEach((iconAssetId) => {
    const key = iconAssetId; // Default color variant
    const textureId = waffleTabContentTextureIdMap[key];
    waffleIconTextureIds.push({ textureId, itemId: iconAssetId });
  });
  return waffleIconTextureIds.map(({ textureId, itemId }, idx) => ({
    iconAsset: {
      ...commonIconCardProps,
      heightPercent: "70",
      iconAssetId: textureId!,
      itemId: itemId!,
      aspectRatio: 1,
    },
    tickMarkAsset: commonTickMark,
    buyButtonAsset: commonBuyButton,
    unselectedBackgroundAsset: commonUnselectedBackground,
    selectedBackgroundAsset: commonSelectedBackground,
  }));
}

export const scoopItemCardConfig = (): itemButtonCard[] => {
  let scoopIconTextureIds: { textureId: string; itemId: string }[] = [];
  scoopIconAssetIds.forEach((iconAssetId) => {
    const key = iconAssetId + "_1"; // Default color variant
    const textureId = scoopTextureIdMap[key];
    scoopIconTextureIds.push({ textureId, itemId: iconAssetId });
  });
  return scoopIconTextureIds.map(({ textureId, itemId }) => ({
    iconAsset: {
      ...commonIconCardProps,
      iconAssetId: textureId,
      itemId: itemId,
    },
    tickMarkAsset: commonTickMark,
    buyButtonAsset: commonBuyButton,
    unselectedBackgroundAsset: commonUnselectedBackground,
    selectedBackgroundAsset: commonSelectedBackground,
  }));
};
export const colorHexCombination = [
  { color: ColorCombinations.Orange, hex: "#e48205" },
  { color: ColorCombinations.Pink, hex: "#ce6cb6" },
  { color: ColorCombinations.Blue, hex: "#99CCFF" },
  { color: ColorCombinations.Green, hex: "#6ca784" },
];
export const decorationConfig = [];
export interface colorConfig {
  color: string;
  unselectedBackgroundAssetId: string;
  selectedBackgroundAssetId: string;
  widthPercent: string | number;
  heightPercent: string | number;
  aspectRatio?: number;
  topPercent: number;
  leftPercent: number;
  tickMarkAsset: tickMark;
}
export interface decorationConfig {
  decoration: string;
  unselectedBackgroundAssetId: string;
  selectedBackgroundAssetId: string;
  widthPercent: string | number;
  heightPercent: string | number;
  aspectRatio?: number;
  topPercent: number;
  leftPercent: number;
}
const colorCardConfig: colorConfig[] = colorHexCombination.map(
  (colorItem, index) => ({
    color: colorItem.hex,
    unselectedBackgroundAssetId: "970761655195806",
    selectedBackgroundAssetId: "1487334765937585",
    widthPercent: "auto",
    heightPercent: "75",
    aspectRatio: 1,
    topPercent: 0,
    leftPercent: index * 25,
    tickMarkAsset: commonTickMark,
  })
);

const decorationCardConfig: decorationConfig[] = decorationConfig.map(
  (decoration, index) => ({
    decoration,
    unselectedBackgroundAssetId: "970761655195806",
    selectedBackgroundAssetId: "1487334765937585",
    widthPercent: "20",
    heightPercent: "20",
    aspectRatio: 1,
    topPercent: 0,
    leftPercent: index * 25,
  })
);

export const waffleTabContentConfig = {
  upperText: "WAFFLE SIZES",
  bottomText: "Colors",
  upperTextTopPercent: 0,
  upperTextLeftPercent: 2,
  bottomTextTopPercent: 70,
  bottomTextLeftPercent: 2,
  textFontFamiley: "Bangers",
  textFontSize: 24,
  textColor: "#FFFFFF",
  itemCards: waffleItemCardConfig(),
  colors: colorCardConfig,
};

export const scoopTabContentConfig = {
  upperText: "SCOOPS",
  bottomText: "",
  upperTextTopPercent: 0,
  upperTextLeftPercent: 2,
  bottomTextTopPercent: 70,
  bottomTextLeftPercent: 2,
  textFontFamiley: "Bangers",
  textFontSize: 24,
  textColor: "#FFFFFF",
  itemCards: scoopItemCardConfig(),
  decoration: decorationCardConfig,
};

export interface selectedCustomizationItemInterface {
  type: "waffle" | "scoop";
  index: number;
  textureId: string;
  itemId: string;
  color?: ColorCombinations;
  decoration?: string;
}
