import { TableStatus } from "Enums_Game";
import { MeshEntity, TextureAsset } from "horizon/2p";
import * as hz from "horizon/core";
import { ParlourClosedEvent } from "Manager_Events";

class Component_TableBoards extends hz.Component<typeof Component_TableBoards> {
  static propsDefinition = {
    tableBoardRedTexture: { type: hz.PropTypes.Asset },
    tableBoardGreenTexture: { type: hz.PropTypes.Asset },
    tableBoardBlueTexture: { type: hz.PropTypes.Asset },
    tableBoardYellowTexture: { type: hz.PropTypes.Asset },
    tableBoardWhiteTexture: { type: hz.PropTypes.Asset },
    tableStatusBoardEntity: { type: hz.PropTypes.Entity },
    tableNumberText: { type: hz.PropTypes.Entity },
    tableStatusText: { type: hz.PropTypes.Entity },
  };

  private tableStatusText: Record<TableStatus, string> = {
    [TableStatus.Free]: "NO ORDER",
    [TableStatus.Taken]: "NO ORDER",
    [TableStatus.Occupied]: "TAKE ORDER",
    [TableStatus.WaitingForOrder]: "WAITING",
    [TableStatus.Dirty]: "CLEAN",
    [TableStatus.Served]: "SERVED",
  };


  redBoard: hz.TextureAsset | null = null;
  greenBoard: hz.TextureAsset | null = null;
  blueBoard: hz.TextureAsset | null = null;
  yellowBoard: hz.TextureAsset | null = null;
  whiteBoard: hz.TextureAsset | null = null;


  start() {

    const timeout = this.async.setTimeout(() => {
      this.getChildrenBoards();
      this.connectLocalBroadcastEvent(ParlourClosedEvent, () => {
        this.resetBoardVisibility();
      });
      this.setBoardTexture(this.whiteBoard!);
      this.resetBoardVisibility();
      this.async.clearTimeout(timeout);
    }, 3000);
  }

  getChildrenBoards() {
    this.redBoard = this.props.tableBoardRedTexture!.as(hz.TextureAsset);
    this.greenBoard = this.props.tableBoardGreenTexture!.as(hz.TextureAsset);
    this.blueBoard = this.props.tableBoardBlueTexture!.as(hz.TextureAsset);
    this.yellowBoard = this.props.tableBoardYellowTexture!.as(hz.TextureAsset);
    this.whiteBoard = this.props.tableBoardWhiteTexture!.as(hz.TextureAsset);
  }

  setBoardTexture(texture: TextureAsset) {
    this.props.tableStatusBoardEntity?.as(MeshEntity).setTexture(texture);
  }

  resetBoardVisibility() {
    this.getChildrenBoards();
    this.updateBoardVisibility(TableStatus.Free, "");
  }

  updateBoardVisibility(status: TableStatus, tableNumber: string) {
    // console.log.*$
    //   `Updating board ${tableNumber} to status ${status} to ${this.tableStatusText[status]}`
    // );
    this.props.tableNumberText?.as(hz.TextGizmo).text.set(tableNumber);
    this.props.tableStatusText
      ?.as(hz.TextGizmo)
      .text.set(this.tableStatusText[status]);
    switch (status) {
      case TableStatus.Free:
        this.setBoardTexture(this.whiteBoard!); break;
      case TableStatus.Taken:
        this.setBoardTexture(this.whiteBoard!); break;
      case TableStatus.Occupied:
        this.setBoardTexture(this.greenBoard!); break;
      case TableStatus.WaitingForOrder:
        this.setBoardTexture(this.yellowBoard!); break;
      case TableStatus.Dirty:
        this.setBoardTexture(this.redBoard!); break;
      case TableStatus.Served:
        this.setBoardTexture(this.blueBoard!); break;
      default:
        this.setBoardTexture(this.whiteBoard!);
        break;
    }
  }

}



hz.Component.register(Component_TableBoards);
export default Component_TableBoards;
