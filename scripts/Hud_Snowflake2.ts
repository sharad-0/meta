import { Asset, Player, PropTypes, TextureAsset } from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { gameManager, playerManager } from "Managers_Instance";
const UPDATE_MS = 500; // pull fresh stats twice per second
const ANIM_STEP_MS = 50; // ~20 fps for smooth counting

class HUD_PlayerCashTop extends UIComponent<typeof HUD_PlayerCashTop> {
  protected panelHeight: number = 300;
  protected panelWidth: number = 500;
  private displayedCoins = new Map<Player, number>();
  private targetCoins = new Map<Player, number>();
  private showFlyerBinding = new Binding<boolean>(true);
  private flyerCoinBinding = new Binding<string>("100000");

  static propsDefinition = {};
  private coinsBinding = new Binding<string>("0");
  private playerCashBgAssetId = "1498225091234348";
  private fontSizeBinding = new Binding<number>(22);

  initializeUI(): UINode {
    return View({
      children: [this.playerCashComponent()],
      style: {
        width: "10%",
        height: "13%",
        top: "5%",
        right: "15%",
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        zIndex: 100,
        // backgroundColor: "rgba(0, 0, 0, 0.81)",
      },
    });
  }

  playerCashComponent() {
    return View({
      style: {
        width: "auto",
        height: "62%",
        aspectRatio: 225 / 74,
        position: "absolute",
        bottom: "-20%"
        // left: "76%",
        // backgroundColor: "rgba(207, 13, 13, 0.87)",
      },

      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt(this.playerCashBgAssetId)) as TextureAsset
          ),
          style: {
            width: "100%",
            height: "100%",
            position: "absolute",
          },
        }),
        View({
          style: {
            height: "auto",
            width: "63%",
            aspectRatio: 206 / 65,
            left: "31%",
            alignSelf: "center",
            position: "absolute",
            top: "26.5%",
            // backgroundColor: "rgba(207, 13, 13, 0.6)",
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",

          },
          children: Text({
            text: this.coinsBinding,
            style: {
              color: "#FFFFFF",
              fontFamily: "Roboto",
              fontWeight: "bold",
              textAlign: "center",
              textAlignVertical: "center",
              paddingHorizontal: "2%",

              fontSize: this.fontSizeBinding,

              // backgroundColor: "rgba(228, 26, 26, 0.83)",
            },
          }),
        }),
        UINode.if(
          this.showFlyerBinding,
          View({
            children: [
              Text({
                text: this.flyerCoinBinding,
                style: {
                  color: "#54CDF5",
                  fontFamily: "Roboto",
                  fontWeight: "bold",
                  textAlign: "center",
                  textAlignVertical: "center",
                  width: "100%",
                  height: "100%",
                  fontSize: 32,
                },
              }),
            ],
            style: {
              width: "auto",
              height: "40%",
              aspectRatio: 180 / 47,
              // backgroundColor: "#00000076",
              alignContent: "center",
              justifyContent: "center",
              alignItems: "center",
              right: "6%",
              bottom: "-35%",
              position: "absolute",
            },
          })
        ),
      ],
    });
  }
  start() {
    this.refreshTargets();
    this.animateCoins();

    this.async.setInterval(() => this.refreshTargets(), UPDATE_MS);

    this.async.setInterval(() => this.animateCoins(), ANIM_STEP_MS);
  }

  // Add field inside class
  private flyerHideTimers = new Map<Player, number>();

  // Replace refreshTargets with this version
  private refreshTargets(): void {
    if (!playerManager) return;
    for (const player of playerManager.getCurrentPlayers()) {
      const real = playerManager.getSnowflake(player);
      const prevTarget = this.targetCoins.get(player);
      this.targetCoins.set(player, real);

      // First sight: initialize displayed and hide flyer
      if (!this.displayedCoins.has(player)) {
        this.displayedCoins.set(player, real);
        this.coinsBinding.set(this.formatCoin(real), [player]);
        this.showFlyerBinding.set(false, [player]);
        continue;
      }

      if (prevTarget !== undefined) {
        const delta = real - prevTarget;

        // Positive change: show flyer once with constant amount
        if (delta > 0) {
          const flyerText = `+${this.formatCoin(delta)}`;
          this.flyerCoinBinding.set(flyerText, [player]);
          this.showFlyerBinding.set(true, [player]);

          // Reset any existing hide timer for this player
          const existing = this.flyerHideTimers.get(player);
          if (existing !== undefined) {
            // Prefer async.clearTimeout if available, else global
            // @ts-ignore optional API depending on runtime
            if (this.async?.clearTimeout) this.async.clearTimeout(existing);
            else this.async.clearTimeout(existing as unknown as number);
          }

          const id = this.async.setTimeout(() => {
            this.showFlyerBinding.set(false, [player]);
            this.flyerHideTimers.delete(player);
          }, 3000) as unknown as number;
          this.flyerHideTimers.set(player, id);
        }

        // Negative or zero change: ensure flyer is hidden
        if (delta <= 0) {
          const existing = this.flyerHideTimers.get(player);
          if (existing !== undefined) {
            // @ts-ignore optional API depending on runtime
            if (this.async?.clearTimeout) this.async.clearTimeout(existing);
            else this.async.clearTimeout(existing as unknown as number);
            this.flyerHideTimers.delete(player);
          }
          this.showFlyerBinding.set(false, [player]);
        }
      }
    }
  }

  // Replace animateCoins with this version (no flyer updates here)
  private animateCoins(): void {
    const STEP_DIVISOR = 10;

    this.displayedCoins.forEach((current, player) => {
      const target = this.targetCoins.get(player) ?? current;
      if (current === target) return;

      const diff = target - current;
      const step = Math.max(1, Math.ceil(Math.abs(diff) / STEP_DIVISOR));
      const next =
        Math.abs(diff) <= step ? target : current + Math.sign(diff) * step;

      this.displayedCoins.set(player, next);
      this.coinsBinding.set(this.formatCoin(next), [player]);
      this.setFontBinding(next);
    });
  }

  setFontBinding(coins: number) {
    const formatted = this.formatCoin(coins);
    const isFormatted = /[MB]$/.test(formatted); // checks for "M" or "B" at end

    if (isFormatted) {
      this.fontSizeBinding.set(24);
    } else {
      // digits only
      const digitCount = formatted.replace(/[^0-9]/g, "").length;
      if (digitCount <= 3) {
        this.fontSizeBinding.set(24);
      } else if (digitCount <= 5) {
        this.fontSizeBinding.set(22);
      } else if (digitCount === 6) {
        this.fontSizeBinding.set(18);
      } else if (digitCount === 7) {
        this.fontSizeBinding.set(18);
      } else {
        // Default (optional)
        this.fontSizeBinding.set(18);
      }
    }
  }

  formatCoin(coin: number): string {
    const absCoin = Math.abs(coin);
    let formatted: string;
    if (absCoin >= 1_000_000_000) {
      formatted = (coin / 1_000_000_000).toFixed(1) + "B";
    } else if (absCoin >= 1_000_000) {
      formatted = (coin / 1_000_000).toFixed(1) + "M";
    } else {
      formatted = coin.toString();
    }
    // Remove trailing .00 or .0
    formatted = formatted.replace(/\.00$/, "").replace(/\.0([kMB])$/, "$1");
    return formatted;
  }
}
UIComponent.register(HUD_PlayerCashTop);
