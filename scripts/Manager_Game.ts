import * as hz from "horizon/core";
import { PlayerJoinedEvent } from "Manager_Events";
import Managers_Instance, {
  mainArenaManager,
  playerManager,
  townManager,
  utilityManager,
} from "Managers_Instance";
// import Manager_FTUE from "Manager_FTUE";
import { StartGroupTravelOptions, World2p } from "horizon/2p";
import { NotificationTypes } from "Enums_Game";
import Manager_MainArena from "Manager_MainArena";
import { Npc } from "horizon/npc";

const worldId: string = "900205496499154"; // This should be the ID of the world you want to teleport to

export default class Manager_Game extends hz.Component<typeof Manager_Game> {
  private static _instance: Manager_Game | null = null;
  static get(): Manager_Game {
    if (!Manager_Game._instance) {
      throw new Error(
        "GameManager not initialised – attach it to an always‑loaded entity."
      );
    }
    return Manager_Game._instance;
  }

  private trainingSession: boolean = false;
  private startSessionGame: boolean = false;

  static propsDefinition = {
    mainArenaAsset: { type: hz.PropTypes.Asset },
    ftueArenaAsset: { type: hz.PropTypes.Asset },
  };

  preStart(): void {
    if (Manager_Game._instance) {
      throw new Error("GameManager is already initialised.");
    }
    Manager_Game._instance = this;
    // console.log.*$

    this.connectLocalBroadcastEvent(PlayerJoinedEvent, ({ player }) => {
      if (!Npc.playerIsNpc(player)) {
        this.onPlayerJoined(player);
      }
    });
  }

  start() {}

  onPlayerJoined(player: hz.Player) {
    // console.log.*$

    // check if the player is in FTUE mode.
    // if (playerManager?.getPlayerRecord(player)?.completedFTUE === false) {
    //   this.handlePlayerFTUE(player);
    // } else {
    //   // console.log.*$
    //   if (this.startSessionGame && this.trainingSession) {
    //     this.async.setTimeout(() => {
    //       this.throwPlayerInAnotherInstance(player);
    //     }, 5000);
    //     return;
    //   }
    //   this.handleMainArena(player);
    // }

    // this.sendLocalBroadcastEvent(teleportedToArena, { player });

    // if (!this.startSessionGame) {
    //   this.sendLocalBroadcastEvent(mainArenaSessionStarted, { player });
    // }
    this.startSessionGame = true; // claim immediately

    // try {
    //   this.world.matchmaking.allowPlayerJoin(true); // allow other players to join again
    // } catch (e) {
    //   // console.log.*$
    // }
  }

  // async handlePlayerFTUE(player: hz.Player) {
  //   // check if this instance has players in main mode and throw this player to new instance
  //   // this.showTeleportingNotif(player);
  //   if (this.startSessionGame) {
  //     // console.log.*$
  //     await utilityManager?.sleep(10); // wait for 10 seconds before throwing the player
  //     this.throwPlayerInAnotherInstance(player);
  //     return;
  //   }

  //   // check if this instance already has a FTUE arena spawned
  //   // console.log.*$
  //   this.world.matchmaking.allowPlayerJoin(false);
  //   this.trainingSession = true;
  //   this.startSessionGame = true;

  //   this.spawnFTUEArena(player);
  // }

  // handleMainArena(player: hz.Player) {
  //   if (this.startSessionGame) {
  //     this.async.setTimeout(() => {
  //       mainArenaManager?.TeleportPlayerToSpawnPoint(player);
  //       const intervalId = this.async.setInterval(() => {
  //         const spawnPos = mainArenaManager?.GetSpawnPointLocation();

  //         // console.log.*$
  //           `[SpawnPoint] Checking spawn point ${spawnPos} for  ${player.name.get()}.`
  //         );
  //         if (
  //           spawnPos &&
  //           spawnPos !== hz.Vec3.zero &&
  //           spawnPos.distance(player.position.get()) < 1
  //         ) {
  //           // console.log.*$
  //             `[SpawnPoint] Player ${player.name.get()} teleported successfully. ${spawnPos} <-> ${player.position.get()}`
  //           );
  //           if (intervalId) this.async.clearInterval(intervalId); // stop retrying
  //           this.sendLocalBroadcastEvent(teleportedToArena, { player });

  //           return;
  //         }
  //         // console.log.*$
  //           `[SpawnPoint] Retrying to teleport player ${player.name.get()} to main arena spawn point...`
  //         );
  //         mainArenaManager?.TeleportPlayerToSpawnPoint(player);
  //       }, 5000);
  //     }, 3000);
  //   } else {
  //     this.startSessionGame = true; // claim immediately
  //     try {
  //       this.spawnMainArena(player);
  //     } catch (e) {
  //       this.startSessionGame = false;
  //       throw e;
  //     }
  //     this.sendLocalBroadcastEvent(mainArenaSessionStarted, { player });
  //   }
  // }

  // showTeleportingNotif(player: hz.Player) {
  //   // console.log.*$
  //   this.world.ui.showPopupForPlayer(player, `Teleporting to FTUE in ...`, 10, {
  //     position: new hz.Vec3(0, 0.3, 0),
  //     fontSize: 2.8,
  //     backgroundColor: hz.Color.fromHex("#12c4cac7"),
  //     showTimer: true,
  //   });
  // }

  // spawnMainArena(player: hz.Player) {
  //   this.world
  //     .spawnAsset(
  //       this.props.mainArenaAsset!,
  //       new hz.Vec3(0, 0, 0),
  //       new hz.Quaternion(0, 0, 0, 1)
  //     )
  //     .then((entities) => {
  //       if (entities.length > 0) {
  //         // console.log.*$
  //           `[Main_Arena_Spawner] Main arena spawned successfully for player ${player.id}.`
  //         );

  //         const mainArena = entities[0].getComponents(Manager_MainArena)[0];
  //         if (mainArena) {
  //           mainArena.setManagers();
  //           mainArena.TeleportPlayerToSpawnPoint(player);
  //           // townManager?.onPlayerJoined(player);
  //           this.sendLocalBroadcastEvent(teleportedToArena, { player });

  //           const allPlayer = playerManager?.getCurrentPlayers();
  //           allPlayer?.forEach((p) => {
  //             const tutorialStatus =
  //               playerManager?.getPlayerRecord(p)?.completedFTUE;
  //             if (p.id !== player.id && tutorialStatus === true) {
  //               mainArena.TeleportPlayerToSpawnPoint(p);
  //               // townManager?.onPlayerJoined(p);
  //               this.sendLocalBroadcastEvent(teleportedToArena, { player });
  //             }
  //           });
  //         }
  //       }
  //     });
  // }

  // async spawnFTUEArena(player: hz.Player) {
  //   await this.world
  //     .spawnAsset(
  //       this.props.ftueArenaAsset!,
  //       new hz.Vec3(0, 0, 0),
  //       new hz.Quaternion(0, 0, 0, 1)
  //     )
  //     .then((entities) => {
  //       if (entities.length > 0) {
  //         // console.log.*$
  //           `[FTUE_Spawner] FTUE arena spawned successfully for player ${player.id}.`
  //         );

  //         const ftueManager = entities[0].getComponents(Manager_FTUE)[0];
  //         Managers_Instance.get()?.setTrainingManager(ftueManager);
  //         this.sendLocalBroadcastEvent(ftueArenaSessionStarted, {});

  //         if (ftueManager) {
  //           ftueManager.onPlayerJoinsFTUE(player);
  //         }

  //         const allPlayer = playerManager?.getCurrentPlayers();
  //         allPlayer?.forEach((p) => {
  //           if (p.id !== player.id) {
  //             this.throwPlayerInAnotherInstance(p);
  //           }
  //         });
  //       } else {
  //         console.warn("[FTUE_Spawner] No entities spawned for FTUE arena.");
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("[FTUE_Spawner] Error spawning FTUE arena:", error);
  //     });
  // }

  // async throwPlayerInAnotherInstance(player: hz.Player) {
  //   try {
  //     // console.log.*$

  //     if (
  //       !worldId ||
  //       `${worldId}`.trim() === "" ||
  //       BigInt(worldId) === BigInt(0)
  //     ) {
  //       console.error("Invalid worldId. Aborting group travel.");
  //       return;
  //     }

  //     const world2p = new World2p(this.world);
  //     const options: StartGroupTravelOptions = {
  //       navigateToInviteOnlyInstance: false, // set true if you want a private/Invite-only instance
  //     };

  //     // console.log.*$
  //     await world2p.startGroupTravel(`${worldId}`, [player], options);
  //   } catch (e) {
  //     console.error("Failed to start group travel:", e);
  //   } finally {
  //     // console.log.*$
  //       `Finished attempting to throw player ${player.id} to another instance.`
  //     );
  //   }
  // }

  isThisTrainingSession(): boolean {
    return false;
  }

  dispose(): void {
    Manager_Game._instance = null;
  }
}
hz.Component.register(Manager_Game);
