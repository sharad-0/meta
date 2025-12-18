declare module 'horizon/npc_2p' {
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */
import { Npc } from 'horizon/npc';
import { Player } from 'horizon/core';
export declare const ApiName = "npc_2p";
/**
 * Extensions to an NPC for 2P only, used to create a clone of a player's appearance.
 */
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
 * Extensions to an NPC for 2P only, used to create a clone of a player's appearance.
 */
export declare class NpcPlayerClone extends Npc {
    /**
     * Take an Embodiment ID and apply it to the NPC Gizmo.
     *
     * @param embodimentId - Use a {@link NpcCloneEmbodimentIds | NPC clone embodiment ID}.
     */
    setEmbodimentIds(embodimentIds: NpcCloneEmbodimentIds): Promise<boolean>;
    setNPCNameTag(name: string): Promise<boolean>;
    /**
     * Create an NPC and return their Id. That NPC's Appearance is a clone of target player with optional overrides.
     *
     * @param player - The player's whose base apperance we want to clone.
     * @param skuOverrides - Optional list of sku overrides to use when copying the player's appearance.
     * @returns A promise containing {@link NpcCloneEmbodimentIds | NPC clone embodiment ID}.
     */
    createPlayerCloneEmbodimentIdsWithOverrides(player: Player, skuOverrides?: Array<string>): Promise<NpcCloneEmbodimentIds>;
}

}