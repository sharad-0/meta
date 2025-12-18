import { Color, PropTypes, TextureAsset } from "horizon/core";
import {
  Binding,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { playerManager } from "Managers_Instance";

class UI_RoleSelectionNotif extends UIComponent<typeof UI_RoleSelectionNotif> {
  static propsDefinition = {};
  private roleNameBinding = new Binding<string>("Role Selected!");

  initializeUI(): UINode {
    return View({
      children: Text({
        text: this.roleNameBinding,
        style: {
          fontSize: 28,
          color: Color.white,
          textAlign: "center",
          textAlignVertical: "center",
          fontWeight: "bold",
          fontFamily: "Roboto",
        },
      }),

      style: {
        position: "absolute",
        backgroundColor: "rgba(23, 201, 23, 0.7)",
        borderRadius: 12,
        top: "18%",
        width: "60%",
        left: "20%",
        right: "20%",
        height: "10%",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center",
      },
    });
  }

  public refreshUI() {
    // // console.log.*$
    playerManager?.getCurrentPlayers().forEach((player) => {
      const role = playerManager?.getRole(player);
      this.roleNameBinding.set(`${role} role is selected!`, [player]);
    });
  }
}
UIComponent.register(UI_RoleSelectionNotif);
export default UI_RoleSelectionNotif;
