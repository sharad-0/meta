import * as hz from 'horizon/core';

type CameraTransform = {
  position: hz.Vec3,
  rotation: hz.Quaternion,
}

enum CameraDirectorState {
  CyclingThroughDefaultCameraPositions,
  ForcedFocus
}

const CONVERT_MILLISECONDS_TO_SECONDS = 1000;
const CAMERA_CONTROLLER_DEFAULT_CAMERA_CHECK_INTERVAL = 5;

class WorldBroadcastBrain extends hz.Component<typeof WorldBroadcastBrain> {
  static propsDefinition = {
    localPassiveInstance: { type: hz.PropTypes.Entity },
    passiveInstanceUI: { type: hz.PropTypes.Entity },
    timeToSwitchToNextDefaultCamera: { type: hz.PropTypes.Number, default: 5 },
    debugMode: { type: hz.PropTypes.Boolean, default: false },
  };

  public static instance: WorldBroadcastBrain;

  private defaultLocations: CameraTransform[] = [];

  private currentState: CameraDirectorState = CameraDirectorState.CyclingThroughDefaultCameraPositions;
  private currentCameraTransform!: CameraTransform;
  private timeOfLastDefaultCameraSwitch: number | null = null;
  private forcedFocusTarget: CameraTransform | null = null;

  private defaultCamera!: hz.Entity;

  start() {
    WorldBroadcastBrain.instance = this;

    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnWorldBroadcastCameraJoined, (cameraPlayer) => {
      this.SetLocalOwnership(cameraPlayer);
    });

    this.connectLocalBroadcastEvent(hz.World.onUpdate, ({ deltaTime }) => {
      this.OnUpdate(deltaTime);
    });

    this.defaultCamera = this.entity.children.get().filter(entity => entity.tags.contains('DefaultCamera'))[0];
    if (this.defaultCamera == undefined) {
      console.error('[*] No default camera found');
      return;
    }

    this.InjectDefaultLocations(this.LocateDefaultCameraPositions());
  }

  public ForceCameraFocusOnTarget(target: CameraTransform): void {
    if (target == null) {
      console.error('[*] WorldBroadcastBrain: Cannot force focus on null target');
      return;
    }


    if (this.props.debugMode)
      console.log(`[WorldBroadcastBrain] Forcing focus on ${JSON.stringify(target)} `);

    this.forcedFocusTarget = target;
    this.currentState = CameraDirectorState.ForcedFocus;
    this.UpdateCamera(target);
  }

  public EndForcedFocus(): void {
    if (this.props.debugMode)
      console.log('[WorldBroadcastBrain] Ending forced focus');

    this.currentState = CameraDirectorState.CyclingThroughDefaultCameraPositions;
    this.forcedFocusTarget = null;
  }

  private Execute_CyclingThroughDefaultCameraPositions(): void {
    if (this.timeOfLastDefaultCameraSwitch == null) {
      const defaultCameraTransform = this.defaultLocations[0];
      this.UpdateCamera(defaultCameraTransform);
      return;
    }

    const defaultCameraCheckInterval = this.props.timeToSwitchToNextDefaultCamera <= 0 ? CAMERA_CONTROLLER_DEFAULT_CAMERA_CHECK_INTERVAL : this.props.timeToSwitchToNextDefaultCamera;
    if (Date.now() - this.timeOfLastDefaultCameraSwitch < defaultCameraCheckInterval * CONVERT_MILLISECONDS_TO_SECONDS)
      return;


    let indexOf = this.defaultLocations.indexOf(this.currentCameraTransform);

    if (indexOf == -1)
      return;


    if (indexOf >= this.defaultLocations.length - 1)
      indexOf = 0;
    else
      indexOf++;

    const newTransform = this.defaultLocations[indexOf];
    this.UpdateCamera(newTransform);
  }

  private CheckIfShouldBeInForcedFocus(): void {
    if (this.forcedFocusTarget == null) {
      if (this.props.debugMode)
        console.log('[WorldBroadcastBrain] No forced focus target, switching to cycling through default camera positions');

      this.currentState = CameraDirectorState.CyclingThroughDefaultCameraPositions;
      return;
    }
  }

  private InjectDefaultLocations(transforms: CameraTransform[]): void {
    this.defaultLocations = transforms;
  }

  private LocateDefaultCameraPositions(): CameraTransform[] {
    const transforms: CameraTransform[] = [];
    const entities = this.world.getEntitiesWithTags(["CameraPosition"]);

    entities.forEach(entity => transforms.push({ position: entity.position.get(), rotation: entity.rotation.get() }));

    if (this.props.debugMode) {
      console.log(`[WorldBroadcastBrain] Found ${transforms.length} default camera positions`);
      transforms.forEach(transform => console.log(`[WorldBroadcastBrain] ${JSON.stringify(transform)}`));
    }

    return transforms;
  }

  private OnUpdate(deltaTime: number): void {
    switch (this.currentState) {
      case CameraDirectorState.CyclingThroughDefaultCameraPositions:
        this.Execute_CyclingThroughDefaultCameraPositions();
        break;
      case CameraDirectorState.ForcedFocus:
        this.CheckIfShouldBeInForcedFocus();
        break;
    }
  }

  private SetLocalOwnership(cameraPlayer: hz.Player) {
    this.props.localPassiveInstance?.owner.set(cameraPlayer);
    this.props.passiveInstanceUI?.owner.set(cameraPlayer);
  }

  private UpdateCamera(newTransform: CameraTransform): void {
    if (newTransform == undefined) {
      console.error('[*] WorldBroadcastBrain: Cannot update camera to undefined transform');
      return;
    }

    if (this.props.debugMode) {
      console.log(`[WorldBroadcastBrain] Updating camera to ${JSON.stringify(newTransform)}`);
    }


    this.defaultCamera.rotation.set(newTransform.rotation);
    this.defaultCamera.position.set(newTransform.position);

    this.currentCameraTransform = newTransform;
    this.timeOfLastDefaultCameraSwitch = Date.now();
  }
}
hz.Component.register(WorldBroadcastBrain);
