import { PlayerRoles } from "Enums_Game";
import { TextureAsset } from "horizon/2p";
import { Asset, CodeBlockEvents, Player, PropTypes } from "horizon/core";
import { Npc } from "horizon/npc";
import {
  Binding,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { PlayerNameStatsUpdatedEvent, PlayerSwitchedRoleEvent } from "Manager_Events";

export default class HUD_PlayerTopStats extends UIComponent<typeof HUD_PlayerTopStats> {
  static propsDefinition = {
    fetcherIcon: { type: PropTypes.Asset },
    scooperIcon: { type: PropTypes.Asset },
    serverIcon: { type: PropTypes.Asset },
    unknownIcon: { type: PropTypes.Asset },
  };

  private nameBinding: Binding<string> = new Binding("Player");
  private roleBinding: Binding<string> = new Binding("on break");
  private roleIconBinding: Binding<ImageSource> = new Binding(
    ImageSource.fromTextureAsset(
      new Asset(BigInt("680146238434829")) as TextureAsset
    )
  );

  private playerNameBgAssetId = "848164661401480";
  private fetcherIconAssetId = "3168394606654942";
  private scooperIconAssetId = "1423308772092004";
  private serverIconAssetId = "2052843368791491";
  private unknownIconAssetId = "680146238434829";

  private fetcherIconImageSource: ImageSource = ImageSource.fromTextureAsset(
    new Asset(BigInt(this.fetcherIconAssetId)) as TextureAsset
  );
  private scooperIconImageSource: ImageSource = ImageSource.fromTextureAsset(
    new Asset(BigInt(this.scooperIconAssetId)) as TextureAsset
  );
  private serverIconImageSource: ImageSource = ImageSource.fromTextureAsset(
    new Asset(BigInt(this.serverIconAssetId)) as TextureAsset
  );
  private unknownIconImageSource: ImageSource = ImageSource.fromTextureAsset(
    new Asset(BigInt(this.unknownIconAssetId)) as TextureAsset
  );


  private ownerPlayer: Player | null = null;
  initializeUI(): UINode {
    return View({
      children: [this.playerNameComponent()],
      style: {
        width: "10%",
        height: "13%",
        top: "5%",
        left: "18%",
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        zIndex: 100,
        // backgroundColor: "rgba(0, 0, 0, 0.81)",
      },
    });
  }

  playerNameComponent() {
    return View({
      style: {
        width: "auto",
        height: "100%",
        aspectRatio: 1,
        position: "absolute",
        // backgroundColor: "rgba(207, 13, 13, 0.87)",
      },

      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt(this.playerNameBgAssetId)) as TextureAsset
          ),
          style: {
            width: "100%",
            height: "100%",
            position: "absolute",
          },
        }),
        Image({
          source: this.roleIconBinding,
          style: {
            width: "auto",
            height: "90%",
            aspectRatio: 1,
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            alignContent: "center",
            alignSelf: "center",
            marginBottom: "3%",
            marginLeft: "3%",

            // backgroundColor: "rgba(0, 0, 0, 0.8)",
            // borderRadius: 100
          },
        }),
        // Text({
        //   text: this.nameBinding,
        //   style: {
        //     color: "#FFFFFF",
        //     fontFamily: "Bangers",
        //     textAlign: "center",
        //     height: "32%",
        //     width: "70%",
        //     top: "14%",
        //     left: "30%",
        //     paddingHorizontal: "2%",
        //     textAlignVertical: "center",
        //     position: "absolute",

        //     // backgroundColor: "rgba(0, 0, 0, 0.83)",
        //   },
        // }),
        // Text({
        //   text: this.roleBinding,
        //   style: {
        //     color: "#0F5F82",
        //     fontFamily: "Bangers",
        //     textAlign: "center",
        //     textAlignVertical: "center",
        //     height: "40%",
        //     width: "70%",
        //     bottom: "14%",
        //     left: "30%",
        //     paddingHorizontal: "2%",
        //     position: "absolute",

        //     // backgroundColor: "rgba(0, 0, 0, 0.83)",
        //   },
        // }),
      ],
    });
  }

  start() {
    // this.connectCodeBlockEvent(
    //   this.entity,
    //   CodeBlockEvents.OnPlayerEnterWorld,
    //   (player) => {
    //     this.setPlayerData(player, PlayerRoles.Unknown);
    //   }
    // );
    this.async.setTimeout(() => {

      this.connectNetworkEvent(
        this.entity.owner.get(),
        PlayerNameStatsUpdatedEvent,
        ({ player, newRole }) => {
          this.setPlayerData(player, newRole);
        }
      );


    }, 3000);

  }

  setPlayerData(player: Player, newRole: PlayerRoles) {
    const name = this.formatName(player.name.get());
    this.nameBinding.set(name);
    if (newRole === PlayerRoles.Unknown) {
      this.roleBinding.set("on break");
    } else {
      this.roleBinding.set(newRole.toString());
    }
    const iconImage = this.getRoleBasedIcon(newRole);
    // console.log.*$
    this.roleIconBinding.set(iconImage);
  }

  preloadRoleBasedIcons() {
    this.props.fetcherIcon!;
    this.props.scooperIcon!;
    this.props.serverIcon!;
    this.props.unknownIcon!;
  }


  getRoleBasedIcon(role: PlayerRoles): ImageSource {
    // this.roleIconAssets = {
    //   [PlayerRoles.Fetcher]: this.props.fetcherIcon! as TextureAsset,
    //   [PlayerRoles.Scooper]: this.props.scooperIcon! as TextureAsset,
    //   [PlayerRoles.Server]: this.props.serverIcon! as TextureAsset,
    //   [PlayerRoles.Unknown]: this.props.unknownIcon! as TextureAsset,
    // }
    // console.log.*$
    switch (role) {

      case PlayerRoles.Fetcher:
        return this.fetcherIconImageSource;
      case PlayerRoles.Scooper:
        return this.scooperIconImageSource;
      case PlayerRoles.Server:
        return this.serverIconImageSource;
      default:
        return this.unknownIconImageSource;
    }
  }

  formatName(name: string): string {
    if (name.length > 8) {
      return name.slice(0, 8) + "...";
    }
    return name;
  }
}
UIComponent.register(HUD_PlayerTopStats);
