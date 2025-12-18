import {
  itemButtonCard,
  waffleItemCardConfig,
  scoopItemCardConfig,
  waffleTextureIdMap,
  scoopTextureIdMap,
} from "Constants_TownHouse";
import { PlayerHouseConfig, ScoopDecoration, UpgradeInfo } from "Enums_Game";
import { ColorCombinations } from "Enums_Game";


function makeAddWaffleCard() {
  const template = waffleItemCardConfig()[0];
  return {
    ...template,
    iconAsset: {
      ...template.iconAsset,
      // TODO: replace with dedicated plus icon
      iconAssetId: "24642143918758444",
      itemId: "add_waffle",
    },
    itemIndex: -1,
  };
}

function makeAddScoopCard() {
  const template = scoopItemCardConfig()[0];
  return {
    ...template,
    iconAsset: {
      ...template.iconAsset,
      // TODO: replace with dedicated plus icon
      iconAssetId: "1437731947456621",
      itemId: "add_scoop",
    },
    itemIndex: -1,
  };
}


export function playerHouseToScrollItemCards(
  playerHouse: PlayerHouseConfig
): itemButtonCard[] {
  // console.log.*$
  //   `playerHouseToScrollItemCards: playerHouse = ${JSON.stringify(playerHouse)}`
  // );
  // Map player waffle upgrades to waffle card configs
  const waffleCards = playerHouse.waffles.map((upgrade, idx) => {
    const template = waffleItemCardConfig()[0];
    const textureId = getWaffleTextureId(upgrade.assetId, upgrade.color);
    return {
      ...template,
      iconAsset: {
        ...template.iconAsset,
        iconAssetId: textureId || template.iconAsset.iconAssetId,
      },
      itemIndex: idx,
      // Optionally map further properties (color, decoration, etc.) here
    };
  });

  // Map player scoop upgrades to scoop card configs
  const scoopCards = playerHouse.scoops.map((upgrade, idx) => {
    const template = scoopItemCardConfig()[0];
    const textureId = getScoopTextureId(upgrade.assetId);

    return {
      ...template,
      iconAsset: {
        ...template.iconAsset,
        iconAssetId: textureId || template.iconAsset.iconAssetId,
      },
      itemIndex: idx,
      // Optionally map further properties here
    };
  });

  // Concatenate lists: waffles (original order), then scoops (original order)
  const combined = [...waffleCards, ...scoopCards];

   if (playerHouse.waffles.length < 5) {
    combined.push(makeAddWaffleCard());
  }
  if (playerHouse.scoops.length < 10) {
    combined.push(makeAddScoopCard());
  }

  
  return combined;
}

export function getWaffleTextureId(
  waffleId: string,
  color: ColorCombinations
): string | undefined {
  const key = `${waffleId}_${color}`;
  return waffleTextureIdMap[key];
}

export function getScoopTextureId(
  scoopId: string,
  decoration?: ScoopDecoration
): string | undefined {
  const key = scoopId + "_" + (decoration || "1");
  return scoopTextureIdMap[key];
}
