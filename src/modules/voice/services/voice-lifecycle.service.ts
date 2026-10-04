import { VoiceChannel, GuildMember, Guild } from "discord.js";
import { VoiceMemoryStore } from "../cache/voice.store";
import { GuildMemoryStore } from "../cache/guild.store";
import { ActionLogger } from "../../../core/logger/action.logger";
import { FastLogger } from "../../../core/logger/logger";
import { VoiceCreationService } from "./voice-creation.service";
import { VoiceAuthService } from "./voice-auth.service";
import {
  VoiceSettingsService,
  RenameVoiceResult,
  LimitVoiceResult,
  BitrateVoiceResult,
  RegionVoiceResult,
  StatusVoiceResult
} from "./voice-settings.service";
import { VoiceClaimService, ClaimVoiceResult } from "./voice-claim.service";

export type {
  RenameVoiceResult,
  LimitVoiceResult,
  BitrateVoiceResult,
  RegionVoiceResult,
  StatusVoiceResult,
  ClaimVoiceResult
};

export class VoiceLifecycleService {
  private static tempTimers: Map<string, Set<NodeJS.Timeout>> = new Map();

  public static isCreating(userId: string): boolean {
    return VoiceCreationService.isCreating(userId);
  }

  public static acquireCreationLock(userId: string): boolean {
    return VoiceCreationService.acquireCreationLock(userId);
  }

  public static releaseCreationLock(userId: string): void {
    VoiceCreationService.releaseCreationLock(userId);
  }

  public static checkJoinRateLimit(userId: string): { isRateLimited: boolean; remainingSeconds: number } {
    return VoiceCreationService.checkJoinRateLimit(userId);
  }

  public static registerTempTimer(channelId: string, timer: NodeJS.Timeout): void {
    let set = this.tempTimers.get(channelId);
    if (!set) {
      set = new Set();
      this.tempTimers.set(channelId, set);
    }
    set.add(timer);
  }

  public static clearTempTimers(channelId: string): void {
    const set = this.tempTimers.get(channelId);
    if (set) {
      for (const timer of set) {
        clearTimeout(timer);
      }
      this.tempTimers.delete(channelId);
    }
  }

  public static async createRoom(member: GuildMember): Promise<string | null> {
    return VoiceCreationService.createRoom(member);
  }

  public static canRename(channelId: string): { allowed: boolean; waitSeconds?: number } {
    return VoiceSettingsService.canRename(channelId);
  }

  public static rollbackRename(channelId: string): void {
    VoiceSettingsService.rollbackRename(channelId);
  }

  public static async checkEmpty(channel: VoiceChannel): Promise<void> {
    if (channel.members.size === 0) {
      VoiceMemoryStore.remove(channel.id);
      VoiceSettingsService.clearCooldown(channel.id);
      this.clearTempTimers(channel.id);

      try {
        await channel.delete();
      } catch (err: unknown) {
        FastLogger.warn(`Failed to delete empty channel ${channel.id}: ${err instanceof Error ? err.message : String(err)}`);
      }

      queueMicrotask(async () => {
        const config = GuildMemoryStore.resolve(channel.guildId);
        if (config?.logsChannelId) {
          ActionLogger.logAction({
            guildId: channel.guildId,
            executorId: channel.id,
            action: "Voice Channel Deleted",
            channelName: channel.name
          }).catch(() => {});
        }
      });
    }
  }

  public static isManager(channelId: string, userId: string): boolean {
    return VoiceAuthService.isManager(channelId, userId);
  }

  public static isOwner(channelId: string, userId: string): boolean {
    return VoiceAuthService.isOwner(channelId, userId);
  }

  public static canManageTarget(channelId: string, actorId: string, targetId: string, guild?: Guild | null): boolean {
    return VoiceAuthService.canManageTarget(channelId, actorId, targetId, guild);
  }

  public static async renameChannel(
    channel: VoiceChannel | null,
    member: GuildMember,
    rawName: string
  ): Promise<RenameVoiceResult> {
    return VoiceSettingsService.renameChannel(channel, member, rawName);
  }

  public static async setLimit(
    channel: VoiceChannel | null,
    member: GuildMember,
    rawLimit: string | number
  ): Promise<LimitVoiceResult> {
    return VoiceSettingsService.setLimit(channel, member, rawLimit);
  }

  public static async setBitrate(
    channel: VoiceChannel | null,
    member: GuildMember,
    rawBitrate: string | number
  ): Promise<BitrateVoiceResult> {
    return VoiceSettingsService.setBitrate(channel, member, rawBitrate);
  }

  public static async setRegion(
    channel: VoiceChannel | null,
    member: GuildMember,
    rawRegion: string
  ): Promise<RegionVoiceResult> {
    return VoiceSettingsService.setRegion(channel, member, rawRegion);
  }

  public static async setStatus(
    channel: VoiceChannel | null,
    member: GuildMember,
    rawStatus: string
  ): Promise<StatusVoiceResult> {
    return VoiceSettingsService.setStatus(channel, member, rawStatus);
  }

  public static async claimChannel(
    channel: VoiceChannel | null,
    member: GuildMember
  ): Promise<ClaimVoiceResult> {
    return VoiceClaimService.claimChannel(channel, member);
  }
}
