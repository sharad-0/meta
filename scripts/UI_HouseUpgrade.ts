import { Image, Text, UIComponent, UINode, View, ImageSource, Binding, Pressable } from 'horizon/ui';
import { Asset, Player, PropTypes } from 'horizon/core';
import { TextureAsset } from 'horizon/2p';
import { WaffleUpgradeCost } from 'Enums_Game';
import { playerManager } from 'Managers_Instance';

export type levelStatus = 'locked' | 'unlocked' | 'upgraded';

export default class UI_HouseUpgrade extends UIComponent<typeof UI_HouseUpgrade> {
  static propsDefinition = {
    backgroundImage: {type: PropTypes.Asset },
    closeButton: { type: PropTypes.Asset },

    Scoop1Icon: {type: PropTypes.Asset },
    Scoop2Icon: {type: PropTypes.Asset },
    Scoop3Icon: {type: PropTypes.Asset },

    unlockedState: {type: PropTypes.Asset },
    lockedState: {type: PropTypes.Asset },
    upgradedState: {type: PropTypes.Asset },

    starIcon: {type: PropTypes.Asset },
    cashIcon: {type: PropTypes.Asset }

  };

  public onUpgradePressed?: (player: Player) => void;
  public onClosePressed?: () => void;

  scoop1Text = new Binding<string>("Unlocks at 0 XP");
  scoop2Text = new Binding<string>("Unlocks at 100 XP");
  scoop3Text = new Binding<string>("Unlocks at 200 XP");

  scoop1BgTex = new Binding<ImageSource | null>(null);
  scoop2BgTex = new Binding<ImageSource | null>(null);
  scoop3BgTex = new Binding<ImageSource | null>(null);

  scoop1CashIcon = new Binding<boolean>(false);
  scoop2CashIcon = new Binding<boolean>(false);
  scoop3CashIcon = new Binding<boolean>(false);

  playerLevel = new Binding<string>("1");
  expBinding = new Binding<string>("0/1 XP");
  cashBinding = new Binding<string>("0");
  levelFillWidth = new Binding<number>(0);

  private scoopConfig: Record<number, { asset: () => Readonly<Asset>; aspect: number; width: number }> = {
    1: { asset: () => this.props.Scoop1Icon!, aspect: 148 / 204, width: 90 },
    2: { asset: () => this.props.Scoop2Icon!, aspect: 148 / 204, width: 90 },
    3: { asset: () => this.props.Scoop3Icon!, aspect: 125 / 194, width: 90 },
  };

  private readonly bindings: Record<
    number,
    {
      bgTexture: Binding<ImageSource | null>;
      btnText: Binding<string>;
      cashIcon: Binding<boolean>;
    }
  > = {
    1: {
      bgTexture: this.scoop1BgTex ?? ImageSource.fromTextureAsset(this.props.lockedState!.as(TextureAsset)),
      btnText: this.scoop1Text,
      cashIcon: this.scoop1CashIcon,
    },
    2: {
      bgTexture: this.scoop2BgTex ?? ImageSource.fromTextureAsset(this.props.lockedState!.as(TextureAsset)),
      btnText: this.scoop2Text,
      cashIcon: this.scoop2CashIcon,
    },
    3: {
      bgTexture: this.scoop3BgTex ?? ImageSource.fromTextureAsset(this.props.lockedState!.as(TextureAsset)),
      btnText: this.scoop3Text,
      cashIcon: this.scoop3CashIcon,
    },
  };


  initializeUI(): UINode {
    return View({
      style: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      },
      children: [
        View({
          children: [
            /* Background image */
            Image({
              source: ImageSource.fromTextureAsset(this.props.backgroundImage!.as(TextureAsset)),
              style: {
                width: "100%",
                height: "110%",
                position: "absolute",
              },
            }),

            View({
              style: {
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "flex-start",
              },
              children: [
                this.upgradeButtons(),
                this.levelSection(),
              ]
            }),

            this.closeButton(),
          ],
          style: {
            width: "65%",
            height: "70%",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          },
        }),
      ],
    });
  }

  private levelSection(): UINode {
    return View({
      style: {
        // backgroundColor: "rgba(0, 0, 0, 0.05)",
        bottom: -15,
        width: "100%",
        height: "5%",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        // marginVertical: "2%",
        zIndex: 100,
      },
      children: [
        // level / progress bar
        View({
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.39)",
            borderRadius: 30,
            width: 200,
            height: 45,
            justifyContent: "center",
            alignItems: "flex-start",
            flexDirection: "row",
            marginHorizontal: "5%",
          },
          children: [
            // star icon
            View({
              style: { 
                left: -15,
                width: "20%",
                alignItems: "center",
                justifyContent: "center"
              },
              children: [
                Image({
                  source: ImageSource.fromTextureAsset(this.props.starIcon?.as(TextureAsset)!),
                  style: { width: 60, height: 60, position: "absolute" }
                }),
                Text({ text: this.playerLevel, style: { color: "black", fontWeight: "bold", fontSize: 32, fontFamily: "Bangers" } }),
              ],
            }),
            // xp / progress bar
            View({
              style: { 
                width: "70%",
                height: "100%",
                // backgroundColor: "rgba(0, 0, 0, 0.7)",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                top: "10%"
              },
              children: [
                // xp
                View({
                  style: { left: 0, right: 0, alignItems: "center" },
                  children: [
                    Text({ text: this.expBinding, style: { color: "white", fontWeight: "bold", fontSize: 30, fontFamily: "Bangers" } }),
                  ],
                }),
                // progress bar
                View({
                  style: {
                    width: "90%", height: 15, bottom: 0,
                    backgroundColor: "#2a2a2a",
                    borderRadius: 13, padding: 3, justifyContent: "center",
                  },
                  children: [
                    View({
                      style: {
                        width: this.levelFillWidth, height: "100%",
                        backgroundColor: "#2bdc42", borderRadius: 10,
                      },
                    }),
                  ],
                }),
              ],
            })
          ]
        }),
        // cash section
        View({
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderRadius: 30,
            width: 175,
            height: 45,
            marginHorizontal: "5%",
          },
          children:[
            // cash icon
            View({
              style: { 
                width: "100%",
                alignItems: "flex-start",
                justifyContent: "center",
                flexDirection: "row",
              },
              children: [
                Image({
                  source: ImageSource.fromTextureAsset(this.props.cashIcon?.as(TextureAsset)!),
                  style: { width: 60, height: 60, position: "absolute", left: -15, bottom: -5 }
                }),
                Text({ text: this.cashBinding, style: { color: "white", fontWeight: "bold", fontSize: 35, fontFamily: "Bangers" } }),
              ],
            }),
          ]
        })
      ]
    })
  }

  private upgradeButtons(): UINode {
    return View({
      children: [this.upgradeCard(1), this.upgradeCard(2), this.upgradeCard(3)],
      style: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "80%",
        height: "85%",
        marginVertical: "1.5%",
        // top: "2%",
        // padding: "10%",
      },
    });
  }

  private upgradeCard(level: number): UINode {
    const cardWidth = 250;
    const aspectRatio = 320 / 432;
    const desiredHeight = cardWidth / aspectRatio;

    const { bgTexture, btnText, cashIcon } = this.bindings[level];
    return View({
      style: {
        alignItems: "center",
        justifyContent: "space-evenly",
        width: cardWidth,
        height: desiredHeight,
        marginHorizontal: "2.5%",
      },
      children: [
        Image({
          source: bgTexture,
          style: {
            width: "100%",
            height: "100%",
            paddingTop: "10%",
            position: "absolute",
          },
        }),
        View({
          style: {
            width: "100%",
            height: "100%",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
          },
          children: [
            View({
              style: {
                width: "100%",
                height: "70%",
                alignItems: "center",
                justifyContent: "flex-end",
                flexDirection: "column",
                paddingVertical: "5%",
                bottom: "5%"
              },
              children: [
                /* Role icon */
                this.getScoopIcon(level),
                /* Role name */
                Text({
                  text: level === 1 ? "CONE CABIN" : level === 2 ? "CONE VILLA" : "CONE CASTLE",
                  style: {
                    fontSize: 35,
                    fontWeight: "bold",
                    color: "black",
                    fontFamily: "Bangers"
                  },
                }),
              ]
            }),
            View({
              style: {
                width: "100%",
                height: "30%",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              },
              children: [
                Pressable({
                  onClick: (p: Player) => {
                    if (this.onUpgradePressed) {
                      this.onUpgradePressed(p);
                    }
                  },
                  onEnter: (p: Player) => {},
                  onExit: (p: Player) => {},
                  children: [
                    UINode.if(cashIcon, Image({
                      source: ImageSource.fromTextureAsset(this.props.cashIcon!.as(TextureAsset)),
                      style: { width: 50, height: 50, marginRight: 10}
                    })),
                    Text({
                      text: btnText,
                      style: {
                        fontSize: 28,
                        fontFamily: "Bangers",
                        fontWeight: "bold",
                        color: "#294e1aff",
                      },
                    }),
                  ],
                  style: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }
                }),
              ]
            }),
          ]
        }),
      ]
    });
  }

  private getScoopIcon(level: number): UINode {
    const cfg = this.scoopConfig[level];
    if (!cfg) return Text({ text: "Error" });

    return Image({
      source: ImageSource.fromTextureAsset(cfg.asset().as(TextureAsset)),
      style: {
        width: cfg.width,
        height: cfg.width / cfg.aspect,
        // paddingTop: "10%",
      },
    });
  }

  private getButtonText(player: Player,status: levelStatus, level: number): string {    
    switch (status) {
      case "locked":
        if (playerManager?.houseLevelLocked(player, WaffleUpgradeCost.get(level)?.[0]!) ?? false) {
          return `REACH LEVEL ${WaffleUpgradeCost.get(level)?.[0]}`;
        } else if (playerManager?.houseCashLocked(player, WaffleUpgradeCost.get(level)?.[1]!) ?? false) {
          return `${WaffleUpgradeCost.get(level)?.[1]}`;
        }
      case "unlocked":
        return `${WaffleUpgradeCost.get(level)?.[1]}`;
      case "upgraded":
        return "";
    }
  }

  private getButtonBg(status: levelStatus): ImageSource {
    switch(status) {
      case "locked":
        return ImageSource.fromTextureAsset(this.props.lockedState!.as(TextureAsset));
      case "unlocked":
        return ImageSource.fromTextureAsset(this.props.unlockedState!.as(TextureAsset));
      case "upgraded":
        return ImageSource.fromTextureAsset(this.props.upgradedState!.as(TextureAsset));
    }
  }

  closeButton() {
    return View({
      style: {
        top: "10%",
        left: -60,
        zIndex: 10,
        position: "absolute",
      },
      children: [
        Pressable({
          onPress: (player) => {
            if (this.onClosePressed) {
              this.onClosePressed();
            }
          },
          children: [
            Image({
              source: ImageSource.fromTextureAsset(this.props.closeButton!),
              style: {
                width: 60,
                height: 60,
              },
            }),
          ],
        }),
      ],
    });
  }

  refreshUI(player: Player) {
    const b = this.bindings;

    [1, 2, 3].forEach((level) => {
      const playerHouseLevel = playerManager?.getHouseLevel(player);
      const status: levelStatus = playerHouseLevel! >= level ? "upgraded" : playerManager?.canAffordUpgrade(player, WaffleUpgradeCost.get(level)?.[0]!, WaffleUpgradeCost.get(level)?.[1]!) ? "unlocked" : "locked";
      
      const levelLocked = playerManager?.houseLevelLocked(player, WaffleUpgradeCost.get(level)?.[0]!) ?? false;
      const houseCashLocked = playerManager?.houseCashLocked(player, WaffleUpgradeCost.get(level)?.[1]!) ?? false;

      b[level].bgTexture.set(this.getButtonBg(status));
      b[level].btnText.set(this.getButtonText(player, status, level));
      b[level].cashIcon.set(status === "unlocked" || (status === "locked" && !levelLocked && houseCashLocked));
    });

    const exp = playerManager?.getExp(player) ?? 0; // default to 0 if undefined
    const level = playerManager?.getLevel(exp) ?? 0;
    const levelCap = playerManager?.getLevelCap(level + 1) ?? 1; // avoid division by zero
    const prevCap = playerManager?.getLevelCap(level) ?? 0; // previous level cap, default to 0
    
    this.playerLevel.set(`${level}`);
    this.expBinding.set(`${exp - prevCap}/${levelCap} XP`);
    this.levelFillWidth.set(((exp - prevCap) / levelCap) * 100);

    const cash = playerManager?.getCash(player);
    this.cashBinding.set(`${cash}`);
  }
  
}
UIComponent.register(UI_HouseUpgrade);
