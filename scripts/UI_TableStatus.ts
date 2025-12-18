import { TableStatus } from 'Enums_Game';
import { Color } from 'horizon/core';
import { Binding, Text, UIComponent, UINode, View } from 'horizon/ui';

export default class UI_TableStatus extends UIComponent<typeof UI_TableStatus> {
  static propsDefinition = {};
  colorBinding: Binding<Color> = new Binding<Color>(Color.fromHex("#FFFFFF"));
  textBinding: Binding<string> = new Binding<string>("NO ORDER");
  private tableStatusText: Record<TableStatus, string> = {
    [TableStatus.Free]: "NO ORDER",
    [TableStatus.Taken]: "NO ORDER",
    [TableStatus.Occupied]: "TAKE ORDER",
    [TableStatus.WaitingForOrder]: "WAITING",
    [TableStatus.Dirty]: "CLEAN",
    [TableStatus.Served]: "SERVED",
  };
  initializeUI(): UINode {
    return View({
      children: [
        Text({
          text: this.textBinding,
          style: {
            fontSize: 76,
            textAlign: 'center',
            textAlignVertical: 'center',
            color: 'black',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '90%',
            fontFamily: "Roboto-Mono",
            fontWeight: "bold"
          }
        })
      ],
      style: {
        backgroundColor: this.colorBinding,
        height: "100%",
        width: "100%",
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',

      }
    });
  }

  updateUi(status: TableStatus) {
    switch (status) {
      case TableStatus.Free:
        this.colorBinding.set(Color.fromHex("#FFFFFF"));
        this.textBinding.set(this.tableStatusText[TableStatus.Free]);
        break;
      case TableStatus.Taken:
        this.colorBinding.set(Color.fromHex("#FFFFFF"));
        this.textBinding.set(this.tableStatusText[TableStatus.Taken]);
        break;
      case TableStatus.Occupied:
        this.colorBinding.set(Color.fromHex("#72f00b"));
        this.textBinding.set(this.tableStatusText[TableStatus.Occupied]);
        break;
      case TableStatus.WaitingForOrder:
        this.colorBinding.set(Color.fromHex("#FFFF00"));
        this.textBinding.set(this.tableStatusText[TableStatus.WaitingForOrder]);
        break;
      case TableStatus.Dirty:
        this.colorBinding.set(Color.fromHex("#FF0000"));
        this.textBinding.set(this.tableStatusText[TableStatus.Dirty]);
        break;

      case TableStatus.Served:
        this.colorBinding.set(Color.fromHex("#00a2ff"));
        this.textBinding.set(this.tableStatusText[TableStatus.Served]);
        break;

      default:
        this.colorBinding.set(Color.fromHex("#FFFFFF"));
        this.textBinding.set(this.tableStatusText[TableStatus.Free]);
        break;
    }
  }
}
UIComponent.register(UI_TableStatus);
