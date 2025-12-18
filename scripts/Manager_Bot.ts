import Component_Bot from "Component_Bot";
import { PlayerRoles } from "Enums_Game";
import {
  Asset,
  CodeBlockEvent,
  CodeBlockEvents,
  Component,
  Entity,
  Player,
  PropTypes,
} from "horizon/core";
import { Npc, NpcPlayer } from "horizon/npc";
import {
  ParlourClosedEvent,
  ParlourOpenedEvent,
  PlayerJoinedEvent,
  PlayerSwitchedRoleEvent,
} from "Manager_Events";
import { playerManager } from "Managers_Instance";

export default class Manager_Bot extends Component<typeof Manager_Bot> {
  static propsDefinition = {
    isBotNeeded: { type: PropTypes.Boolean, default: true },
    scooperBotAsset: {
      type: PropTypes.Asset,
    },
    fetcherBotAsset: {
      type: PropTypes.Asset,
    },
    serverBotAsset: {
      type: PropTypes.Asset,
    },
    scooperBotSpawnPoint: { type: PropTypes.Entity },
    fetcherBotSpawnPoint: { type: PropTypes.Entity },
    serverBotSpawnPoint: { type: PropTypes.Entity },
  };

  private activeBotList: Entity[] = [];
  private isParlourOpen: boolean = false;
  start() {
    if (!this.props.isBotNeeded) return;
    this.connectLocalBroadcastEvent(PlayerSwitchedRoleEvent, (data) =>
      this.OnPlayerSwitchedRoleEvent()
    );
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerExitWorld,
      async (player) => {
        await this.OnPlayerSwitchedRoleEvent();
      }
    );

    this.connectLocalBroadcastEvent(ParlourOpenedEvent, () => {
      this.isParlourOpen = true;
      this.OnPlayerSwitchedRoleEvent();
    });

    this.connectLocalBroadcastEvent(ParlourClosedEvent, () => {
      this.isParlourOpen = false;
      this.OnPlayerSwitchedRoleEvent();
    });
  }

  async OnPlayerSwitchedRoleEvent() {
    // console.log.*$
    // if (data && data.player && Npc.playerIsNpc(data.player)) return;
    let realPlayers = playerManager?.getCurrentPlayers() ?? [];
    realPlayers = realPlayers.filter((p) => !Npc.playerIsNpc(p));
    const realPlayerCount = realPlayers.length;

    // Roles occupied by real players
    const playerRoles: PlayerRoles[] =
      playerManager?.getRolesForPlayers(realPlayers) ?? [];

    // Required roles and priority order
    const requiredRoles: PlayerRoles[] = [
      PlayerRoles.Fetcher,
      PlayerRoles.Server,
      PlayerRoles.Scooper,
    ];

    // Target bot count: 0 if 3+ players; else clamp(3 - players, 1..2)
    let targetBotCount =
      realPlayerCount >= 3 ? 0 : Math.max(1, Math.min(2, 3 - realPlayerCount));
    if (realPlayerCount <= 0 || !this.isParlourOpen) {
      targetBotCount = 0;
    }

    // Current bots and their roles
    const botInfos = this.activeBotList
      .filter((e) => e && e.exists())
      .map((entity) => {
        const comp = entity.getComponents(Component_Bot)[0];
        const role = comp?.getBotRole() as PlayerRoles | undefined;
        return { entity, role };
      })
      .filter(
        (x): x is { entity: Entity; role: PlayerRoles } => x.role !== undefined
      );

    // Index bots by role
    const botsByRole = new Map<PlayerRoles, Entity[]>();
    for (const { entity, role } of botInfos) {
      const arr = botsByRole.get(role) ?? [];
      arr.push(entity);
      botsByRole.set(role, arr);
    }

    // Roles missing from real players
    const missingFromPlayers = requiredRoles.filter(
      (r) => !playerRoles.includes(r)
    );

    // Choose desired bot roles up to targetBotCount using requiredRoles priority
    const desiredBotRoles: PlayerRoles[] = missingFromPlayers.slice(
      0,
      Math.max(0, targetBotCount)
    );
    const desiredSet = new Set<PlayerRoles>(desiredBotRoles);

    // Despawn bots whose role is no longer desired, and trim duplicates per role
    const toDespawn: Entity[] = [];
    botsByRole.forEach((list, role) => {
      if (!desiredSet.has(role)) {
        toDespawn.push(...list);
      } else if (list.length > 1) {
        toDespawn.push(...list.slice(1)); // keep one per role
      }
    });
    for (const ent of toDespawn) {
      await this.despawnBot(ent);
    }

    // Determine which desired roles are still missing in bots after despawn
    const currentDesiredRoles = new Set<PlayerRoles>(
      this.activeBotList
        .map((e) => e.getComponents(Component_Bot)[0]?.getBotRole())
        .filter(
          (r): r is PlayerRoles =>
            r !== undefined && desiredSet.has(r as PlayerRoles)
        ) as PlayerRoles[]
    );
    const toSpawnRoles = desiredBotRoles.filter(
      (r) => !currentDesiredRoles.has(r)
    );

    // Spawn missing desired roles (one bot per role)
    for (const role of toSpawnRoles) {
      await this.spawnRoleBot(role);
    }

    // Final clamp: if still too many bots due to race/duplicates, trim extras
    if (this.activeBotList.length > targetBotCount) {
      const extras = this.activeBotList.length - targetBotCount;

      // Prefer keeping one bot per desired role; mark keepers first
      const keptRoles = new Set<PlayerRoles>();
      const candidatesForDespawn: Entity[] = [];
      for (const ent of this.activeBotList) {
        const role = ent.getComponents(Component_Bot)[0]?.getBotRole();
        if (
          role !== undefined &&
          role !== null &&
          desiredSet.has(role) &&
          !keptRoles.has(role as PlayerRoles)
        ) {
          keptRoles.add(role as PlayerRoles);
        } else {
          candidatesForDespawn.push(ent);
        }
      }

      // Despawn extras deterministically
      for (let i = 0; i < extras && i < candidatesForDespawn.length; i++) {
        await this.despawnBot(candidatesForDespawn[i]);
      }
    }

    // If there are 3+ real players, ensure all bots are gone
    if (targetBotCount === 0 && this.activeBotList.length > 0) {
      // Copy to avoid mutation during iteration
      const botsSnapshot = [...this.activeBotList];
      for (const ent of botsSnapshot) {
        await this.despawnBot(ent);
      }
    }

    // console.log.*$
    //   `Rebalanced bots. Players=${realPlayerCount}, TargetBots=${targetBotCount}, ActiveBots=${this.activeBotList.length}`
    // );
  }

  public registerBot(botEntity: Entity) {
    // console.log.*$
    this.activeBotList.push(botEntity);
  }

  public async deregisterBot(botEntity: Entity) {
    // console.log.*$
    const index = this.activeBotList.indexOf(botEntity);
    if (index > -1) {
      this.activeBotList.splice(index, 1);
    }
  }

  async spawnRoleBot(role: PlayerRoles) {
    let botAsset: Asset | null = null;
    let spawnPoint: Entity | null = null;
    switch (role) {
      case PlayerRoles.Scooper:
        botAsset = this.props.scooperBotAsset!;
        spawnPoint = this.props.scooperBotSpawnPoint!;
        break;
      case PlayerRoles.Fetcher:
        botAsset = this.props.fetcherBotAsset!;
        spawnPoint = this.props.fetcherBotSpawnPoint!;
        break;
      case PlayerRoles.Server:
        botAsset = this.props.serverBotAsset!;
        spawnPoint = this.props.serverBotSpawnPoint!;
        break;
    }
    if (botAsset && spawnPoint) {
      this.world
        .spawnAsset(
          botAsset,
          spawnPoint.position.get(),
          spawnPoint.rotation.get()
        )
        .then(async (entities) => {
          // console.log.*$
          const botEntity = entities[0];
          await this.onBotEntitySpawned(botEntity, role);
        });
    }
  }

  async onBotEntitySpawned(entity: Entity, role: PlayerRoles) {
    // console.log.*$
    this.registerBot(entity);
    entity.getComponents(Component_Bot)[0].setBotRole(role);
    await entity.as(Npc)?.spawnPlayer();
  }

  async despawnBot(entity: Entity) {
    if (entity.exists()) {
      const botEntity = entity.as(Npc);
      if (botEntity) {
        await botEntity.getComponents(Component_Bot)[0].stopAllActivities();
        botEntity.despawnPlayer();
        await this.deregisterBot(entity);
        await this.world.deleteAsset(entity, true);
      }
    }
  }

  getBotComponentFromRole(role: PlayerRoles): Component_Bot | null {
    for (const ent of this.activeBotList) {
      const botComp = ent.getComponents(Component_Bot)[0];
      if (botComp && botComp.getBotRole() === role) {
        return botComp;
      }
    }
    return null;
  }

  getBotPlayersFromRole(role: PlayerRoles): Player[] {
    const botComps = this.getBotComponentFromRole(role);
    if (!botComps || !botComps.botPlayer) {
      return [];
    }
    return [botComps.botPlayer];
  }
  getCurrentBots(): Player[] {
    const allPlayers = this.world.getPlayers();
    const botPlayers: Player[] = [];
    for (const player of allPlayers) {
      if (Npc.playerIsNpc(player)) {
        botPlayers.push(player);
      }
    }
    return botPlayers;
  }
}
Component.register(Manager_Bot);
