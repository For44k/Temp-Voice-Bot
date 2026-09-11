import {
  VoiceChannel,
  GuildMember,
  ChannelType,
  PermissionFlagsBits,
  Routes
} from "discord.js";
import { VoiceMemoryStore, FastVoiceSession } from "../cache/voice.store";
import { GuildMemoryStore } from "../cache/guild.store";
import { PreferencesStore } from "../../user/cache/preferences.store";
import { PanelBuilder } from "../../../core/interactions/panel.builder";
import { GlobalBlacklistStore } from "../../user/cache/global-blacklist.store";
import { TaskWorkerQueue } from "../../../core/workers/task-worker.queue";
import { PersistenceWorkerQueue } from "../../../core/workers/persistence.worker";
import { ActionLogger } from "../../../core/logger/action.logger";
import { BotDeveloperStore } from "../../user/cache/bot-developer.store";

const OWNER_ALLOW_BITS = String(
  PermissionFlagsBits.Connect |
  PermissionFlagsBits.Speak |
  PermissionFlagsBits.Stream |
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.MoveMembers |
  PermissionFlagsBits.SendMessages
);

const TRUSTED_ALLOW_BITS = String(
  PermissionFlagsBits.Connect |
  PermissionFlagsBits.Speak |
  PermissionFlagsBits.Stream |
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages
);

const BLOCKED_DENY_BITS = String(
  PermissionFlagsBits.Connect |
  PermissionFlagsBits.SendMessages
);

export class VoiceLifecycleService {
  private static creatingUsers: Map<string, number> = new Map();
  private static renameCooldowns: Map<string, { count: number; resetAt: number }> = new Map();
  private static joinTimestamps: Map<string, number[]> = new Map();
  private static activeCooldowns: Map<string, number> = new Map();

  public static isCreating(userId: string): boolean {
    const expires = this.creatingUsers.get(userId);
    if (!expires) return false;
    if (Date.now() > expires) {
      this.creatingUsers.delete(userId);
      return false;
    }
    return true;
  }

  public static checkJoinRateLimit(userId: string): { isRateLimited: boolean; remainingSeconds: number } {
    const now = Date.now();

    if (this.isCreating(userId)) {
      return { isRateLimited: true, remainingSeconds: 2 };
    }

    const cooldownUntil = this.activeCooldowns.get(userId);
    if (cooldownUntil) {
      if (now < cooldownUntil) {
        return { isRateLimited: true, remainingSeconds: Math.ceil((cooldownUntil - now) / 1000) };
      }
      this.activeCooldowns.delete(userId);
    }

    const timestamps = this.joinTimestamps.get(userId) || [];
    const validTimestamps = timestamps.filter((t) => now - t <= 3500);
    validTimestamps.push(now);
    this.joinTimestamps.set(userId, validTimestamps);

    if (validTimestamps.length >= 2) {
      const cooldownExpiry = now + 3500;
      this.activeCooldowns.set(userId, cooldownExpiry);
      this.joinTimestamps.delete(userId);
      return { isRateLimited: true, remainingSeconds: 3 };
    }

    return { isRateLimited: false, remainingSeconds: 0 };
  }

  public static async createRoom(member: GuildMember): Promise<string | null> {
    if (GlobalBlacklistStore.isUserBlacklisted(member.id)) {
      void member.voice.disconnect().catch(() => {});
      return null;
    }

    if (this.isCreating(member.id)) return null;
    this.creatingUsers.set(member.id, Date.now() + 10000);

    try {
      const guild = member.guild;
      const config = GuildMemoryStore.resolve(guild.id);
      if (!config) return null;

      const existingRoom = VoiceMemoryStore.getByOwner(guild.id, member.id);
      if (existingRoom) {
        const existingCh = guild.channels.cache.get(existingRoom.channelId) as VoiceChannel | undefined;
        if (existingCh && existingCh.isVoiceBased()) {
          await guild.client.rest.patch(Routes.guildMember(guild.id, member.id), {
            body: { channel_id: existingRoom.channelId }
          }).catch(() => {});
          return existingRoom.channelId;
        } else {
          VoiceMemoryStore.remove(existingRoom.channelId);
        }
      }

      const prefs = PreferencesStore.getSync(guild.id, member.id);

      let channelName = `${member.displayName}'s Room`;
      if (config.nameTemplate) {
        channelName = config.nameTemplate
          .replace(/{username}/gi, member.displayName)
          .replace(/{user}/gi, member.user.username)
          .replace(/{server}/gi, guild.name)
          .slice(0, 100);
      }

      const rawOverwrites: Array<{ id: string; allow: string; deny: string; type: number }> = [];

      let parentChannel: any = null;
      if (config.categoryId) {
        parentChannel = guild.channels.cache.get(config.categoryId);
      }
      if (!parentChannel && config.generatorId) {
        const triggerChannel = guild.channels.cache.get(config.generatorId);
        if (triggerChannel?.parent) {
          parentChannel = triggerChannel.parent;
        } else {
          parentChannel = triggerChannel;
        }
      }

      if (parentChannel?.permissionOverwrites?.cache) {
        for (const ov of parentChannel.permissionOverwrites.cache.values()) {
          rawOverwrites.push({
            id: ov.id,
            allow: ov.allow.bitfield.toString(),
            deny: ov.deny.bitfield.toString(),
            type: ov.type
          });
        }
      }

      const existingOwnerOvIndex = rawOverwrites.findIndex((o) => o.id === member.id);
      if (existingOwnerOvIndex !== -1) {
        rawOverwrites[existingOwnerOvIndex] = {
          id: member.id,
          allow: OWNER_ALLOW_BITS,
          deny: "0",
          type: 1
        };
      } else {
        rawOverwrites.push({
          id: member.id,
          allow: OWNER_ALLOW_BITS,
          deny: "0",
          type: 1
        });
      }

      for (const blockedId of prefs.blacklist) {
        const isRole = guild.roles.cache.has(blockedId);
        rawOverwrites.push({
          id: blockedId,
          allow: String(PermissionFlagsBits.ViewChannel),
          deny: BLOCKED_DENY_BITS,
          type: isRole ? 0 : 1
        });
      }

      for (const trustedId of prefs.trusted) {
        const isRole = guild.roles.cache.has(trustedId);
        rawOverwrites.push({
          id: trustedId,
          allow: TRUSTED_ALLOW_BITS,
          deny: "0",
          type: isRole ? 0 : 1
        });
      }

      for (const wlId of prefs.whitelist) {
        if (!prefs.trusted.has(wlId)) {
          const isRole = guild.roles.cache.has(wlId);
          rawOverwrites.push({
            id: wlId,
            allow: TRUSTED_ALLOW_BITS,
            deny: "0",
            type: isRole ? 0 : 1
          });
        }
      }

      const rest = guild.client.rest;
      const rawChannel = (await rest.post(Routes.guildChannels(guild.id), {
        body: {
          name: channelName,
          type: ChannelType.GuildVoice,
          parent_id: config.categoryId || undefined,
          user_limit: config.defaultLimit,
          permission_overwrites: rawOverwrites
        }
      })) as { id: string; name: string };

      const newChannelId = rawChannel.id;

      const session: FastVoiceSession = {
        channelId: newChannelId,
        guildId: guild.id,
        ownerId: member.id,
        originalOwnerId: member.id,
        coOwners: new Set(prefs.trusted),
        whitelist: new Set(prefs.whitelist),
        isLocked: false,
        isTextLocked: false,
        isHidden: false,
        antiAbuseEnabled: true
      };
      VoiceMemoryStore.set(session);

      try {
        await rest.patch(Routes.guildMember(guild.id, member.id), {
          body: { channel_id: newChannelId }
        });
      } catch {
        VoiceMemoryStore.remove(newChannelId);
        void rest.delete(Routes.channel(newChannelId)).catch(() => {});
        return null;
      }

      if (config.defaultStatus) {
        const formattedStatus = config.defaultStatus
          .replace(/{username}/gi, member.displayName)
          .replace(/{user}/gi, member.user.username)
          .replace(/{server}/gi, guild.name)
          .slice(0, 500);

        if (TaskWorkerQueue.hasWorker) {
          TaskWorkerQueue.dispatch({
            type: "SET_STATUS",
            channelId: newChannelId,
            status: formattedStatus
          });
        } else {
          void rest.put(`/channels/${newChannelId}/voice-status`, {
            body: { status: formattedStatus }
          }).catch(() => {});
        }
      }

      PersistenceWorkerQueue.dispatch({
        type: "CREATE_ROOM",
        data: {
          channelId: newChannelId,
          guildId: guild.id,
          ownerId: member.id,
          originalOwnerId: member.id,
          coOwners: Array.from(prefs.trusted),
          whitelist: Array.from(prefs.whitelist),
          isLocked: false,
          isTextLocked: false,
          isHidden: false,
          antiAbuseEnabled: true
        }
      });

      PersistenceWorkerQueue.dispatch({
        type: "INCREMENT_CHANNELS_CREATED",
        userId: member.id,
        guildId: guild.id
      });

      queueMicrotask(async () => {
        try {
          const channel = (guild.channels.cache.get(newChannelId) as VoiceChannel | undefined) ??
            await guild.channels.fetch(newChannelId).catch(() => null) as VoiceChannel | null;

          if (channel && channel.isSendable()) {
            const fullPayload = await PanelBuilder.createFullPanelPayload(guild.id, member.id);
            await channel.send(fullPayload).catch(() => {});
          }

          if (config.logsChannelId && channel) {
            ActionLogger.logAction({
              guildId: guild.id,
              executorId: member.id,
              action: "Voice Channel Created",
              channelName: channel.name
            }).catch(() => {});
          }
        } catch {}
      });

      return newChannelId;
    } finally {
      this.creatingUsers.delete(member.id);
    }
  }

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

  public static async checkEmpty(channel: VoiceChannel): Promise<void> {
    if (channel.members.size === 0) {
      VoiceMemoryStore.remove(channel.id);
      this.renameCooldowns.delete(channel.id);

      try {
        await channel.delete();
      } catch {
        if (TaskWorkerQueue.hasWorker) {
          TaskWorkerQueue.dispatch({
            type: "DELETE_CHANNEL",
            channelId: channel.id
          });
        }
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
    if (BotDeveloperStore.isDeveloper(userId)) return true;
    const session = VoiceMemoryStore.get(channelId);
    if (!session) return false;
    return session.ownerId === userId || session.coOwners.has(userId);
  }

  public static isOwner(channelId: string, userId: string): boolean {
    if (BotDeveloperStore.isDeveloper(userId)) return true;
    const session = VoiceMemoryStore.get(channelId);
    return session?.ownerId === userId;
  }

  public static canManageTarget(channelId: string, actorId: string, targetId: string): boolean {
    if (BotDeveloperStore.isDeveloper(actorId)) return true;
    const session = VoiceMemoryStore.get(channelId);
    if (!session) return false;
    if (targetId === session.ownerId) return false;
    if (actorId === session.ownerId) return true;
    if (session.coOwners.has(actorId)) {
      if (session.coOwners.has(targetId)) return false;
      return true;
    }
    return false;
  }
}
