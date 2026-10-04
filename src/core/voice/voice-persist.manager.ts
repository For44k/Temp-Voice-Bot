import { Client, VoiceChannel } from "discord.js";
import { FastLogger } from "../logger/logger";
import { BotGateway } from "../gateway/bot.gateway";
import { BotVoicePersistModel } from "../../database/schemas/bot-voice-persist.schema";

export interface VoicePersistData {
  mainBot?: { guildId: string; channelId: string };
}

export class VoicePersistManager {
  private static data: VoicePersistData = {};
  private static isLoaded = false;
  private static reconnectingMain = false;

  public static async preload(): Promise<void> {
    try {
      const records = await BotVoicePersistModel.find().lean();
      for (const rec of records) {
        if (rec.botType === "main") {
          this.data.mainBot = { guildId: rec.guildId, channelId: rec.channelId };
        }
      }
      this.isLoaded = true;
      FastLogger.info("Voice persist configurations loaded from database");
    } catch (err) {
      FastLogger.error("Failed to preload BotVoicePersistModel", err);
    }
  }

  public static load(): VoicePersistData {
    return this.data;
  }

  public static setMainBotChannel(guildId: string, channelId: string): void {
    this.data.mainBot = { guildId, channelId };
    void BotVoicePersistModel.updateOne(
      { botType: "main" },
      { $set: { guildId, channelId } },
      { upsert: true }
    ).exec().catch((err) => {
      FastLogger.error("Failed to save main bot voice persist to database", err);
    });
  }

  public static async joinVoice(client: Client, guildId: string, channelId: string): Promise<boolean> {
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return false;

      let channel = guild.channels.cache.get(channelId) as VoiceChannel | undefined;
      if (!channel) {
        channel = (await guild.channels.fetch(channelId).catch(() => null)) as VoiceChannel | null ?? undefined;
      }
      if (!channel || !channel.isVoiceBased()) return false;

      const shard = guild.shard;
      if (!shard) return false;

      shard.send({
        op: 4,
        d: {
          guild_id: guildId,
          channel_id: channelId,
          self_mute: false,
          self_deaf: true
        }
      });
      return true;
    } catch (err) {
      FastLogger.error(`Failed to join voice channel ${channelId}`, err);
      return false;
    }
  }

  public static async reconnectMain(): Promise<void> {
    if (this.reconnectingMain) return;
    const data = this.load();
    if (!data.mainBot || !BotGateway.client) return;

    this.reconnectingMain = true;
    try {
      await this.joinVoice(BotGateway.client, data.mainBot.guildId, data.mainBot.channelId);
    } finally {
      setTimeout(() => {
        this.reconnectingMain = false;
      }, 5000);
    }
  }

  public static async reconnectAll(): Promise<void> {
    const data = this.load();
    if (data.mainBot && BotGateway.client) {
      void this.joinVoice(BotGateway.client, data.mainBot.guildId, data.mainBot.channelId);
    }
  }
}
