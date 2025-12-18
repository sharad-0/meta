import * as hz from "horizon/core";
import Manager_Inventory from "Manager_Inventory";
import Manager_Bag from "Manager_Bag";
import Manager_PlayerHud from "Manager_PlayerHud";
import Manager_Player from "Manager_Player";
import Manager_Town from "Manager_Town";
import Manager_Scooper from "Manager_Scooper";
import Manager_Scooper_Hand from "Manager_Scooper_Hand";
import Manager_Order from "Manager_Order";
import Manager_Game from "Manager_Game";
import Manager_FTUE from "Manager_FTUE";
import Manager_MainArena from "Manager_MainArena";
import Manager_Server from "Manager_Server";
import Manager_NavMesh from "Manager_NavMesh";
import Manager_Table from "Manager_Table";
import Manager_Cashier from "Manager_Cashier";
import Manager_CashierUI from "Manager_CashierUI";
import Manager_NPC from "Manager_NPC";
import Manager_PlayerAnimations from "Manager_PlayerAnimations";
import Manager_ObjectPooling from "Manager_ObjectPooling";
import Manager_Utility from "Manager_Utility";
import Manager_CashPool from "Manager_CashPool";
import Manager_RingArrow from "Manager_RingArrow";
import Manager_Props from "Manager_Props";
import Manager_VacuumControl from "Manager_VacuumControl";
import Manager_Bot from "Manager_Bot";
import { HapticsManager } from "HapticsManager";
import Manager_Theme from "Manager_Theme";
import Manager_Snowflake from "Manager_Snowflake";

export let playerManager: Manager_Player | null = null;
export let gameManager: Manager_Game | null = null;
export let townManager: Manager_Town | null = null;

export let bagManager: Manager_Bag | null = null;
export let orderManager: Manager_Order | null = null;
export let inventoryManager: Manager_Inventory | null = null;
export let tableManager: Manager_Table | null = null;
export let hudManager: Manager_PlayerHud | null = null;
export let scooperManager: Manager_Scooper | null = null;
export let scooperHandManager: Manager_Scooper_Hand | null = null;
export let serverManager: Manager_Server | null = null;
export let cashierManager: Manager_Cashier | null = null;
export let cashierUIManager: Manager_CashierUI | null = null;
export let ringArrowManager: Manager_RingArrow | null = null;
export let propsManager: Manager_Props | null = null;

export let navMeshManager: Manager_NavMesh | null = null;
export let npcManager: Manager_NPC | null = null;
export let objectPoolManager: Manager_ObjectPooling | null = null;
export let utilityManager: Manager_Utility | null = null;
export let cashPoolManager: Manager_CashPool | null = null;

export let trainingManager: Manager_FTUE | null = null;
export let mainArenaManager: Manager_MainArena | null = null;
export let playerAnimations: Manager_PlayerAnimations | null = null;

export let vacuumController: Manager_VacuumControl | null = null;

export let botManager: Manager_Bot | null = null;
export let hapticsManager: HapticsManager | null = null;
export let themeSessionManager: Manager_Theme | null = null;

export let snowflakeManager: Manager_Snowflake | null = null;

export default class Managers_Instance extends hz.Component<
  typeof Managers_Instance
> {
  static propsDefinition = {
    BagManager: { type: hz.PropTypes.Entity },
    OrderManager: { type: hz.PropTypes.Entity },
    InventoryManager: { type: hz.PropTypes.Entity },
    HudManager: { type: hz.PropTypes.Entity },
    ScooperManager: { type: hz.PropTypes.Entity },
    ScooperHandManager: { type: hz.PropTypes.Entity },
    ServerManager: { type: hz.PropTypes.Entity },
    CashierManager: { type: hz.PropTypes.Entity },
    CashierUIManager: { type: hz.PropTypes.Entity },
    TableManager: { type: hz.PropTypes.Entity },
    PlayerAnimationsManager: { type: hz.PropTypes.Entity },
    ObjectPoolManager: { type: hz.PropTypes.Entity },
    UtilityManager: { type: hz.PropTypes.Entity },
    RingArrowManager: { type: hz.PropTypes.Entity },
    PropsManager: { type: hz.PropTypes.Entity },
    ManagerVacuumControl: { type: hz.PropTypes.Entity },
    BotManager: { type: hz.PropTypes.Entity },
    HapticsManager: { type: hz.PropTypes.Entity },
    themeSessionmanager: { type: hz.PropTypes.Entity },
    snowflakeManager: { type: hz.PropTypes.Entity },

    // NavMeshManager: { type: hz.PropTypes.Entity },
    // NPCManager: { type: hz.PropTypes.Entity },
    // CashPoolManager: { type: hz.PropTypes.Entity },
    // TownManager: { type: hz.PropTypes.Entity },
    // RoleSwitchPlatformManager: { type: hz.PropTypes.Entity },
    // TrainingManager: { type: hz.PropTypes.Entity },
    // MainArenaManager: { type: hz.PropTypes.Entity },
  };

  private static ArenaManager: Managers_Instance | null = null;
  static get(): Managers_Instance {
    if (!Managers_Instance.ArenaManager) {
      throw new Error(
        "Instance Manager is not initialised – attach it to an always‑loaded entity."
      );
    }
    return Managers_Instance.ArenaManager;
  }

  preStart(): void {
    if (Managers_Instance.ArenaManager) {
      throw new Error("Arena Manager is already initialised.");
    }
    Managers_Instance.ArenaManager = this;
    // console.log.*$
  }

  start() {
    themeSessionManager =
      this.props.themeSessionmanager?.getComponents(Manager_Theme)[0] ?? null;

    // cashPoolManager = this.props.CashPoolManager?.getComponents(Manager_CashPool)[0] ?? null;
    // if (!cashPoolManager) {
    //   throw new Error("CashPoolManager is not set or not found.");
    // }

    snowflakeManager =
      this.props.snowflakeManager?.getComponents(Manager_Snowflake)[0] ?? null;


    playerManager = Manager_Player.get() ?? null;
    if (!playerManager) {
      throw new Error("PlayerManager is not set or not found.");
    }

    gameManager = Manager_Game.get() ?? null;
    if (!gameManager) {
      throw new Error("GameManager is not set or not found.");
    }

    // townManager = this.props.TownManager?.getComponents(Manager_Town)[0] ?? null;
    // if (!townManager) {
    //   throw new Error("TownManager is not set or not found.");
    // }

    // mainArenaManager = this.props.MainArenaManager?.getComponents(Manager_MainArena)[0] ?? null;
    // if (!mainArenaManager) {
    //   throw new Error("MainArenaManager is not set or not found.");
    // }

    // trainingManager = this.props.TrainingManager?.getComponents(Manager_FTUE)[0] ?? null;
    // if (!trainingManager) {
    //   throw new Error("TrainingManager is not set or not found.");
    // }

    bagManager = this.props.BagManager?.getComponents(Manager_Bag)[0] ?? null;
    if (!bagManager) {
      throw new Error("BagManager is not set or not found.");
    }

    orderManager =
      this.props.OrderManager?.getComponents(Manager_Order)[0] ?? null;
    if (!orderManager) {
      throw new Error("OrderManager is not set or not found.");
    }

    inventoryManager =
      this.props.InventoryManager?.getComponents(Manager_Inventory)[0] ?? null;
    if (!inventoryManager) {
      throw new Error("InventoryManager is not set or not found.");
    }

    hudManager =
      this.props.HudManager?.getComponents(Manager_PlayerHud)[0] ?? null;
    if (!hudManager) {
      throw new Error("HudManager is not set or not found.");
    }

    scooperManager =
      this.props.ScooperManager?.getComponents(Manager_Scooper)[0] ?? null;
    if (!scooperManager) {
      throw new Error("ScooperManager is not set or not found.");
    }

    scooperHandManager =
      this.props.ScooperHandManager?.getComponents(Manager_Scooper_Hand)[0] ??
      null;
    if (!scooperHandManager) {
      throw new Error("ScooperHandManager is not set or not found.");
    }

    serverManager =
      this.props.ServerManager?.getComponents(Manager_Server)[0] ?? null;
    if (!serverManager) {
      throw new Error("ServerManager is not set or not found.");
    }

    cashierManager =
      this.props.CashierManager?.getComponents(Manager_Cashier)[0] ?? null;
    if (!cashierManager) {
      throw new Error("CashierManager is not set or not found.");
    }

    cashierUIManager =
      this.props.CashierUIManager?.getComponents(Manager_CashierUI)[0] ?? null;
    if (!cashierUIManager) {
      throw new Error("CashierUIManager is not set or not found.");
    }

    // navMeshManager =
    //   this.props.NavMeshManager?.getComponents(Manager_NavMesh)[0] ?? null;
    // if (!navMeshManager) {
    //   throw new Error("NavMeshManager is not set or not found.");
    // }

    tableManager =
      this.props.TableManager?.getComponents(Manager_Table)[0] ?? null;
    if (!tableManager) {
      throw new Error("TableManager is not set or not found.");
    }

    // npcManager =
    //   this.props.NPCManager?.getComponents(Manager_NPC)[0] ?? null;
    // if (!npcManager) {
    //   throw new Error("NPCManager is not set or not found.");
    // }

    playerAnimations =
      this.props.PlayerAnimationsManager?.getComponents(
        Manager_PlayerAnimations
      )[0] ?? null;
    if (!playerAnimations) {
      throw new Error("PlayerAnimations is not set or not found.");
    }

    objectPoolManager =
      this.props.ObjectPoolManager?.getComponents(Manager_ObjectPooling)[0] ??
      null;
    if (!objectPoolManager) {
      throw new Error("ObjectPoolManager is not set or not found.");
    }

    utilityManager =
      this.props.UtilityManager?.getComponents(Manager_Utility)[0] ?? null;
    if (!utilityManager) {
      throw new Error("UtilityManager is not set or not found.");
    }

    ringArrowManager =
      this.props.RingArrowManager?.getComponents(Manager_RingArrow)[0] ?? null;
    if (!ringArrowManager) {
      throw new Error("RingArrowManager is not set or not found.");
    }

    propsManager =
      this.props.PropsManager?.getComponents(Manager_Props)[0] ?? null;
    if (!propsManager) {
      throw new Error("PropsManager is not set or not found.");
    }

    vacuumController =
      this.props.ManagerVacuumControl?.getComponents(
        Manager_VacuumControl
      )[0] ?? null;
    if (!vacuumController) {
      throw new Error("ManagerVacuumControl is not set or not found.");
    }

    botManager = this.props.BotManager?.getComponents(Manager_Bot)[0] ?? null;
    if (!botManager) {
      throw new Error("BotManager is not set or not found.");
    }

    hapticsManager =
      this.props.HapticsManager?.getComponents(HapticsManager)[0] ?? null;
    if (!hapticsManager) {
      throw new Error("HapticsManager is not set or not found.");
    }

    // cashPoolManager = this.props.CashPoolManager?.getComponents(Manager_CashPool)[0] ?? null;
    // if (!cashPoolManager) {
    //   throw new Error("CashPoolManager is not set or not found.");
    // }

    // console.log.*$
  }

  setTrainingManager(manager: Manager_FTUE) {
    trainingManager = manager;
    // console.log.*$
  }

  setMainArenaManager(manager: Manager_MainArena | null) {
    mainArenaManager = manager;
    // console.log.*$
  }

  setTownManager(manager: Manager_Town) {
    townManager = manager;
    // console.log.*$
  }

  setCashPoolManager(manager: Manager_CashPool) {
    cashPoolManager = manager;
    // console.log.*$
  }

  setNpcManager(manager: Manager_NPC) {
    npcManager = manager;
    // console.log.*$
  }

  setNavMeshManager(manager: Manager_NavMesh) {
    navMeshManager = manager;
    // console.log.*$
  }
}
hz.Component.register(Managers_Instance);
