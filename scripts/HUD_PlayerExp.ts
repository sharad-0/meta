import { TextureAsset } from "horizon/2p";
import { Asset, Player } from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { PlayerExpUpdatedEvent } from "Manager_Events";

export default class HUD_PlayerExp extends UIComponent<typeof HUD_PlayerExp> {
  protected panelHeight: number = 300;
  protected panelWidth: number = 500;

  static propsDefinition = {};
  private levelNumberBinding = new Binding<string>("0");
  private expBinding = new Binding<string>("0");
  private showFlyerBinding = new Binding<boolean>(false);
  private flyerExpBinding = new Binding<string>("0");
  private playerCurrentExp = new Map<Player, number>();
  // private progressBarWidthBinding = new Binding<string>("0%");
  private playerExpBgAssetId = "648574324977543";
  UPDATE_MS = 500; // pull fresh stats twice per second
  private owner: Player | null = null;
  initializeUI(): UINode {
    return View({
      children: [this.playerExpComponent()],
      style: {
        width: "10%",
        height: "13%",
        top: "5%",
        left: "17.5%",
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        zIndex: 100,

        // backgroundColor: "rgba(0, 0, 0, 0.81)",
      },
    });
  }

  playerExpComponent() {
    return View({
      style: {
        width: "auto",
        height: "57%",
        aspectRatio: 207 / 85,
        position: "absolute",
        bottom: "-20%"
        // left: "10%",
        // backgroundColor: "rgba(207, 13, 13, 0.87)",
      },

      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt(this.playerExpBgAssetId)) as TextureAsset
          ),
          style: {
            position: "absolute",
            width: "100%",
            height: "100%",
          },
        }),
        View({
          children: [
            Text({
              text: this.levelNumberBinding,
              style: {
                color: "#44390F",
                fontFamily: "Roboto",
                textAlign: "center",
                textAlignVertical: "center",
                width: "100%",
                height: "100%",
                fontWeight: "bold",
                fontSize: 15,
                // backgroundColor: "#1839bb91",
              },
            }),
          ],
          style: {
            width: "auto",
            height: "50%",
            aspectRatio: 1,
            // backgroundColor: "#2bbb1876",
            alignContent: "center",
            justifyContent: "center",
            alignItems: "center",
            left: "10%",
            top: "27%",
          },
        }),

        View({
          children: [
            Text({
              text: this.expBinding,
              style: {
                color: "#FFFFFF",
                fontFamily: "Roboto",
                fontWeight: "bold",
                textAlign: "center",
                textAlignVertical: "center",
                width: "100%",
                height: "100%",
                paddingLeft: "2%",
                fontSize: 12,
                // paddingVertical: "2%",
                // backgroundColor: "#1839bbff",
              },
            }),
          ],
          style: {
            width: "auto",
            height: "40%",
            aspectRatio: 180 / 47,
            // backgroundColor: "#2bbb1876",
            alignContent: "center",
            justifyContent: "center",
            alignItems: "center",
            right: "4%",
            top: "36%",
            position: "absolute",
            borderTopRightRadius: 30,
            borderBottomRightRadius: 30,
          },
        }),

        UINode.if(
          this.showFlyerBinding,
          View({
            children: [
              Text({
                text: this.flyerExpBinding,
                style: {
                  color: "#FFC124",
                  fontFamily: "Roboto",
                  fontWeight: "bold",
                  textAlign: "center",
                  textAlignVertical: "center",
                  width: "100%",
                  height: "100%",
                  fontSize: 20,
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
              right: "4%",
              bottom: "-30%",
              position: "absolute",
            },
          })
        ),
      ],
    });
  }

  start() {
    // console.log.*$

    // this.refreshTargets(); // first pull

    // this.async.setInterval(() => this.refreshTargets(), this.UPDATE_MS);
    this.connectNetworkEvent(
      this.entity.owner.get(),
      PlayerExpUpdatedEvent,
      ({ player, newExp, prevCap, nextCap, level }) => {
        this.refreshTargets(player, newExp, prevCap, nextCap, level);
      }
    );
  }

  // Add inside class HUD_PlayerExp
  private flyerHideTimers = new Map<Player, number>();

  // setPlayer(player: Player) {
  //   this.owner = player;
  //   this.refreshTargets(player);
  // }
  // Replace refreshTargets with this version
  private refreshTargets(player: Player, exp: number, prevCap: number, nextCap: number, level: number): void {


    const segment = Math.max(1, nextCap - prevCap);

    const currentInLevel = Math.max(0, Math.min(exp - prevCap, segment));
    const prevExp = this.playerCurrentExp.get(player);

    // Always update level/exp readout
    this.levelNumberBinding.set(level.toString(), [player]);
    this.expBinding.set(`${currentInLevel}/${segment}`);

    // First observation: baseline without flyer
    if (prevExp === undefined) {
      this.playerCurrentExp.set(player, exp);
      this.showFlyerBinding.set(false);
      return;
    }

    const delta = exp - prevExp;

    if (delta > 0) {
      // Show constant flyer amount for this update only
      this.flyerExpBinding.set(`+${delta}`);
      this.showFlyerBinding.set(true);

      // Cancel previous hide timer if any
      const existing = this.flyerHideTimers.get(player);
      if (existing !== undefined) {
        // Prefer async.clearTimeout if provided by the engine
        // @ts-ignore: optional API
        if (this.async?.clearTimeout) this.async.clearTimeout(existing);
        else this.async.clearTimeout(existing as unknown as number);
      }

      // Start a fresh 3s hide timer
      const id = this.async.setTimeout(() => {
        this.showFlyerBinding.set(false);
        this.flyerHideTimers.delete(player);
      }, 3000) as unknown as number;
      this.flyerHideTimers.set(player, id);
    } else {
      // Non-positive change: hide flyer and clear any timer
      const existing = this.flyerHideTimers.get(player);
      if (existing !== undefined) {
        // @ts-ignore: optional API
        if (this.async?.clearTimeout) this.async.clearTimeout(existing);
        else this.async.clearTimeout(existing as unknown as number);
        this.flyerHideTimers.delete(player);
      }
      this.showFlyerBinding.set(false);
    }

    // Update snapshot after processing the delta
    this.playerCurrentExp.set(player, exp);

  }
}
UIComponent.register(HUD_PlayerExp);
