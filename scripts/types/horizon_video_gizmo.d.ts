declare module 'horizon/video_gizmo' {
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */
import { Entity, Player } from 'horizon/core';
export declare const ApiName = "VideoGizmo";
/**
 * Video Info data returned from the VideoGizmo APIs
 */
declare type VideoInfo = {
    projection: Projection;
    stereoFormat: StereoMode;
};
/**
 * Type of projection used for the video.
 */
export declare enum Projection {
    Rectilinear = 0,
    Equirectangular = 1
}
/**
 * Type of StereoMode used for the video.
 */
export declare enum StereoMode {
    Monoscopic = 0,
    LeftRight = 1,
    TopBottom = 2
}
/**
 * A Video Player gizmo, which provides the ability to play videos in the world.
 *
 * @remarks
 * The Video Gizmo APIs require a specific setup as noted in the usage guide: https://fburl.com/gdoc/3mc55zol
 * For this reason, it exists in its own module to gate it separately.
 */
export declare class VideoGizmo extends Entity {
    /**
     * Returns the ID of the VideoGizmo.
     * @returns The ID of the VideoGizmo.
     */
    toString(): string;
    /**
     * Gets the info (e.g. Stereo format, 360/180, etc.) for the VideoGizmo added to the world.
     * Note:
     *
     * @example
     * ```
     * type Props = {target: VideoGizmo};
     * class Play extends Component<Props> {
     *   static propsDefinition: PropsDefinition<Props> = {
     *     target: {type: PropTypes.Entity},
     *   };
     *   start() {
     *     this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, (isRightHand, player) => {
     *       const videoGizmo = this.props.target.as(VideoGizmo);
     *       const videoInfo = videoGizmo.getVideoInfo();
     *       if (videoInfo == undefined) {
     *         console.log('VideoInfo undefined ');
     *         return;
     *       }
     *       console.log('Video projection ' + videoInfo.projection);
     *       console.log('Video stereoFormat ' + videoInfo.stereoFormat);
     *     });
     *   }
     * }
     * ```
     *
     * @remarks Must be called in a local script attached to a locally owned object; throws an error if called on the server.
     */
    getVideoInfo(): VideoInfo | undefined;
    /**
     * Plays a video in the VideoGizmo.
     *
     * @example
     * ```
     * type Props = {target: VideoGizmo};
     * class Play extends Component<Props> {
     *   static propsDefinition: PropsDefinition<Props> = {
     *     target: {type: PropTypes.Entity},
     *   };
     *   start() {
     *     this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, (isRightHand, player) => {
     *       const videoGizmo = this.props.target.as(VideoGizmo);
     *       videoGizmo.play();
     *     })
     *   }
     * }
     * ```
     */
    play(): void;
    /**
     * Pauses the video in the VideoGizmo.
     *
     * @example
     * ```
     * type Props = {target: VideoGizmo};
     * class Pause extends Component<Props> {
     *   static propsDefinition: PropsDefinition<Props> = {
     *     target: {type: PropTypes.Entity},
     *   };
     *   start() {
     *     this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, (isRightHand, player) => {
     *       const videoGizmo = this.props.target.as(VideoGizmo);
     *       videoGizmo.pause();
     *     })
     *   }
     * }
     * ```
     */
    pause(): void;
    /**
     * Stops the video in the VideoGizmo.
     *
     * @example
     * ```
     * type Props = {target: VideoGizmo};
     * class Stop extends Component<Props> {
     *   static propsDefinition: PropsDefinition<Props> = {
     *     target: {type: PropTypes.Entity},
     *   };
     *   start() {
     *     this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, (isRightHand, player) => {
     *       const videoGizmo = this.props.target.as(VideoGizmo);
     *       videoGizmo.stop();
     *     })
     *   }
     * }
     * ```
     */
    stop(): void;
    /**
     * Sets volume for the video in the VideoGizmo.
     *
     * @example
     * ```
     * type Props = {target: VideoGizmo};
     * class Volume extends Component<Props> {
     *   static propsDefinition: PropsDefinition<Props> = {
     *     target: {type: PropTypes.Entity},
     *   };
     *   start() {
     *     this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, (isRightHand, player) => {
     *       const videoGizmo = this.props.target.as(VideoGizmo);
     *       videoGizmo.setVolume(4, 4, player);
     *     })
     *   }
     * }
     * ```
     * @param volume - The target volume to set for video playback.
     * @param timeInSeconds - The duration in seconds, for the volume to
     * transition to the target level. This helps provide a fade effect.
     * @param player - The player to set the volume for.
     */
    setVolume(volume: number, timeInSeconds: number, player: Player): void;
    /**
     * Gets the elapsed time of the video since the beginning in milliseconds.
     *
     * @remarks
     * This method only works when called from the local client. Calling this method from the server will return `undefined`.
     *
     * If the video is a live stream, the time since the stream's start is returned.
     *
     * If the video is paused, the time when it was paused is returned.
     *
     * @returns The elapsed time of the video since the beginning in milliseconds.
     *
     * @example
     * ```
     * type Props = {target: VideoGizmo};
     * class CurrentTime extends Component<Props> {
     *   static propsDefinition: PropsDefinition<Props> = {
     *     target: {type: PropTypes.Entity},
     *   };
     *   start() {
     *     if (this.world.getServerPlayer() === this.world.getLocalPlayer()) {
     *       return;
     *     }
     *     const videoGizmo = this.props.target.as(VideoGizmo);
     *     this.async.setInterval(() => {
     *       console.log(videoGizmo.getCurrentTime());
     *     }, 1_000);
     *   }
     * }
     * ```
     */
    getCurrentTime(): number | undefined;
}
export {};

}