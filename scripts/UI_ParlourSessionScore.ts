import { Asset, Player, PlayerVisibilityMode, PropTypes, TextureAsset } from 'horizon/core';
import { Binding, Image, ImageSource, Pressable, Text, UIComponent, UINode, View } from 'horizon/ui';
import { cashPoolManager, orderManager, playerManager } from 'Managers_Instance';

export default class UI_ParlourSessionScore extends UIComponent<typeof UI_ParlourSessionScore> {
  static propsDefinition = {
    backgroundAsset: { type: PropTypes.Asset },
  };

  private playersDoneSeeing: Player[] = [];

  private overallCashBinding = new Binding<string>("0");
  private totalOrdersBinding = new Binding<string>("0");
  private selfCashBinding = new Binding<string>("0");
  private scaleBinding = new Binding<number>(1);
  initializeUI(): UINode {
    return View({
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("1184374687204673")).as(TextureAsset)
          ),
          style: {
            position: "absolute",
            width: "30%",
            height: "57.5%",
          },
        }),
        View({
          style: {
            position: "absolute",
            width: "30%",
            height: "57.5%",
            // backgroundColor: "#0000005d",
          },
          children: [
            Pressable({
              onPress: (player: Player) => {
                this.scaleBinding.set(0.9);
                this.playersDoneSeeing.push(player);
                this.updateUI();
                this.async.setTimeout(() => this.scaleBinding.set(1), 100);
              },
              style: {
                position: "absolute",
                left: "30%",
                bottom: "8%",
                height: "15%",
                width: "auto",
                aspectRatio: 321 / 121,
                transform: [{ scale: this.scaleBinding }],
                // backgroundColor: "#ff0000aa",
              },
              children: Image({
                source: ImageSource.fromTextureAsset(
                  new Asset(BigInt("1125203626385804")).as(TextureAsset)
                ),
                style: {
                  height: "100%",
                  width: "100%",
                },
              }),
            }),
            Text({
              text: this.overallCashBinding,
              style: {
                position: "absolute",
                color: "#7D5B0C",
                fontSize: 38,
                fontWeight: "bold",
                textAlign: "right",
                textAlignVertical: "center",
                height: 40,
                width: "auto",
                aspectRatio: 150 / 56,
                right: "9%",
                top: "25%",
                alignSelf: "flex-end",
                fontFamily: "Roboto",
                // backgroundColor: "rgba(76, 236, 18, 0.83)",
              },
            }),
            Text({
              text: this.totalOrdersBinding,
              style: {
                position: "absolute",
                color: "#7D5B0C",
                fontSize: 38,
                fontWeight: "bold",
                textAlign: "right",
                textAlignVertical: "center",
                height: 40,
                width: "auto",
                aspectRatio: 150 / 56,
                right: "54%",
                top: "25%",
                alignSelf: "flex-end",
                fontFamily: "Roboto",
              },
            }),
            Text({
              text: this.selfCashBinding,
              style: {
                position: "absolute",
                color: "#7D5B0C",
                fontSize: 44,
                fontWeight: "bold",
                textAlign: "left",
                textAlignVertical: "center",
                height: 60,
                width: "auto",
                aspectRatio: 184 / 103,
                right: "15%",
                top: "56%",
                alignSelf: "flex-end",
                fontFamily: "Roboto",
                // backgroundColor: "rgba(18, 233, 72, 1)"
              },
            }),
          ],
        }),
      ],
      style: {
        height: "100%",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
      },
    });
  }

  start(): void {
    // this.async.setTimeout(() => {
    //   this.showUI();
    // }, 5000);
  }

  updateUI() {
    const allPlayers = playerManager?.getCurrentPlayers() || [];
    if (allPlayers.length === this.playersDoneSeeing.length) {
      // console.log.*$
      this.entity.visible.set(false);
      this.playersDoneSeeing = [];
      return;
    }
    const playersStillSeeing = allPlayers.filter(p => !this.playersDoneSeeing.includes(p));
    this.entity.visible.set(true);

    this.entity.setVisibilityForPlayers(this.playersDoneSeeing, PlayerVisibilityMode.HiddenFrom);
    this.entity.setVisibilityForPlayers(playersStillSeeing, PlayerVisibilityMode.VisibleTo);
  }

  showUI() {
    // Set the bindings
    this.overallCashBinding.set(cashPoolManager?.getAmountInCashPool().toString() || "0");
    this.totalOrdersBinding.set(orderManager?.getCompletedOrderCount().toString() || "0");

    for (const player of playerManager?.getCurrentPlayers() || []) {
      this.selfCashBinding.set(playerManager?.getSessionCashEarned(player).toString() || "0", [player]);
    }

    this.playersDoneSeeing = [];
    this.updateUI();
  }
}
UIComponent.register(UI_ParlourSessionScore);
