import { AnalyticsManager } from "AnalyticsManager";
import { CustomAnalyticsEvents, EntryTypes, PlayerRoles } from "Enums_Game";
import { Asset, Player } from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Pressable,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { playerManager } from "Managers_Instance";

export default class UI_FTUERole extends UIComponent<typeof UI_FTUERole> {
  static propsDefinition = {};

  // Three images for serverEntry/fetcherEntry/scooperEntry, one for mainEntry.
  // Replace the second and third IDs with your actual asset IDs as needed.
  private ftueUiPanels: Record<
    "mainEntry" | "serverEntry" | "fetcherEntry" | "scooperEntry",
    string[]
  > = {
    mainEntry: ["1164796895609202"],
    serverEntry: ["4367861410160376", "719119457227402", "840906095239634"],
    fetcherEntry: ["2071413580062723", "1093760032788924", "802303892570991"],
    scooperEntry: ["808956451910991", "1195211462668311", "1903363856946976"],
  };

  private ftueHeaderPanels: Record<
    "mainEntry" | "serverEntry" | "fetcherEntry" | "scooperEntry",
    string
  > = {
    mainEntry: "1164796895609202",
    serverEntry: "1490768525491958",
    fetcherEntry: "24954390337549251",
    scooperEntry: "1147206357601971",
  };

  // Store assets per entry as arrays
  private assetStore: Record<string, Asset[]> = {};
  private headerAssetStore: Record<string, Asset> = {};

  stepBinding2: Binding<boolean> = new Binding<boolean>(false);
  stepBinding3: Binding<boolean> = new Binding<boolean>(false);

  private isRoleEntryBinding: Binding<boolean> = new Binding<boolean>(false);

  imageBinding1: Binding<ImageSource> = new Binding<ImageSource>(
    ImageSource.fromTextureAsset(new Asset(BigInt("4367861410160376")))
  );
  imageBinding2: Binding<ImageSource> = new Binding<ImageSource>(
    ImageSource.fromTextureAsset(new Asset(BigInt("719119457227402")))
  );
  imageBinding3: Binding<ImageSource> = new Binding<ImageSource>(
    ImageSource.fromTextureAsset(new Asset(BigInt("840906095239634")))
  );
  arrowImageBinding: Binding<ImageSource> = new Binding<ImageSource>(
    ImageSource.fromTextureAsset(new Asset(BigInt("1323525268929095")))
  );
  headerTextImageBinding: Binding<ImageSource> = new Binding<ImageSource>(
    ImageSource.fromTextureAsset(new Asset(BigInt("1490768525491958")))
  );

  stepCounterText: Binding<string> = new Binding<string>("1/3");

  private entryType: EntryTypes | null = null;
  private currentImageIndex: number = 0;
  private isButtonAvailable: Binding<boolean> = new Binding<boolean>(false);
  private revealVersion: number = 0;
  private uiOnScreen: boolean = false;

  initializeUI(): UINode {
    return View({
      style: {
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.98)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1001,
      },

      children: [
        UINode.if(this.isRoleEntryBinding, this.HeaderComponent()),
        UINode.if(
          this.isRoleEntryBinding,
          this.RoleBodyComponent(),
          this.MainBodyComponent()
        ),
        UINode.if(this.isRoleEntryBinding, this.StepCounterComponent()),
        UINode.if(this.isButtonAvailable, this.TextComponent()),
        UINode.if(this.isButtonAvailable, this.ButtonComponent()),
      ],
    });
  }

  ButtonComponent() {
    return Pressable({
      onPress: (player) => {
        this.onButtonPress(player);
      },
      style: {
        position: "absolute",
        width: "100%",
        height: "100%",
      },
    });
  }

  HeaderComponent() {
    return View({
      children: this.ImageComponent(
        "40%",
        211 / 49,
        this.headerTextImageBinding
      ),
      style: {
        position: "absolute",
        alignSelf: "center",
        alignContent: "center",
        justifyContent: "center",
        top: "5%",
      },
    });
  }

  StepCounterComponent() {
    return View({
      style: {
        width: "20%",
        height: "auto",
        aspectRatio: 200 / 40,
        position: "absolute",
        alignSelf: "center",
        alignContent: "center",
        justifyContent: "center",
        bottom: "5%",
      },

      children: Text({
        text: this.stepCounterText,
        style: {
          fontSize: 30,
          color: "white",
          fontFamily: "Bangers",
          fontWeight: "bold",
          alignSelf: "center",
          alignContent: "center",
          justifyContent: "center",
        },
      }),
    });
  }

  RoleBodyComponent() {
    return View({
      style: {
        width: "80%",
        height: "auto",
        aspectRatio: 960 / 540,
        position: "absolute",
        alignSelf: "center",
        alignContent: "center",
        flexDirection: "row",
        justifyContent: "space-evenly",
      },

      children: [
        this.ImageComponent("22%", 211 / 308, this.imageBinding1),
        this.ImageComponent("3%", 31 / 23, this.arrowImageBinding),
        UINode.if(
          this.stepBinding2,
          this.ImageComponent("22%", 211 / 308, this.imageBinding2),
          this.EmptyImageComponent("22%", 211 / 308)
        ),
        this.ImageComponent("3%", 31 / 23, this.arrowImageBinding),
        UINode.if(
          this.stepBinding3,
          this.ImageComponent("22%", 211 / 308, this.imageBinding3),
          this.EmptyImageComponent("22%", 211 / 308)
        ),
      ],
    });
  }
  MainBodyComponent() {
    return View({
      style: {
        width: "70%",
        height: "auto",
        aspectRatio: 1920 / 1080,
        position: "absolute",
        alignSelf: "center",
        alignContent: "center",
        justifyContent: "center",
      },

      children: [this.ImageComponent("100%", 1920 / 1080, this.imageBinding1)],
    });
  }

  EmptyImageComponent(width: string, aspectRatio: number) {
    return View({
      style: {
        width: width,
        height: "auto",
        aspectRatio: aspectRatio,
        // position: "absolute",
        alignSelf: "center",
        alignContent: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0)",
      },
    });
  }

  ImageComponent(
    width: string,
    aspectRatio: number,
    imageBinding: Binding<ImageSource>
  ) {
    return Image({
      source: imageBinding,
      style: {
        width: width,
        height: "auto",
        aspectRatio: aspectRatio,
        // position: "absolute",
        alignSelf: "center",
        alignContent: "center",
        justifyContent: "center",
      },
    });
  }

  TextComponent() {
    return Text({
      text: "Tap  To Continue",
      style: {
        fontSize: 28,
        color: "white",
        fontFamily: "Bangers",
        position: "absolute",
        bottom: "5%",
        right: "5%",
      },
    });
  }

  start() {
    // Preload assets based on ftueUiPanels
    for (const key of Object.keys(this.ftueUiPanels)) {
      const ids = this.ftueUiPanels[key as keyof typeof this.ftueUiPanels];
      this.assetStore[key] = ids.map((id) => new Asset(BigInt(id)));
    }

    for (const key of Object.keys(this.ftueHeaderPanels)) {
      const id =
        this.ftueHeaderPanels[key as keyof typeof this.ftueHeaderPanels];
      this.headerAssetStore[key] = new Asset(BigInt(id));
    }

    // this.setImage(EntryTypes.scooper);
  }

  private getAssetsForEntry(entry: keyof typeof this.ftueUiPanels): Asset[] {
    // Ensure assetStore is populated for the entry
    if (
      !this.assetStore[entry] ||
      this.assetStore[entry].length !== this.ftueUiPanels[entry].length
    ) {
      this.assetStore[entry] = this.ftueUiPanels[entry].map(
        (id) => new Asset(BigInt(id))
      );
    }
    return this.assetStore[entry];
  }

  private getHeaderAssetForEntry(
    entry: keyof typeof this.ftueHeaderPanels
  ): Asset {
    // Ensure headerAssetStore is populated for the entry
    if (!this.headerAssetStore[entry]) {
      this.headerAssetStore[entry] = new Asset(
        BigInt(this.ftueHeaderPanels[entry])
      );
    }
    return this.headerAssetStore[entry];
  }

  public setImage(entry: EntryTypes) {
    if (this.uiOnScreen) return; // Prevent multiple UIs on screen
    this.uiOnScreen = true;
    this.entryType = entry;
    this.currentImageIndex = 0;

    // Resolve assets for this entry
    const assets = this.getAssetsForEntry(
      entry as keyof typeof this.ftueUiPanels
    );
    const headerAsset = this.getHeaderAssetForEntry(
      entry as keyof typeof this.ftueHeaderPanels
    );

    // Reset visibility and gating
    this.isButtonAvailable.set(false);
    this.stepBinding2.set(false);
    this.stepBinding3.set(false);

    if (entry === EntryTypes.main) {
      // Single image flow (no header, no step counter)
      this.isRoleEntryBinding.set(false);
      this.imageBinding1.set(ImageSource.fromTextureAsset(assets[0]));

      // Bump version and schedule enabling tap after 1s
      const version = ++this.revealVersion;
      const timer = this.async.setTimeout(() => {
        if (this.revealVersion !== version) return;
        this.isButtonAvailable.set(true);
        this.uiOnScreen = false;
        this.async.clearTimeout(timer);
      }, 1000);
    } else {
      // Role flow (3 steps)
      this.isRoleEntryBinding.set(true);
      this.headerTextImageBinding.set(
        ImageSource.fromTextureAsset(headerAsset)
      );
      this.imageBinding1.set(ImageSource.fromTextureAsset(assets[0]));
      this.imageBinding2.set(ImageSource.fromTextureAsset(assets[1]));
      this.imageBinding3.set(ImageSource.fromTextureAsset(assets[2]));
      this.stepCounterText.set(`${this.currentImageIndex + 1}/3`);

      // Auto-reveal steps with 1s intervals, then enable "Tap to Continue"
      const version = ++this.revealVersion;

      // Reveal step 2 at t=1s
      const timer = this.async.setTimeout(() => {
        if (this.revealVersion !== version) return;
        this.stepBinding2.set(true);
        this.currentImageIndex = 1;
        this.stepCounterText.set(`2/3`);
        this.async.clearTimeout(timer);
      }, 1000);

      // Reveal step 3 at t=2s, then allow tap-to-continue
      const timer2 = this.async.setTimeout(() => {
        if (this.revealVersion !== version) return;
        this.stepBinding3.set(true);
        this.currentImageIndex = 2;
        this.stepCounterText.set(`3/3`);
        this.isButtonAvailable.set(true);
        this.uiOnScreen = false;
        this.async.clearTimeout(timer2);
      }, 2000);
    }
  }

  onButtonPress(player: Player) {
    // Button is only mounted when isButtonAvailable is true
    if (!this.entryType) return;

    // Close UI and mark FTUE complete
    this.entity.visible.set(false);
    playerManager?.updateFtueKey(player, this.entryType);
    this.isButtonAvailable.set(false);
    this.stepBinding2.set(false);
    this.stepBinding3.set(false);
    this.sendAnalyticsEvent(player, this.entryType);
  }

  sendAnalyticsEvent(player: Player, entryType: EntryTypes) {
    switch (entryType) {
      case EntryTypes.main:
        AnalyticsManager.s_instance.sendGameTutorialEnd(player);
        break;
      case EntryTypes.fetcher:
        AnalyticsManager.s_instance.sendRoleTutorialEnd(
          player,
          PlayerRoles.Fetcher
        );
        break;
      case EntryTypes.scooper:
        AnalyticsManager.s_instance.sendRoleTutorialEnd(
          player,
          PlayerRoles.Scooper
        );
        break;
      case EntryTypes.server:
        AnalyticsManager.s_instance.sendRoleTutorialEnd(
          player,
          PlayerRoles.Server
        );
        break;
    }
  }
}
UIComponent.register(UI_FTUERole);
