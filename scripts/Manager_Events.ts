import { Player, LocalEvent, Entity, NetworkEvent } from "horizon/core";
import { PlayerRoles } from "Enums_Game";

export const PlayerJoinedEvent = new LocalEvent<{ player: Player }>();
export const PlayerLeftEvent = new LocalEvent<{ player: Player }>();

export const PlayerSwitchedRoleEvent = new LocalEvent<{
  player: Player;
  newRole: PlayerRoles;
}>();

export const ParlourOpenedEvent = new LocalEvent<{}>();
export const ParlourClosedEvent = new LocalEvent<{}>();
export const SecondPassedEvent = new LocalEvent<{}>();

// export const mainArenaSessionStarted = new LocalEvent<{ player: Player }>();
// export const teleportedToArena = new LocalEvent<{ player: Player }>();
// export const ftueArenaSessionStarted = new LocalEvent<{}>();

export const CashPoolUpdatedEvent = new LocalEvent<{}>();

export const addPlayersToUseTrash = new LocalEvent<{
  player: Player;
}>();

export const removePlayersFromUseTrash = new LocalEvent<{
  player: Player;
}>();
export const ResetTrayForOrder = new LocalEvent<{
  trayId: string;
  player: Player;
}>();
export const onPlayerTrashedItem = new LocalEvent<{
  player: Player;
}>();

export const onServerTrashedItem = new LocalEvent<{
  player: Player;
  orderId: number;
}>();

export const pickedItemFromTray = new LocalEvent<{
  player: Player;
  entityId: bigint;
}>();

export const playerPickedItem = new LocalEvent<{
  player: Player;
  orderId: number;
  entityId: bigint;
}>();
export const iceCreamDelivered = new LocalEvent<{
  player: Player;
  orderId: number;
}>();

export const messCleanedAtTable = new LocalEvent<{
  tableId: string;
}>();

export const monsterPulledIn = new LocalEvent<{
  targetEntity: Entity;
  monsterIndex: number;
  itemKey: string;
}>();

export const setMonsterIndex = new LocalEvent<{
  index: number;
}>();

export const itemPickedFromScooper = new LocalEvent<{
  player: Player;
}>();

export const itemDroppedInTray = new LocalEvent<{
  player: Player;
}>();

export const spawnPointReady = new LocalEvent<{
  spawnPointType: PlayerRoles;
  spawnPointEntity: Entity;
}>();

export const ActivateFetcherControls = new NetworkEvent<{
  fetcherPlayer: Player | null;
}>("ActivateFetcherControls");

export const DeactivateFetcherControls = new NetworkEvent<{
  fetcherPlayer: Player | null;
}>("DeactivateFetcherControls");

export const ToggleFetcherVacuum = new NetworkEvent<{
  fetcherPlayer: Player | null;
}>("ToggleFetcherVacuum");

export const FetcherVacuumButttonPressed = new NetworkEvent<{
  fetcherPlayer: Player | null;
}>("FetcherVacuumButttonPressed");

export const PlayerEnterScooperFoot = new LocalEvent<{
  entity: Entity;
  player: Player;
}>();
export const PlayerExitScooperFoot = new LocalEvent<{
  entity: Entity;
  player: Player;
}>();

export const OrderStatusChanged = new LocalEvent<{}>();

export const PlayerEnteredSnowfightArea = new NetworkEvent<{
  player: Player;
}>("PlayerEnteredSnowfightArea");

export const PlayerGrabbedSnowball = new NetworkEvent<{
  player: Player;
}>("PlayerGrabbedSnowball");

export const PlayerDroppedSnowball = new NetworkEvent<{
  player: Player;
}>("PlayerDroppedSnowball");

export const PlayerExitedSnowfightArea = new NetworkEvent<{
  player: Player;
}>("PlayerExitedSnowfightArea");

export const PlayerEnteredSnowmanArea = new NetworkEvent<{
  player: Player;
}>("PlayerEnteredSnowmanArea");

export const PlayerExitedSnowmanArea = new NetworkEvent<{
  player: Player;
}>("PlayerExitedSnowmanArea");

export const SnowballThrowEvent = new NetworkEvent<{
  player: Player;
}>("SnowballThrowEvent");

export const RushHourBegins = new LocalEvent<{}>();

export const RushHourEnds = new LocalEvent<{}>();

export const RoleSwitched = new NetworkEvent<{
  player: Player;
}>("RoleSwitched");
export const PlayerNameStatsUpdatedEvent = new NetworkEvent<{
  player: Player;
  newRole: PlayerRoles;
}>("PlayerNameStatsUpdatedEvent");
export const PlayerCashUpdatedEvent = new NetworkEvent<{
  player: Player;
  newCash: number;
}>("PlayerCashUpdatedEvent");

export const PlayerExpUpdatedEvent = new NetworkEvent<{
  player: Player;
  newExp: number;
  prevCap: number;
  nextCap: number;
  level: number;
}>("PlayerExpUpdatedEvent");