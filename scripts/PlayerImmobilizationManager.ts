/*
 * PARTY BOMB PLAYER MANAGER - DANCE-FRIENDLY VERSION
 * 
 * This script handles player movement restrictions while preserving emote functionality.
 * Instead of completely blocking movement (which also blocks emotes), it uses minimal
 * values to restrict locomotion while keeping emote buttons accessible.
 * 
 * KEY CHANGE: Uses minimal movement values (0.1, 0.1, 0.5) instead of zeros
 * to preserve emote/gesture functionality while preventing actual locomotion.
 * 
 * Setup Requirements:
 * - EXECUTION MODE: "Local" (required for player property access)
 * - Place on a TRIGGER entity (invisible cube with large trigger zone)
 * - Set entity as TRIGGER with large radius (10m+)
 * - Assign partyBombEntity property to the Party Bomb entity
 * - Assign customUIEntity property to UI Gizmo with PartyBombUI script
 * 
 * Author: AI Assistant
 * Version: 5.0 - Dance-Friendly Party Bomb System (Emotes Preserved)
 */

import * as hz from 'horizon/core';

// Party Bomb Player Management System
// Production-ready implementation with custom UI integration

class PlayerImmobilizationManager extends hz.Component<typeof PlayerImmobilizationManager> {
  static propsDefinition = {
    partyBombEntity: { type: hz.PropTypes.Entity, displayName: 'Party Bomb Entity' },
    customUIEntity: { type: hz.PropTypes.Entity, displayName: 'Custom UI Entity (UIGizmo with PartyBombUI)' },
    debugMode: { type: hz.PropTypes.Boolean, default: false, displayName: 'Debug Logging' },
    triggerDuration: { type: hz.PropTypes.Number, default: 10.0, displayName: 'Trigger Active Duration (s)', min: 1, max: 30 }
  };

  private _activePlayerTimers: Map<number, number> = new Map();
  private _partyBomb?: hz.Entity;
  private _serverPlayer?: hz.Player;
  private _lastBombPosition?: hz.Vec3;
  private _checkTimer?: number;
  private _triggerActive: boolean = false;
  private _triggerDeactivationTimer?: number;
  private _originalPlayerSpeeds: Map<number, {loco: number, sprint: number, jump: number}> = new Map();

  preStart() {
    // console.log.*$
    
    this._serverPlayer = this.world.getServerPlayer();
    this._partyBomb = this.props.partyBombEntity;
    
    if (!this._partyBomb) {
      // console.log.*$
      return;
    }
    
    // Listen for players entering THIS trigger entity (for immobilization)
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterTrigger,
      this.onPlayerEnterImmobilizationTrigger.bind(this)
    );
    
    // Listen for players exiting THIS trigger entity (for cleanup)
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitTrigger,
      this.onPlayerExitImmobilizationTrigger.bind(this)
    );
    
    // console.log.*$
  }

  start() {
    // console.log.*$
    
    // CRITICAL: Disable trigger entity completely at start
    this.disableTriggerEntity();
    
    // EXTRA SAFETY: Restore all players to normal movement at start
    this.restoreAllPlayersToNormalMovement();
    
    // Start periodic checking for bomb position changes (indicates explosion)
    this.startPeriodicCheck();
  }
  
  private restoreAllPlayersToNormalMovement() {
    try {
      const players = this.world.getPlayers();
      for (const player of players) {
        try {
          // Force restore to official defaults
          player.locomotionSpeed.set(4.5);
          player.sprintMultiplier.set(1.4);
          player.jumpSpeed.set(4.3);
        } catch (e) {
          // console.log.*$
        }
      }
    } catch (e) {
      // console.log.*$
    }
  }
  
  private disableTriggerEntity() {
    try {
      // Move trigger far away AND make it very small
      this.entity.position.set(new hz.Vec3(0, -1000, 0)); // Underground
      this.entity.scale.set(new hz.Vec3(0.01, 0.01, 0.01)); // Tiny scale
      this.entity.visible.set(false); // Invisible
    } catch (e) {
      // console.log.*$
    }
  }
  
  private enableTriggerEntity(position: hz.Vec3) {
    try {
      // Move trigger to position and restore normal scale
      this.entity.position.set(position);
      this.entity.scale.set(new hz.Vec3(10, 10, 10)); // Large trigger zone
      this.entity.visible.set(false); // Keep invisible but active
    } catch (e) {
      // console.log.*$
    }
  }
  
  private startPeriodicCheck() {
    if (!this._partyBomb) return;
    
    const checkInterval = () => {
      if (!this._partyBomb) return;
      
      try {
        const currentPos = this._partyBomb.position.get();
        
        // Check if bomb position changed significantly (indicates explosion/respawn)
        if (this._lastBombPosition) {
          const distance = currentPos.distance(this._lastBombPosition);
          
          if (distance > 1.0) { // Significant position change
            this.checkForExplosionTargets();
          }
        }
        
        this._lastBombPosition = currentPos;
        
        // Schedule next check - MUCH FASTER for immediate response
        this._checkTimer = this.async.setTimeout(checkInterval, 50); // Check every 50ms for instant response
        
      } catch (e) {
        // console.log.*$
      }
    };
    
    // Start the checking loop - NO INITIAL DELAY for instant response
    this._checkTimer = this.async.setTimeout(checkInterval, 50); // Start immediately
  }

  private onPlayerEnterImmobilizationTrigger(player: hz.Player) {
    // console.log.*$
    
    // Only process if trigger is active (after explosion)
    if (!this._triggerActive) {
      if (this.props.debugMode) {
        // console.log.*$
      }
      return;
    }
    
    // Check if this player should be immobilized (near exploded bomb)
    if (this.shouldImmobilizePlayer(player)) {
      // console.log.*$
      this.immobilizePlayerViaTrigger(player, 10.0);
    } else {
      // console.log.*$
    }
  }
  
  private onPlayerExitImmobilizationTrigger(player: hz.Player) {
    // console.log.*$
    // Note: Don't restore movement here - let timer handle it
  }

  private shouldImmobilizePlayer(player: hz.Player): boolean {
    if (!this._partyBomb) return false;
    
    const bombPos = this._partyBomb.position.get();
    const playerPos = player.position.get();
    const distance = playerPos.distance(bombPos);
    const radius = 6.0; // Explosion radius
    
    const inRange = distance <= radius;
    
    if (this.props.debugMode) {
      // console.log.*$
    }
    
    return inRange;
  }
  
  private immobilizePlayerViaTrigger(player: hz.Player, duration: number) {
    try {
      // console.log.*$
      
      // FIRST: Store original speeds before modifying
      try {
        const originalLoco = player.locomotionSpeed.get();
        const originalSprint = player.sprintMultiplier.get();
        const originalJump = player.jumpSpeed.get();
        
        this._originalPlayerSpeeds.set(player.id, {
          loco: originalLoco,
          sprint: originalSprint,
          jump: originalJump
        });
        
        // console.log.*$
      } catch (e) {
        // If we can't read speeds, use Meta Horizon Worlds official defaults
        this._originalPlayerSpeeds.set(player.id, {
          loco: 4.5,   // Official default locomotionSpeed
          sprint: 1.4, // Official default sprintMultiplier  
          jump: 4.3    // Official default jumpSpeed
        });
        // console.log.*$
      }
      
      // DANCE-FRIENDLY IMMOBILIZATION: Heavily reduce movement but don't completely block everything
      // This allows emotes/gestures to still work while preventing actual locomotion
      player.locomotionSpeed.set(0.1);     // Minimal movement (not 0 to preserve emote functionality)
      player.sprintMultiplier.set(0.1);    // Minimal sprint (not 0 to preserve interactions)
      player.jumpSpeed.set(0.5);           // Very limited jumping (not 0 to preserve some vertical movement for emotes)
      
      // console.log.*$
      
      // Start screen shake effect
      // Enhanced player effects handled by startEnhancedPlayerEffects
      
      // Set up restoration timer
      this.clearTimerFor(player.id);
      const timer = this.async.setTimeout(() => {
        this.restorePlayerMovement(player);
      }, duration * 1000);
      
      this._activePlayerTimers.set(player.id, timer);
      
    } catch (e) {
      // console.log.*$
    }
  }
  
  private immobilizePlayersInBlastRadiusImmediately(explosionPosition: hz.Vec3) {
    try {
      // console.log.*$
      
      const players = this.world.getPlayers();
      const radius = 6.0; // Same as bomb blast radius
      let affectedCount = 0;
      
      for (const player of players) {
        try {
          const playerPos = player.position.get();
          const distance = playerPos.distance(explosionPosition);
          
          if (distance <= radius) {
            // console.log.*$
            
            // Store original speeds IMMEDIATELY
            try {
              const originalLoco = player.locomotionSpeed.get();
              const originalSprint = player.sprintMultiplier.get();
              const originalJump = player.jumpSpeed.get();
              
              this._originalPlayerSpeeds.set(player.id, {
                loco: originalLoco,
                sprint: originalSprint,
                jump: originalJump
              });
              
              // console.log.*$
            } catch (e) {
              // Use defaults if can't read
              this._originalPlayerSpeeds.set(player.id, {
                loco: 4.5, sprint: 1.4, jump: 4.3
              });
            }
            
            // DANCE-FRIENDLY IMMOBILIZATION: Minimal movement to preserve emote functionality
            player.locomotionSpeed.set(0.1);     // Minimal movement (not 0 to preserve emote functionality)
            player.sprintMultiplier.set(0.1);    // Minimal sprint (not 0 to preserve interactions)  
            player.jumpSpeed.set(0.5);           // Very limited jumping (not 0 to preserve some vertical movement for emotes)
            
            // Start enhanced player effects
            // console.log.*$
            this.startEnhancedPlayerEffects(player, 10.0);
            
            // Set restoration timer
            this.clearTimerFor(player.id);
            const timer = this.async.setTimeout(() => {
              this.restorePlayerMovement(player);
            }, 10000); // 10 seconds
            
            this._activePlayerTimers.set(player.id, timer);
            affectedCount++;
            
            // console.log.*$
          }
        } catch (e) {
          // console.log.*$
        }
      }
      
      // console.log.*$
    } catch (e) {
      // console.log.*$
    }
  }

  private checkForExplosionTargets() {
    // This method now detects explosions and activates the trigger
    if (!this._partyBomb) return;
    
    try {
      const bombPos = this._partyBomb.position.get();
      
      // Check if bomb moved significantly (indicates explosion/respawn)
      if (this._lastBombPosition) {
        const distance = this._lastBombPosition.distance(bombPos);
        
        // More refined explosion detection
        if (distance > 3.0) { 
        // Check if this is an explosion (sudden position change) vs pickup (gradual movement)
        const bombVisible = this._partyBomb.visible.get();
          
          if (bombVisible) {
            // Bomb is visible and moved significantly = likely explosion
            // console.log.*$
            
            // IMMEDIATE IMMOBILIZATION: Don't wait for trigger approach
            this.immobilizePlayersInBlastRadiusImmediately(this._lastBombPosition);
            
            // Also activate trigger zone as backup
            this.activateTriggerZone(this._lastBombPosition); // Use PREVIOUS position (explosion site)
          } else {
            // Bomb not visible = likely respawning/resetting
            // console.log.*$
            
            // CRITICAL: Deactivate trigger when bomb respawns
            if (this._triggerActive) {
              // console.log.*$
              this.deactivateTriggerZone();
            }
          }
        }
      }
      
      // Update last position for next check
      this._lastBombPosition = bombPos;
      
      if (this.props.debugMode) {
        // console.log.*$
      }
    } catch (e) {
      // console.log.*$
    }
  }
  
  private activateTriggerZone(explosionPosition: hz.Vec3) {
    // console.log.*$
    
    // Enable trigger entity at explosion location
    this.enableTriggerEntity(explosionPosition);
    
    // Activate the trigger logic
    this._triggerActive = true;
    // console.log.*$
    
    // Clear any existing deactivation timer
    if (this._triggerDeactivationTimer) {
      this.async.clearTimeout(this._triggerDeactivationTimer);
    }
    
    // Set timer to deactivate trigger
    this._triggerDeactivationTimer = this.async.setTimeout(() => {
      this.deactivateTriggerZone();
    }, this.props.triggerDuration * 1000);
  }
  
  private deactivateTriggerZone() {
    // console.log.*$
    this._triggerActive = false;
    
    // Completely disable trigger entity
    this.disableTriggerEntity();
    
    // console.log.*$
  }

  // Legacy method for compatibility
  private onImmobilizePlayerEvent(data: { playerId: number; duration: number; state: 'start' | 'end' | 'cancel' }) {
    if (this.props.debugMode) {
      // console.log.*$
    }

    const players = this.world.getPlayers();
    const targetPlayer = players.find(p => p.id === data.playerId);

    if (!targetPlayer) {
      // console.log.*$
      return;
    }

    if (data.state === 'start') {
      this.immobilizePlayer(targetPlayer, data.duration);
    } else if (data.state === 'end' || data.state === 'cancel') {
      this.restorePlayerMovement(targetPlayer);
    }
  }

  private immobilizePlayer(player: hz.Player, duration: number) {
    const isMobile = player.deviceType.get() === hz.PlayerDeviceType.Mobile;
    
    // console.log.*$

    // Clear any existing timer for this player
    this.clearTimerFor(player.id);

    try {
      // Store original speeds for debugging
      const originalLoco = player.locomotionSpeed.get();
      const originalSprint = player.sprintMultiplier.get();
      const originalJump = player.jumpSpeed.get();

      if (this.props.debugMode) {
        // console.log.*$
      }

      // Apply DANCE-FRIENDLY IMMOBILIZATION: Preserve emote functionality
      player.locomotionSpeed.set(0.1);     // Minimal movement (not 0 to preserve emote functionality)
      player.sprintMultiplier.set(0.1);    // Minimal sprint (not 0 to preserve interactions)
      player.jumpSpeed.set(0.5);           // Very limited jumping (not 0 to preserve some vertical movement for emotes)

      // Verify immobilization
      const newLoco = player.locomotionSpeed.get();
      const newSprint = player.sprintMultiplier.get();
      const newJump = player.jumpSpeed.get();

      if (this.props.debugMode) {
        // console.log.*$
      }

      if (newLoco <= 0.1 && newSprint <= 0.1 && newJump <= 0.5) {
        // console.log.*$
      } else {
        // console.log.*$
        
        // Retry immobilization with dance-friendly values
        for (let i = 0; i < 3; i++) {
          player.locomotionSpeed.set(0.1);
          player.sprintMultiplier.set(0.1);
          player.jumpSpeed.set(0.5);
        }
      }

      // Start continuous enforcement
      this.startContinuousEnforcement(player, duration);

      // Start screen shake effect
      // Enhanced player effects handled by startEnhancedPlayerEffects

      // Set cleanup timer
      const ms = duration * 1000;
      const timer = this.async.setTimeout(() => {
        // console.log.*$
        this.restorePlayerMovement(player);
      }, ms);
      
      this._activePlayerTimers.set(player.id, timer);

    } catch (e) {
      // console.log.*$
    }
  }

  private startContinuousEnforcement(player: hz.Player, duration: number) {
    const startTime = Date.now();
    const durationMs = duration * 1000;

    const enforce = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed >= durationMs) {
        if (this.props.debugMode) {
          // console.log.*$
        }
        return;
      }

      try {
        // Apply dance-friendly restrictions consistently
        player.locomotionSpeed.set(0.1);
        player.sprintMultiplier.set(0.1);
        player.jumpSpeed.set(0.5);
        
        // Schedule next enforcement
        this.async.setTimeout(enforce, 500); // Every 0.5 seconds
      } catch (e) {
        if (this.props.debugMode) {
          // console.log.*$
        }
      }
    };

    // Start enforcement loop
    if (this.props.debugMode) {
      // console.log.*$
    }
    enforce();
  }

  private restorePlayerMovement(player: hz.Player) {
    // console.log.*$

    this.clearTimerFor(player.id);
    // Enhanced player effects end automatically via timer

    try {
      // Get stored original speeds or use Meta Horizon Worlds official defaults
      const originalSpeeds = this._originalPlayerSpeeds.get(player.id) || {
        loco: 4.5,   // Official default locomotionSpeed
        sprint: 1.4, // Official default sprintMultiplier
        jump: 4.3    // Official default jumpSpeed
      };
      
      // console.log.*$
      
      // Restore to original values
      player.locomotionSpeed.set(originalSpeeds.loco);
      player.sprintMultiplier.set(originalSpeeds.sprint);
      player.jumpSpeed.set(originalSpeeds.jump);

      // console.log.*$
      
      // Clean up stored speeds
      this._originalPlayerSpeeds.delete(player.id);

    } catch (e) {
      // console.log.*$
      // console.log.*$
      
      // Keep the stored speeds in case we can restore later
      // console.log.*$
    }
  }

  private clearTimerFor(playerId: number) {
    const timer = this._activePlayerTimers.get(playerId);
    if (timer) {
      this.async.clearTimeout(timer);
      this._activePlayerTimers.delete(playerId);
    }
  }

  // Public method for manual cleanup (if needed)
  public clearAllEffects() {
    // console.log.*$
    
    const players = this.world.getPlayers();
    for (const player of players) {
      this.restorePlayerMovement(player);
    }
  }

  // Beautiful Custom UI System - NO MORE POPUP CHAOS!
  private startEnhancedPlayerEffects(player: hz.Player, duration: number) {
    // console.log.*$
    
    // Try beautiful custom UI first
    if (this.tryBeautifulCustomUI(player, duration)) {
      // console.log.*$
      // Add haptics to complement the beautiful UI
      this.applyHapticsOnly(player, duration);
    } else {
      // console.log.*$
      // MINIMAL fallback - ONLY haptics, NO POPUPS to avoid chaos
      this.applyMinimalFallbackEffects(player, duration);
    }
  }
  
  private tryBeautifulCustomUI(player: hz.Player, duration: number): boolean {
    if (!this.props.customUIEntity) {
      // console.log.*$
      return false;
    }
    
    try {
      // console.log.*$
      
      // Get the PartyBombUI component
      const components = this.props.customUIEntity.getComponents();
      for (const comp of components) {
        // Try new PartyBombUI method first
        if (comp && (comp as any).startPartyBombEffect) {
          // console.log.*$
          (comp as any).startPartyBombEffect(player, duration);
          return true;
        }
        // Fallback to old methods for backward compatibility
        else if (comp && (comp as any).startBoogieBombEffect) {
          (comp as any).startBoogieBombEffect(player, duration);
          return true;
        }
        else if (comp && (comp as any).startBoogieBombUI) {
          (comp as any).startBoogieBombUI(player, duration);
          return true;
        }
      }
      
      // console.log.*$
      return false;
      
    } catch (e) {
      // console.log.*$
      return false;
    }
  }
  
  private applyHapticsOnly(player: hz.Player, duration: number) {
    // console.log.*$
    
    try {
      const isMobile = player.deviceType.get() === hz.PlayerDeviceType.Mobile;
      
      // Immediate impact haptic
      player.rightHand.playHaptics(400, hz.HapticStrength.Strong, hz.HapticSharpness.Sharp);
      player.leftHand.playHaptics(400, hz.HapticStrength.Strong, hz.HapticSharpness.Sharp);
      
      // Start rhythmic haptics (simplified version)
      this.startSimpleRhythmicHaptics(player, duration, isMobile);
      
      // console.log.*$
      
    } catch (e) {
      // console.log.*$
    }
  }
  
  private startSimpleRhythmicHaptics(player: hz.Player, duration: number, isMobile: boolean) {
    const hapticInterval = isMobile ? 800 : 600; // Slightly slower for custom UI
    const hapticCount = Math.floor(duration * 1000 / hapticInterval);
    
    for (let i = 0; i < hapticCount; i++) {
      this.async.setTimeout(() => {
        try {
          const isStrong = (i % 4 === 0); // Every 4th is strong
          const strength = isStrong ? hz.HapticStrength.Strong : hz.HapticStrength.Medium;
          const sharpness = isStrong ? hz.HapticSharpness.Sharp : hz.HapticSharpness.Soft;
          const duration_ms = isStrong ? 200 : 100;
          
          player.rightHand.playHaptics(duration_ms, strength, sharpness);
          player.leftHand.playHaptics(duration_ms, strength, sharpness);
        } catch (e) {
          // Ignore haptic errors
        }
      }, i * hapticInterval);
    }
  }
  
  private applyMinimalFallbackEffects(player: hz.Player, duration: number) {
    // console.log.*$
    
    try {
      const isMobile = player.deviceType.get() === hz.PlayerDeviceType.Mobile;
      // console.log.*$
      
      // ONLY HAPTICS - NO POPUPS TO AVOID CHAOS
      
      // 1. IMMEDIATE STRONG HAPTIC IMPACT
      player.rightHand.playHaptics(500, hz.HapticStrength.Strong, hz.HapticSharpness.Sharp);
      player.leftHand.playHaptics(500, hz.HapticStrength.Strong, hz.HapticSharpness.Sharp);
      // console.log.*$
      
      // 2. RHYTHMIC HAPTIC PATTERN - Simplified
      this.startSimpleRhythmicHaptics(player, duration, isMobile);
      
      // console.log.*$
      
    } catch (e) {
      // console.log.*$
      // console.log.*$
    }
  }
  
  // UI Management Methods - Per-Player Visibility System
  private hideUIForAllPlayers() {
    if (!this.props.customUIEntity) {
      // console.log.*$
      return;
    }
    
    try {
      // console.log.*$
      
      const components = this.props.customUIEntity.getComponents();
      for (const comp of components) {
        if (comp && (comp as any).hideForAllPlayers) {
          (comp as any).hideForAllPlayers();
          // console.log.*$
          return;
        }
      }
      
      // console.log.*$
      
    } catch (e) {
      // console.log.*$
    }
  }
  
  // ALL OLD POPUP METHODS REMOVED - REPLACED WITH PER-PLAYER UI SYSTEM!
  
  // Old screen shake methods removed - now using enhanced player effects
}

// No exports needed for ownership-based communication

hz.Component.register(PlayerImmobilizationManager);
