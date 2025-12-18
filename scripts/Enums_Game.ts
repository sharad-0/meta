import { NavMesh } from "horizon/navmesh";
import { Entity, Vec3 } from "horizon/core";

export enum NavMeshTags {
  NPC = "NPC",
}

export enum AudioGizmoTags {
  OrderAccepted = "OrderAccepted",
  ButtonTapSound = "ButtonTapSound",
  CashCollectedSound = "CashCollectedSound",
  OrderDelivered = "OrderDeliveredAudio",
  RoleSwitch = "RoleSwitchAudio",
}

export enum Items {
  None = "none",
  Cone = "item1",
  Vanilla = "item2",
  Strawberry = "item3",
  Chocolate = "item4",
}
export const orderItemAmount = {
  [Items.Cone]: 5,
  [Items.Vanilla]: 5,
  [Items.Strawberry]: 5,
  [Items.Chocolate]: 5,
};

export function getItems(): Items[] {
  return ITEM_VALUES.filter((item) => item !== Items.None);
}

export const ITEM_KEYS = Object.keys(Items) as Array<keyof typeof Items>;
export const ITEM_VALUES: Items[] = Object.values(Items);

export function parseItem(value: string): Items | undefined {
  return Object.values(Items).includes(value as Items)
    ? (value as Items)
    : undefined;
}

export function getEnumValueFromKey(value: string): Items | undefined {
  return Items[value as keyof typeof Items];
}

export function getEnumKeyFromValue(value: Items): string | undefined {
  return Object.keys(Items).find(
    (key) => Items[key as keyof typeof Items] === value
  );
}

export interface IceCream {
  items: Items[];
  orderId: number;
}

export enum PlayerRoles {
  Fetcher = "Fetcher",
  Scooper = "Scooper",
  Server = "Server",
  Unknown = "Unknown",
}

export type Role = "Fetcher" | "Scooper" | "Server";

export function toPlayerRole(role: Role): PlayerRoles {
  return PlayerRoles[role];
}

export enum OrderStatus {
  Pending = "pending",
  Accepted = "accepted",
  Completed = "completed",
  Delivered = "delivered",
  Paid = "paid",
}

export type TableData = {
  status: TableStatus;
  position: Vec3;
  tableId: string;
  isOrderSet?: boolean; // optional, used when the table is occupied
  tableCenter?: Vec3;
};

export enum TableStatus {
  Free = "Free",
  Taken = "Taken",
  Occupied = "Occupied",
  WaitingForOrder = "Waiting",
  Served = "Served",
  Dirty = "Dirty",
}

export const TABLESTATUS_COLORS = {
  free: "rgba(42, 241, 255, 0.6)",
  occupied: "#9e3a3a33",
  hover: "#1565c0ff",
  dirty: "rgba(255, 153, 0, 0.2)",
};

export const TABLESTATUS_BORDERCOLORS = {
  free: "#2AF1FF",
  occupied: "#9E3A3A",
  hover: "#1565c0",
  dirty: "#FF9900",
};

export enum NotificationTypes {
  bagFull = "BagFull",
  outOfStock = "OutOfStock",
  maxCapacity = "MaxCapacity",
  orderConfirmed = "OrderConfirmed",
  SwitchingRole = "SwitchingRole",
  RoleSwitched = "RoleSwitched",
  RoleSwitchingCancelled = "RoleSwitchingCancelled",
  OrderServed = "OrderServed",
  PickingCone = "PickingCone",
  ScoopingVanilla = "ScoopingVanilla",
  ScoopingStrawberry = "ScoopingStrawberry",
  ScoopingChocolate = "ScoopingChocolate",
  ShiftEnded = "ShiftEnded",
  ParlorOpen = "parlourOpen",
  ClosingIn2Mins = "ClosingIn2Mins",
  RushHourBegin = "RushHourBegin",
  FetcherRoleSelected = "FetcherRoleSelected",
  ScooperRoleSelected = "ScooperRoleSelected",
  ServerRoleSelected = "ServerRoleSelected",
  LevelUpgraded = "LevelUpgraded",
  PlaceItemFirst = "PlaceItemFirst",
  CashEarned = "CashEarned",
  SnowmanBuildRequirement = "SnowmanBuildRequirement",
}

// -----------------------------------------------------------------------------
//                          CashierUIConstants.ts
// -----------------------------------------------------------------------------

// Exports an array of themed greetings that can be shown to NPC customers.
export interface Greeting {
  id: string; // unique identifier for analytics / persistence
  text: string; // line shown in the speech bubble or HUD
  color: string; // hex colour applied to the text bubble
  chances: number; // relative weight in the random‑picker
  tip: number; // bonus tip percentage awarded when used
}

export enum ComponentTags {
  CashierStation = "cashierStation",
  NpcDestroyer = "NpcDestroyer",
  WaitingArea = "WaitingArea",

  CashierStation_FTUE = "cashierStation_FTUE",
  NpcDestroyer_FTUE = "NpcDestroyer_FTUE",
  WaitingArea_FTUE = "WaitingArea_FTUE",
}

export enum CashierStatus {
  Greeting = "greeting",
  Placed = "placed",
  CollectCash = "collectCash",
  Completed = "completed",
  Undefined = "undefined", // used when the customer is not in the queue
}

export interface Customer {
  id: bigint;
  orderId: number;
}

export enum CashierUiTags {
  GreetingAssignment = "CashierGreetingUI",
  OrderAccepted = "OrderAcceptedUI",
  Undefined = "undefined",
}

/**
 * List of greetings available to the cashier role.
 * The higher the `chances` value, the more frequently it will be randomly
 * selected.  Keep the sum proportional rather than normalised – the picker
 * can weight them on the fly.
 */
export const GreetingsData: Greeting[] = [
  {
    id: "greeting1",
    text: "Hello! Welcome to Scoop up",
    color: "#158710",
    chances: 100,
    tip: 1,
  },
  {
    id: "greeting2",
    text: "Good Day to you!, Welcome to Scoop up",
    color: "#BA7214",
    chances: 50,
    tip: 5,
  },
  {
    id: "greeting3",
    text: "You look amazing today! Welcome to Scoop up",
    color: "#AB3C3C",
    chances: 10,
    tip: 15,
  },
];

export interface ChangeButton {
  id: number;
  text: string;
  value: number;
}

export const ChangeButtonData: ChangeButton[] = [
  {
    id: 1,
    text: "1's",
    value: 1,
  },
  {
    id: 2,
    text: "5's",
    value: 5,
  },
  {
    id: 3,
    text: "10's",
    value: 10,
  },
];
export const OrderCostData = {
  1: 10,
  2: 20,
  3: 40,
  4: 60,
};

export const CustomerPaymentData = [
  10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80,
];

export const itemVsMachineAnimationName = {
  [Items.Cone]: "Cone_machineee",
  [Items.Vanilla]: "Strawberry_anim",
  [Items.Strawberry]: "Strawberry_anim",
  [Items.Chocolate]: "Strawberry_anim",
};

export const xpThresholdsPerLevel = [
  0, // Level 1
  50, // Level 2
  100, // Level 3
  200, // Level 4
  300, // Level 5
  400, // Level 6
  600, // Level 7
  750, // Level 8
  950, // Level 9
  1150, // Level 10
  1400, // Level 11
  1650, // Level 12
  1900, // Level 13
  2200, // Level 14
  2500, // Level 15
  2850, // Level 16
  3200, // Level 17
  3600, // Level 18
  4000, // Level 19
  4450, // Level 20
];

export const xpCumulativeCaps: number[] = (() => {
  const caps: number[] = [];
  let sum = 0;
  for (let i = 0; i < xpThresholdsPerLevel.length; i++) {
    sum += xpThresholdsPerLevel[i];
    caps.push(sum);
  }
  // caps[0] currently equals 0 (since first element is 0), which is desired: Level 1 = 0 total XP.
  return caps;
})();
// -----------------------------------------------------------------------------
//                          Component_House.ts
// -----------------------------------------------------------------------------

export const WaffleUpgradeCost = new Map<number, [number, number]>([
  [2, [2, 125]],
  [3, [3, 400]],
  [4, [4, 800]],
]);

export const ScoopUpgradeCost = new Map<number, [number, number]>([
  [2, [2, 125]],
  [3, [3, 400]],
  [4, [4, 800]],
]);

export interface ScoopDecoration {
  assetId: string;
  rotation: number;
}

export enum UpgradeType {
  Waffle = 1,
  Scoop = 2,
  Decor = 3,
}

export interface UpgradeInfo {
  assetId: string;
  yRotation: number;
  color: ColorCombinations;
  decoration?: ScoopDecoration;
}

export enum ColorCombinations {
  Pink = 1, // strawberry
  Orange = 2,
  Blue = 3,
  Green = 4,
  Brown = 5, // chocolate
  White = 6, // vanilla
}

export interface PlayerHouseConfig {
  waffles: UpgradeInfo[];
  scoops: UpgradeInfo[];
}

export enum LeaderBoardNames {
  AllRounders = "All Rounders",
  TopFetchers = "Top Fetchers",
  TopScoopers = "Top Scoopers",
  TopServers = "Top Servers",
}

export type DeliveryType = "green" | "yellow" | "red";
export enum DeliveryTypeEnum {
  Fast = "green",
  Normal = "yellow",
  Late = "red",
}
export enum EntryTypes {
  main = "mainEntry",
  server = "serverEntry",
  fetcher = "fetcherEntry",
  scooper = "scooperEntry",
}

export const CustomAnalyticsEvents = {
  RoleSwitched: "Role_Switched",
  ServerWrongOrder: "Server_Wrong_Order",
  ServerCorrectOrder: "Server_Correct_Order",
  ServerOrderDelivered: "Server_Order_Delivered",
  ServerCleanedTable: "Server_Cleaned_Table",
  ScooperPickedItem: "Scooper_Picked_Item",
  ScooperDepositItem: "Scooper_Deposited_Item",
  ScooperCorrectIceCream: "Scooper_Correct_IceCream",
  ScooperWrongDeposit: "Scooper_Wrong_Deposit",
  FetcherFetchedItems: "Fetcher_Fetched_Items",
  FetcherDepositedItems: "Fetcher_Deposited_Items",
  FetcherTrashedItems: "Fetcher_Trashed_Items",
  ScooperTrashedItems: "Scooper_Trashed_Items",
  ServerTrashedItems: "Server_Trashed_Items",
  TownUpgradeButtonClicked: "Town_Upgrade_Button_Clicked",
  GameTutorialStarted: "Game_Tutorial_Started",
  RoleTutorialStarted: "Role_Tutorial_Started",
  GameTutorialEnded: "Game_Tutorial_Ended",
  RoleTutorialEnded: "Role_Tutorial_Ended",
  ServerOrderStarted: "Server_Order_Started",
  ServerOrderGuessed: "Server_Order_Guessed",
  CashCredit: "Cash_Credit",
  XpCredit: "XP_Credit",
  LevelUp: "Level_Up",
  CashDebit: "Cash_Debit",
  ParlourSessionEnd: "Parlour_Session_End",
  ParlourSessionStart: "Parlour_Session_Start",
};
