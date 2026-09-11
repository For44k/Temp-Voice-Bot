import * as fs from "fs";
import * as path from "path";
import { Client, VoiceChannel } from "discord.js";
import { FastLogger } from "../logger/logger";
import { TaskWorkerQueue } from "../workers/task-worker.queue";
import { BotGateway } from "../gateway/bot.gateway";

export interface VoiceJsonData {
  mainBot?: { guildId: string; channelId: string };
  workerBot?: { guildId: string; channelId: string };
}

export class VoicePersistManager {
  private static readonly FILE_PATH = path.join(process.cwd(), "voice.json");
  private static data: VoiceJsonData = {};
  private static isLoaded = false;

  public static load(): VoiceJsonData {
    if (this.isLoaded) return this.data;
    try {
      if (fs.existsSync(this.FILE_PATH)) {
        const raw = fs.readFileSync(this.FILE_PATH, "utf-8");
        this.data = JSON.parse(raw);
      } else {
        this.data = {};
      }
    } catch {
      this.data = {};
    }
    this.isLoaded = true;
    return this.data;
  }

  public static save(data: VoiceJsonData): void {
    this.data = data;
    this.isLoaded = true;
    void fs.promises.writeFile(this.FILE_PATH, JSON.stringify(data, null, 2), "utf-8").catch((err) => {
      FastLogger.error("Failed to save voice.json", err);
    });
  }

  public static setMainBotChannel(guildId: string, channelId: string): void {
    this.load();
    this.data.mainBot = { guildId, channelId };
    this.save(this.data);
  }

  public static setWorkerBotChannel(guildId: string, channelId: string): void {
    this.load();
    this.data.workerBot = { guildId, channelId };
    this.save(this.data);
  }

  public static async joinVoice(client: Client, guildId: string, channelId: string): Promise<boolean> {
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return false;

      const channel = guild.channels.cache.get(channelId) as VoiceChannel | undefined;
      if (!channel || !channel.isVoiceBased()) return false;

      const shard = guild.shard;
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

  public static async reconnectAll(): Promise<void> {
    const data = this.load();

    if (data.mainBot && BotGateway.client) {
      void this.joinVoice(BotGateway.client, data.mainBot.guildId, data.mainBot.channelId);
    }

    if (data.workerBot && TaskWorkerQueue.client) {
      void this.joinVoice(TaskWorkerQueue.client, data.workerBot.guildId, data.workerBot.channelId);
    }
  }
}
