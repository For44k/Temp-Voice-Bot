import { GuildConfigModel, IGuildConfig } from "../../../database/schemas/guild-config.schema";

export class GuildMemoryStore {
  private static store: Map<string, IGuildConfig> = new Map();
  private static generatorMap: Map<string, string> = new Map();

  private static normalize(item: any): IGuildConfig {
    if (!item.generatorId && item.voiceChannelId) {
      item.generatorId = item.voiceChannelId;
    }
    if (!item.nameTemplate && item.channelNameTemplate) {
      item.nameTemplate = item.channelNameTemplate;
    }
    if (!item.defaultStatus && item.defaultChannelStatus) {
      item.defaultStatus = item.defaultChannelStatus;
    }
    return item as IGuildConfig;
  }

  public static async preload(): Promise<void> {
    try {
      const records = await GuildConfigModel.find().lean();
      for (const rawItem of records) {
        const item = this.normalize(rawItem);
        this.store.set(item.guildId, item);
        if (item.generatorId) {
          this.generatorMap.set(item.generatorId, item.guildId);
        }
      }
    } catch {}
  }

  public static isGenerator(channelId: string): boolean {
    return this.generatorMap.has(channelId);
  }

  public static getGuildByGenerator(channelId: string): string | undefined {
    return this.generatorMap.get(channelId);
  }

  public static resolve(guildId: string): IGuildConfig | null {
    return this.store.get(guildId) || null;
  }

  public static async resolveAsync(guildId: string): Promise<IGuildConfig | null> {
    const memory = this.store.get(guildId);
    if (memory) return memory;

    try {
      const data = await GuildConfigModel.findOne({ guildId }).maxTimeMS(500).lean();
      if (data) {
        const item = this.normalize(data);
        this.store.set(guildId, item);
        if (item.generatorId) {
          this.generatorMap.set(item.generatorId, item.guildId);
        }
        return item;
      }
    } catch {}
    return null;
  }

  public static set(guildId: string, data: IGuildConfig): void {
    const item = this.normalize(data);
    const old = this.store.get(guildId);
    if (old?.generatorId && old.generatorId !== item.generatorId) {
      this.generatorMap.delete(old.generatorId);
    }
    this.store.set(guildId, item);
    if (item.generatorId) {
      this.generatorMap.set(item.generatorId, guildId);
    }
  }

  public static purge(guildId: string): void {
    const old = this.store.get(guildId);
    if (old?.generatorId) {
      this.generatorMap.delete(old.generatorId);
    }
    this.store.delete(guildId);
  }
}
