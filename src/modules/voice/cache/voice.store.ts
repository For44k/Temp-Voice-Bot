import { Client, VoiceChannel } from "discord.js";
import { ActiveVoiceModel, IActiveVoice } from "../../../database/schemas/active-voice.schema";
import { PersistenceWorkerQueue } from "../../../core/workers/persistence.worker";
import { FastLogger } from "../../../core/logger/logger";

export interface FastVoiceSession {
  channelId: string;
  guildId: string;
  ownerId: string;
  originalOwnerId: string;
  coOwners: Set<string>;
  whitelist: Set<string>;
  isLocked: boolean;
  isTextLocked: boolean;
  isHidden: boolean;
  antiAbuseEnabled?: boolean;
  channelMutes?: Set<string>;
  channelDeafens?: Set<string>;
  claimPromptMessageId?: string;
  antiAbuseAttempts?: Map<string, { count: number; lastTime: number; notified: boolean }>;
}

export class VoiceMemoryStore {
  private static channels: Map<string, FastVoiceSession> = new Map();
  private static ownerLookup: Map<string, string> = new Map();

  public static get(channelId: string): FastVoiceSession | undefined {
    return this.channels.get(channelId);
  }

  public static getByOwner(guildId: string, userId: string): FastVoiceSession | undefined {
    const channelId = this.ownerLookup.get(`${guildId}:${userId}`);
    return channelId ? this.channels.get(channelId) : undefined;
  }

  public static set(session: FastVoiceSession): void {
    const ownerKey = `${session.guildId}:${session.ownerId}`;
    const existingChannelId = this.ownerLookup.get(ownerKey);
    if (existingChannelId && existingChannelId !== session.channelId) {
      this.channels.delete(existingChannelId);
      PersistenceWorkerQueue.dispatch({ type: "DELETE_ROOM", channelId: existingChannelId });
    }

    this.channels.set(session.channelId, session);
    this.ownerLookup.set(ownerKey, session.channelId);
  }

  public static reassignOwner(channelId: string, newOwnerId: string): void {
    const session = this.channels.get(channelId);
    if (!session) return;
    this.ownerLookup.delete(`${session.guildId}:${session.ownerId}`);
    session.ownerId = newOwnerId;
    this.ownerLookup.set(`${session.guildId}:${newOwnerId}`, channelId);
    PersistenceWorkerQueue.dispatch({
      type: "UPDATE_ROOM",
      channelId,
      update: { ownerId: newOwnerId }
    });
  }

  public static remove(channelId: string): void {
    const session = this.channels.get(channelId);
    if (session) {
      this.ownerLookup.delete(`${session.guildId}:${session.ownerId}`);
      this.channels.delete(channelId);
    }
    PersistenceWorkerQueue.dispatch({ type: "DELETE_ROOM", channelId });
  }

  public static async preload(): Promise<void> {
    try {
      const records = await ActiveVoiceModel.find().lean();
      for (const item of records) {
        const session: FastVoiceSession = {
          channelId: item.channelId,
          guildId: item.guildId,
          ownerId: item.ownerId,
          originalOwnerId: item.originalOwnerId,
          coOwners: new Set(item.coOwners || []),
          whitelist: new Set(item.whitelist || []),
          isLocked: Boolean(item.isLocked),
          isTextLocked: Boolean(item.isTextLocked),
          isHidden: Boolean(item.isHidden),
          antiAbuseEnabled: item.antiAbuseEnabled !== false
        };
        this.channels.set(item.channelId, session);
        this.ownerLookup.set(`${item.guildId}:${item.ownerId}`, item.channelId);
      }
    } catch (err) {
      FastLogger.error("Failed to preload ActiveVoiceModel", err);
    }
  }

  public static async reconcileWithDiscord(client: Client): Promise<void> {
    try {
      const staleChannelIds: string[] = [];

      for (const [channelId, session] of this.channels.entries()) {
        const guild = client.guilds.cache.get(session.guildId);
        if (!guild) {
          staleChannelIds.push(channelId);
          continue;
        }

        let ch = guild.channels.cache.get(channelId) as VoiceChannel | undefined;
        if (!ch) {
          try {
            ch = (await guild.channels.fetch(channelId).catch(() => null)) as VoiceChannel | null ?? undefined;
          } catch {
            ch = undefined;
          }
        }

        if (!ch) {
          staleChannelIds.push(channelId);
        }
      }

      for (const staleId of staleChannelIds) {
        this.remove(staleId);
      }

      if (staleChannelIds.length > 0) {
        FastLogger.info(`Cleaned up ${staleChannelIds.length} stale voice sessions during startup reconciliation.`);
      }
    } catch (err) {
      FastLogger.error("Error during VoiceMemoryStore discord reconciliation", err);
    }
  }

  public static sync(channelId: string): void {
    const session = this.channels.get(channelId);
    if (!session) return;
    PersistenceWorkerQueue.dispatch({
      type: "UPDATE_ROOM",
      channelId,
      update: {
        ownerId: session.ownerId,
        coOwners: Array.from(session.coOwners),
        whitelist: Array.from(session.whitelist),
        isLocked: session.isLocked,
        isTextLocked: session.isTextLocked,
        isHidden: session.isHidden,
        antiAbuseEnabled: session.antiAbuseEnabled !== false
      }
    });
  }
}
