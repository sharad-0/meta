import ArrowFollower from "ArrowPointer";
import Component_TargetArrow from "Component_TargetArrow";
import * as hz from "horizon/core";

export default class Manager_FTUEMarkers extends hz.Component<
  typeof Manager_FTUEMarkers
> {
  static propsDefinition = {
    //Spawn Points
    serverSpawnPoint: { type: hz.PropTypes.Entity },
    scooperSpawnPoint: { type: hz.PropTypes.Entity },
    fetcherSpawnPoint: { type: hz.PropTypes.Entity },

    // Targets
    tableEntity: { type: hz.PropTypes.Entity },
    coneScoopingMachine: { type: hz.PropTypes.Entity },
    coneMachineArrowMarker: { type: hz.PropTypes.Entity },
    vanillaScoopingMachine: { type: hz.PropTypes.Entity },
    vanillaMachineArrowMarker: { type: hz.PropTypes.Entity },
    scoopingTable: { type: hz.PropTypes.Entity },
    scoopingTableArrowMarker: { type: hz.PropTypes.Entity },

    monstersZone: { type: hz.PropTypes.Entity },
    vanillaFetchingMachine: { type: hz.PropTypes.Entity },
    vanillaFetchingMachineArrowMarker: { type: hz.PropTypes.Entity },

    serverTable: { type: hz.PropTypes.Entity },
    serverTableArrowMarker: { type: hz.PropTypes.Entity },

    playerArrowPointer: { type: hz.PropTypes.Entity },
  };

  private playerArrowPointer: ArrowFollower | undefined = undefined;

  start() {
    this.playerArrowPointer =
      this.props.playerArrowPointer?.getComponents(ArrowFollower)[0];
  }

  public setSpawnToServerMarker() {
    if (this.playerArrowPointer && this.props.serverSpawnPoint) {
      this.playerArrowPointer.setTarget(this.props.serverSpawnPoint);
    }
  }

  public setServerSpawnToTableMarker() {
    if (this.playerArrowPointer && this.props.tableEntity) {
      this.playerArrowPointer.setTarget(this.props.tableEntity);
    }
  }

  public setTableToFetcherMarker() {
    if (this.playerArrowPointer && this.props.fetcherSpawnPoint) {
      this.playerArrowPointer.setTarget(this.props.fetcherSpawnPoint);
    }
  }

  setFetcherToVanillaMonsterMarker() {
    if (this.playerArrowPointer && this.props.monstersZone) {
      this.playerArrowPointer.setTarget(this.props.monstersZone);
    }
  }
  setFetcherToVanillaMachineMarker() {
    if (
      this.playerArrowPointer &&
      this.props.vanillaFetchingMachine &&
      this.props.vanillaFetchingMachineArrowMarker
    ) {
      this.playerArrowPointer.setTarget(this.props.vanillaFetchingMachine);
      this.hideAllArrowMarkers();
      this.props
        .vanillaFetchingMachineArrowMarker!.getComponents(
          Component_TargetArrow
        )[0]
        ?.setArrowMarkerVisible(true);
    }
  }

  public setFetcherToScooperMarker() {
    if (this.playerArrowPointer && this.props.scooperSpawnPoint) {
      this.playerArrowPointer.setTarget(this.props.scooperSpawnPoint);
    }
  }

  public setScooperToConeMachineMarker() {
    if (
      this.playerArrowPointer &&
      this.props.coneScoopingMachine &&
      this.props.coneMachineArrowMarker
    ) {
      this.playerArrowPointer.setTarget(this.props.coneScoopingMachine);
      this.hideAllArrowMarkers();
      this.props
        .coneMachineArrowMarker!.getComponents(Component_TargetArrow)[0]
        ?.setArrowMarkerVisible(true);
    }
  }

  public setScooperToScoopingTableMarker() {
    if (
      this.playerArrowPointer &&
      this.props.scoopingTable &&
      this.props.scoopingTableArrowMarker
    ) {
      this.playerArrowPointer.setTarget(this.props.scoopingTable);
      this.hideAllArrowMarkers();
      this.props
        .scoopingTableArrowMarker!.getComponents(Component_TargetArrow)[0]
        ?.setArrowMarkerVisible(true);
    }
  }

  public setScooperToVanillaMachineMarker() {
    if (
      this.playerArrowPointer &&
      this.props.vanillaScoopingMachine &&
      this.props.vanillaMachineArrowMarker
    ) {
      this.playerArrowPointer.setTarget(this.props.vanillaScoopingMachine);
      this.hideAllArrowMarkers();
      this.props
        .vanillaMachineArrowMarker!.getComponents(Component_TargetArrow)[0]
        ?.setArrowMarkerVisible(true);
    }
  }

  public setScooperToServerMarker() {
    if (this.playerArrowPointer && this.props.serverSpawnPoint) {
      this.playerArrowPointer.setTarget(this.props.serverSpawnPoint);
    }
  }

  public setServerToServerTableMarker() {
    if (
      this.playerArrowPointer &&
      this.props.serverTable &&
      this.props.serverTableArrowMarker
    ) {
      this.playerArrowPointer.setTarget(this.props.serverTable);
      this.hideAllArrowMarkers();
      this.props
        .serverTableArrowMarker!.getComponents(Component_TargetArrow)[0]
        ?.setArrowMarkerVisible(true);
    }
  }

  public setServerTableToTableMarker() {
    if (this.playerArrowPointer && this.props.tableEntity) {
      this.playerArrowPointer.setTarget(this.props.tableEntity);
    }
  }

  hideAllArrowMarkers() {
    if (this.props.coneMachineArrowMarker) {
      this.props
        .coneMachineArrowMarker!.getComponents(Component_TargetArrow)[0]
        ?.setArrowMarkerVisible(false);
    }
    if (this.props.scoopingTableArrowMarker) {
      this.props
        .scoopingTableArrowMarker!.getComponents(Component_TargetArrow)[0]
        ?.setArrowMarkerVisible(false);
    }
    if (this.props.vanillaMachineArrowMarker) {
      this.props
        .vanillaFetchingMachineArrowMarker!.getComponents(
          Component_TargetArrow
        )[0]
        ?.setArrowMarkerVisible(false);
    }
    if (this.props.vanillaMachineArrowMarker) {
      this.props
        .vanillaMachineArrowMarker!.getComponents(Component_TargetArrow)[0]
        ?.setArrowMarkerVisible(false);
    }
    if (this.props.serverTableArrowMarker) {
      this.props
        .serverTableArrowMarker!.getComponents(Component_TargetArrow)[0]
        ?.setArrowMarkerVisible(false);
    }
  }
}
hz.Component.register(Manager_FTUEMarkers);
