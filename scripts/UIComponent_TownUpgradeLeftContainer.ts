import { itemButtonCard, waffleTextureIdMap } from "Constants_TownHouse";
import { TextureAsset } from "horizon/2p";
import { Asset } from "horizon/core";
import {
  Bindable,
  Binding,
  DynamicList,
  Image,
  ImageSource,
  Pressable,
  ScrollView,
  Text,
  UINode,
  View,
} from "horizon/ui";

export function topScrollViewContainerContent(
  itemCardsBinding: Binding<itemButtonCard[]>,
  numberOfItems: number,
  onSelect: (itemId: string, index: number) => void,
  itemCardsSelectionBindings: Binding<boolean>[]
) {
  const cardH = 100;
  const cardW = (cardH * 178) / 146;
  const gap = 0;

  const row = View({
    style: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingHorizontal: gap, // left and right edge space
    },
    children: DynamicList<itemButtonCard>({
      style: { flexDirection: "row", alignItems: "center" },
      data: itemCardsBinding,
      renderItem: (cfg, index) =>
        View({
          style: {
            width: cardW,
            height: cardH,
            marginRight: gap, // internal gaps
          },
          children: createScrollViewItemCard(
            cfg,
            index!,
            cfg.iconAsset?.itemId!,
            itemCardsSelectionBindings[index!],
            onSelect
          ),
        }),
    }),
  });

  // const gap = 10;

  return ScrollView({
    children: [row],
    horizontal: true,
    contentContainerStyle: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingLeft: "2%",
      paddingRight: `calc(2% + ${gap}px)`, // ensures right-most spacing
    },
    style: {
      top: "5%",
      height: "80%",
      width: "94%",
      left: "3%",
      position: "absolute",
      borderRadius: 30,
    },
  });
}

function createScrollViewItemCard(
  cfg: itemButtonCard,
  index: number,
  itemId: string,
  isSelected: Binding<boolean> | undefined,
  onSelect: (itemId: string, itemIndex: number) => void
) {
  let unSelectedBgAssetId = "1320319063023370";
  let selectedBgAssetId = "776023678473468";
  if (index === 0) {
    unSelectedBgAssetId = "1283084016363663";
    selectedBgAssetId = "1356183726180040";
  }
  return View({
    style: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      // width/height provided by wrapper; otherwise set explicit dimensions here
    },
    children: [
      Pressable({
        onPress: () => onSelect(itemId, cfg.itemIndex!),
        style: {
          // make this the centering flex box
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        },
        children: [
          // background frame stays absolute
          UINode.if(
            isSelected!,
            Image({
              source: ImageSource.fromTextureAsset(
                new Asset(BigInt(selectedBgAssetId)) as TextureAsset
              ),
              style: {
                position: "absolute",
                width: "100%",
                height: "100%",
                aspectRatio: 178 / 146,
                borderRadius: 20,
              },
            }),
            Image({
              source: ImageSource.fromTextureAsset(
                new Asset(BigInt(unSelectedBgAssetId)) as TextureAsset
              ),
              style: {
                position: "absolute",
                width: "100%",
                height: "100%",
                aspectRatio: 178 / 146,
                borderRadius: 20,
              },
            })
          ),
          // icon centers via flex alignment
          Image({
            source: ImageSource.fromTextureAsset(
              new Asset(BigInt(cfg.iconAsset.iconAssetId)) as TextureAsset
            ),
            style: {
              width: "auto",
              height: 50,
              aspectRatio: 111 / 86,
              // no absolute, no top/left
            },
          }),
          UINode.if(
            isSelected!,
            Image({
              source: ImageSource.fromTextureAsset(
                new Asset(BigInt("1123635715989092")) as TextureAsset
              ),
              style: {
                width: "auto",
                height: "98%",
                aspectRatio: 63 / 237,
                position: "absolute",
              },
            })
          ),
        ],
      }),
    ],
  });
}

function getDynamicHeightPercent(textureId: string): string {
  const key = Object.keys(waffleTextureIdMap).find(
    (k) => waffleTextureIdMap[k] === textureId
  );

  if (!key) {
    return "100%"; // Default if texture id not found
  }

  if (key.startsWith("waffle1_")) {
    return "90%";
  } else if (key.startsWith("waffle2_")) {
    return "95%";
  } else if (key.startsWith("waffle3_")) {
    return "100%";
  }

  return "100%"; // Default fallback
}

export function waffleLeftContainerContent() {
  return View({
    style: {
      height: "100%",
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 10,

      // backgroundColor: "rgba(255, 0, 0, 0.5)",
    },
    children: [
      Text({
        text: "Add a waffle to view",
        style: {
          fontSize: 38,
          color: "#002C87",
          fontFamily: "Bangers",
          textAlign: "center",
          alignSelf: "center",
        },
      }),
    ],
  });
}

export function scoopLeftContainerContent() {
  return View({
    style: {
      height: "100%",
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 10,
      // backgroundColor: "rgba(255, 0, 0, 0.5)",
    },
    children: [
      Text({
        text: "Add a scoop to view",
        style: {
          fontSize: 38,
          color: "#002C87",
          fontFamily: "Bangers",
          textAlign: "center",
          alignSelf: "center",
        },
      }),
    ],
  });
}

export function itemCustomizationLeftContainerContent(
  imageSourceBinding: Bindable<ImageSource>,
  isBuildButtonVisible: Bindable<boolean>,
  onBuildButtonClick: () => void,
  canAfford: Binding<boolean>,
  isPurchaseable: Binding<boolean>,
  costBinding: Binding<string>
) {
  return View({
    style: {
      backgroundColor: "#253C73",
      height: "100%",
      width: "100%",
      // aspectRatio: 480/462,
      justifyContent: "flex-end",
      flexDirection: "column",
      alignItems: "center",
      // left: "23%",
      // top: "21%",
      borderRadius: 30,
    },
    children: [
      Image({
        source: imageSourceBinding,
        style: {
          width: "auto",
          height: "50%",
          aspectRatio: 338 / 256,
          marginBottom: "10%",
        },
      }),

      View({
        style: {
          width: "auto",
          height: "26%",
          aspectRatio: 407 / 132,
          marginBottom: "5%",
        },
        children: [
          UINode.if(
            isBuildButtonVisible!,
            buildButton(
              onBuildButtonClick,
              canAfford,
              isPurchaseable,
              costBinding
            )
          ),
        ],
      }),
    ],
  });
}

function buildButton(
  onPress: () => void,
  canAfford: Binding<boolean>,
  isPurchaseable: Binding<boolean>,
  costBinding: Binding<string>
) {
  return UINode.if(
    canAfford,
    Pressable({
      onPress: onPress,
      style: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      },
      children: UINode.if(
        isPurchaseable,
        View({
          style: {
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          },
          children: [
            Image({
              source: ImageSource.fromTextureAsset(
                new Asset(BigInt("1557733862051692")) as TextureAsset
              ),
              style: {
                width: "100%",
                height: "100%",
                position: "absolute",
              },
            }),

            Text({
              text: costBinding,
              style: {
                color: "#104B16",
                fontFamily: "Bangers",
                textAlign: "center",
                bottom: "-20%",
                left: "5%",
                fontSize: 26,
              },
            }),
          ],
        }),

        View({
          style: {
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          },
          children: [
            Image({
              source: ImageSource.fromTextureAsset(
                new Asset(BigInt("2077608872805841")) as TextureAsset
              ),
              style: {
                width: "100%",
                height: "100%",
                aspectRatio: 340 / 132,
                position: "absolute",
              },
            }),
          ],
        })
      ),
    }),
    disabledBuildButton()
  );
}

function disabledBuildButton() {
  return Text({
    text: "not enough cash",
    style: {
      padding: "2%",
      color: "#FFFFFF",
      fontFamily: "Bangers",
      textAlign: "center",
      textAlignVertical: "center",
      fontSize: 32,
    },
  });
}
