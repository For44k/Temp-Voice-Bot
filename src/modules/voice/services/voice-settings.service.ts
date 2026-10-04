import { VoiceChannel, GuildMember } from "discord.js";
import { VoiceAuthService } from "./voice-auth.service";
import { FastLogger } from "../../../core/logger/logger";
import { Usages } from "../../../shared/embeds/usages";

export type RenameVoiceResult =
  | { status: "renamed"; name: string }
  | { status: "not_in_voice" }
  | { status: "not_manager" }
  | { status: "empty_name" }
  | { status: "invalid_name" }
  | { status: "same_name"; name: string }
  | { status: "cooldown"; retryAfterSeconds: number }
  | { status: "failed"; error?: string };

export type LimitVoiceResult =
  | { status: "updated"; limit: number }
  | { status: "not_in_voice" }
  | { status: "not_manager" }
  | { status: "invalid_limit" }
  | { status: "same_limit"; limit: number }
  | { status: "failed"; error?: string };

export type BitrateVoiceResult =
  | { status: "updated"; bitrateKbps: number }
  | { status: "not_in_voice" }
  | { status: "not_manager" }
  | { status: "invalid_bitrate"; maxAllowedKbps: number }
  | { status: "same_bitrate"; bitrateKbps: number }
  | { status: "failed"; error?: string };

export type RegionVoiceResult =
  | { status: "updated"; region: string | null }
  | { status: "not_in_voice" }
  | { status: "not_manager" }
  | { status: "invalid_region" }
  | { status: "same_region"; region: string | null }
  | { status: "failed"; error?: string };

export type StatusVoiceResult =
  | { status: "updated"; textStatus: string }
  | { status: "cleared" }
  | { status: "not_in_voice" }
  | { status: "not_manager" }
  | { status: "invalid_status" }
  | { status: "same_status"; textStatus: string }
  | { status: "failed"; error?: string };

export class VoiceSettingsService {
  private static renameCooldowns: Map<string, { count: number; resetAt: number }> = new Map();

  public static canRename(channelId: string): { allowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    const entry = this.renameCooldowns.get(channelId);

    if (!entry || now > entry.resetAt) {
      this.renameCooldowns.set(channelId, { count: 1, resetAt: now + 600000 });
      return { allowed: true };
    }

    if (entry.count < 2) {
      entry.count++;
      return { allowed: true };
    }

    const waitSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  public static rollbackRename(channelId: string): void {
    const entry = this.renameCooldowns.get(channelId);
    if (!entry) return;
    if (entry.count > 1) {
      entry.count--;
    } else {
      this.renameCooldowns.delete(channelId);
    }
  }

  public static clearCooldown(channelId: string): void {
    this.renameCooldowns.delete(channelId);
  }

  public static async renameChannel(
    channel: VoiceChannel | null,
    member: GuildMember,
    rawName: string
  ): Promise<RenameVoiceResult> {
    if (!channel) {
      return { status: "not_in_voice" };
    }

    if (!VoiceAuthService.isManager(channel.id, member.id)) {
      return { status: "not_manager" };
    }

    const trimmed = rawName.trim();
    if (!trimmed) {
      return { status: "empty_name" };
    }

    const sanitized = Usages.sanitize(trimmed).slice(0, 100);
    if (!Usages.isValidChannelName(sanitized)) {
      return { status: "invalid_name" };
    }

    if (channel.name === sanitized) {
      return { status: "same_name", name: sanitized };
    }

    const rateCheck = this.canRename(channel.id);
    if (!rateCheck.allowed) {
      return { status: "cooldown", retryAfterSeconds: rateCheck.waitSeconds || 0 };
    }

    try {
      await channel.setName(sanitized);
      return { status: "renamed", name: sanitized };
    } catch (err: unknown) {
      this.rollbackRename(channel.id);
      FastLogger.error("Failed to update channel name on Discord", {
        channelId: channel.id,
        guildId: channel.guildId,
        actorId: member.id,
        targetName: sanitized,
        err
      });
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  }

  public static async setLimit(
    channel: VoiceChannel | null,
    member: GuildMember,
    rawLimit: string | number
  ): Promise<LimitVoiceResult> {
    if (!channel) {
      return { status: "not_in_voice" };
    }

    if (!VoiceAuthService.isManager(channel.id, member.id)) {
      return { status: "not_manager" };
    }

    const parsed = typeof rawLimit === "number" ? rawLimit : parseInt(String(rawLimit).trim(), 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 99) {
      return { status: "invalid_limit" };
    }

    if (channel.userLimit === parsed) {
      return { status: "same_limit", limit: parsed };
    }

    try {
      await channel.setUserLimit(parsed);
      return { status: "updated", limit: parsed };
    } catch (err: unknown) {
      FastLogger.error("Failed to set user limit on Discord", {
        channelId: channel.id,
        guildId: channel.guildId,
        actorId: member.id,
        limit: parsed,
        err
      });
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  }

  public static async setBitrate(
    channel: VoiceChannel | null,
    member: GuildMember,
    rawBitrate: string | number
  ): Promise<BitrateVoiceResult> {
    if (!channel) {
      return { status: "not_in_voice" };
    }

    if (!VoiceAuthService.isManager(channel.id, member.id)) {
      return { status: "not_manager" };
    }

    let maxAllowedKbps = 96;
    const tier = channel.guild.premiumTier;
    if (tier === 1) maxAllowedKbps = 128;
    else if (tier === 2) maxAllowedKbps = 256;
    else if (tier === 3) maxAllowedKbps = 384;

    const parsed = typeof rawBitrate === "number" ? rawBitrate : parseInt(String(rawBitrate).trim(), 10);
    if (isNaN(parsed) || parsed < 8 || parsed > maxAllowedKbps) {
      return { status: "invalid_bitrate", maxAllowedKbps };
    }

    const currentKbps = Math.round(channel.bitrate / 1000);
    if (currentKbps === parsed) {
      return { status: "same_bitrate", bitrateKbps: parsed };
    }

    try {
      await channel.setBitrate(parsed * 1000);
      return { status: "updated", bitrateKbps: parsed };
    } catch (err: unknown) {
      FastLogger.error("Failed to set bitrate on Discord", {
        channelId: channel.id,
        guildId: channel.guildId,
        actorId: member.id,
        bitrateKbps: parsed,
        err
      });
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  }

  public static async setRegion(
    channel: VoiceChannel | null,
    member: GuildMember,
    rawRegion: string
  ): Promise<RegionVoiceResult> {
    if (!channel) {
      return { status: "not_in_voice" };
    }

    if (!VoiceAuthService.isManager(channel.id, member.id)) {
      return { status: "not_manager" };
    }

    const validRegions: Record<string, string | null> = {
      automatic: null,
      auto: null,
      brazil: "brazil",
      rotterdam: "rotterdam",
      hongkong: "hongkong",
      india: "india",
      japan: "japan",
      russia: "russia",
      singapore: "singapore",
      southafrica: "southafrica",
      sydney: "sydney",
      "us-central": "us-central",
      "us-east": "us-east",
      "us-south": "us-south",
      "us-west": "us-west"
    };

    const clean = rawRegion.toLowerCase().trim();
    if (!(clean in validRegions)) {
      return { status: "invalid_region" };
    }

    const targetRegion = validRegions[clean];
    if (channel.rtcRegion === targetRegion) {
      return { status: "same_region", region: targetRegion };
    }

    try {
      await channel.setRTCRegion(targetRegion);
      return { status: "updated", region: targetRegion };
    } catch (err: unknown) {
      FastLogger.error("Failed to set RTC region on Discord", {
        channelId: channel.id,
        guildId: channel.guildId,
        actorId: member.id,
        region: targetRegion,
        err
      });
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  }

  public static async setStatus(
    channel: VoiceChannel | null,
    member: GuildMember,
    rawStatus: string
  ): Promise<StatusVoiceResult> {
    if (!channel) {
      return { status: "not_in_voice" };
    }

    if (!VoiceAuthService.isManager(channel.id, member.id)) {
      return { status: "not_manager" };
    }

    const trimmed = rawStatus.trim();
    if (trimmed.length > 500) {
      return { status: "invalid_status" };
    }

    try {
      await channel.client.rest.put(`/channels/${channel.id}/voice-status`, {
        body: { status: trimmed }
      });

      if (!trimmed) {
        return { status: "cleared" };
      }
      return { status: "updated", textStatus: trimmed };
    } catch (err: unknown) {
      FastLogger.error("Failed to set voice channel status on Discord", {
        channelId: channel.id,
        guildId: channel.guildId,
        actorId: member.id,
        status: trimmed,
        err
      });
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  }
}
