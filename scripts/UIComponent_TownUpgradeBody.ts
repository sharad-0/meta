import {
  backgroundImage,
  colorConfig,
  decorationConfig,
  itemAffordableCosts,
  itemButtonCard,
  scoopTabContentConfig,
  selectedCustomizationItemInterface,
  TownUpgradeTabTypes,
  TownUpgradeUiHeader,
  TownUpgradeUiTabs,
  waffleTabContentConfig,
} from "Constants_TownHouse";
import { ColorCombinations } from "Enums_Game";
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

// Waffle tab UI container
export function waffleTabContent(
  onColorSelected: (color: string) => void,
  onBuyCallback: (itemId: string) => void,
  lockedWafflesIndexBindings: Binding<boolean>[],
  selectedWaffleIndexBindings: Binding<boolean>[],
  selectedWaffleColorIndexBindings: Binding<boolean>[],
  prevUsedWaffleIndexBindings: Binding<boolean>[],
  itemBgImageSourceBinding: Binding<ImageSource>,
  itemClickableBinding: Binding<boolean>[]
) {
  const tabConfig = waffleTabContentConfig;
  let itemCards: UINode[];
  itemCards = tabConfig.itemCards.map((cfg, idx) => {
    return createWaffleItemCard(
      cfg,
      idx,
      lockedWafflesIndexBindings?.[idx],
      selectedWaffleIndexBindings?.[idx],
      itemClickableBinding?.[idx],
      onBuyCallback,
      prevUsedWaffleIndexBindings?.[idx]
    );
  });
  const colorBoxes = tabConfig.colors.map((colorCfg, index) =>
    createColorBox(
      colorCfg,
      selectedWaffleColorIndexBindings?.[index],
      onColorSelected
    )
  );

  return View({
    style: { width: "55%", height: "90%", left: "22%", borderRadius: 30 },
    children: [
      Text({
        text: tabConfig.upperText,
        style: {
          fontSize: tabConfig.textFontSize,
          fontFamily: tabConfig.textFontFamiley as FontFamily,
          color: tabConfig.textColor,
          top: `${tabConfig.upperTextTopPercent}%`,
          left: `${tabConfig.upperTextLeftPercent}%`,
        },
      }),
      View({
        children: [
          Image({
            source: itemBgImageSourceBinding,
            style: {
              width: "100%",
              height: `auto`,
              aspectRatio: 718 / 219,
              position: "absolute",
              top: "0%",
              left: "0%",
            },
          }),

          ...itemCards,
        ],
        style: {
          flexDirection: "row",
          justifyContent: "space-between",
          width: "98%",
          height: "50.3%",
          // backgroundColor: "#2656B9",
          borderRadius: 30,
          top: "0%",
        },
      }),
      Text({
        text: tabConfig.bottomText,
        style: {
          fontSize: tabConfig.textFontSize,
          fontFamily: tabConfig.textFontFamiley as FontFamily,
          color: tabConfig.textColor,
          left: `${tabConfig.bottomTextLeftPercent}%`,
        },
      }),
      View({
        style: {
          flexDirection: "row",
          width: "100%",
          height: "34.3%",
          // backgroundColor: "#2656B9",
          justifyContent: "space-evenly",
          alignContent: "center",
          alignItems: "center",
          borderRadius: 30,
          bottom: "-1.5%",
        },
        children: colorBoxes,
      }),
    ],
  });
}

// Scoop tab UI container
export function scoopTabContent(
  onDecorationSelected: (decor: decorationConfig) => void,
  onBuyCallback: (itemId: string) => void,
  lockedScoopIndexBindings: Binding<boolean>[],
  selectedScoopIndexBindings: Binding<boolean>[],
  prevUsedScoopIndexBindings: Binding<boolean>[]
) {
  const tabConfig = scoopTabContentConfig;

  const itemCards = tabConfig.itemCards.map((cfg, idx) =>
    createScoopItemCard(
      cfg,
      idx,
      lockedScoopIndexBindings?.[idx],
      selectedScoopIndexBindings?.[idx],
      onBuyCallback,
      prevUsedScoopIndexBindings?.[idx]
    )
  );

  const decorationBoxes = tabConfig.decoration.map((decorationCfg) =>
    createDecorationBox(decorationCfg, onDecorationSelected)
  );

  return View({
    style: { width: "55%", height: "90%", left: "22%", borderRadius: 30 },
    children: [
      Text({
        text: tabConfig.upperText,
        style: {
          fontSize: tabConfig.textFontSize,
          fontFamily: tabConfig.textFontFamiley as FontFamily,
          color: tabConfig.textColor,
          top: `${tabConfig.upperTextTopPercent}%`,
          left: `${tabConfig.upperTextLeftPercent}%`,
        },
      }),
      View({
        children: itemCards,
        // contentContainerStyle: {
        //   flexDirection: "row",
        //   alignItems: "center",
        //   justifyContent: "space-around",
        //   // backgroundColor: "#26b926ff",
        // },
        // horizontal: true,
        style: {
          flexDirection: "row",
          justifyContent: "space-evenly",
          width: "100%",
          height: "50.3%",
          // backgroundColor: "#2656B9",
          borderRadius: 30,
          top: "0%",
        },
      }),
      Text({
        text: tabConfig.bottomText,
        style: {
          fontSize: tabConfig.textFontSize,
          fontFamily: tabConfig.textFontFamiley as FontFamily,
          color: tabConfig.textColor,
          left: `${tabConfig.bottomTextLeftPercent}%`,
        },
      }),
      View({
        style: {
          flexDirection: "row",
          width: "100%",
          height: "34.3%",
          // backgroundColor: "#2656B9",
          justifyContent: "space-evenly",
          alignContent: "center",
          alignItems: "center",
          borderRadius: 30,
          bottom: "-1.5%",
        },
        children: decorationBoxes,
      }),
    ],
  });
}

// Customization tab UI container
export function customizationTabContent() {
  return View({
    style: {
      width: "100%",
      height: "100%",
      // backgroundColor: "#18191aa1",
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      alignContent: "center",
    },
    children: [
      Text({
        text: "select the elements on tower to add / customise",
        style: {
          fontSize:
            TownUpgradeUiHeader[TownUpgradeTabTypes.Customization].fontSize,
          color: "#C0D5FF",
          fontFamily: TownUpgradeUiHeader[TownUpgradeTabTypes.Customization]
            .fontFamily as FontFamily,
          alignContent: "center",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          width: "60%",
          paddingHorizontal: "2%",
        },
      }),
      // Add more customization content here as needed
    ],
  });
}

// Helper to create an item card UI node
function createScoopItemCard(
  cfg: itemButtonCard,
  index: number,
  locked: Binding<boolean> = new Binding(false),
  selected: Binding<boolean> = new Binding(false),
  onBuyCallback: (itemId: string) => void,
  prevUsed?: Binding<boolean>
) {
  const lockedButtonAssetId = [
    BigInt("1539840803851182"),
    BigInt("1539840803851182"),
    BigInt("1815106992465734"),
  ];
  return View({
    style: {
      alignContent: "center",
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: "2%",
      position: "relative",
    },
    children: [
      UINode.if(
        locked,
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(lockedButtonAssetId[index]) as TextureAsset
          ),
          style: {
            width: "auto",
            height: "85%",
            aspectRatio: 200 / 205,
            alignContent: "center",
            justifyContent: "center",
            alignItems: "center",
          },
        }),
        unlocScoopButton(cfg, selected, onBuyCallback, prevUsed)
      ),
    ],
  });
}
function unlocScoopButton(
  cfg: itemButtonCard,
  selected: Binding<boolean> = new Binding(false),
  onBuyCallback: (itemId: string) => void,
  prevUsed?: Binding<boolean>
) {
  return Pressable({
    style: {
      alignContent: "center",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      height: "100%",
    },
    onPress: () => {
      onBuyCallback(cfg.iconAsset.itemId!);
    },
    children: [
      UINode.if(
        selected,
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("780032734940799")) as TextureAsset
          ),
          style: {
            width: "auto",
            height: "85%",
            aspectRatio: 200 / 205,
          },
        }),
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("1331043505311841")) as TextureAsset
          ),
          style: {
            width: "auto",
            height: "85%",
            aspectRatio: 200 / 205,
          },
        })
      ),
      Image({
        source: ImageSource.fromTextureAsset(
          new Asset(BigInt(cfg.iconAsset.iconAssetId)) as TextureAsset
        ),
        style: {
          width: `${cfg.iconAsset.widthPercent}%`,
          height: `${cfg.iconAsset.heightPercent}%`,
          aspectRatio: cfg.iconAsset.aspectRatio,
          position: "absolute",
          // top: `${cfg.iconAsset.topPercent}%`,
          bottom: "40%",
          // left: `${cfg.iconAsset.leftPercent}%`,
        },
      }),

      UINode.if(
        prevUsed!,
        View({
          style: {
            width: "100%",
            height: `auto`,
            aspectRatio: cfg.buyButtonAsset.aspectRatio,
            position: "absolute",
            bottom: "6%",
            // backgroundColor: "#FFDB95",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            // borderBottomLeftRadius: 15,
            // borderBottomRightRadius: 15,
            // paddingHorizontal: "20%",
          },
          children: [
            Text({
              text: "Current",
              style: {
                color: "#0c0c0bff",
                fontFamily: "Bangers",
                textAlign: "center",
                alignSelf: "center",
              },
            }),
          ],
        }),
        View({
          style: {
            width: "100%",
            height: `auto`,
            aspectRatio: cfg.buyButtonAsset.aspectRatio,
            position: "absolute",
            bottom: "6%",
            // backgroundColor: "#A0FF97",
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            borderBottomLeftRadius: 15,
            borderBottomRightRadius: 15,
            paddingHorizontal: "20%",
          },
          children: [
            Image({
              source: ImageSource.fromTextureAsset(
                new Asset(BigInt("2272011469965228")) as TextureAsset
              ),
              style: {
                width: "auto",
                height: `70%`,
                aspectRatio: 1,
              },
            }),

            Text({
              text: itemAffordableCosts[
                cfg.iconAsset.itemId as keyof typeof itemAffordableCosts
              ].cost.toString(),
              style: {
                color: "#104B16",
                fontFamily: "Bangers",
                textAlign: "center",
                alignSelf: "center",
                marginLeft: 5,
              },
            }),
          ],
        })
      ),
      
    ],
  });
}

function createWaffleItemCard(
  cfg: itemButtonCard,
  index: number,
  locked: Binding<boolean> = new Binding(false),
  selected: Binding<boolean> = new Binding(false),
  clickable: Binding<boolean> = new Binding(true),

  onBuyCallback: (itemId: string) => void,
  prevUsed?: Binding<boolean>
) {
  const lockedButtonAssetId = [
    BigInt("783045184475874"),
    BigInt("783045184475874"),
    BigInt("1509317086873544"),
  ];
  return View({
    style: {
      alignContent: "center",
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: "2%",
      position: "relative",
    },
    children: [
      UINode.if(
        locked,
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(lockedButtonAssetId[index]) as TextureAsset
          ),
          style: {
            width: "auto",
            height: "85%",
            aspectRatio: 200 / 205,
            alignContent: "center",
            justifyContent: "center",
            alignItems: "center",
          },
        }),
        unlockedWaffleButton(cfg, selected, onBuyCallback, clickable, prevUsed)
      ),
    ],
  });
}

function unlockedWaffleButton(
  cfg: itemButtonCard,
  selected: Binding<boolean> = new Binding(false),
  onBuyCallback: (itemId: string) => void,
  clickable: Binding<boolean> = new Binding(true),
  prevUsed?: Binding<boolean>
) {
  return UINode.if(
    clickable,
    Pressable({
      style: {
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      },
      onPress: () => {
        onBuyCallback(cfg.iconAsset.itemId!);
      },
      children: [
        UINode.if(
          selected,
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
        UINode.if(
          selected,
          Image({
            source: ImageSource.fromTextureAsset(
              new Asset(BigInt("780032734940799")) as TextureAsset
            ),
            style: {
              width: "auto",
              height: "85%",
              aspectRatio: 200 / 205,
            },
          }),
          Image({
            source: ImageSource.fromTextureAsset(
              new Asset(BigInt("1331043505311841")) as TextureAsset
            ),
            style: {
              width: "auto",
              height: "85%",
              aspectRatio: 200 / 205,
            },
          })
        ),
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt(cfg.iconAsset.iconAssetId)) as TextureAsset
          ),
          style: {
            width: `${cfg.iconAsset.widthPercent}%`,
            height: `${cfg.iconAsset.heightPercent}%`,
            aspectRatio: cfg.iconAsset.aspectRatio,
            position: "absolute",
            bottom: "28%",
          },
        }),

        UINode.if(
          prevUsed!,
          View({
            style: {
              width: "100%",
              height: `auto`,
              aspectRatio: cfg.buyButtonAsset.aspectRatio,
              position: "absolute",
              bottom: "6%",
              // backgroundColor: "#FFDB95",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              // borderBottomLeftRadius: 15,
              // borderBottomRightRadius: 15,
              // paddingHorizontal: "20%",
            },
            children: [
              Text({
                text: "Current",
                style: {
                  color: "#0c0c0bff",
                  fontFamily: "Bangers",
                  textAlign: "center",
                  alignSelf: "center",
                },
              }),
            ],
          }),
          View({
            style: {
              width: "100%",
              height: `auto`,
              aspectRatio: cfg.buyButtonAsset.aspectRatio,
              position: "absolute",
              bottom: "6%",
              // backgroundColor: "#A0FF97",
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
              borderBottomLeftRadius: 15,
              borderBottomRightRadius: 15,
              paddingHorizontal: "20%",
            },
            children: [
              Image({
                source: ImageSource.fromTextureAsset(
                  new Asset(BigInt("2272011469965228")) as TextureAsset
                ),
                style: {
                  width: "auto",
                  height: `70%`,
                  aspectRatio: 1,
                },
              }),

              Text({
                text: itemAffordableCosts[
                  cfg.iconAsset.itemId as keyof typeof itemAffordableCosts
                ].cost.toString(),
                style: {
                  color: "#104B16",
                  fontFamily: "Bangers",
                  textAlign: "center",
                  alignSelf: "center",
                  marginLeft: 5,
                },
              }),
            ],
          })
        ),
        UINode.if(
          selected,
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
    Pressable({
      style: {
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      },
      onPress: () => {
        // onBuyCallback(cfg.iconAsset.itemId!);
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("1470386847445261")) as TextureAsset
          ),
          style: {
            width: "auto",
            height: "85%",
            aspectRatio: 200 / 205,
          },
        }),

        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt(cfg.iconAsset.iconAssetId)) as TextureAsset
          ),
          style: {
            width: `${cfg.iconAsset.widthPercent}%`,
            height: `${cfg.iconAsset.heightPercent}%`,
            aspectRatio: cfg.iconAsset.aspectRatio,
            position: "absolute",
            bottom: "28%",
            // left: `${cfg.iconAsset.leftPercent}%`,
          },
        }),

        // UINode.if(
        //   prevUsed!,
        //   View({
        //     style: {
        //       width: "100%",
        //       height: `auto`,
        //       aspectRatio: cfg.buyButtonAsset.aspectRatio,
        //       position: "absolute",
        //       bottom: "6%",
        //       // backgroundColor: "#FFDB95",
        //       flexDirection: "row",
        //       justifyContent: "center",
        //       alignItems: "center",
        //       // borderBottomLeftRadius: 15,
        //       // borderBottomRightRadius: 15,
        //       // paddingHorizontal: "20%",
        //     },
        //     children: [
        //       Text({
        //         text: "Current",
        //         style: {
        //           color: "#0c0c0bff",
        //           fontFamily: "Bangers",
        //           textAlign: "center",
        //           alignSelf: "center",
        //         },
        //       }),
        //     ],
        //   }),
        //   View({
        //     style: {
        //       width: "100%",
        //       height: `auto`,
        //       aspectRatio: cfg.buyButtonAsset.aspectRatio,
        //       position: "absolute",
        //       bottom: "6%",
        //       // backgroundColor: "#A0FF97",
        //       flexDirection: "row",
        //       justifyContent: "space-around",
        //       alignItems: "center",
        //       borderBottomLeftRadius: 15,
        //       borderBottomRightRadius: 15,
        //       paddingHorizontal: "20%",
        //     },
        //     children: [
        //       Image({
        //         source: ImageSource.fromTextureAsset(
        //           new Asset(BigInt("2272011469965228")) as TextureAsset
        //         ),
        //         style: {
        //           width: "auto",
        //           height: `70%`,
        //           aspectRatio: 1,
        //         },
        //       }),

        //       Text({
        //         text: itemAffordableCosts[
        //           cfg.iconAsset.itemId as keyof typeof itemAffordableCosts
        //         ].cost.toString(),
        //         style: {
        //           color: "#104B16",
        //           fontFamily: "Bangers",
        //           textAlign: "center",
        //           alignSelf: "center",
        //           marginLeft: 5,
        //         },
        //       }),
        //     ],
        //   })
        // ),
      ],
    })
  );
}

// Helper to create color box UI node
function createColorBox(
  colorCfg: colorConfig,
  selected: Binding<boolean> = new Binding(false),
  onColorSelected?: (color: string) => void
) {
  return Pressable({
    onPress: () => {
      onColorSelected?.(colorCfg.color);
    },
    style: {
      width: `${colorCfg.widthPercent}%`,
      height: `${colorCfg.heightPercent}%`,
      aspectRatio: colorCfg.aspectRatio,
      position: "relative",
      marginBottom: "3%",
    },
    children: [
      UINode.if(
        selected,
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(
              BigInt(colorCfg.selectedBackgroundAssetId)
            ) as TextureAsset
          ),
          style: {
            width: "100%",
            height: "100%",
            aspectRatio: colorCfg.aspectRatio,
          },
        }),
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(
              BigInt(colorCfg.unselectedBackgroundAssetId)
            ) as TextureAsset
          ),
          style: {
            width: "100%",
            height: "100%",
            aspectRatio: colorCfg.aspectRatio,
          },
        })
      ),
      View({
        style: {
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "80%",
          height: "80%",
          backgroundColor: colorCfg.color,
          borderRadius: 15,
        },
      }),
      UINode.if(
        selected,
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt(colorCfg.tickMarkAsset.assetId)) as TextureAsset
          ),
          style: {
            width: colorCfg.tickMarkAsset.widthPercent,
            height: `${Number(colorCfg.tickMarkAsset.heightPercent) * 2}%`,
            aspectRatio: colorCfg.tickMarkAsset.aspectRatio,
            position: "absolute",
            alignSelf: "center",
            top: "25%",
          },
        })
      ),
    ],
  });
}

// Helper to create decoration box UI node
function createDecorationBox(
  decorationCfg: decorationConfig,
  onDecorationSelected: (decor: decorationConfig) => void
) {
  return Pressable({
    onPress: () => {
      onDecorationSelected?.(decorationCfg);
    },
    style: {
      width: `${decorationCfg.widthPercent}%`,
      height: `${decorationCfg.heightPercent}%`,
      aspectRatio: decorationCfg.aspectRatio,
      position: "relative",
    },
    children: [
      Image({
        source: ImageSource.fromTextureAsset(
          new Asset(
            BigInt(decorationCfg.unselectedBackgroundAssetId)
          ) as TextureAsset
        ),
        style: {
          width: "100%",
          height: "100%",
          aspectRatio: decorationCfg.aspectRatio,
        },
      }),
      Text({
        text: decorationCfg.decoration,
        style: {
          position: "absolute",
          top: "30%",
          left: "20%",
          fontSize: 14,
          color: "#fff",
          fontFamily: "Bangers",
        },
      }),
    ],
  });
}
