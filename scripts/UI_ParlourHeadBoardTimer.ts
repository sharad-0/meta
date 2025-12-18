import { Color } from "horizon/core";
import { Binding, Text, UIComponent, UINode, View } from "horizon/ui";
import { SecondPassedEvent } from "Manager_Events";
import { gameManager, mainArenaManager } from "Managers_Instance";

class UI_ParlourHeadBoardTimer extends UIComponent<
  typeof UI_ParlourHeadBoardTimer
> {
  protected panelHeight: number = 600;
  protected panelWidth: number = 1000;

  static propsDefinition = {};

  private bgColorBinding = new Binding<Color>(Color.fromHex("#D51B1B"));
  private openTextBinding = new Binding<string>("00:00");

  initializeUI(): UINode {
    return View({
      children: [
        Text({
          text: "Opens in",
          style: {
            fontSize: 120,
            fontFamily: "Bangers",
            fontWeight: "bold",
            color: "#FFFFFF",
            textAlign: "center",
            textAlignVertical: "center",
          },
        }),
        Text({
          text: this.openTextBinding,
          style: {
            fontSize: 250,
            fontFamily: "Roboto",
            fontWeight: "bold",
            color: "#FF7676",
            textAlign: "center",
            textAlignVertical: "center",
          },
        }),
      ],
      style: {
        height: this.panelHeight,
        width: this.panelWidth,
        alignContent: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
      },
    });
  }

  start(): void {
    this.connectLocalBroadcastEvent(SecondPassedEvent, () => this.updateUI());
  }

  updateUI() {
    this.bgColorBinding.set(Color.fromHex("#D51B1B"));
    const openTime = mainArenaManager?.getTimeToOpenParlour() ?? 0;

    const minutes = Math.floor(openTime / 60);
    const seconds = openTime % 60;
    this.openTextBinding.set(
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    ); // Format as MM:SS

  }
}
UIComponent.register(UI_ParlourHeadBoardTimer);
