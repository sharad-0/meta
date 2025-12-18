import { Color } from 'horizon/core';
import { Binding, Text, UIComponent, UINode, View } from 'horizon/ui';
import { ParlourClosedEvent, ParlourOpenedEvent, SecondPassedEvent } from 'Manager_Events';
import { gameManager, mainArenaManager } from 'Managers_Instance';

class UI_ParlourOpenStatus extends UIComponent<typeof UI_ParlourOpenStatus> {
  protected panelHeight: number = 130;
  protected panelWidth: number = 600;

  static propsDefinition = {};

  private  bgColorBinding = new Binding<Color>(Color.fromHex("#D51B1B"));
  private openTextBinding = new Binding<string>("Closed");

  initializeUI(): UINode {
    return View({
      children: [
        Text({
          text: this.openTextBinding,
          style: {
            fontSize: 120,
            fontFamily: 'Roboto',
            fontWeight: 'bold',
            color: '#FFFFFF',
            textAlign: 'center',
            textAlignVertical: 'center',
            height: this.panelHeight,
            width: this.panelWidth,
          }
        })
      ],
      style: {
        backgroundColor: this.bgColorBinding,
        borderRadius: 50,
        height: this.panelHeight,
        width: this.panelWidth,
      }
    });
  }

  start() {
    this.connectLocalBroadcastEvent(ParlourOpenedEvent, () => this.updateUI());
    this.connectLocalBroadcastEvent(ParlourClosedEvent, () => this.updateUI());
  }

  updateUI() {
    if (mainArenaManager?.isParlourOpen()) {
      this.bgColorBinding.set(Color.fromHex("#2DB711"));
      this.openTextBinding.set("Open");
    } else {
      this.bgColorBinding.set(Color.fromHex("#D51B1B"));
      this.openTextBinding.set("Closed");
    }
  }
}
UIComponent.register(UI_ParlourOpenStatus);