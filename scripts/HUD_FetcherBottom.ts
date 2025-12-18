import { UIComponent, View, Text, Binding, UINode } from "horizon/ui";
import { PlayerRoles } from "Enums_Game";
import { Player } from "horizon/core";
import { bagManager, playerManager } from "Managers_Instance";

class HUD_FetcherBottom extends UIComponent<typeof HUD_FetcherBottom> {
  static propsDefinition = {};

  private objectiveBinding = new Binding<string>("Collect Ingredient Monsters");
  private bagBinding = new Binding<string>("");

  // Store the unsubscribe handle so we can clean up
  private unsubscribeBag: (() => void) | undefined = undefined;

  /* ---------------- UI tree ---------------- */
  initializeUI(): UINode {
    return View({
      style: {
        position: "absolute",
        bottom: 20,
        left: "31%",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: 50,
        borderWidth: 5,
        borderColor: "white",
        width: 500,
        height: 100,
        alignItems: "center",
        justifyContent: "center",
        // zIndex: -2,
      },
      children: [
        Text({
          text: this.objectiveBinding,
          style: {
            fontFamily: "Roboto",
            fontSize: 32,
            fontWeight: "bold",
            color: "black",
            textAlign: "center",
          },
        }),
      ],
    });
  }

  preStart(): void {}

  onDestroy(): void {
    // Prevent leaks
    if (this.unsubscribeBag) {
      this.unsubscribeBag();
      this.unsubscribeBag = undefined;
    }
  }

  start() {
    this.async.setInterval(() => {
      playerManager?.getRolePlayers(PlayerRoles.Fetcher)
        .forEach((player) => {
          this.subscribeEvent(player);
        });
    }, 1000);
  }
  subscribeEvent(player: Player) {
    this.unsubscribeBag = bagManager?.subscribe(player, () => {
      if (bagManager && bagManager.getTotalItemCount(player) >= bagManager.getBagCapacity(player)) {
        this.objectiveBinding.set("Put Monsters In Machine", [player]);
      } else {
        this.objectiveBinding.set("Collect Ingredient Monsters", [player]);
      }
    });
  }
}
UIComponent.register(HUD_FetcherBottom);
