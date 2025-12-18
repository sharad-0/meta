declare module 'horizon/2p' {
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */
import { Asset, AttachablePlayerAnchor, AudioGizmo, Color, HorizonProperty, Player, World, ParticleGizmo, PersistentSerializableState, Entity, Quaternion, SpawnControllerBase, Vec3, TooltipAnchorLocation, TooltipOptions, NetworkEvent, RaycastHit, RaycastOptions, CodeBlockEvent } from 'horizon/core';
import * as i18n_utils from 'HorizonI18nUtils';
/**
 * Extends the AttachablePlayerAnchor class to provide additional attachment
 * points for a player avatar.
 *
 * @example
 * attachToPlayer(AttachablePlayerAnchor.Head)
 * attachToPlayer(AttachablePlayerAnchor.Torso)
 * attachToPlayer(AttachablePlayerAnchorExtended.leftHip)
 * attachToPlayer(AttachablePlayerAnchorExtended.rightHip)
 */
export declare class AttachablePlayerAnchorExtended {
    static readonly leftHip: AttachablePlayerAnchor;
    static readonly rightHip: AttachablePlayerAnchor;
}
/**
 * Deprecated.
 *
 * @deprecated Use the {@link core.AvatarPoseGizmo | core.AvatarPoseGizmo } class instead.
 *
 * Controls player interaction with the Avatar Pose gizmo, which allows
 * players to enter an avatar pose on an entity. The gizmo is typically
 * used to enter a player into a sitting pose on a specific entity.
 */
export declare class AvatarPoseGizmo extends Entity {
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.AvatarPoseGizmo.toString | core.AvatarPoseGizmo.toString }
     * method instead.
     *
     * Creates a human-readable representation of the `AvatarPoseGizmo` object.
     * @returns A string representation of the `AvatarPoseGizmo` object.
     */
    toString(): string;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.AvatarPoseGizmo.player | core.AvatarPoseGizmo.player }
     * property instead.
     *
     * The player to add to the Avatar Pose gizmo.
     *
     * @remarks
     * When a player is added to the gizmo, they teleport to the gizmo
     * and then the avatar pose is applied to them. If another player is already on
     * the gizmo when this property is set, they will be removed. Setting this property
     * to null just removes any exisiting player from the gizmo.
     */
    player: HorizonProperty<Player | null>;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.AvatarPoseGizmo.exitAllowed | core.AvatarPoseGizmo.exitAllowed }
     * property instead.
     *
     * Indicates whether to allow players to exit the Avatar Pose gizmo. True allows players
     * to exit the gizmo; false does not. The default value is `true`.
     */
    exitAllowed: HorizonProperty<boolean>;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.AvatarPoseGizmo.setCanUseForPlayers | core.AvatarPoseGizmo.setCanUseForPlayers }
     * method instead.
     *
     * Sets the players that are allowed to use the avatar pose on the entity,
     * and the players that are blocked from using the pose.
     *
     * @remarks
     * This method sets the list that determines the players that have
     * permission to use the avatar pose on the entity associated with the
     * Avatar Pose gizmo.
     *
     * The `mode` parameter determines how the list operates. You can set
     * the mode to either allow players in the list and block the
     * remaining players, or block players in the list and allow the
     * remaining players.
     *
     * Calling this method replaces any existing permissions set by the
     * list. Passing an empty array to this method blocks all players
     * from using the avatar pose.
     *
     * @param players - The list of players to allow or block from using
     * the avatar pose. The `mode` parameter determines how the list is
     * operates.
     * @param mode - Indicates whether to allow players in the list to
     * use the avatar pose and block the remaining mplayers, or block
     * players in the list and allow the remaining players.
     *
     * @example
     * In this example, the mode is set to block two specified players
     * from using the avatar pose.
     * ```
     * avatarPoseEntity.setCanUseForPlayers([myPlayer1, myPlayer2], AvatarPoseUseMode.DisallowUse );
     * ```
     */
    setCanUseForPlayers(players: Array<Player>, mode: AvatarPoseUseMode): void;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.AvatarPoseGizmo.resetCanUseForPlayers | core.AvatarPoseGizmo.resetCanUseForPlayers }
     * method instead.
     *
     * Removes all players from the list set by the {@link AvatarPoseGizmo.setCanUseForPlayers }
     * method, either allowing or blocking all players from using the avatar pose
     * on the entity depending on the mode.
     *
     * @remarks
     * If the `mode` parameter of the {@link AvatarPoseGizmo.setCanUseForPlayers } method
     * is set to `AvatarPoseUseMode.DisallowUse`, then calling the `resetCanUseForPlayers`
     * method blocks all players from using the avatar pose on the entity. If
     * the parameter is set to `AvatarPoseUseMode.AllowUse`, `resetCanUseForPlayers`
     * allows all players to use the avatar pose on the entity.
     *
     * @example
     * In this example, the mode for setCanUseForPlayers is set to block all players
     * in the list from using the avatar pose on the entity. As a result, the call
     * to resetCanUseForPlayers blocks all players from using the avatar pose on the
     * entity.
     * ```
     * cubeEntity.setCanUseForPlayers([myPlayer1, myPlayer2], AvatarPoseUseMode.DisallowUse );
     * cubeEntity.resetCanUseForPlayers();
     * ```
     */
    resetCanUseForPlayers(): void;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.AvatarPoseGizmo.canPlayerUse | core.AvatarPoseGizmo.canPlayerUse }
     * method instead.
     *
     * Indicates whether the given player can use the avatar pose on the entity.
     *
     * @param player - The player to check permissions for.
     *
     * @returns `true` if the player has permission to use the avatar pose on the entity,
     * `false` otherwise.
     *
     */
    canPlayerUse(player: Player): boolean;
}
/**
 * Deprecated.
 *
 * @deprecated Use the {@link core.AvatarPoseUseMode | core.AvatarPoseUseMode }
 * enum instead.
 *
 * The modes to apply to the permission list that determines which players
 * can use a specific avatar pose managed by an Avatar Pose gizmo.
 *
 * @remarks
 * You can set the permission list by calling the
 * {@link AvatarPoseGizmo.setCanUseForPlayers} method.
 */
export declare enum AvatarPoseUseMode {
    /**
     * Blocks the given players from using the avatar pose.
     */
    DisallowUse = 0,
    /**
     * Enables the given players to use the avatar pose.
     */
    AllowUse = 1
}
/**
 * The axis input for movement with input devices.
 */
export declare enum AxisInput {
    /**
     * Left Thumbstick X on Oculus Touch.
     */
    LeftAxisX = 0,
    /**
     * Left Thumbstick Y on Oculus Touch.
     */
    LeftAxisY = 1,
    /**
     * Right Thumbstick X on Oculus Touch.
     */
    RightAxisX = 2,
    /**
     * Right Thumbstick Y on Oculus Touch.
     */
    RightAxisY = 3,
    /**
     * Left Index Trigger on Oculus Touch.
     */
    LeftTrigger = 4,
    /**
     * Right Index Trigger on Oculus Touch.
     */
    RightTrigger = 5,
    /**
     * Left Grip Trigger on Oculus Touch.
     */
    LeftGrip = 6,
    /**
     * Right Grip Trigger on Oculus Touch.
     */
    RightGrip = 7
}
/**
 * The button pressed for input.
 */
export declare enum ButtonInput {
    /**
     * A on Oculus Touch; Space on keyboard.
     */
    RightButton1 = 0,
    /**
     * B on Oculus Touch; R on keyboard.
     */
    RightButton2 = 1,
    /**
     * X on Oculus Touch; F (Hold) on keyboard.
     */
    LeftButton1 = 2,
    /**
     * Y on Oculus Touch; R (Hold) on keyboard.
     */
    LeftButton2 = 3,
    /**
     * Left Index Trigger on Oculus Touch.
     */
    LeftTrigger = 4,
    /**
     * Right Index Trigger on Oculus Touch.
     */
    RightTrigger = 5,
    /**
     * Left Grip Trigger on Oculus Touch.
     */
    LeftGrip = 6,
    /**
     * Right Grip Trigger on Oculus Touch.
     */
    RightGrip = 7,
    /**
     * Left Thumbstick Click on Oculus Touch.
     */
    LeftThumbstick = 8,
    /**
     * Right Thumbstick Click on Oculus Touch; F on keyboard.
     */
    RightThumbstick = 9
}
/**
 * The icon to use.
 */
export declare enum ButtonIcon {
    /**
     * The icon for Ability.
     */
    Ability = 0,
    /**
     * The icon for Aim.
     */
    Aim = 1,
    /**
     * The icon for Airstrike.
     */
    Airstrike = 2,
    /**
     * The icon for Crouch.
     */
    Crouch = 3,
    /**
     * The icon for Door.
     */
    Door = 4,
    /**
     * The icon for Drink.
     */
    Drink = 5,
    /**
     * The icon for Drop.
     */
    Drop = 6,
    /**
     * The icon for Dual Wield.
     */
    DualWield = 7,
    /**
     * The icon for Eagle Eye.
     */
    EagleEye = 8,
    /**
     * The icon for Eat.
     */
    Eat = 9,
    /**
     * The icon for Fire Special.
     */
    FireSpecial = 10,
    /**
     * The icon for Fire.
     */
    Fire = 11,
    /**
     * The icon for Grab.
     */
    Grab = 12,
    /**
     * The icon for Heal.
     */
    Heal = 13,
    /**
     * The icon for Infinite Ammo.
     */
    InfiniteAmmo = 14,
    /**
     * The icon for Inspect.
     */
    Inspect = 15,
    /**
     * The icon for Interact.
     */
    Interact = 16,
    /**
     * The icon for invisible.
     */
    Invisible = 17,
    /**
     * The icon for Jump.
     */
    Jump = 18,
    /**
     * The icon for House Left.
     */
    MouseLeft = 19,
    /**
     * The icon for Mouse Middle.
     */
    MouseMiddle = 20,
    /**
     * The icon for Mouse Right.
     */
    MouseRight = 21,
    /**
     * The icon for Mouse Scroll.
     */
    MouseScroll = 22,
    /**
     * The icon for Net.
     */
    Net = 23,
    /**
     * The icon for None.
     */
    None = 24,
    /**
     * The icon for Place.
     */
    Place = 25,
    /**
     * The icon for Purchase.
     */
    Purchase = 26,
    /**
     * The icon for Reload.
     */
    Reload = 27,
    /**
     * The icon for Rocket Jump.
     */
    RocketJump = 28,
    /**
     * The icon for Rocket Volley.
     */
    RocketVolley = 29,
    /**
     * The icon for Rocket.
     */
    Rocket = 30,
    /**
     * The icon for Shield.
     */
    Shield = 31,
    /**
     * The icon for Speak.
     */
    Speak = 32,
    /**
     * The icon for Special.
     */
    Special = 33,
    /**
     * The icon for Speed Boost.
     */
    SpeedBoost = 34,
    /**
     * The icon for Sprint.
     */
    Sprint = 35,
    /**
     * The icon for Swap.
     */
    Swap = 36,
    /**
     * The icon for Swing Weapon.
     */
    SwingWeapon = 37,
    /**
     * The icon for Throw.
     */
    Throw = 38,
    /**
     * The icon for Use.
     */
    Use = 39,
    /**
     * The icon for Punch.
     */
    Punch = 40,
    /**
     * The icon for Expand.
     */
    Expand = 41,
    /**
     * The icon for Contract.
     */
    Contract = 42,
    /**
     * The icon for Map.
     */
    Map = 43,
    /**
     * The icon for ChevronLeft.
     */
    LeftChevron = 44,
    /**
     * The icon for ChevronRight.
     */
    RightChevron = 45,
    /**
     * The icon for Menu.
     */
    Menu = 46,
    /**
     * The Push Toggle Talk icon for Available
     */
    PttAvailable = 47,
    /**
     * The Push Toggle Talk icon for Busy
     */
    PttBusy = 48,
    /**
     * The Push Toggle Talk icon for Listening
     */
    PttListening = 49,
    /**
     * The Push Toggle Talk icon for Muted
     */
    PttMuted = 50,
    /**
     * The Push Toggle Talk icon for Responding
     */
    PttResponding = 51,
    /**
     * The Push Toggle Talk icon for Thinking (between listening and responding)
     */
    PttThinking = 52
}
/**
 * The available types of environment variables. These types match the available
 * types in the SVR tool.
 */
export declare enum EnvironmentVariableType {
    /**
     * An integer environment variable.
     */
    Number = 0,
    /**
     * A string environment variable.
     */
    String = 1
}
/**
 * The type of the environment variable that is used for the return value of {@link World2p.getEnvironmentVariable}.
 */
declare type EnvironmentVariableOutputType<T extends EnvironmentVariableType> = T extends EnvironmentVariableType.Number ? number : T extends EnvironmentVariableType.String ? string : never;
/**
 * Options for `startGroupTravel`.
 */
export declare type StartGroupTravelOptions = {
    /**
     * Set to true to navigate to an invite-only instance.
     */
    navigateToInviteOnlyInstance?: boolean;
};
/**
 * Parameters for the {@link JITTriggerEvent} network event.
 *
 * @param name - The name of the event.
 * @param playerId - The ID of the player the event is triggered for. It might be server player id as well.
 * @param payload - The payload of the event.
 */
export declare type JITEventParams = {
    name: string;
    playerId: number;
    payload: string;
};
/**
 * An event that is triggered when another event occurs in the JIT system. This can be either a server event
 * triggered from SVR or a client event triggered when a video reaches a specific time.
 *
 * @remarks You can subscribe to this event using the
 * {@link core.Component.connectNetworkBroadcastEvent | connectNetworkBroadcastEvent} method.
 */
export declare const JITTriggerEvent: NetworkEvent<JITEventParams>;
/**
 * The possible results for calling IPersistentStorage2p.setPlayerVariableAsync
 */
export declare enum SetPlayerVariableResult {
    /**
     * Success result
     */
    SUCCESS = 0,
    /**
     * Failure result
     */
    FAILURE = 1,
    /**
     * Failure due to object variable being too large
     */
    FAILURE_MAX_DATA_SIZE = 2,
    /**
     * Failure due to player being invalid
     */
    FAILURE_INVALID_PLAYER = 3,
    /**
     * Failure due to variable key being invalid
     */
    FAILURE_INVALID_VARIABLE = 4,
    /**
     * Failure due to being called from local script
     */
    FAILURE_CALLED_IN_LOCAL_MODE = 5
}
/**
 * A persistent storage object, which contains a set of functions that interact with player variables.
 *
 * For information about using player variables, see the
 * {@link https://developers.meta.com/horizon-worlds/learn/documentation/typescript/getting-started/persistent-variables-v2 | Persistent Variables} guide.
 */
export interface IPersistentStorage2p {
    /**
     * Sets a persistent player variable async
     * @param player - The player for whom to set the value.
     * @param key - The name of the variable to set, should have "group:name" structure.
     * @param value - The value to assign to the variable.
     * @returns a promise that resolves true if the variable was successfully set. Note: IPersistentStorage.getPlayerVariable will not return updated values until the returned promise completes.
     */
    setPlayerVariableAsync<T extends PersistentSerializableState>(player: Player, key: string, value: T): Promise<SetPlayerVariableResult>;
}
/**
 * Represents a world in Horizon.
 */
export declare class World2p extends World {
    /**
     * Creates a World2p object.
     *
     * @param _ - An unused World parameter, to discourage use of World2p without a reference to the World singleton.
     */
    constructor(_: World);
    /**
     * A set of user interface functions for players.
     *
     * @remarks
     * `showTooltipFromGraphQLForPlayer` - Shows a tooltip modal to a specific player using a backend tooltip entity.
     */
    ui2p: {
        /**
         * Shows a tooltip modal to a specific player using a backend Tooltip entity.
         * @param player - The player to display the tooltip for.
         * @param tooltipAnchorLocation - The anchor point to use to determine the tooltip display location.
         * @param tooltipKey - The GraphQL ID of the tooltip data that will be pulled from the backend and displayed.
         * @param options - The configuration for the tooltip (display line, play sounds, attachment entity, etc).
         *
         * The commands to show custom text tooltips and dismiss tooltips are in the 1st party library and
         * therefor live inside world.ui which is inherited by World2p.  To use these commands simply use
         * World2p.ui.DismissTooltip(player, playSound)
         * and World2p.ui.ShowTooltipForPlayer(player, tooltipAnchorLocation, text, toolTipOptions) respectively
         */
        showTooltipFromGraphQLForPlayer(player: Player, tooltipAnchorLocation: TooltipAnchorLocation, tooltipKey: string, options?: Partial<TooltipOptions>): void;
    };
    /**
     * Caches assets needed for group travel. As an example, a custom loading skydome for a destination world is loaded with this function.
     * Note: this function can only be called locally. Calling this function on the server will result in an exception.
     *
     * @param worldID - The destination world ID. Select "Copy World Link" from the https://horizon.meta.com/creator/worlds_all/ page.
     */
    static preloadGroupTravel(worldID: string): Promise<boolean>;
    /**
     * Creates a group of players and assigns them to a world. This method fails if there are less than
     * two players in a given world.
     *
     * @param worldID - The world ID. Select "Copy World Link" from the
     * https://horizon.meta.com/creator/worlds_all/ page.
     * @param players - An array of Player objects to assign to the new world's players. Must include
     * at least one player.
     * @param options - Optional parameters for the group travel.
     */
    startGroupTravel(worldID: string, players: Array<Player>, options?: StartGroupTravelOptions): void;
    /**
     * The matchmaking system for queueing players into the world.
     *
     * @deprecated Use the {@link https://horizon.meta.com/resources/scripting-api/core.world.matchmaking.md/ | World.matchmaking }
     * property instead.
     *
     * @remarks
     * `allowPlayerJoin` - Indicates whether players can join the world.
     */
    matchmaking: {
        /**
         * Indicates whether more players can join the world.
         *
         * @param allow - `true`, to allow more players to join the world; `false` to prevent additional
         * players from joining the world. The default value is `true`.
         */
        allowPlayerJoin(allow: boolean): Promise<void>;
    };
    /**
     * The entitlement information for a player, which is used to manage in-game items
     * purchased and stored in their inventory.
     *
     * `grantPlayerEntitlement` - Grants the specified type and quantity of an item to a player.
     */
    entitlements: {
        /**
         *  Grants the specified type and quantity of an item to a player.
         *
         * @param player - The player to grant the items to.
         * @param itemId - The globally unique inventory item ID that represents the item.
         * @param quantity - The quantity to grant. 1 is the default value.
         */
        grantPlayerEntitlement(player: Player, item: string, quantity?: number): PlayerEntitlementInfo;
    };
    /**
     * A persistent storage object for 2Ps, which contains an additional set of functions that interact with player variables.
     *
     * For information about using player variables, see the
     * {@link https://developers.meta.com/horizon-worlds/learn/documentation/typescript/getting-started/persistent-variables-v2 | Persistent Variables} guide.
     */
    persistentStorage2p: IPersistentStorage2p;
    /**
     * Attaches a spawn controller to the specified entities.
     *
     * @returns The spawn controller.
     */
    attachSpawnController(entities: Entity[]): SpawnControllerBase;
    /**
     * Retrieves the value of the given environment variable from the current world
     * based on the name and type of the variable.
     *
     * @remarks
     * The environment variables available to a world are located in the Worlds tab
     * of the SVR tool. This method is only useful if you have access to the
     * current world in the SVR tool.
     *
     * @param name - The name of the environment variable to retrieve.
     * @param expectedType - The expected type of the environment variable. Defaults
     * to {@link EnvironmentVariableType.Number}.
     * @returns The value of the environment variable with the specified name and type.
     * If the environment variable is not set, returns `undefined`. If the environment
     * variable is of the wrong type, an error is thrown.
     *
     * @example
     * ```
     * let world2P = new World2p(this.world);
     * let firstSongStartTime = world2P.getEnvironmentVariable('first_song_start_time');
     * let firstSongTitle = world2P.getEnvironmentVariable('first_song_title', EnvironmentalVariableType.String);
     * ```
     */
    getEnvironmentVariable<TType extends EnvironmentVariableType = EnvironmentVariableType.Number>(name: string, expectedTypeArg?: TType): EnvironmentVariableOutputType<TType> | undefined;
    /**
     * Retrieves the number of seconds since the start time of the last ongoing
     * world event, or undefined if there is no ongoing event.
     *
     * @remarks
     * You can use this method to schedule events based the amount of time since
     * the current event started.
     *
     * You can create and view world events, and view their environment variables
     * in the SVR tool if you have access to the world in the tool. To retrieve
     * an environment variable, see the {@link World2p.getEnvironmentVariable }
     * method.
     *
     * @returns The number of seconds since the event started, or undefined if
     * there is no ongoing event.
     *
     * @example
     * In this example, the `World2p.getEnvironmentVariable` method retrieves
     * the start time of the latest ongoing event in the world and then the
     * `World2p.getTimeSinceEventStart` method is used to calculate the duration
     * of the event.
     * ```
     * let world2P = new World2p(this.world);
     * let countDownStartTime = world2P.getEnvironmentVariable('countdown_start_time');
     * let timeSinceEventStart = world2P.getTimeSinceEventStart();
     * if (timeSinceEventStart && timeSinceEventStart >= countDownStartTime) {
     *   startCountDown();
     * }
     * ```
     */
    getTimeSinceEventStart(): number | undefined;
    /**
     * Casts a sphere using the given origin, direction and raidius returning contact points.
     * Only the closest point for each player or entity will be in the results.
     *
     * @param origin - Starting point of the sphere.
     * @param direction - Displacement of the sphere (vector from the origin to the terminal point).
     * @param radius - Radius of the sphere.
     * @param options - The {@link RaycastOptions} for configuring the raycast operation.
     *
     * @returns Contact points.
     */
    spherecast(origin: Vec3, direction: Vec3, radius: number, options?: RaycastOptions): RaycastHit[];
}
/**
 * The options for a player's title.
 *
 * @remarks
 * Type Parameters:
 *
 * `title` - The text to display (empty or null clears any text and background).
 *
 * `background` - The background of the title. Default is black with an opaque alpha.
 * `Undefined`: Use the system default title background. `Color`: Use a solid color title
 * background. `[Color, Color]`: Use a smooth gradient background, going from the first
 * color to the second.
 *
 * @privateRemarks
 * If the API site or doc generator works with type parms, we can remove the parameter
 * info from the remarks section.
 *
 * @typeParam title - The text to display (empty or null clears any text and background).
 * @typeParam background - The background of the title. Default is black with an opaque alpha.
 * Undefined: Use the system default title background. Color: Use a solid color title
 * background. [Color, Color]: Use a smooth gradient background, going from the first
 * color to the second.
 */
export declare type PlayerTitleOptions = {
    title?: string;
    background?: Color | [Color, Color];
};
/**
 * The default values for PlayerTitleOptions.
 *
 * @remarks
 * See {@link PlayerTitleOptions}.
 */
export declare const DefaultPlayerTitleOptions: {};
/**
 * A tag associated with a player avatar.
 */
export declare class NameTag {
    /**
     * The player attached to the tag.
     */
    private readonly player;
    /**
     * Creates a new `NameTag`.
     * @param player - The Player to attach the tag to.
     */
    constructor(player: Player);
    /**
     * The visibility of the player's tag.
     *
     * @remarks `true` for visible, `false` for invisible.
     */
    visible: HorizonProperty<boolean>;
}
/**
 * Deprecated.
 *
 * @deprecated Use the {@link https://horizon.meta.com/resources/scripting-api/core.avatargrippose.md/ | AvatarGripPose }
 * enum instead.
 *
 * Defines the HWXS animation set that is assigned to an avatar.
 */
export declare enum AvatarPose {
    /**
     * The Default grip type.
     */
    Default = "Default",
    /**
     * Held in a pistol grip.
     */
    Pistol = "Pistol",
    /**
     * Held in a shotgun grip.
     */
    Shotgun = "Shotgun",
    /**
     * Held in a rifle grip.
     */
    Rifle = "Rifle",
    /**
     * Held in an RPG grip.
     */
    RPG = "RPG",
    /**
     * Held in a sword grip.
     */
    Sword = "Sword",
    /**
     * Held in a torch grip.
     */
    Torch = "Torch",
    /**
     * Held in a shield grip.
     */
    Shield = "Shield",
    /**
     * Held in a fishing grip.
     */
    Fishing = "Fishing",
    /**
     * Generic grip for carrying lighter objects.
     */
    CarryLight = "CarryLight",
    /**
     * Generic grip for carrying heavier objects.
     */
    CarryHeavy = "CarryHeavy",
    /**
     * Generic grip for driving objects.
     */
    Driving = "Driving"
}
/**
 * Deprecated.
 *
 * @deprecated Use the {@link https://horizon.meta.com/resources/scripting-api/core.avatargripposeanimationnames.md/ | core.AvatarGripPoseAnimationNames }
 * enum instead.
 *
 * Defines the available avatar pose animations.
 */
export declare enum AvatarPoseAnimationNames {
    /**
     * Fire animation for the player.
     */
    Fire = "Fire",
    /**
     * Reload animation for the player.
     */
    Reload = "Reload"
}
/**
 *
 */
export declare type InfoSlideStyle = {
    attachImageToHeader?: boolean;
};
/**
 * Info Slides carousel data.
 *
 * @param title - localizable title of the slide
 * @param message - localizable message of the slide
 * @param imageUri - asset ID of image to display on the slide
 */
export declare type InfoSlide = {
    title?: i18n_utils.LocalizableText | string;
    message?: i18n_utils.LocalizableText | string;
    imageUri?: string;
    style?: InfoSlideStyle;
};
/**
 * The base class for all players in the world.
 */
export declare class Player2p extends Player {
    /**
     * The name tag for the player.
     */
    readonly nameTag: NameTag;
    /**
     * The player's title options.
     */
    title: HorizonProperty<PlayerTitleOptions>;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link https://horizon.meta.com/resources/scripting-api/core.player.playavatargripposeanimationbyname.md/ | core.Player.playAvatarGripPoseAnimationByName }
     * method instead.
     *
     * Triggers a one shot AvatarPose animation by name.
     * @param avatarPoseAnimationName - The avatar pose animation to play. See AvatarPoseAnimationNames for known values.
     *
     * @example
     * ```
     * player.playAvatarPoseAnimationByName(AvatarPoseAnimationNames.Fire)
     * ```
     */
    playAvatarPoseAnimationByName(avatarPoseAnimationName: string): void;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.player.sprintMultiplier | core.player.sprintMultiplier }
     * property instead.
     *
     * The multiplier applied to a player's locomotion speed when they are sprinting.
     * Setting this to 1 disables a player's ability to sprint.
     *
     * @remarks
     *
     * `sprintMultiplier.set` can be called on any player from any context, but
     * `sprintMultiplier.get` will throw an error unless it's called from a
     * local script attached to an object owned by the player in question.
     */
    sprintMultiplier: HorizonProperty<number>;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.player.strafeMultiplier | core.player.strafeMultiplier }
     * property instead.
     *
     * The multiplier applied to a player's locomotion speed when they are strafing.
     *
     * @remarks
     *
     * Default value is 0.825.
     * strafeMultiplier must be a value between 0 and 10.
     * `strafeMultiplier.set` can be called on any player from any context, but
     * `strafeMultiplier.get` will throw an error unless it's called from a
     * local script attached to an object owned by the player in question.
     *
     * Using the Orbit, Pan, and Follow camera modes will prevent the user from backpedaling.
     *
     * @example
     * This example demonstrates how to modify the player strafe multiplier while it is inside a trigger.
     * ```
     * import {Player2p} from 'horizon/2p';
     * import * as hz from 'horizon/core';
     *
     * class StrafeMultiplierExample extends hz.Component<typeof StrafeMultiplierExample> {
     *   static propsDefinition = {
     *     modifiedStrafeMultiplier: { type: hz.PropTypes.Number },
     *   };
     *
     *   private defaultStrafeMultiplier: number = 0.825;
     *
     *   start() {
     *     this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player) => {
     *       var extendedPlayer = new Player2p(player.id);
     *       extendedPlayer.strafeMultiplier.set(this.props.modifiedStrafeMultiplier);
     *     });
     *
     *     this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitTrigger, (player) => {
     *       var extendedPlayer = new Player2p(player.id);
     *       extendedPlayer.strafeMultiplier.set(this.defaultStrafeMultiplier);
     *     });
     *   }
     * }
     *
     * hz.Component.register(StrafeMultiplierExample);
     * ```
     */
    strafeMultiplier: HorizonProperty<number>;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.player.backpedalMultiplier | core.player.backpedalMultiplier }
     * property instead.
     *
     * The multiplier applied to a player's locomotion speed when they are backpedaling.
     *
     * @remarks
     *
     * Default value is 0.825.
     * backpedalMultiplier must be a value between 0 and 10.
     * `backpedalMultiplier.set` can be called on any player from any context, but
     * `backpedalMultiplier.get` will throw an error unless it's called from a
     * local script attached to an object owned by the player in question.
     *
     * Using the Orbit, Pan, and Follow camera modes will prevent the user from backpedaling.
     *
     * @example
     * This example demonstrates how to modify the player backpedal multiplier while it is inside a trigger.
     * ```
     * import {Player2p} from 'horizon/2p';
     * import * as hz from 'horizon/core';
     *
     * class BackpedalMultiplierExample extends hz.Component<typeof BackpedalMultiplierExample> {
     *   static propsDefinition = {
     *     modifiedBackpedalMultiplier: { type: hz.PropTypes.Number },
     *   };
     *
     *   private defaultBackpedalMultiplier: number = 0.825;
     *
     *   start() {
     *     this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player) => {
     *       var extendedPlayer = new Player2p(player.id);
     *       extendedPlayer.backpedalMultiplier.set(this.props.modifiedBackpedalMultiplier);
     *     });
     *
     *     this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitTrigger, (player) => {
     *       var extendedPlayer = new Player2p(player.id);
     *       extendedPlayer.backpedalMultiplier.set(this.defaultBackpedalMultiplier);
     *     });
     *   }
     * }
     *
     * hz.Component.register(BackpedalMultiplierExample);
     * ```
     */
    backpedalMultiplier: HorizonProperty<number>;
    /**
     * The multiplier applied to a mobile (2D) player's on-screen joystick input.
     *
     * @remarks
     *
     * Default value is 1.
     * Acceptable values must be between 0 and 10, with 0 disabling the player's ability to move
     * and 10 bringing them to full speed at 1/10th the default joystick distance.
     * `joystickInputMultiplier.set` can be called on any player from any context, but
     * `joystickInputMultiplier.get` will throw an error unless it's called from a
     * local script attached to an object owned by the player in question.
     *
     * @example
     * This example demonstrates how to modify the player's joystick input multiplier while they are inside a trigger.
     * ```
     * import {Player2p} from 'horizon/2p';
     * import * as hz from 'horizon/core';
     *
     * class JoystickInputMultiplierExample extends hz.Component<typeof JoystickInputMultiplierExample> {
     *   static propsDefinition = {
     *     modifiedJoystickInputMultiplier: { type: hz.PropTypes.Number },
     *   };
     *
     *   private defaultJoystickInputMultiplier: number = 1;
     *
     *   start() {
     *     this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player) => {
     *       var extendedPlayer = new Player2p(player.id);
     *       extendedPlayer.joystickInputMultiplier.set(this.props.modifiedJoystickInputMultiplier);
     *     });
     *
     *     this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitTrigger, (player) => {
     *       // Return to default value.
     *       var extendedPlayer = new Player2p(player.id);
     *       extendedPlayer.joystickInputMultiplier.set(this.defaultJoystickInputMultiplier);
     *     });
     *   }
     * }
     *
     * hz.Component.register(JoystickInputMultiplierExample);
     * ```
     */
    joystickInputMultiplier: HorizonProperty<number>;
    /**
     * Starts recording the player's point of view into a video.
     * @param momentName - The name of the video. This value must be alphanumeric
     * but can include spaces.
     * @param options - The options that specify how to record the video.
     */
    startVideoCapture(momentName: string, options?: StartVideoCaptureOptions): Promise<VideoCaptureResponseCode>;
    /**
     * Stops recording the player's point of view into a video.
     * @param options - The options for how to record the video.
     */
    stopVideoCapture(options?: StopVideoCaptureOptions): Promise<VideoCaptureResponseCode>;
    /**
     * Applies a new avatar configuration to the current player.
     *
     * @param config - The avatar configuration to set.
     *
     * @returns
     * A promise that indicates whether the operation succeeds.
     */
    setAvatarConfigs(config: bigint | Array<bigint>): Promise<boolean>;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link https://horizon.meta.com/resources/scripting-api/core.player.setavatargripposeoverride.md/ | core.player.setAvatarGripPoseOverride }
     * method instead.
     *
     * Overrides the existing HWXS avatar grip type, which is determined by the currently held item.
     * @param avatarPose - The type of pose which wants enforcing, this will persist until cleared or another grip override is set
     */
    setAvatarPoseOverride(avatarPose: AvatarPose): void;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link https://horizon.meta.com/resources/scripting-api/core.player.clearavatargripposeoverride.md/ | core.player.clearAvatarGripPoseOverride }
     * method instead.
     * Clears any avatar pose overrides.
     */
    clearAvatarPoseOverride(): void;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.player.avatarScale} property instead.
     * The scale of the player's avatar.
     * Change this to scale the player up or down.
     * @remarks
     * - Accepts values between 0.05 and 50.
     * - The scaling happens with a one frame delay.
     */
    avatarScale: HorizonProperty<number>;
    /**
     * Mutes the audio from a set of players for the given player.
     *
     * @param players - The list of players to mute for the given player. If this
     * parameter isn't provided, all players are muted for the given player.
     */
    mutePlayersForPlayer(players?: Array<Player>): void;
    /**
     * Unmutes the audio from a set of players for the given player.
     *
     * @param players - The list of players to unmute for the given player. If
     * this parameter isn't provided, all players are unmuted for the given
     * player.
     */
    unmutePlayersForPlayer(players?: Array<Player>): void;
    /**
     * The functions and options for a player's selfie camera.
     *
     * @remarks
     * `open` - Opens the player's selfie camera if it is currently closed.
     * The camera will save the recording after 60.0s, but not close itself.
     *
     * `close` - Closes the player's selfie camera and saves any ongoing
     * recording.
     */
    selfieVideoCamera: {
        /**
         * This API can only be called when the player's selfie camera is closed, not in safe mode, etc.
         * Details in the return camera API result
         *
         * The selfie camera will save the recording after 60.0s, but not
         * close itself. This is the default behavior of the Horizon Selfie Camera.
         */
        open: (position: Vec3, rotation: Quaternion, options?: Partial<OpenSelfieVideoCameraOptions>) => Promise<CameraAPIResult>;
        close: () => Promise<CameraAPIResult>;
    };
    /**
     * Shows info slides carousel for player.
     *
     * NOTE: Mobile & Desktop only.
     *
     * @param slides - customized info slides that will be shown to the player
     */
    showInfoSlides(slides: InfoSlide[]): void;
    /**
     * Sets Mobile Input control types to the default style
     * This uses a linear gradient for speed relative to the joystick magnitude
     * Has no effect if set for a Player on VR or Web
     * Must be run on a local player
     *
     * @example
     * ```
     * start() {
     *   const owner = this.owner.get();
     * 	 if (owner.id != this.world.serverPlayer.get().id) {
     *     var extendedPlayer = new Player2p(this.entity.owner.get().id);
     *     extendedPlayer?.setMobileInputStyleDefault();
     *   }
     * }
     * ```
     */
    setMobileInputStyleDefault(): void;
    /**
     * Sets Mobile Input control types to a stepped curve
     * This provides a more responsive feel to mobile players
     * by using 1 of 3 specific movement magnitudes (walk/run/sprint)
     *
     * This allows players to have more fine control on tricky obstacles or small areas
     * they might want to explore e.g. a lobby, or for navigation tightropes in a
     * platforming game.
     *
     * Has no effect if set for a Player on VR or Web
     * Must be run on a local player
     *
     * @param walkThreshold - default 0.05
     * @param jogThreshold - default 0.4
     * @param sprintThreshold - default 0.95
     *
     * @example
     * ```
     * start() {
     *   const owner = this.owner.get();
     * 	 if (owner.id != this.world.serverPlayer.get().id) {
     *     var extendedPlayer = new Player2p(this.entity.owner.get().id);
     *     extendedPlayer?.setMobileInputStyleComfortable();
     *   }
     * }
     * ```
     */
    setMobileInputStyleComfortable(walkThreshold?: number, runThreshold?: number, sprintThreshold?: number): void;
    /**
     * Sets Mobile Input control types to make the player sprint with
     * minimal input on the joystick
     *
     * The Threshold for sprinting is set at an input magnitude of 0.05
     *
     * This will provide a more response feel for fast-paced
     * action oriented worlds
     *
     * Has no effect if set for a Player on VR or Web player
     * Must be run on a local player
     *
     * @example
     * ```
     * start() {
     *   const owner = this.owner.get();
     * 	 if (owner.id != this.world.serverPlayer.get().id) {
     *     var extendedPlayer = new Player2p(this.entity.owner.get().id);
     *     extendedPlayer?.setMobileInputStyleDefault();
     *   }
     * }
     * ```
     */
    setMobileInputStyleAlwaysSprint(): void;
}
/**
 * The possible orientations for opening player's selfie camera.
 */
export declare enum CameraOrientation {
    /**
     * Landcape mode.
     */
    LANDSCAPE = 0,
    /**
     * Portait mode.
     */
    PORTRAIT = 1
}
/**
 * The possible directions for opening player's selfie camera.
 */
export declare enum CameraDirection {
    /**
     * The front facing selfie camera.
     */
    SELFIE = 0,
    /**
     * The forward facing camera that is usually located on the back of the device.
     */
    FORWARD = 1
}
/**
 * The modes for displaying name tags when {@link Player2p.selfieVideoCamera | opening} a selfie camera.
 */
export declare enum CameraNametagMode {
    /**
     * Display name tags.
     */
    SHOW = 0,
    /**
     * Hide name tags.
     */
    HIDE = 1
}
/**
 * The capture modes for a selfie camera.
 */
export declare enum CameraCaptureMode {
    /**
     * Capture photos.
     */
    PHOTO = 0,
    /**
     * Record videos.
     */
    VIDEO = 1,
    /**
     * Record videos in drone mode, which capture video using the third person view.
     */
    DRONE = 2
}
/**
 * The possible return options for
 * {@link Player2p.selfieVideoCamera | opening and closing} a player's selfie
 * camera.
 */
export declare enum CameraAPIResult {
    /**
     * Successfully opened the camera.
     */
    OPEN_SUCCESS = 0,
    /**
     * Successfully closed the camera.
     */
    CLOSE_SUCCESS = 1,
    /**
     * Failed: the camera is already open from anther source.
     */
    ALREADY_OPEN = 2,
    /**
     * Failed: the camera was already closed from another source.
     */
    ALREADY_CLOSED = 3,
    /**
     * Failed: the player did not grant storage permission.
     */
    NO_STORAGE_PERMISSION = 4,
    /**
     * Failed: the player is invalid and possibly left the world.
     */
    PLAYER_INVALID = 5,
    /**
     * Failed: the player entered safe mode.
     */
    PLAYER_IN_SAFE_MODE = 6,
    /**
     * Failed: the player declined recording.
     */
    PLAYER_DECLINED_REC = 7,
    /**
     * Failed: Horizon cannot access the camera.
     */
    CAMERA_SERVICE_UNAVAILABLE = 8,
    /**
     * Failed: the player's currently opened camera is not from this source.
     */
    CAMERA_OPENED_VIA_OTHER_SOURCE = 9,
    /**
     * Failed: unknown error.
     */
    UNKNOWN = 10
}
/**
 * The default options for opening a selfie Cam.
 */
export declare const DefaultOpenSelfieVideoCameraOptions: OpenSelfieVideoCameraOptions;
/**
 * The options for {@link Player2p.selfieVideoCamera | opening} a selfie camera.
 *
 * @remarks
 * Type Parameters:
 *
 * `orientation` - The camera orientation to use.
 *
 * `direction` - The directation to aim the camera.
 *
 * `startRecordingOnOpen` - Indicates whether the camera automatically starts recording when it opens.
 *
 * `hideUIButtons` - Indicates whether to hide the camera's UI buttons while it is open.
 *
 * `nametagMode` - Indicates whether to display the player's name tags while the camera is open.
 *
 * `captureMode` - The capture mode to activate when the camera opens.
 */
export declare type OpenSelfieVideoCameraOptions = {
    orientation: CameraOrientation;
    direction: CameraDirection;
    startRecordingOnOpen: boolean;
    hideUIButtons: boolean;
    nameTagMode: CameraNametagMode;
    captureMode: CameraCaptureMode;
};
declare enum VFXParameterTypeEnum {
    'boolean' = 0,
    'number' = 1,
    'booleanArray' = 2,
    'numberArray' = 3
}
declare type VFXParameterType = number | boolean | number[] | boolean[];
declare type VFXParameter<T extends VFXParameterType> = {
    name: string;
    type: string;
    minValue: T | null;
    maxValue: T | null;
};
/**
 * Deprecated.
 *
 * @deprecated Use the {@link https://developers.meta.com/horizon-worlds/reference/2.0.0/core_particlegizmo | core.ParticleFXSetParameterOptions }
 * type instead.
 *
 * The optional parameters for the setVFXParameterValue method.
 *
 * @remarks
 * players - The array of players to apply the change to.
 *
 * @typeParam players - The array of players to apply the change to.
 */
export declare type ParticleFXSetParameterOptions = {
    players?: Array<Player>;
};
/**
 * Options for `StartVideoCapture`.
 */
export declare type StartVideoCaptureOptions = {
    /**
     * The duration, in seconds, to continue recording.
     * Default is 60 seconds. Internally this value is restricted to at most 60 seconds.
     */
    duration: number;
    /**
     * Whether to save the resulting MP4 when finished.
     * If `false`, it is discarded; otherwise, it is saved.
     * Default is true.
     */
    saveOnDurationReached: boolean;
};
/**
 * Options for `StopVideoCapture`.
 */
export declare type StopVideoCaptureOptions = {
    /**
     * Whether to save the resulting MP4.
     * If `false`, it is discarded; otherwise, it is saved.
     * Default is true.
     */
    save: boolean;
};
/**
 * Deprecated.
 *
 * @deprecated Use the {@link https://developers.meta.com/horizon-worlds/reference/2.0.0/core_particlegizmo | ParticleGizmo }
 * class instead.
 *
 * Represents a particle affect that can effect one or more particles in a particle system.
 */
export declare class VFXParticleGizmo extends ParticleGizmo {
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link https://developers.meta.com/horizon-worlds/reference/2.0.0/core_particlegizmo | core.particleGizmo.toString }
     * property instead.
     *
     * Gets a human readable representation of the VFXParticleGizmo.
     * @returns - A string representation of this VFXParticleGizmo.
     */
    toString(): string;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link https://developers.meta.com/horizon-worlds/reference/2.0.0/core_particlegizmo | core.particleGizmo.convertToVFXParameterType }
     * property instead.
     *
     * Converts a C#-compatible particle FX parameter type to a TypeScript-compatible VFX parameter type.
     * @param parameterType - The Particle FX parameter type to convert.
     *
     * @returns - An equivalent VFX parameter type enum for the given Particle FX parameter type.
     * @throws Thrown if the given parameter type is unrecognized.
     */
    convertToVFXParameterType(parameterType: string): VFXParameterTypeEnum;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link https://developers.meta.com/horizon-worlds/reference/2.0.0/core_particlegizmo | core.particleGizmo.parseValue }
     * property instead.
     *
     * Parses the minimum and maximum VFX values according to type.
     *
     * @param value - A string containing a comma separated list of the numbers or
     * bools to parse.
     * @param type - The type of the parameter.
     * @returns - The parsed values. If the values are invalid, returns null.
     */
    parseValue(value: string, type: VFXParameterTypeEnum): number | boolean | number[] | boolean[] | null;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link https://developers.meta.com/horizon-worlds/reference/2.0.0/core_particlegizmo | core.particleGizmo.setVFXParamterValue }
     * property instead.
     *
     * Sets a custom PopcornFX parameter at runtime.
     *
     * @param parameterName - The name of the custom parameter to set.
     * @param newValue - The new value of type number, boolean, number[], or boolean[].
     * @param options - Allows customization of the set parameter action.
     *
     * @example Sets a boolean custom parameter.
     * ```
     * this.entity.as(ParticleGizmo).setVFXParameterValue("Trail Active", false);
     * ```
     */
    setVFXParameterValue<T extends VFXParameterType>(name: string, value: T, options?: ParticleFXSetParameterOptions): Promise<undefined>;
    /**
     * Gets all custom parameters for the particle effect.
     *
     * @returns VFXParameter[] - An array of VFX parameters associated with the particle effect.
     *
     * @deprecated Use the {@link https://developers.meta.com/horizon-worlds/reference/2.0.0/core_particlegizmo | core.particleGizmo.getVFXParameters }
     * property instead.
     *
     * @example Prints some parameter attributes to the console.
     * ```
     * const printParameters = async () =\> {
     *   const parameters = this.entity.as(ParticleGizmo).getVFXParameters();
     *   parameters.forEach(vfxParam =\> {
     *     console.log(vfxParam.name + ", " + vfxParam.type);
     *   \});
     * \}
     * ```
     */
    getVFXParameters(): Promise<VFXParameter<VFXParameterType>[]>;
}
/**
 * Represents a system action on a player.
 */
export declare enum SystemAction {
    /**
     * A jump action.
     */
    Jump = 0
}
/**
 * The response codes for {@link Player2p.startVideoCapture | player video capture} functions.
 *
 * @privateRemarks
 * Must remain in sync with VideoCaptureResponseCode in IScriptingRuntime.cs.
 */
export declare enum VideoCaptureResponseCode {
    /**
     * Operation completed without error.
     */
    Success = 0,
    /**
     * Exception happened with internal code. Not the fault of the caller.
     */
    InternalError = 1,
    /**
     * User has turned off storage permission on the device so we cann't save any video files.
     */
    StoragePermissionDenied = 2,
    /**
     * When calling start capture but there is already a recording in progress it will fail
     */
    RecordingAlreadyInProgress = 3,
    /**
     * When calling stop capture but no recording is in progress it fails.
     */
    RecordingNotInProgress = 4,
    /**
     * User has auto capture disabled.
     */
    FeatureDisabled = 5,
    /**
     * Parameters were invalid. String may have had special characters
     */
    InvalidParamter = 6
}
export { EntityStyle } from 'horizon/core';
export { TextureAsset } from 'horizon/core';
export type { SetMeshOptions } from 'horizon/core';
export { MeshEntity } from 'horizon/core';
/**
 * The entitlement information for a player, which is used to manage in-game items
 * purchased and stored in their inventory.
 */
export interface PlayerEntitlementInfo {
    /**
     * Item ID of the item to a acquire.
     */
    itemId: string;
    /**
     * Indicates whether the owner is currently active. `true` if the owner is active; `false` otherwise.
     */
    isOwnershipActive: boolean;
    /**
     * The number of items in the player's inventory that are the same type as the item to acquire.
     */
    currentQuantity: number;
}
/**
 * Motion type for an entity.
 */
export declare enum MotionType {
    /**
     * Indicates no motion type. Entities using this motion type will be static in the scene.
     */
    None = 0,
    /**
     * Indicates animated motion type
     */
    Animated = 1,
    /**
     * Indicates interactive motion type
     */
    Interactive = 2
}
/**
 * Represents an entity in a 2D world.
 */
export declare class Entity2p extends Entity {
    /**
     * Gets a human readable representation of the object.
     * @returns a string representation of the object.
     */
    toString(): string;
    /**
     * Sets a transform constraint of an entity (the child) to another (the parent).
     *
     * @remarks
     * This is the "snapping version" of transform constraint, using the `localPosition`, `localRotation`, and `localScale` parameters.
     * It overrides the child's original local world position, rotation, and scale in its parent's coordinate system.
     *
     * @param parentEntity - The parent entity.
     * @param localPosition - The child's local position in its parent's coordinate system.
     * @param localRotation - The child's local rotation in its parent's coordinate system.
     * @param localScale - The child's local scale in its parent's coordinate system.
     */
    setTransformConstraint(parentEntity: Entity, localPosition: Vec3, localRotation: Quaternion, localScale: Vec3): void;
    /**
     * Sets a transform constraint of an entity (the child) to another (the parent).
     *
     * @remarks
     * This is the "keep relative version" of transform constraint, using the child's original local world position, rotation, and scale.
     * Its parent's coordinate system is preserved after the operation.
     *
     * To keep the child entity's world position, location, and scale before and after the attachment operation,
     * use this method instead of "setTransformConstraint". To override attached entity's
     * world position and location with your custom values, use "setTransformConstraint" with custom values.
     * @param parentEntity - The parent entity.
     */
    setTransformConstraintKeepRelative(parentEntity: Entity): void;
    /**
     * Sets a transform constraint of an entity (the child) to another asset bundle gizmo reference.
     *
     * @remarks
     * An asset bundle gizmo reference normally refers to one of the bone references generated in the game dynamically by the asset bundle gizmo.
     * This is the "snapping version" of transform constraint, using the `localPosition`, `localRotation` and `localScale` parameters.
     * This function overrides the child's original local world position, rotation, and scale in its parent's coordinate system.
     *
     * IMPORTANT: For now, if you call this function in the start() function of your TS script, you need
     * to assure the attached object share the same ownership with the being attached asset bundle.
     * This is because the asset bundle is playing the animation on the client side, but the SOP is synced by
     * the server. So if they do not share the same ownership, you may notice some de-sync issue.
     *
     * You must import the asset bundle using the `Always Animate` option for `Culling Mode`.
     * Otherwise, the asset does not animate with the entity.
     *
     * @param parentEntity - The parent entity (an asset bundle gizmo entity).
     * @param referenceName - The asset bundle gizmo reference name.
     * @param localPosition - The child's local position in its parent's coordinate system.
     * @param localRotation - The child's local rotation in its parent's coordinate system.
     * @param localScale - The child's local scale in its parent's coordinate system.
     */
    setTransformConstraintToAssetBundleGizmoReference(parentEntity: Entity, referenceName: string, localPosition: Vec3, localRotation: Quaternion, localScale: Vec3): void;
    /**
     * Sets a transform constraint of an entity (the child) to another asset bundle gizmo reference.
     *
     * @remarks
     * An asset bundle gizmo reference normally refers to one of the bone references generated in the game dynamically by the asset bundle gizmo.
     * This is the "keep relative version" of transform constraint, using the child's original local world position, rotation, and scale.
     * This function preserves its parent's coordinate system after the operation.
     *
     * Important: For now, if you call this function in the start() function of your TS script, you need
     * to assure the attached object share the same ownership with the being attached asset bundle.
     * This is because the asset bundle is playing the animation on the client side, but the SOP is synced by
     * the server. So if they do not share the same ownership, you may notice some de-sync issue.
     *
     * @param parentEntity - The parent entity (asset bundle gizmo entity).
     * @param referenceName - The asset bundle gizmo reference name.
     */
    setTransformConstraintToAssetBundleGizmoReferenceKeepRelative(parentEntity: Entity, referenceName: string): void;
    /**
     * Clears the transform constraint of an entity.
     */
    clearTransformConstraint(): void;
    /**
     * Get and set entity motion type.
     *
     * @remarks
     * The motionType property setter is only supported for runtime spawned assets.
     *
     */
    motionType: HorizonProperty<MotionType>;
}
/**
 * The matchmaking system for queueing players into the world.
 */
export declare class Matchmaking {
    /**
     * Create a ticket for players to queue into a world.
     *
     * @param worldID - The ID of the world to queue for. Select
     * "Copy World Link" from the https://horizon.meta.com/creator/worlds_all/ page.
     * @param players - The players to queue with the ticket.
     * @param options - The ticket options, such as the minimum number of players
     * required to start a match.
     */
    createTicket(worldID: string, players: Array<Player>, options: MatchmakingTicketOptions): Promise<MatchmakingTicket>;
    /**
     * Gets the {@link MatchmakingTicket | matchmaking ticket} for the given player.
     *
     * @param player - The player to query for a matchmaking ticket.
     */
    getTicketForPlayer(player: Player): MatchmakingTicket | null;
    /**
     * Gets the latest {@link MatchmakingTicketMatchInfo | matchmaking ticket match infomation} for the given player.
     *
     * @param player - The player to query for the latest match infomation
     */
    getTicketMatchInfoForPlayer(player: Player): Promise<MatchmakingTicketMatchInfo | null>;
}
declare type MatchmakingRatingOptions = {
    rating: number;
    ratingMin: number;
    ratingMax: number;
    mutualMatch?: boolean;
};
declare type MatchmakingTicketOptions = {
    readonly minPlayerCountToStartMatch: number;
    readonly backfill?: boolean;
    readonly ticketPool?: string;
    readonly matchmakingRatingOptions?: MatchmakingRatingOptions;
};
declare type MatchmakingTicketMatchInfo = {
    readonly matchID: string;
    readonly ticketID: string;
    readonly teamName?: string;
    readonly ticketPool?: string;
};
/**
 * An list of players attempting to enter a world using the {@link Matchmaking | matchmaking system}.
 */
export declare class MatchmakingTicket {
    /**
     * The ID of the matchmaking ticket.
     */
    readonly ticketID: string;
    /**
     * The ID of the world the players are queueing for.
     */
    readonly worldID: string;
    /**
     * The players in the queue.
     */
    readonly players: Array<Player>;
    /**
     * The time the ticket was created.
     */
    readonly createdTime: number;
    /**
     * The ticket options, such as the minimum number of players
     * required to start a match.
     */
    readonly options: MatchmakingTicketOptions;
    /**
     * Cancels the matchmaking ticket, which deletes the ticket and removes all
     * players on the ticket from the queue.
     *
     * @returns A promise that indicates whether the cancellation succeeds. If the
     * player is queued with another matchmaking ticket, this method fails.
     */
    cancelTicket(): Promise<boolean>;
    /**
     * Forces the matchmaking ticket to complete without waiting for an optimal match for
     * the specified players. This method might lower the matching quality and should only
     * be called when players can no loner wait for an optimal match.
     */
    forceMatchTicket(): Promise<void>;
}
/**
 * Represents an AudioGizmo entity that plays only creator-uploaded raw audio files (such as .wav, .opus).
 */
export declare class RawAudioGizmo extends AudioGizmo {
    /**
     * Sets the audio asset. Only works on AudioGraph Gizmos.
     *
     * @param asset - The audio asset to set.
     * @param players - The list of players to set the audio asset for.
     * If not specified, the asset is set on the gizmo for all players.
     */
    setCustomAudioAsset(asset: Asset, players?: Array<Player>): Promise<void>;
}
/**
 * Quick Experiment values for the world
 */
export declare class HorizonQuickExperiment {
    /**
     * Get experiment value for current player
     * @param key - the name of the experiment
     * @returns - value of the param if it exists, if no value - returns undefined
     */
    static getValueForCurrentPlayer(key: string): Promise<boolean | number | string | undefined>;
}
/**
 * HorizonPanelType enum
 */
export declare enum HorizonPanelType {
    /**
     * A panel type that recommends other worlds and events.
     */
    RecommendedPanel = 1
}
/**
 * Options for the HorizonPanel API
 */
export declare type HorizonPanelOptions = {
    /**
     * The type of panel it shows
     */
    name: HorizonPanelType;
    /**
     * The position where the panel shows on.
     */
    position: Vec3;
    /**
     * The rotation of the panel.
     */
    rotation: Quaternion;
};
/**
 * A unique token that represents a panel instance.
 */
export declare type HorizonPanelToken = number;
/**
 * API to trigger horizon panel for user
 */
export declare class HorizonPanel {
    /**
     * Show a panel to the player
     * @param player - The player to show the panel to.
     * @param options - HorizonPanelOptions that are used to configure the panel
     * @returns - A unique panel token that can be used to hide the panel
     */
    static showPanelToPlayer(player: Player, options: HorizonPanelOptions): HorizonPanelToken;
    /**
     * Hide the panel being presented
     * @param panelToken - The ID of the panel to hide
     */
    static hidePanel(panelToken: HorizonPanelToken): void;
}
/**
 * Loading screen pause API
 */
export declare class LoadingScreenPause {
    /**
     *
     * @remarks
     * Retrieve the maximum amount of time loading screen will be paused when HasLoadingScreenPause SVR tag is set.
     * Value is in milliseconds.
     * @example
     * start() {
     *    var maxPauseTime = LoadingScreenPause.getLoadingScreenMaxPauseTime();
     * }
     */
    static getLoadingScreenMaxPauseTime(): number;
    /**
     *
     * @remarks
     * Returns true if the loading screen is still up
     * @example
     * start() {
     *    var stillOnLoadingScreen = LoadingScreenPause.isLoadingScreenStillUp();
     * }
     */
    static isLoadingScreenStillUp(): boolean;
    /**
     * Unpause the loading screen
     * @remarks
     * When the HasLoadingScreenPause SVR tag is set on the world, the loading screen will wait
     * until this function is called or until the max wait time returned by getLoadingScreenMaxPauseTime.
     * @param player - The player to end loading screen pause for. When called locally it will always apply to the calling player
     * @example
     *
     * //Server
     * start() {
     *   this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, (enteredby:hz.Player)=>{
     *     LoadingScreenPause.endLoadingScreenPause(enteredBy);
     *   });
     * }
     *
     * //Local
     * start() {
     *   this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, (enteredby:hz.Player)=>{
     *     this.entity.owner.set(enteredby);
     *   });
     * }
     * receiveOwnership( state: null, fromPlayer: hz.Player, toPlayer: hz.Player): void {
     *   LoadingScreenPause.endLoadingScreenPause(toPlayer);
     * };
     */
    static endLoadingScreenPause(player: Player): void;
}
export declare const CustomUICodeBlockEvents: {
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.CodeBlockEvents.OnPlayerFocusUI | core.CodeBlockEvents.OnPlayerFocusUI }
     * method instead.
     *
     * The event that is triggered when a player focuses on a Custom UI entity. Broadcasted from the client of the current player.
     * @param player - The player that is focusing on the UI.
     * @param focusedOn - The CustomUI entity that the player is focusing on.
     * @example
     * This example shows how to use the CustomUICodeBlockEvents.OnPlayerFocusUI event to log when a player focuses on a Custom UI entity.
     * ```
     * import * as hz from 'horizon/core';
     * import * as hz2p from 'horizon/2p';
     *
     * class FocusInputListener extends hz.Component<typeof FocusInputListener> {
     *   static propsDefinition = {};
     *
     *   start() {
     *       this.connectCodeBlockEvent(this.entity, hz2p.CustomUICodeBlockEvents.OnPlayerFocusUI, (player: hz.Player, focusedOn: hz.Entity) => console.log(`${player.name.get()} focused on ${focusedOn.name.get()}`));
     *   }
     * }
     * hz.Component.register(FocusInputListener);
     * ```
     */
    OnPlayerFocusUI: CodeBlockEvent<[player: Player, focusedOn: Entity]>;
    /**
     * Deprecated.
     *
     * @deprecated Use the {@link core.CodeBlockEvents.OnPlayerUnfocusUI | core.CodeBlockEvents.OnPlayerUnfocusUI }
     * method instead.
     *
     * The event that is triggered when a player unfocuses from a Custom UI entity. Broadcasted from the client of the current player.
     * @param player - The player that is unfocusing from the UI.
     * @param unfocusedFrom - The CustomUI entity that the player is unfocusing from.
     * @example
     * This example shows how to use the CustomUICodeBlockEvents.OnPlayerUnfocusUI event to log when a player unfocuses from a Custom UI entity.
     * ```
     * import * as hz from 'horizon/core';
     * import * as hz2p from 'horizon/2p';
     *
     * class UnfocusInputListener extends hz.Component<typeof UnfocusInputListener> {
     *   static propsDefinition = {};
     *
     *   start() {
     *       this.connectCodeBlockEvent(this.entity, hz2p.CustomUICodeBlockEvents.OnPlayerUnfocusUI, (player: hz.Player, unfocusedFrom: hz.Entity) => console.log(`${player.name.get()} unfocused from ${unfocusedFrom.name.get()}`));
     *   }
     * }
     * hz.Component.register(UnfocusInputListener);
     * ```
     */
    OnPlayerUnfocusUI: CodeBlockEvent<[player: Player, unfocusedFrom: Entity]>;
};
/**
 * Represents the embodiment IDs of an NPC clone.
 *
 * @param npcId - The unique identifier for the NPC.
 * @param npcSnapshotId - The unique identifier for the NPC's appearance snapshot.
 */
export declare type NpcCloneEmbodimentIds = {
    npcId: string;
    npcSnapshotId: string;
};
/**
 * Fast override service generates faster overrides however can cause performance
 * pressure. Only use this service if faster overrides are critical to your gameplay and
 * turn them off after your gameplay has finished applying all Avatar overrides.
 *
 * This is a singleton service - use AvatarFastOverrideService.getInstance() to access it.
 */
export declare class AvatarFastOverrideService {
    private static instance;
    private static timeoutEndTime;
    private static timeoutId;
    private constructor();
    /**
     * Gets the singleton instance of the AvatarFastOverrideService.
     */
    static getInstance(): AvatarFastOverrideService;
    /**
     * Starts the fast override service.
     * Optionally provide a timeout. Service turns itself off after timeout.
     * Subsequent calls with timeout will set the timeout to the new duration.
     */
    startFastOverrideService(timeoutMs?: number): Promise<boolean>;
    /**
     * Stops the fast override service and clears any pending timeout.
     */
    stopFastOverrideService(): Promise<boolean>;
    /**
     * Returns if the service is running
     */
    isFastOverrideServiceRunning(): Promise<boolean>;
    private setOrUpdateTimeout;
    private clearTimeout;
}

}