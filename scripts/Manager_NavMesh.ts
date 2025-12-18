import { NavMeshTags } from 'Enums_Game';
import { AgentLocomotionResult, AvatarAIAgent } from 'horizon/avatar_ai_agent';
import * as hz from 'horizon/core';
import NavMeshManager, { NavMesh, NavMeshPath } from 'horizon/navmesh';

export default class Manager_NavMesh extends hz.Component<typeof Manager_NavMesh> {
  static propsDefinition = {};

  public navMesh?: NavMesh;
  public navMeshBaked: boolean = false;

  async preStart() {
    const navMeshManager = NavMeshManager.getInstance(this.world);
    const navMesh = await navMeshManager.getByName("Android");
    if (navMesh == null) {
      console.error("Could not find navMesh: Android");
      return;
    };
    this.navMesh = navMesh;
  }

  start(): void {
    this.bakeNavMesh();
  }

  async bakeNavMesh() {
    if (!this.navMesh) {
      const navMeshManager = NavMeshManager.getInstance(this.world);
      const navMesh = await navMeshManager.getByName("Android");
      if (navMesh == null) {
        console.warn("Could not find navMesh: Android");
        this.retryBakeNavMesh();
        return;
      };
      this.navMesh = navMesh;
    }

    await this.navMesh?.rebake().then((success) => {
      if (success) {
        this.navMeshBaked = true;
      } else {
        console.warn("NavMesh rebake failed, will retry in 5 seconds.");
        this.retryBakeNavMesh();
      }
    });

    // Get status of navigation mesh baking. Wait until complete.
    const bake = this.navMesh?.getStatus().currentBake;
    if (bake != null) {
      await bake;
    };

    // console.log.*$
  }

  async retryBakeNavMesh() {
    const intervalId = this.async.setInterval(async () => {
      if (!this.navMesh) {
        const navMeshManager = NavMeshManager.getInstance(this.world);
        const navMesh = await navMeshManager.getByName("Android");
        if (navMesh) {
          this.navMesh = navMesh;
          await this.navMesh.rebake().then((success) => {
            if (success) {
              this.navMeshBaked = true
              // console.log.*$
              this.async.clearInterval(intervalId);
            } 
          });
        }
      }
    }, 5000);
  }

  // Uses referenced NavMesh to return a set of Vec3 waypoints for a path between the from: and to: parameters.
  public getPathTo(from : hz.Vec3, to : hz.Vec3) : Array<hz.Vec3> {
    let nextPath: NavMeshPath | null;

    let getPathAttempts: number = 0;
    do {
      nextPath = this.navMesh?.getPath(from, to) ?? null;
      getPathAttempts++;
      to.y = from.y;
    } while (nextPath == null && getPathAttempts < 20);
    if (nextPath == null) {
      return new Array<hz.Vec3>();
    }
    return nextPath.waypoints;
  }

  // Managements movement for the NPC from its current location to a provided destination: Vec3 location.
  // Calls to getPath() to return waypoints, which are passed to the NPC methods rotateTo() and moveToPositions()
  public moveToPosition(
    agent : AvatarAIAgent,
    destination : hz.Vec3,
    onfulfilled?:((value: AgentLocomotionResult) => void | PromiseLike<void>) | null | undefined,
    onrejected?:((reason:any) => void | PromiseLike<never>) | null | undefined) : Promise<void> {

    // console.log.*$
    let agentPos = agent.agentPlayer!.get()?.foot.getPosition(hz.Space.World)!; //agent.position.get();

    let navmeshStart = this.navMesh?.getNearestPoint(agentPos, .3);
    if(navmeshStart) {
      agentPos = navmeshStart;
    }
    let navmeshDest = this.navMesh?.getNearestPoint(destination, .3);
    if(navmeshDest) {
      destination = navmeshDest;
    }

    let path = this.getPathTo(agentPos, destination);
    return agent.locomotion.rotateTo(destination.sub(agentPos)).then( 
      (value: AgentLocomotionResult) => agent.locomotion.moveToPositions(path, {movementSpeed: 3}).then(onfulfilled, onrejected)
    );
  }
}
hz.Component.register(Manager_NavMesh);