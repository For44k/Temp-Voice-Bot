import { UserAliasModel } from "../../../database/schemas/user-alias.schema";

export class AliasStore {
  private static cache: Map<string, Map<string, string>> = new Map();

  private static makeKey(guildId: string, userId: string): string {
    return `${guildId}:${userId}`;
  }

  public static async getAliases(guildId: string, userId: string): Promise<Map<string, string>> {
    const key = this.makeKey(guildId, userId);
    const cached = this.cache.get(key);
    if (cached) return cached;

    const map = new Map<string, string>();
    try {
      const record = await UserAliasModel.findOne({ guildId, userId }).maxTimeMS(2000).lean();
      if (record?.aliases) {
        for (const [k, v] of Object.entries(record.aliases)) {
          if (typeof v === "string") {
            map.set(k.toLowerCase(), v.toLowerCase());
          }
        }
      }
    } catch {}

    this.cache.set(key, map);
    return map;
  }

  public static async resolve(guildId: string, userId: string, alias: string): Promise<string | undefined> {
    const map = await this.getAliases(guildId, userId);
    return map.get(alias.toLowerCase());
  }

  public static async addAlias(guildId: string, userId: string, alias: string, targetCommand: string): Promise<{ success: boolean; reason?: string }> {
    const map = await this.getAliases(guildId, userId);
    const lowerAlias = alias.toLowerCase();
    const lowerTarget = targetCommand.toLowerCase();

    if (map.size >= 5 && !map.has(lowerAlias)) {
      return { success: false, reason: "Max limit of 5 aliases reached." };
    }

    map.set(lowerAlias, lowerTarget);
    const key = this.makeKey(guildId, userId);
    this.cache.set(key, map);

    const plainObject: Record<string, string> = {};
    for (const [k, v] of Array.from(map.entries())) {
      plainObject[k] = v;
    }

    UserAliasModel.updateOne(
      { guildId, userId },
      { aliases: plainObject },
      { upsert: true }
    ).exec().catch(() => {});

    return { success: true };
  }

  public static async removeAlias(guildId: string, userId: string, alias: string): Promise<boolean> {
    const map = await this.getAliases(guildId, userId);
    const lowerAlias = alias.toLowerCase();

    if (!map.has(lowerAlias)) return false;

    map.delete(lowerAlias);
    const key = this.makeKey(guildId, userId);
    this.cache.set(key, map);

    const plainObject: Record<string, string> = {};
    for (const [k, v] of Array.from(map.entries())) {
      plainObject[k] = v;
    }

    UserAliasModel.updateOne(
      { guildId, userId },
      { aliases: plainObject },
      { upsert: true }
    ).exec().catch(() => {});

    return true;
  }
}
