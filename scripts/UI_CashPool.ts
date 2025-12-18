import * as hz from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { CashPoolUpdatedEvent } from "Manager_Events";
import { cashPoolManager, gameManager, playerManager } from "Managers_Instance";

export default class UI_CashPool extends UIComponent<typeof UI_CashPool> {
  static propsDefinition = {
    background: { type: hz.PropTypes.Asset },
    cashIcon: { type: hz.PropTypes.Asset },
  };

  private cashEarnedThisSession: Binding<string> = new Binding("0");

  initializeUI(): UINode {
    return View({
      style: {
        alignSelf: "center",
        width: "100%",
        height: "100%",
        alignContent: "center",
        justifyContent: "center",
      },
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            this.props.background!.as(hz.TextureAsset)
          ),
          style: {
            resizeMode: "contain",
            width: "100%",
            height: "100%",
            position: "absolute",
          },
        }),
        View({
          style: {
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
          },
          children: [
            Image({
              source: ImageSource.fromTextureAsset(
                this.props.cashIcon!.as(hz.TextureAsset)
              ),
              style: {
                width: "30%",
                height: "30%",
              },
            }),
            Text({
              text: this.cashEarnedThisSession,
              style: {
                fontSize: 150,
                color: "#ffffffff",
                fontFamily: "Roboto",
                fontWeight: "bold",
                textAlign: "center",
                // marginTop: 10,
              },
            }),
          ],
        }),
      ],
    });
  }

  start() {
    this.connectLocalBroadcastEvent(CashPoolUpdatedEvent, () =>
      this.updateUI()
    );
    this.updateUI();
  }

  updateUI() {
    // const players = playerManager?.getCurrentPlayerRecs();
    let totalCash = 0;
    // if (players) {
    //   for (const player of players) {
    //     // console.log.*$
    //       `Player ${player.name} has earned ${player.cashEarnedInSession} this session.`
    //     );
    //     totalCash += player.cashEarnedInSession;
    //   }
    // }

    totalCash = cashPoolManager?.getAmountInCashPool() || 0;

    if (totalCash > 1000) {
      totalCash /= 1000;
      totalCash = Math.round(totalCash * 100) / 100; // round to 2 decimal places
      this.cashEarnedThisSession.set(totalCash.toString() + "K");
      return;
    } else {
      this.cashEarnedThisSession.set(totalCash.toString());
    }
  }
}
UIComponent.register(UI_CashPool);
