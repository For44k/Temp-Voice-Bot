import { VoiceChannel, GuildMember } from "discord.js";
import { VoiceMemoryStore } from "../cache/voice.store";
import { VoicePermissionsManager } from "./voice-permission.service";
import { FastLogger } from "../../../core/logger/logger";

export type ClaimVoiceResult =
  | { status: "claimed"; channelId: string }
  | { status: "not_in_voice" }
  | { status: "not_active_voice" }
  | { status: "already_owner" }
  | { status: "owner_still_present" }
  | { status: "failed"; error?: string };

export class VoiceClaimService {
  public static async claimChannel(
    channel: VoiceChannel | null,
    member: GuildMember
  ): Promise<ClaimVoiceResult> {
    if (!channel) {
      return { status: "not_in_voice" };
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (!session) {
      return { status: "not_active_voice" };
    }

    if (session.ownerId === member.id) {
      return { status: "already_owner" };
    }

    const ownerInChannel = channel.members.has(session.ownerId);
    if (ownerInChannel) {
      return { status: "owner_still_present" };
    }

    try {
      await VoicePermissionsManager.transferOwnership(channel, session.ownerId, member);
      return { status: "claimed", channelId: channel.id };
    } catch (err: unknown) {
      FastLogger.error("Failed to claim channel", {
        channelId: channel.id,
        guildId: channel.guildId,
        actorId: member.id,
        err
      });
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  }
}
