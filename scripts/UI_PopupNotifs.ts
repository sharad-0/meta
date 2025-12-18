import { NotificationTypes } from "Enums_Game";
import { TextureAsset } from "horizon/2p";
import { Asset, Entity, Player, PropTypes } from "horizon/core";
import {
  Binding,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";

type NotifAssetMap = Record<NotificationTypes, string>; // notifType -> assetId(string) [web:28][web:2]

export default class UI_PopupNotifs extends UIComponent<typeof UI_PopupNotifs> {
  static propsDefinition = {};

  private textureAssets: TextureAsset[] = [];
  private playerIconIndexBinding = new Binding<ImageSource>(
    ImageSource.fromTextureAsset(
      new Asset(BigInt("1374515880767200")) as TextureAsset
    )
  );

  intervalTimer: number | undefined = undefined;
  private cycleInterval: number | undefined; // holds setInterval id [web:40][web:39]

  // Example instance:
  NOTIF_ASSETS: NotifAssetMap = {
    [NotificationTypes.bagFull]: "1374515880767200",
    [NotificationTypes.outOfStock]: "760825963460638",
    [NotificationTypes.maxCapacity]: "1351546650093377",
    [NotificationTypes.orderConfirmed]: "1709783093051483",
    [NotificationTypes.SwitchingRole]: "1509761330039833",
    [NotificationTypes.ServerRoleSelected]: "1770560133574850",
    [NotificationTypes.FetcherRoleSelected]: "1364396402019436",
    [NotificationTypes.ScooperRoleSelected]: "1475225810417124",
    [NotificationTypes.RoleSwitched]: "734741006277723",
    [NotificationTypes.RoleSwitchingCancelled]: "1459438145268393",
    [NotificationTypes.OrderServed]: "1963793807805988",
    [NotificationTypes.PickingCone]: "1495726768130770",
    [NotificationTypes.ScoopingVanilla]: "805360422071196",
    [NotificationTypes.ScoopingStrawberry]: "1544798823567883",
    [NotificationTypes.ScoopingChocolate]: "2256410918135557",
    [NotificationTypes.ShiftEnded]: "1540939437344788",
    [NotificationTypes.ParlorOpen]: "1155625739777574",
    [NotificationTypes.ClosingIn2Mins]: "2485098465196465",
    [NotificationTypes.RushHourBegin]: "795592809512704",
    [NotificationTypes.LevelUpgraded]: "1329544785363219",
    [NotificationTypes.PlaceItemFirst]: "1088106046854380",
    [NotificationTypes.CashEarned]: "829561073220113",
    [NotificationTypes.SnowmanBuildRequirement]: "1097353965681771"

  };

  initializeUI(): UINode {
    return View({
      style: {
        width: "100%",
        height: "100%",
        position: "absolute",
        alignContent: "center",
        alignItems: "center",
      },
      children: Image({
        source: this.playerIconIndexBinding,
        style: {
          width: "auto",
          height: `10%`,
          aspectRatio: 264 / 69,
          position: "absolute",
          top: "20%",
        },
      }),
    });
  }

  preStart(): void { }

  start(): void {
    // this.startNotificationCycle();
  }

  public setImage(
    notifType: NotificationTypes,
    player: Player,
    timeToHideInSeconds: number,
  ) {
    const assetId = this.NOTIF_ASSETS[notifType];
    if (!assetId) {
      console.warn("Index out of bounds for texture assets.");
      return;
    }
    this.entity.visible.set(true);
    if (this.intervalTimer) {
      this.async.clearTimeout(this.intervalTimer);
      this.intervalTimer = undefined;
    }
    const imageSource = ImageSource.fromTextureAsset(
      new Asset(BigInt(assetId)) as TextureAsset
    );
    this.playerIconIndexBinding.set(imageSource, [player]);
    this.intervalTimer = this.async.setTimeout(() => {
      this.entity.visible.set(false);
    }, timeToHideInSeconds * 1000);
  }

  testCase() {
    const notifType = NotificationTypes.bagFull;
    const assetId = this.NOTIF_ASSETS[notifType];
    const imageSource = ImageSource.fromTextureAsset(
      new Asset(BigInt(assetId)) as TextureAsset
    );
    this.playerIconIndexBinding.set(imageSource);
  }

  public startNotificationCycle(intervalSeconds = 3) {
    // Clear any existing cycle first [web:40]
    if (this.cycleInterval) {
      this.async.clearInterval(this.cycleInterval);
      this.cycleInterval = undefined;
    }

    const types = Object.values(NotificationTypes); // string enum values [web:46]
    if (!types.length) return;

    let i = 0;
    this.entity.visible.set(true);

    const tick = () => {
      const notifType = types[i] as NotificationTypes;
      const assetId = this.NOTIF_ASSETS[notifType];
      if (assetId) {
        const imageSource = ImageSource.fromTextureAsset(
          new Asset(BigInt(assetId)) as TextureAsset
        );
        this.playerIconIndexBinding.set(imageSource);
      }
      i = (i + 1) % types.length;
    };

    tick(); // show first immediately [web:39]
    this.cycleInterval = this.async.setInterval(tick, intervalSeconds * 1000); // 3s default [web:39]
  }
}
UIComponent.register(UI_PopupNotifs);
