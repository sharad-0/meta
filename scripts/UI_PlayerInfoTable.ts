import {
  UIComponent,
  View,
  Text,
  Binding,
  UINode,
  Image,
  ImageSource,
} from "horizon/ui";
import { Player, PropTypes, TextureAsset } from "horizon/core";
import { playerManager } from "Managers_Instance";

export default class UI_PlayerInfoTable extends UIComponent<
  typeof UI_PlayerInfoTable
> {
  /** Fixed table dimensions. */
  static readonly ROWS = 7;
  static readonly COLS = 4; // dynamic cols: name, role, cash, time
  /* ------------------------------------------------------------------ */
  /* 1.  Constants – tweak the pixel widths to suit your design.        */
  /* ------------------------------------------------------------------ */
  COL_W = {
    idx: 25, // “No.” column
    name: 100, // Player name
    role: 80, // Role label
    cash: 70, // Cash earned
    time: 90, // Session time
  } as const;

  /* Optional decorative assets if you want to skin the table. */
  static propsDefinition = {
    headerBG: { type: PropTypes.Asset },
    rowBG: { type: PropTypes.Asset },
    highlightBG: { type: PropTypes.Asset },
    cashIcon: { type: PropTypes.Asset },
    timerIcon: { type: PropTypes.Asset },
  } as const;

  /** [row][col] → Binding  (col 0 = name, 1 = role, 2 = cash, 3 = time) */
  private readonly bindings: Binding<string>[][] = [];
  private showCaIconBinding: Binding<boolean> = new Binding<boolean>(false);
  private showTimerIconBinding: Binding<boolean> = new Binding<boolean>(false);
  /** ID returned by *setInterval* so we can clean up. */
  private tickerId: number | undefined;

  // ──────────────────────────────────────────────────────────────────────────
  // Lifecycle hooks
  // ──────────────────────────────────────────────────────────────────────────

  initializeUI(): UINode {
    // Pre‑allocate the bindings so we can wire them straight into <Text>.
    for (let r = 0; r < UI_PlayerInfoTable.ROWS; r++) {
      const rowBindings: Binding<string>[] = [];
      for (let c = 0; c < UI_PlayerInfoTable.COLS; c++) {
        rowBindings.push(new Binding<string>("--"));
      }
      this.bindings.push(rowBindings);
    }

    return View({
      style: {
        flexDirection: "column",
        height: "75%",
        width: "100%",
        top: "15%",
        borderRadius: 16,
      },
      children: [
        this.headerRow(),

        ...this.bindings.map((rowBindings, idx) =>
          this.dataRow(idx, rowBindings)
        ),
      ],
    });
  }

  start() {
    // Prime the table immediately and then tick every second.
    this.refresh();
    this.tickerId = this.async.setInterval(() => this.refresh(), 1_000);
  }

  destroy() {
    if (this.tickerId !== undefined) {
      this.async.clearInterval(this.tickerId);
    }
  }

  /** Builds the static header row. */
  private headerRow(): UINode {
    return Image({
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        height: "100%",
        width: "100%",
        borderRadius: 16,
      },
      source: ImageSource.fromTextureAsset(
        this.props.headerBG! as TextureAsset
      ),
    });
  }

  /** Builds a single data row. */
  private dataRow(idx: number, rowBindings: Binding<string>[]): UINode {
    const numCell = Text({
      text: String(idx + 1),
      style: {
        // flex: 0,
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        width: this.COL_W.idx,
        // backgroundColor: "rgba(25, 192, 80, 0.5)",
        color: "white",
        left: 5,
      },
    });

    const makeCell = (
      binding: Binding<string>,
      left: number,
      width: number,
      textAlign: "flex-start" | "flex-end" | "center",
      iconAssetPresent: boolean,
      iconAsset?: TextureAsset
    ) => {
      // if (iconAssetPresent == true && binding.derive((text) => text == "--")) {
      //   iconAssetPresent = false;
      // }
      return View({
        children: [
          UINode.if(
            iconAssetPresent == true, // Only show icon if asset is present
            Image({
              source: ImageSource.fromTextureAsset(iconAsset!),
              style: {
                // position: "absolute",
                // left: left - 2,
                width: 20,
                height: 20,
                // flex: 0,
                alignSelf: "flex-start",
                // top: 2,
                // backgroundColor: "rgba(25, 192, 80, 0.5)",
              },
            })
          ),
          Text({
            text: binding,
            style: {
              // flex: 0,
              fontSize: 16,
              // marginLeft: iconAssetPresent ? 5 : 0,
              // textAlign: textAlign,
              // overflow: "hidden",
              // left: left,
              // width: width,
              // backgroundColor: "rgba(156, 25, 25, 0.5)",
            },
          }),
        ],
        style: {
          // overflow: "hidden",
          left: left,
          width: width,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          // backgroundColor: "rgba(156, 25, 25, 0.5)",
        },
      });
    };
    return View({
      style: {
        flexDirection: "row",
        padding: 6,
        top: "17%",
        width: "80%",
        // justifyContent: "space-around",
        alignItems: "center",
        left: "2%",
      },
      children: [
        numCell,
        makeCell(
          rowBindings[0],
          5,
          this.COL_W.name,
          "center",
          false,
          this.props.cashIcon! as TextureAsset
        ), // player name
        makeCell(
          rowBindings[1],
          50,
          this.COL_W.role,
          "center",
          false,
          this.props.cashIcon! as TextureAsset
        ), // role
        makeCell(
          rowBindings[2],
          65,
          this.COL_W.cash,
          "flex-start",
          true,
          this.props.cashIcon! as TextureAsset
        ), // cash
        makeCell(
          rowBindings[3],
          85,
          this.COL_W.time,
          "flex-start",
          true,
          this.props.timerIcon! as TextureAsset
        ), // time
      ],
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Data refresh routine
  // ──────────────────────────────────────────────────────────────────────────

  private refresh() {
    const players = playerManager?.getCurrentPlayers() ?? [];
    for (let r = 0; r < UI_PlayerInfoTable.ROWS; r++) {
      const bRow = this.bindings[r];

      if (players[r]) {
        const player = players[r] as Player;
        const record = playerManager?.getPlayerRecord(player);

        // Column 0 – Player name (truncate client‑side if needed)
        if (record?.name!.length! > 12) {
          bRow[0].set(record?.name!.substring(0, 10) + "...");
        } else {
          bRow[0].set(record?.name!);
        }

        // bRow[0].set(record?.name ?? "--");

        // Column 1 – Role
        bRow[1].set(record?.role ?? "--");

        // Column 2 – Cash earned (to 1 decimal place)
        bRow[2].set(
          this.convertCashIntoString(record?.cashEarnedInSession ?? 0) ?? "--"
        );
        this.showCaIconBinding.set(
          record?.cashEarnedInSession! > 0 ? true : false
        );

        // Column 3 – Time in session HH:MM:SS
        bRow[3].set(this.formatElapsed(record?.sessionStartTime!));
        this.showTimerIconBinding.set(
          Date.now() - record?.sessionStartTime! > 0 ? true : false
        );
      } else {
        // No player for this slot – reset to placeholders
        for (const binding of bRow) binding.set("--");
      }
    }
  }

  convertCashIntoString(cash: number): string {
    if (cash < 1000) {
      return cash.toString();
    } else if (cash < 1_000_000) {
      return (cash / 1000).toFixed(0) + "K"; // e.g. 1.2K
    } else {
      return (cash / 1_000_000).toFixed(0) + "M"; // e.g. 1.2M
    }
  }

  /** Converts a session start timestamp → "HH:MM:SS" string. */
  private formatElapsed(startMs: number): string {
    const elapsed = Math.max(Date.now() - startMs, 0);
    const h = Math.floor(elapsed / 3_600_000)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((elapsed % 3_600_000) / 60_000)
      .toString()
      .padStart(2, "0");
    const s = Math.floor((elapsed % 60_000) / 1_000)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
}

UIComponent.register(UI_PlayerInfoTable);
