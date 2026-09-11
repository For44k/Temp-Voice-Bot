import { UserPreferencesModel } from "../../../database/schemas/user-preferences.schema";
import { FastLogger } from "../../../core/logger/logger";

export interface CachedPreferences {
  blacklist: Set<string>;
  trusted: Set<string>;
  whitelist: Set<string>;
}

export class PreferencesStore {
  private static cache: Map<string, CachedPreferences> = new Map();

  private static makeKey(guildId: string, userId: string): string {
    return `${guildId}:${userId}`;
  }

  public static async preload(): Promise<void> {
    try {
      const records = await UserPreferencesModel.find().lean();
      for (const record of records) {
        const key = this.makeKey(record.guildId, record.userId);
        this.cache.set(key, {
          blacklist: new Set(record.blacklist || []),
          trusted: new Set(record.trusted || []),
          whitelist: new Set(record.whitelist || [])
        });
      }
    } catch {}
  }

  public static getSync(guildId: string, userId: string): CachedPreferences {
    const key = this.makeKey(guildId, userId);
    const cached = this.cache.get(key);
    if (cached) return cached;
    const fallback: CachedPreferences = {
      blacklist: new Set(),
      trusted: new Set(),
      whitelist: new Set()
    };
    this.cache.set(key, fallback);
    void this.fetchAsync(guildId, userId);
    return fallback;
  }

  private static async fetchAsync(guildId: string, userId: string): Promise<void> {
    try {
      const record = await UserPreferencesModel.findOne({ guildId, userId }).maxTimeMS(500).lean();
      if (record) {
        this.cache.set(this.makeKey(guildId, userId), {
          blacklist: new Set(record.blacklist || []),
          trusted: new Set(record.trusted || []),
          whitelist: new Set(record.whitelist || [])
        });
      }
    } catch (err) {
      FastLogger.error("Failed to fetch user preferences asynchronously", err);
    }
  }

  public static async get(guildId: string, userId: string): Promise<CachedPreferences> {
    const key = this.makeKey(guildId, userId);
    const cached = this.cache.get(key);
    if (cached) return cached;

    try {
      const record = await UserPreferencesModel.findOne({ guildId, userId }).maxTimeMS(500).lean();
      const data: CachedPreferences = {
        blacklist: new Set(record?.blacklist || []),
        trusted: new Set(record?.trusted || []),
        whitelist: new Set(record?.whitelist || [])
      };
      this.cache.set(key, data);
      return data;
    } catch {
      const fallback: CachedPreferences = {
        blacklist: new Set(),
        trusted: new Set(),
        whitelist: new Set()
      };
      this.cache.set(key, fallback);
      return fallback;
    }
  }

  public static async addBlacklist(guildId: string, userId: string, targetId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.blacklist.add(targetId);
    this.cache.set(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $addToSet: { blacklist: targetId } },
        { upsert: true }
      ).exec();
    } catch {}
  }

  public static async removeBlacklist(guildId: string, userId: string, targetId: string): Promise<boolean> {
    const prefs = await this.get(guildId, userId);
    if (!prefs.blacklist.has(targetId)) return false;

    prefs.blacklist.delete(targetId);
    this.cache.set(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $pull: { blacklist: targetId } },
        { upsert: true }
      ).exec();
    } catch {}

    return true;
  }

  public static async addTrusted(guildId: string, userId: string, targetId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.trusted.add(targetId);
    this.cache.set(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $addToSet: { trusted: targetId } },
        { upsert: true }
      ).exec();
    } catch {}
  }

  public static async removeTrusted(guildId: string, userId: string, targetId: string): Promise<boolean> {
    const prefs = await this.get(guildId, userId);
    if (!prefs.trusted.has(targetId)) return false;

    prefs.trusted.delete(targetId);
    this.cache.set(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $pull: { trusted: targetId } },
        { upsert: true }
      ).exec();
    } catch {}

    return true;
  }

  public static async addWhitelist(guildId: string, userId: string, targetId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.whitelist.add(targetId);
    this.cache.set(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $addToSet: { whitelist: targetId } },
        { upsert: true }
      ).exec();
    } catch {}
  }

  public static async removeWhitelist(guildId: string, userId: string, targetId: string): Promise<boolean> {
    const prefs = await this.get(guildId, userId);
    if (!prefs.whitelist.has(targetId)) return false;

    prefs.whitelist.delete(targetId);
    this.cache.set(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $pull: { whitelist: targetId } },
        { upsert: true }
      ).exec();
    } catch {}

    return true;
  }

  public static async clearBlacklist(guildId: string, userId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.blacklist.clear();
    this.cache.set(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $set: { blacklist: [] } },
        { upsert: true }
      ).exec();
    } catch {}
  }

  public static async clearTrusted(guildId: string, userId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.trusted.clear();
    this.cache.set(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $set: { trusted: [] } },
        { upsert: true }
      ).exec();
    } catch {}
  }

  public static async clearWhitelist(guildId: string, userId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.whitelist.clear();
    this.cache.set(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $set: { whitelist: [] } },
        { upsert: true }
      ).exec();
    } catch {}
  }
}
