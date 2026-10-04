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
import { PersistenceWorkerQueue } from "../../../core/workers/persistence.worker";
import { ActionLogger } from "../../../core/logger/action.logger";
import { FastLogger } from "../../../core/logger/logger";
import { Usages } from "../../../shared/embeds/usages";

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

export class VoiceCreationService {
  private static creatingUsers: Map<string, number> = new Map();
  private static joinTimestamps: Map<string, number[]> = new Map();
  private static activeCooldowns: Map<string, number> = new Map();
  private static guildCreationQueues: Map<string, Promise<string | null>> = new Map();

  public static isCreating(userId: string): boolean {
    const expires = this.creatingUsers.get(userId);
    if (!expires) return false;
    if (Date.now() > expires) {
      this.creatingUsers.delete(userId);
      return false;
    }
    return true;
  }

  public static acquireCreationLock(userId: string): boolean {
    const now = Date.now();
    const expires = this.creatingUsers.get(userId);
    if (expires && now <= expires) {
      return false;
    }
    this.creatingUsers.set(userId, now + 12000);
    return true;
  }

  public static releaseCreationLock(userId: string): void {
    this.creatingUsers.delete(userId);
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

    if (this.joinTimestamps.size > 2000) {
      for (const [k, v] of this.joinTimestamps) {
        if (v.length === 0 || now - v[v.length - 1] > 10000) {
          this.joinTimestamps.delete(k);
        }
      }
    }

    return { isRateLimited: false, remainingSeconds: 0 };
  }

  public static async createRoom(member: GuildMember): Promise<string | null> {
    if (GlobalBlacklistStore.isUserBlacklisted(member.id)) {
      void member.voice.disconnect().catch(() => {});
      return null;
    }

    if (!member.voice?.channelId) {
      return null;
    }

    const guild = member.guild;
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
        void guild.client.rest.delete(Routes.channel(existingRoom.channelId)).catch(() => {});
      }
    }

    if (!this.acquireCreationLock(member.id)) {
      return null;
    }

    const guildId = member.guild.id;
    const currentQueue = this.guildCreationQueues.get(guildId) || Promise.resolve();

    const creationPromise = currentQueue
      .catch(() => {})
      .then(() => this.executeCreateRoom(member));

    this.guildCreationQueues.set(guildId, creationPromise);

    return creationPromise;
  }

  private static async executeCreateRoom(member: GuildMember): Promise<string | null> {
    if (!member.voice?.channelId) {
      this.releaseCreationLock(member.id);
      return null;
    }

    let createdChannelId: string | null = null;
    const guild = member.guild;
    const rest = guild.client.rest;

    try {
      const config = GuildMemoryStore.resolve(guild.id) || await GuildMemoryStore.resolveAsync(guild.id);
      if (!config) return null;

      const existingRoom = VoiceMemoryStore.getByOwner(guild.id, member.id);
      if (existingRoom) {
        const existingCh = guild.channels.cache.get(existingRoom.channelId) as VoiceChannel | undefined;
        if (existingCh && existingCh.isVoiceBased()) {
          await rest.patch(Routes.guildMember(guild.id, member.id), {
            body: { channel_id: existingRoom.channelId }
          }).catch(() => {});
          return existingRoom.channelId;
        } else {
          VoiceMemoryStore.remove(existingRoom.channelId);
          void rest.delete(Routes.channel(existingRoom.channelId)).catch(() => {});
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

      const rawChannel = (await rest.post(Routes.guildChannels(guild.id), {
        body: {
          name: channelName,
          type: ChannelType.GuildVoice,
          parent_id: config.categoryId || undefined,
          user_limit: config.defaultLimit,
          permission_overwrites: [
            {
              id: member.id,
              allow: OWNER_ALLOW_BITS,
              deny: "0",
              type: 1
            }
          ]
        }
      })) as { id: string; name: string };

      createdChannelId = rawChannel.id;

      const session: FastVoiceSession = {
        channelId: createdChannelId,
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
          body: { channel_id: createdChannelId }
        });
      } catch (moveErr: unknown) {
        const errorObj = moveErr as { code?: number; status?: number; message?: string } | undefined;
        const isUserDisconnected = errorObj?.code === 40032 || errorObj?.code === 10026 || errorObj?.status === 400;
        if (isUserDisconnected) {
          FastLogger.info(`User ${member.user.tag} (${member.id}) disconnected before move completed`);
        } else {
          FastLogger.warn(`Failed to move user ${member.user.tag} (${member.id}) into channel ${createdChannelId} in guild ${guild.id}: ${errorObj?.message || String(moveErr)}`);
        }

        VoiceMemoryStore.remove(createdChannelId);
        void rest.delete(Routes.channel(createdChannelId)).catch((delErr) => {
          FastLogger.error(`Rollback channel delete failed for ${createdChannelId}`, delErr);
        });

        if (!isUserDisconnected && errorObj?.code === 50013) {
          queueMicrotask(async () => {
            try {
              const errNotice = await Usages.permissionError(
                guild.id,
                "Move Member to Room",
                ["Move Members"]
              );
              await member.send(errNotice).catch(() => {});
            } catch {}
          });
        }
        return null;
      }

      const extraOverwrites: Array<{ id: string; allow: string; deny: string; type: number }> = [];

      for (const blockedId of prefs.blacklist) {
        const isRole = guild.roles.cache.has(blockedId);
        extraOverwrites.push({
          id: blockedId,
          allow: String(PermissionFlagsBits.ViewChannel),
          deny: BLOCKED_DENY_BITS,
          type: isRole ? 0 : 1
        });
      }

      for (const trustedId of prefs.trusted) {
        const isRole = guild.roles.cache.has(trustedId);
        extraOverwrites.push({
          id: trustedId,
          allow: TRUSTED_ALLOW_BITS,
          deny: "0",
          type: isRole ? 0 : 1
        });
      }

      for (const wlId of prefs.whitelist) {
        if (!prefs.trusted.has(wlId)) {
          const isRole = guild.roles.cache.has(wlId);
          extraOverwrites.push({
            id: wlId,
            allow: TRUSTED_ALLOW_BITS,
            deny: "0",
            type: isRole ? 0 : 1
          });
        }
      }

      if (extraOverwrites.length > 0) {
        void Promise.allSettled(
          extraOverwrites.map((ow) =>
            rest.put(Routes.channelPermission(createdChannelId!, ow.id), {
              body: { allow: ow.allow, deny: ow.deny, type: ow.type }
            })
          )
        );
      }

      if (config.defaultStatus) {
        const formattedStatus = config.defaultStatus
          .replace(/{username}/gi, member.displayName)
          .replace(/{user}/gi, member.user.username)
          .replace(/{server}/gi, guild.name)
          .slice(0, 500);

        void rest.put(`/channels/${createdChannelId}/voice-status`, {
          body: { status: formattedStatus }
        }).catch((statusErr) => {
          FastLogger.warn(`Failed to set channel status for ${createdChannelId}: ${statusErr}`);
        });
      }

      PersistenceWorkerQueue.dispatch({
        type: "CREATE_ROOM",
        data: {
          channelId: createdChannelId,
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

      const finalChannelId = createdChannelId;
      queueMicrotask(async () => {
        try {
          const channel = (guild.channels.cache.get(finalChannelId) as VoiceChannel | undefined) ??
            await guild.channels.fetch(finalChannelId).catch(() => null) as VoiceChannel | null;

          if (channel && channel.isSendable()) {
            const fullPayload = await PanelBuilder.createFullPanelPayload(guild.id, member.id);
            await channel.send(fullPayload).catch((sendErr) => {
              FastLogger.warn(`Failed to send panel to voice channel ${finalChannelId}: ${sendErr}`);
            });
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

      return createdChannelId;
    } catch (err: unknown) {
      FastLogger.error(`VoiceCreationService.createRoom failed for user ${member.id} in guild ${guild.id}`, err);
      if (createdChannelId) {
        VoiceMemoryStore.remove(createdChannelId);
        void rest.delete(Routes.channel(createdChannelId)).catch((delErr) => {
          FastLogger.error(`Failed to delete channel ${createdChannelId} after creation error`, delErr);
        });
      }
      return null;
    } finally {
      this.releaseCreationLock(member.id);
    }
  }
}
