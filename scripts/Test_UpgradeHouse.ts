import { UpgradeType, UpgradeInfo, ScoopDecoration } from 'Enums_Game';
import * as hz from 'horizon/core';
import { playerManager, townManager } from 'Managers_Instance';

class Test_UpgradeHouse extends hz.Component<typeof Test_UpgradeHouse> {
  static propsDefinition = {
    isWaffle: { type: hz.PropTypes.Boolean, default: true },
    isDecor: { type: hz.PropTypes.Boolean, default: false }
  };

  start() {
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, this.onPlayerEnter.bind(this));
  }

  onPlayerEnter(player: hz.Player) {
    // console.log.*$
    if (this.props.isWaffle) {
      // Upgrade one waffle floor
      const upgradeInfo: UpgradeInfo = {
        assetId: "ice_cream_waffle_01",
        yRotation: 0,
        color: Math.floor(Math.random() * 4) + 1 // random pick a color between 1 to 4
      };
      townManager?.upgradeHouseForPlayer(player, upgradeInfo, UpgradeType.Waffle);
    } else if (this.props.isDecor) {
      // Upgrade one decor item
      const scoopDecor: ScoopDecoration = {
        assetId: "ice_cream_decor_cherry_01",
        rotation: 0
      };
      // Upgrade one scoop floor
      const upgradeInfo: UpgradeInfo = {
        assetId: "ice_cream_scoop_01",
        yRotation: 0,
        color: 1,
        decoration: scoopDecor
      };

      const index = playerManager?.getHouseUpgrade(player)?.scoops.length! - 1;
      townManager?.upgradeHouseForPlayer(player, upgradeInfo, UpgradeType.Decor, index ?? 0);
    } else {
      // random pick a color between 1,5,6
      const colorOptions = [1, 5, 6];
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      // Upgrade one scoop floor
      const upgradeInfo: UpgradeInfo = {
        assetId: "ice_cream_scoop_01",
        yRotation: 0,
        color: color
      };
      townManager?.upgradeHouseForPlayer(player, upgradeInfo, UpgradeType.Scoop); 
    }
  }
}
hz.Component.register(Test_UpgradeHouse);