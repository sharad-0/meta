import {
  AudioGizmoTags,
  Items,
  OrderStatus,
  PlayerRoles,
  TableStatus,
} from "Enums_Game";
import {
  AudioGizmo,
  CodeBlockEvents,
  Component,
  Entity,
  Handedness,
  Player,
  Vec3,
} from "horizon/core";
import NavMeshManager, { NavMesh, NavMeshPath } from "horizon/navmesh";
import {
  Npc,
  NpcLocomotionOptions,
  NpcLocomotionResult,
  NpcPlayer,
} from "horizon/npc";
import {
  inventoryManager,
  orderManager,
  serverManager,
  tableManager,
  vacuumController,
} from "Managers_Instance";
import { Order } from "Manager_Order";
import Trigger_ScooperFootPoints from "Trigger_ScooperFootPoints";
import Trigger_Scooper_Tray from "Trigger_Scooper_Tray";
import Trigger_ScooperInteraction from "Trigger_ScooperInteraction";
import ScooperDump from "Trigger_ScooperDump";
import Trigger_Table from "Trigger_Table";

export default class Component_Bot extends Component<typeof Component_Bot> {
  static propsDefinition = {};
  private readonly NAV_PROFILE_NAME: string = "Bots";
  public selfRole: PlayerRoles | null = null;
  public npcGizmo: Npc | undefined;
  public npcPlayer: NpcPlayer | undefined;
  public botPlayer: Player | undefined;
  private moveOptions: NpcLocomotionOptions = {
    movementSpeed: 3, // Control how fast the NPC moves.
    faceMovementDirection: true, // Force the NPC to face the direction of movement.
  };
  navMesh!: NavMesh;
  // Add these private fields at class level
  private _stopping: boolean = false;
  private _logicTimerId: number | undefined;
  // Optional: keep a reference to the player-enter handler if you want to remove it later
  private _onPlayerEnterWorldHandler?: (player: Player) => Promise<void>;

  // If you can, also store the OnPlayerEnterWorld handler when connecting (optional but recommended)
  async start() {
    this.npcGizmo = this.entity.as(Npc);
    if (this.npcGizmo == undefined) {
      console.error("[Bot] NPC Gizmo is undefined!");
      return;
    }

    this._onPlayerEnterWorldHandler = async (player: Player) => {
      if (this._stopping) return; // ignore during teardown
      const npcGizmoFromPlayer = Npc.getGizmoFromPlayer(player);
      if (npcGizmoFromPlayer && npcGizmoFromPlayer === this.npcGizmo) {
        this.botPlayer = player;
        this.npcPlayer = await this.npcGizmo.tryGetPlayer();
        if (this.npcPlayer == undefined) {
          console.error("[Bot] NPC Player is undefined!");
          return;
        }

        const directory = NavMeshManager.getInstance(this.world);
        const mesh = await directory.getByName(this.NAV_PROFILE_NAME);
        if (!mesh) {
          // console.log.*$
          //   "[Bot] No navmesh available! Did you type the name wrong?"
          // );
          return;
        }

        this.navMesh = mesh;
        // await this.navMesh.rebake();
        this.executeBotLogic();
      }
    };

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterWorld,
      this._onPlayerEnterWorldHandler
    );
  }

  // Complete teardown
  stopAllActivities(): void {
    // 1) Mark stopping to make handlers no-op
    this._stopping = true;

    // 2) Stop role loops by clearing guards and role
    (this as any)._fetcherRunning = false;
    (this as any)._serverRunning = false;
    this._scooperRunning = false;
    this.selfRole = null;

    // 3) Cancel any scheduled executeBotLogic timer
    try {
      if (
        typeof (this.async as any)?.clearTimeout === "function" &&
        this._logicTimerId != null
      ) {
        (this.async as any).clearTimeout(this._logicTimerId);
      } else if (this._logicTimerId != null) {
        this.async.clearTimeout(this._logicTimerId as unknown as number);
      }
    } catch { }

    this._logicTimerId = undefined;

    // 4) Best-effort event disconnect if API exists; otherwise rely on _stopping guard
    try {
      const maybeDisconnect = (this as any).disconnectCodeBlockEvent;
      if (
        typeof maybeDisconnect === "function" &&
        this._onPlayerEnterWorldHandler
      ) {
        maybeDisconnect(
          this.entity,
          CodeBlockEvents.OnPlayerEnterWorld,
          this._onPlayerEnterWorldHandler
        );
      }
    } catch { }
    serverManager?.onPlayerExitWorld(this.botPlayer!);

    // 5) Deactivate controls and drop items
    try {
      this.deactivateFetcherVacuum();
    } catch { }
    try {
      const handEntity = this.npcPlayer?.getGrabbedEntity(Handedness.Right);
      if (this.npcPlayer && handEntity) {
        this.npcPlayer.drop(Handedness.Right);
        this.world.deleteAsset(handEntity, true);
      }
    } catch {
      console.error("Error dropping held item during bot teardown.");
    }

    // 6) Reset transient AI state
    this._orderRRIndex = 0;
    this._lastAbortedOrderId = null;
    this._lastAbortAt = 0;
    this._currentOrderId = null;
    this._restPos = null;

    // 7) Clear references to reduce leaks
    this.botPlayer = undefined;
    // Keep npcPlayer/npcGizmo if the world still references them; else clear if manager fully removes entity
    // this.npcPlayer = undefined;
    // this.npcGizmo = undefined;
    // this.navMesh = undefined as any; // optional if being destroyed

    // 8) Optional: log
    // console.log.*$
  }

  ////////////////////////////////////////////////////////////////Bot Role Methods///////////////////////////////////////////////////////

  public setBotRole(role: PlayerRoles) {
    this.selfRole = role;
    // console.log.*$
  }

  public getBotRole(): PlayerRoles | null {
    return this.selfRole;
  }

  public getNpcPlayer(): NpcPlayer | undefined {
    return this.npcPlayer;
  }

  ///////////////////////////////////////////////////////////////Helper Methods///////////////////////////////////////////////////////

  // 1) Throw on navigation failures so a single catch can handle recovery
  async moveToDestination(
    destinationPoint: Vec3,
    onArrivalAction?: () => void
  ): Promise<void> {
    const path = this.getPathFromNavMesh(destinationPoint);
    if (path == null) {
      throw new Error(`NavMesh path unavailable to destination `);
    }

    let movementOptions = this.moveOptions;
    if (this.selfRole === PlayerRoles.Fetcher) {
      movementOptions = { ...this.moveOptions, movementSpeed: 5 };
    }

    const result: NpcLocomotionResult = await this.npcPlayer!.moveToPositions(
      path,
      movementOptions
    );

    if (result !== NpcLocomotionResult.Complete) {
      throw new Error("Failed to reach destination");
    }

    onArrivalAction?.();
  }

  getPathFromNavMesh(targetPosition: Vec3): Vec3[] | null {
    // Find the nearest point on the NavMesh, within 1 meter, to where we want the NPC to go.
    const navMeshTarget: Vec3 | null = this.navMesh!.getNearestPoint(
      targetPosition,
      1
    );
    if (navMeshTarget == null) {
      console.error(
        "The NPC couldn't find a valid NavMesh position close enough to the wanted destination!"
      );
      return null;
    }
    // Find a starting position on the NavMesh based on the NPC's current position.
    const npcPostion: Vec3 = this.npcPlayer!.position.get();
    const navMeshStart: Vec3 | null = this.navMesh!.getNearestPoint(
      npcPostion,
      Number.MAX_SAFE_INTEGER
    );
    if (navMeshStart == null) {
      console.error("The NPC couldn't find a valid starting NavMesh position!");
      return null;
    }
    const navMeshPath: NavMeshPath | null = this.navMesh!.getPath(
      navMeshStart,
      navMeshTarget
    );
    if (navMeshPath == null) {
      console.error(
        "The NPC couldn't find a NavMesh path to the wanted destination!"
      );
      return null;
    }
    // Return the array of Vec3 to use with NPC's moveToPositions method.
    return navMeshPath.waypoints;
  }
  async grabObject(grabbableObject: Entity): Promise<void> {
    // getGrabbedEntity returns undefined if the NPC isn't holding anything.
    if (this.npcPlayer!.getGrabbedEntity(Handedness.Right) == undefined) {
      if (!grabbableObject.simulated.get()) {
        grabbableObject.simulated.set(true);
      }
      await this.npcPlayer!.grab(Handedness.Right, grabbableObject);
      // console.log.*$
    }
  }

  async dropObject(): Promise<void> {
    if (this.npcPlayer!.getGrabbedEntity(Handedness.Right) == undefined) {
      console.error("NPC isn't holding the Object!");
      return;
    }

    // Drop the banana.
    this.npcPlayer!.drop(Handedness.Right);
  }
  // Update executeBotLogic to capture the timer id so it can be cleared
  executeBotLogic(): void {
    // console.log.*$
    //   `[Bot] Executing logic for role: ${this.selfRole} in 3 seconds.`
    // );
    // Capture timer id
    this._logicTimerId = this.async.setTimeout(() => {
      // console.log.*$
      switch (this.selfRole) {
        case PlayerRoles.Fetcher:
          this.executeFetcherBehavior();
          break;
        case PlayerRoles.Server:
          this.executeServerBehavior();
          break;
        case PlayerRoles.Scooper:
          this.executeScooperBehavior();
          break;
        default:
          console.warn("Bot role is undefined or unrecognized.");
          break;
      }
    }, 3000) as unknown as number;
  }

  ///////////////////////////////////////////////Fetcher Logic Methods///////////////////////////////////////////////////////

  // Optional: add this field to the class to prevent double-starts
  // private _fetcherRunning = false;

  // 2) Robust fetcher loop with centralized rest-and-restart on any error
  public async executeFetcherBehavior(): Promise<void> {
    if ((this as any)._fetcherRunning) {
      // console.log.*$
      return;
    }
    (this as any)._fetcherRunning = true;

    const sleep = (ms: number) =>
      new Promise<void>((res) => this.async.setTimeout(() => res(), ms));

    const restartFromScratch = async () => {
      try {
        this.deactivateFetcherVacuum();
      } catch { }
      try {
        await this.moveToFetcherRestPoint();
      } catch { }
      await sleep(5000);
      (this as any)._fetcherRunning = false;
      if (this.selfRole === PlayerRoles.Fetcher && this.entity.exists()) {
        this.executeBotLogic(); // optional: or call executeFetcherBehavior() directly
        // this.executeFetcherBehavior();
      }
    };

    try {
      if (!this.npcPlayer || !this.entity.exists()) {
        await restartFromScratch();
        return;
      }

      while (this.selfRole === PlayerRoles.Fetcher && this.entity.exists()) {
        try {
          // 1) Decide item
          const item = this.checkForItemToFetch();

          // 2) Navigate to a bound and activate vacuum
          const bound = this.getFetchingBoundForItem(item);
          if (!bound) throw new Error(`No fetching bound for ${item}`);
          const firstPoint = this.getRandomPointWithinBound(bound);
          await this.moveToDestination(firstPoint, () =>
            this.activateFetcherVacuum()
          );

          // 3) Roam within bound ~3s
          const start = Date.now();
          while (
            Date.now() - start < 3000 &&
            this.selfRole === PlayerRoles.Fetcher &&
            this.entity.exists()
          ) {
            await sleep(1000);
            const roamPoint = this.getRandomPointWithinBound(bound);
            await this.moveToDestination(roamPoint);
          }

          // 4) Stop vacuum and go to machine
          this.deactivateFetcherVacuum();
          const machine = this.getIngredientMachineFromItem(item);
          if (!machine) throw new Error(`No machine found for ${item}`);
          await this.moveToDestination(machine.position.get());

          // 5) Wait at machine
          await sleep(2000);

          // 6) Go to trash bin (e.g., offload excess)
          const trashBin = this.world.getEntitiesWithTags([
            "fetcherTrashBin",
          ])[0];
          if (!trashBin) throw new Error("No fetcher trash bin found");
          await this.moveToDestination(trashBin.position.get());

          // 7) Short pause before next cycle; do not self-recurse here
          await sleep(1000);
        } catch (stepErr) {
          console.error("Fetcher step error:", stepErr);
          await restartFromScratch();
          return;
        }
      }
    } catch (err) {
      console.error("Fetcher behavior error:", err);
      await restartFromScratch();
      return;
    } finally {
      // Ensure controls are off if exiting without immediate restart
      this.deactivateFetcherVacuum();
      (this as any)._fetcherRunning = false;
    }
  }

  checkForItemToFetch(): Items {
    const currentInventory = inventoryManager?.getInventory();
    // Default and tie-breaker priority if counts are equal
    const priority: Items[] = [
      Items.Cone,
      Items.Vanilla,
      Items.Strawberry,
      Items.Chocolate,
    ];

    // Fallback if inventory is unavailable
    if (!currentInventory || currentInventory.size === 0) return Items.Cone;

    let minItem: Items | null = null;
    let minCount = Number.POSITIVE_INFINITY;

    // Map.forEach callback signature: (value, key)
    currentInventory.forEach((slot, item) => {
      // Optionally skip a 'None' sentinel if present
      if (item === Items.None) return;

      const count = slot?.currentAmount ?? 0;

      if (count < minCount) {
        minCount = count;
        minItem = item;
      } else if (count === minCount && minItem !== null) {
        // Deterministic tie-breaker by priority order
        if (priority.indexOf(item) < priority.indexOf(minItem)) {
          minItem = item;
        }
      }
    });

    return minItem ?? Items.Cone;
  }

  getFetchingBoundForItem(item: Items): Entity | null {
    switch (item) {
      case Items.Cone:
        return this.world.getEntitiesWithTags(["coneFetchingTr"])[0];
      case Items.Vanilla:
        return this.world.getEntitiesWithTags(["vanillaFetchingTr"])[0];
      case Items.Strawberry:
        return this.world.getEntitiesWithTags(["strawberryFetchingTr"])[0];
      case Items.Chocolate:
        return this.world.getEntitiesWithTags(["chocolateFetchingTr"])[0];
      default:
        return null;
    }
  }
  setFetcherDestinationEntities(): void { }

  getRandomPointWithinBound(entity: Entity): Vec3 {
    const center = entity.position.get();
    const radius = 5;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * radius;

    const x = center.x + distance * Math.cos(angle);
    const z = center.z + distance * Math.sin(angle);
    const y = center.y;
    return new Vec3(x, y, z);
  }

  getIngredientMachineFromItem(item: Items): Entity | null {
    switch (item) {
      case Items.Cone:
        return this.world.getEntitiesWithTags(["coneMachine"])[0];
      case Items.Vanilla:
        return this.world.getEntitiesWithTags(["vanillaMachine"])[0];
      case Items.Strawberry:
        return this.world.getEntitiesWithTags(["strawberryMachine"])[0];
      case Items.Chocolate:
        return this.world.getEntitiesWithTags(["chocolateMachine"])[0];
      default:
        return null;
    }
  }

  activateFetcherVacuum() {
    if (this.botPlayer) {
      vacuumController?.setVacuumState(this.botPlayer);
    } else {
      console.error("Bot Player is undefined!");
    }
  }

  deactivateFetcherVacuum() {
    if (this.botPlayer) {
      vacuumController?.DeactivateFetcherControls(this.botPlayer);
    } else {
      console.error("Bot Player is undefined!");
    }
  }

  async moveToFetcherRestPoint(): Promise<void> {
    const restPoint = this.world.getEntitiesWithTags(["fetcherRest"])[0];
    if (restPoint) {
      await this.moveToDestination(restPoint.position.get());
    } else {
      console.error("No fetcher rest point found.");
    }
  }

  ///////////////////////////////////////////Server Logic Methods///////////////////////////////////////////////////////

  executeServerBehavior(): void {
    // Prevent parallel loops if called multiple times
    if ((this as any)._serverRunning) {
      // console.log.*$
      return;
    }
    (this as any)._serverRunning = true;

    const sleep = (ms: number) =>
      new Promise<void>((res) => this.async.setTimeout(() => res(), ms));

    const run = async () => {
      try {
        // Ensure required gizmos are ready
        if (!this.npcPlayer || !this.entity.exists()) {
          console.error(
            "Server cannot start; NPC not initialized or entity missing."
          );
          return;
        }

        // Main loop
        while (this.selfRole === PlayerRoles.Server && this.entity.exists()) {
          // Priority: Take order > Deliver order > Clean table
          const takeTables = this.checkTableForOrder() ?? [];
          const deliverCandidates = this.checkTablesForDelivery() ?? [];
          // Only consider deliveries with a spawned/ready ice-cream entity
          const deliverTables = deliverCandidates.filter(
            (t) =>
              !!orderManager?.getIceCreamEntityForCompletedOrder(
                t.tableData.tableId
              )
          );
          const cleanTables = this.checkTablesForCleaning() ?? [];

          let handled = false;

          // 1) Take order
          if (takeTables.length > 0) {
            const tableId = takeTables[0].tableData.tableId;
            await this.moveToTable(tableId, () =>
              this.executeTakeOrder(tableId)
            );
            handled = true;
            // Small pause to avoid hot loop
            await sleep(500);
          }
          // 2) Deliver order (only if ice cream entity is actually present/ready)
          else if (deliverTables.length > 0) {
            const tableId = deliverTables[0].tableData.tableId;

            // Move to server station for this table
            const stationTag = "serverStation" + tableId;
            const serverStation = this.world.getEntitiesWithTags([
              stationTag,
            ])[0];

            if (serverStation) {
              // Go to station
              await this.moveToDestination(serverStation.position.get());

              // Re-check availability to avoid races
              const iceEntity =
                orderManager?.getIceCreamEntityForCompletedOrder(tableId);

              if (iceEntity) {
                // Pick up the ice cream
                await this.grabObject(iceEntity);

                // Move to the table to deliver
                const tableTag = "BotTableTrigger" + tableId;
                const tableEntity = this.world.getEntitiesWithTags([
                  tableTag,
                ])[0];
                if (tableEntity) {
                  // console.log.*$
                  await this.moveToDestination(tableEntity.position.get());
                  await this.onDeliverOrder(tableId);
                } else {
                  console.error(`No table entity found for table ${tableId}`);
                }

                handled = true;
                await sleep(200);
              } else {
                // Could not complete delivery (not ready) -> check another task next loop
                await sleep(200);
              }
            } else {
              console.error(`No server station found for table ${tableId}`);
              await sleep(200);
            }
          }
          // 3) Clean table
          else if (cleanTables.length > 0) {
            const tableId = cleanTables[0].tableData.tableId;
            await this.moveToTable(tableId, () => {
              this.executeCleanTable(tableId);
            });
            handled = true;
            await sleep(200);
          }

          // If no task available, do nothing and wait a moment before looping again
          if (!handled) {
            await sleep(800);
          }

          // Loop repeats: do not switch tasks mid-action; only re-check at the end or when unable to complete
        }
      } catch (err) {
        console.error("Server behavior error:", err);
        await this.moveToServerRestPoint();
        await sleep(3000);
        (this as any)._serverRunning = false;
        if (this.selfRole === PlayerRoles.Server && this.entity.exists()) {
          this.executeServerBehavior(); // or call executeServerBehavior() directly
          // this.executeServerBehavior();
        }
      } finally {
        (this as any)._serverRunning = false;
      }
    };

    // Kick off asynchronous loop without blocking
    run();
  }

  async onDeliverOrder(tableId: string) {
    const tableEntity = this.world.getEntitiesWithTags([
      "tableTrigger" + tableId,
    ])[0];
    if (tableEntity) {
      const trigger = tableEntity.getComponents(Trigger_Table)[0];
      if (trigger) {
        await trigger.serverDeliverOrder(this.botPlayer!);
      }
    } else {
      console.error(`No table entity found for table ${tableId}`);
    }
  }

  checkTableForOrder() {
    const tables = tableManager?.getAllTableComps();
    const tablesWithOrders = tables?.filter(
      (tableComp) => tableComp.tableData.status === TableStatus.Occupied
    );
    return tablesWithOrders;
  }

  checkTablesForDelivery() {
    const tables = tableManager?.getAllTableComps();
    const tablesWaitingForDelivery = tables?.filter(
      (tableComp) => tableComp.tableData.status === TableStatus.WaitingForOrder
    );
    const tablesReadyForDelivery = tablesWaitingForDelivery?.filter(
      (tableComp) =>
        orderManager?.getOrderFromTable(tableComp.tableData.tableId)?.status ===
        OrderStatus.Completed
    );
    return tablesReadyForDelivery;
  }

  checkTablesForCleaning() {
    const tables = tableManager?.getAllTableComps();
    const tablesToBeCleaned = tables?.filter(
      (tableComp) => tableComp.tableData.status === TableStatus.Dirty
    );
    return tablesToBeCleaned;
  }

  moveToServerStation(tableId: string): void {
    const tagKey = "serverStation" + tableId;
    const serverStation = this.world.getEntitiesWithTags([tagKey])[0];
    if (serverStation) {
      this.moveToDestination(serverStation.position.get(), () => {
        this.onReachingServerStation(tableId);
      });
    } else {
      console.error(`No server station found for table ${tableId}`);
    }
  }

  async onReachingServerStation(tableId: string) {
    const iceCreamEntity =
      orderManager?.getIceCreamEntityForCompletedOrder(tableId);
    if (iceCreamEntity) {
      await this.grabObject(iceCreamEntity);
    } else {
      console.error(`No ice cream entity found for table ${tableId}`);
    }
    this.moveToTable(tableId, () => { });
  }

  async moveToTable(
    tableId: string,
    onReachingTable: () => void
  ): Promise<void> {
    const tagKey = "BotTableTrigger" + tableId;
    const tableEntity = this.world.getEntitiesWithTags([tagKey])[0];
    if (tableEntity) {
      await this.moveToDestination(tableEntity.position.get(), () => {
        onReachingTable?.();
      });
    } else {
      console.error(`No table entity found for table ${tableId}`);
    }
  }

  executeTakeOrder(tableId: string): void {
    this.world
      .getEntitiesWithTags([AudioGizmoTags.OrderAccepted])[0]
      .as(AudioGizmo)
      .play();

    const order = orderManager?.getOrderFromTable(tableId);
    if (!order) {
      console.error(`No order found for table ${tableId}`);
      return;
    }
    orderManager?.markOrderAsAccepted(order.id);
    tableManager?.onOrderAccepted(tableId!);
  }

  executeCleanTable(tableId: string): void {
    tableManager?.onTableMessCleaned(tableId);
    tableManager
      ?.getTableCompFromId(tableId)
      ?.cleanTableForBot(this.botPlayer!);
  }

  async moveToServerRestPoint(): Promise<void> {
    const restPoint = this.world.getEntitiesWithTags(["serverRest"])[0];
    if (restPoint) {
      await this.moveToDestination(restPoint.position.get());
    } else {
      console.error("No server rest point found.");
    }
  }

  ///////////////////////////////////////////////Scooper Logic Methods///////////////////////////////////////////////////////
  private _scooperRunning = false;
  // Add these private fields to the class
  private _orderRRIndex: number = 0;
  private _lastAbortedOrderId: number | null = null;
  private _lastAbortAt: number = 0;
  private readonly _abortCooldownMs: number = 3000;
  private _currentOrderId: number | null = null;

  executeScooperBehavior(): void {
    if (this._scooperRunning) {
      // console.log.*$
      return;
    }
    this._scooperRunning = true;

    const sleep = (ms: number) =>
      new Promise<void>((res) => this.async.setTimeout(() => res(), ms));

    // Watchdog helper for pickup
    const waitForPickupOrTimeout = async (
      maxMs: number,
      pollMs = 100
    ): Promise<boolean> => {
      const start = Date.now();
      while (
        Date.now() - start < maxMs &&
        this.selfRole === PlayerRoles.Scooper &&
        this.entity.exists()
      ) {
        if (this.checkItemInHand()) return true;
        await sleep(pollMs);
      }
      return this.checkItemInHand();
    };

    const selectOrderSticky = (pending: Order[]): Order | undefined => {
      const now = Date.now();

      // 1) Prefer current order if still pending and not cooling
      if (this._currentOrderId != null) {
        const curIdx = pending.findIndex((o) => o.id === this._currentOrderId); // stickiness [findIndex]
        if (curIdx !== -1) {
          const cur = pending[curIdx];
          const cooling =
            this._lastAbortedOrderId === cur.id &&
            now - this._lastAbortAt < this._abortCooldownMs;
          if (!cooling) {
            return cur; // keep working on it; do NOT advance RR pointer
          }
        } else {
          // Not pending anymore
          this._currentOrderId = null;
        }
      }

      // 2) Fall back to round-robin over pending, skipping cooled orders
      for (let i = 0; i < pending.length; i++) {
        const idx = (this._orderRRIndex + i) % pending.length;
        const candidate = pending[idx];
        const cooling =
          this._lastAbortedOrderId === candidate.id &&
          now - this._lastAbortAt < this._abortCooldownMs;
        if (!cooling) {
          // Advance RR pointer only when switching to a new order
          this._orderRRIndex = (idx + 1) % pending.length;
          return candidate;
        }
      }
      return undefined; // all cooling
    };

    const run = async () => {
      try {
        if (!this.npcPlayer || !this.entity.exists()) {
          console.error(
            "Scooper cannot start; NPC not initialized or entity missing."
          );
          return;
        }

        while (this.selfRole === PlayerRoles.Scooper && this.entity.exists()) {
          // 1) Pending orders?
          const pending = this.getPendingOrders();
          if (!pending || pending.length === 0) {
            await this.moveToRest();
            await sleep(500);
            continue;
          }

          // 2) Choose order with stickiness and cooldown skip
          const order = selectOrderSticky(pending);
          if (!order) {
            // all candidates are cooling down
            await this.moveToRest();
            await sleep(400);
            continue;
          }
          this._currentOrderId = order.id;

          // 3) Ask tray for next needed item for this order
          const nextItem = this.getNextRequiredItem(order);
          if (nextItem === Items.None) {
            // Either finished or mismatch/blocked; release stickiness so we can rotate
            this._currentOrderId = null;
            await sleep(200);
            continue;
          }

          // 4) Move to the appropriate station and attempt pickup with watchdog
          if (this.selfRole !== PlayerRoles.Scooper || !this.entity.exists()) {
            await sleep(100);
            continue;
          }

          await this.moveToItemScoopingStation(nextItem);
          const picked = await waitForPickupOrTimeout(1200, 100);

          if (!picked) {
            // Empty/slow station: mark cooldown, park at rest, continue loop
            this._lastAbortedOrderId = order.id;
            this._lastAbortAt = Date.now();
            await this.moveToRest();
            await sleep(200);
            continue; // IMPORTANT: keep loop alive
          }

          // 5) Deliver to tray
          await this.moveToScooperTray(order);
          await sleep(200);

          // Safety: if still holding, dispose
          if (this.checkItemInHand()) {
            const trashBin = this.world.getEntitiesWithTags([
              "scooperTrashBinFoot",
            ])?.[0];
            const trashBinComp = this.world
              .getEntitiesWithTags(["scooperTrashBin"])[0]
              .getComponents(ScooperDump)[0];
            if (trashBin)
              await this.moveToDestination(trashBin.position.get(), () => {
                trashBinComp.OnPlayerEnterTrigger(this.botPlayer!);
              });
            await sleep(150);
          }

          // 6) After drop, check if order is now complete; if yes, release stickiness
          const afterDropNext = this.getNextRequiredItem(order);
          if (afterDropNext === Items.None) {
            this._currentOrderId = null;
          }

          await sleep(1000);
        }
      } catch (err) {
        console.error("Scooper behavior error:", err);
        await this.moveToRest();
        await sleep(3000);
        this._scooperRunning = false;
        if (this.selfRole === PlayerRoles.Scooper && this.entity.exists()) {
          this.executeScooperBehavior();
        }
      } finally {
        this._scooperRunning = false;
      }
    };

    run();
  }

  private readonly _SCOOPER_REST_TAG: string = "scooperRest";
  private _restPos: Vec3 | null = null;

  // Small helper to fetch/cache rest position once
  private getOrLoadRestPos(): Vec3 | null {
    if (this._restPos) return this._restPos;
    const rest = this.world.getEntitiesWithTags([this._SCOOPER_REST_TAG])?.[0];
    this._restPos = rest?.position.get() ?? null;
    return this._restPos;
  }

  // Distance check with a default epsilon
  private isAt(pos: Vec3, eps: number = 0.25): boolean {
    const cur = this.npcPlayer!.position.get();
    const dx = cur.x - pos.x,
      dy = cur.y - pos.y,
      dz = cur.z - pos.z;
    return dx * dx + dy * dy + dz * dz <= eps * eps;
  }
  // Move to rest if defined and not already there
  private async moveToRest(): Promise<void> {
    const rest = this.getOrLoadRestPos();
    if (!rest) return;
    if (!this.isAt(rest)) {
      await this.moveToDestination(rest);
    }
  }
  getNextRequiredItem(order: Order): Items {
    const scooperTrayKey = "scooperTray" + order.tableId; //scooperTray1
    const scooperTray = this.world.getEntitiesWithTags([scooperTrayKey])[0];
    let nextItemRequired: Items = Items.None;
    // console.log.*$
    //   `[Bot Component] Scooper checking next required item ${scooperTrayKey}`
    // );
    if (scooperTray) {
      const scooperTrayComp =
        scooperTray.getComponents(Trigger_Scooper_Tray)[0];
      // console.log.*$
      //   `[Bot Component] Scooper got scooper tray component: ${scooperTrayComp}`
      // );
      if (scooperTrayComp) {
        nextItemRequired = scooperTrayComp.getNextRequiredItem();
        // console.log.*$
        //   `[Bot Component] Scooper next required item: ${nextItemRequired}`
        // );
      }
    }
    return nextItemRequired;
  }

  getPendingOrders(): Order[] {
    const allOrders = orderManager?.getAcceptedOrders() ?? [];
    return allOrders;
  }

  async executeOrderCreation(order: Order): Promise<void> {
    // console.log.*$
    for (const item of order.items) {
      await this.moveToItemScoopingStation(item);
      //wait for 500 ms to simulate scooping time
    }
    await this.moveToScooperTray(order);
    // console.log.*$
  }

  async moveToItemScoopingStation(item: Items): Promise<void> {
    // console.log.*$
    // Implement movement to item scooping station here.
    const stationTag = item.toString() + "ScooperTrigger"; //item4ScooperTrigger
    const machineTag = item.toString() + "ScoopingMachine"; //item4ScoopingMachine
    // console.log.*$
    const scooperStation = this.world.getEntitiesWithTags([stationTag])[0];
    const scooperMachine = this.world.getEntitiesWithTags([machineTag])[0];
    const scooperStationComp = scooperMachine.getComponents(
      Trigger_ScooperInteraction
    )[0];
    if (scooperStation && scooperStationComp) {
      await this.moveToDestination(scooperStation.position.get(), () => {
        // console.log.*$
        scooperStationComp?.onPlayerEnter(this.botPlayer!);
      });
    } else {
      console.error(`No scooper station found for item ${item}`);
    }
  }

  async moveToScooperTray(order: Order): Promise<void> {
    // console.log.*$
    // Implement movement to scooper tray here.
    const footTag = "scooperFoot" + order.tableId; //scooperFoot1
    const trayTag = "scooperTray" + order.tableId; //scooperTray1
    const scooperFootPoint = this.world.getEntitiesWithTags([footTag])[0];
    const scooperTray = this.world.getEntitiesWithTags([trayTag])[0];
    const scooperTrayComp = scooperTray.getComponents(Trigger_Scooper_Tray)[0];
    if (scooperTray) {
      await this.moveToDestination(scooperFootPoint.position.get(), () => {
        // console.log.*$
        scooperTrayComp?.onPlayerEnterTrigger(this.botPlayer!);
      });
    } else {
      console.error(`No scooper foot found for table ${order.tableId}`);
    }
  }

  checkItemInHand(): boolean {
    const grabbedEntity = this.npcPlayer?.getGrabbedEntity(Handedness.Right);
    // console.log.*$
    //   `[Bot Component] Scooper checking hand: ${grabbedEntity ? "Item present" : "Hand empty"
    //   }`
    // );

    return grabbedEntity !== undefined;
  }

  ///////////////////////////////End of Component_Bot Class/////////////////////////////////////
}
Component.register(Component_Bot);
