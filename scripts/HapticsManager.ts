import { Component, Player, HapticStrength, HapticSharpness, Handedness } from 'horizon/core';

export class HapticsManager extends Component<typeof HapticsManager> {
  static propsDefinition = {};

  start() {
    // This component provides haptic functions and doesn't need to perform actions on start.
  }

  /**
   * Plays a haptic effect on a player's controller(s).
   * @param player The player to send the haptic feedback to.
   * @param duration The duration of the haptic effect in seconds.
   * @param strength The intensity of the haptic effect.
   * @param sharpness The sharpness or feel of the haptic effect.
   * @param hand The hand to play the haptics on. Defaults to both hands.
   */
  public playHaptics(
    player: Player,
    duration: number,
    strength: HapticStrength,
    sharpness: HapticSharpness,
    hand?: Handedness
  ) {
    if (!player) {
      console.warn('HapticsManager: Player is not defined.');
      return;
    }

    const durationMs = duration * 1000;

    if (hand === Handedness.Left) {
      player.leftHand.playHaptics(durationMs, strength, sharpness);
    } else if (hand === Handedness.Right) {
      player.rightHand.playHaptics(durationMs, strength, sharpness);
    } else {
      // Play on both hands if no specific hand is provided
      player.leftHand.playHaptics(durationMs, strength, sharpness);
      player.rightHand.playHaptics(durationMs, strength, sharpness);
    }
  }

  /**
   * Plays a short, strong buzz effect on the player's controllers.
   * Useful for quick feedback like a button press or a minor impact.
   * @param player The player to send the haptic feedback to.
   * @param hand The hand to play the haptics on. Defaults to both hands.
   */
  public playShortBuzz(player: Player, hand?: Handedness) {
    this.playHaptics(player, 0.1, HapticStrength.VeryLight, HapticSharpness.Soft, hand);
  }

  /**
   * Plays a continuous, strong rumble effect.
   * Useful for ongoing actions like charging a weapon or receiving sustained damage.
   * @param player The player to send the haptic feedback to.
   * @param hand The hand to play the haptics on. Defaults to both hands.
   */
  public playStrongRumble(player: Player, hand?: Handedness) {
    this.playHaptics(player, 0.5, HapticStrength.Light, HapticSharpness.Soft, hand);
  }

  /**
   * Plays a light tap effect.
   * Useful for gentle UI feedback or minor interactions.
   * @param player The player to send the haptic feedback to.
   * @param hand The hand to play the haptics on. Defaults to both hands.
   */
  public playLightTap(player: Player, hand?: Handedness) {
    this.playHaptics(player, 0.05, HapticStrength.Light, HapticSharpness.Sharp, hand);
  }

  /**
   * Plays a double-tap haptic effect.
   * @param player The player to send the haptic feedback to.
   * @param hand The hand to play the haptics on. Defaults to both hands.
   */
  public playDoubleTap(player: Player, hand?: Handedness) {
    this.playHaptics(player, 0.1, HapticStrength.Medium, HapticSharpness.Sharp, hand);
    this.async.setTimeout(() => {
      this.playHaptics(player, 0.1, HapticStrength.Medium, HapticSharpness.Sharp, hand);
    }, 150);
  }
}

Component.register(HapticsManager);