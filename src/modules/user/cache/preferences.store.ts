import { UserPreferencesModel } from "../../../database/schemas/user-preferences.schema";
import { FastLogger } from "../../../core/logger/logger";

export interface CachedPreferences {
  blacklist: Set<string>;
  trusted: Set<string>;
  whitelist: Set<string>;
}

export class PreferencesStore {
  private static cache: Map<string, CachedPreferences> = new Map();
  private static readonly MAX_ENTRIES = 5000;

  private static makeKey(guildId: string, userId: string): string {
    return `${guildId}:${userId}`;
  }

  private static setBounded(key: string, value: CachedPreferences): void {
    if (this.cache.size >= this.MAX_ENTRIES && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  public static async preload(): Promise<void> {
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
    this.setBounded(key, fallback);
    void this.fetchAsync(guildId, userId);
    return fallback;
  }

  private static async fetchAsync(guildId: string, userId: string): Promise<void> {
    try {
      const record = await UserPreferencesModel.findOne({ guildId, userId }).maxTimeMS(1000).lean();
      if (record) {
        this.setBounded(this.makeKey(guildId, userId), {
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
      const record = await UserPreferencesModel.findOne({ guildId, userId }).maxTimeMS(1000).lean();
      const data: CachedPreferences = {
        blacklist: new Set(record?.blacklist || []),
        trusted: new Set(record?.trusted || []),
        whitelist: new Set(record?.whitelist || [])
      };
      this.setBounded(key, data);
      return data;
    } catch (err: unknown) {
      FastLogger.error("PreferencesStore.get failed", { guildId, userId, err });
      const fallback: CachedPreferences = {
        blacklist: new Set(),
        trusted: new Set(),
        whitelist: new Set()
      };
      this.setBounded(key, fallback);
      return fallback;
    }
  }

  public static async addBlacklist(guildId: string, userId: string, targetId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.blacklist.add(targetId);
    this.setBounded(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $addToSet: { blacklist: targetId } },
        { upsert: true }
      ).exec();
    } catch (err: unknown) {
      FastLogger.error("PreferencesStore.addBlacklist failed", { guildId, userId, targetId, err });
    }
  }

  public static async removeBlacklist(guildId: string, userId: string, targetId: string): Promise<boolean> {
    const prefs = await this.get(guildId, userId);
    if (!prefs.blacklist.has(targetId)) return false;

    prefs.blacklist.delete(targetId);
    this.setBounded(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $pull: { blacklist: targetId } },
        { upsert: true }
      ).exec();
    } catch (err: unknown) {
      FastLogger.error("PreferencesStore.removeBlacklist failed", { guildId, userId, targetId, err });
    }

    return true;
  }

  public static async addTrusted(guildId: string, userId: string, targetId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.trusted.add(targetId);
    this.setBounded(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $addToSet: { trusted: targetId } },
        { upsert: true }
      ).exec();
    } catch (err: unknown) {
      FastLogger.error("PreferencesStore.addTrusted failed", { guildId, userId, targetId, err });
    }
  }

  public static async removeTrusted(guildId: string, userId: string, targetId: string): Promise<boolean> {
    const prefs = await this.get(guildId, userId);
    if (!prefs.trusted.has(targetId)) return false;

    prefs.trusted.delete(targetId);
    this.setBounded(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $pull: { trusted: targetId } },
        { upsert: true }
      ).exec();
    } catch (err: unknown) {
      FastLogger.error("PreferencesStore.removeTrusted failed", { guildId, userId, targetId, err });
    }

    return true;
  }

  public static async addWhitelist(guildId: string, userId: string, targetId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.whitelist.add(targetId);
    this.setBounded(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $addToSet: { whitelist: targetId } },
        { upsert: true }
      ).exec();
    } catch (err: unknown) {
      FastLogger.error("PreferencesStore.addWhitelist failed", { guildId, userId, targetId, err });
    }
  }

  public static async removeWhitelist(guildId: string, userId: string, targetId: string): Promise<boolean> {
    const prefs = await this.get(guildId, userId);
    if (!prefs.whitelist.has(targetId)) return false;

    prefs.whitelist.delete(targetId);
    this.setBounded(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $pull: { whitelist: targetId } },
        { upsert: true }
      ).exec();
    } catch (err: unknown) {
      FastLogger.error("PreferencesStore.removeWhitelist failed", { guildId, userId, targetId, err });
    }

    return true;
  }

  public static async clearBlacklist(guildId: string, userId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.blacklist.clear();
    this.setBounded(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $set: { blacklist: [] } },
        { upsert: true }
      ).exec();
    } catch (err: unknown) {
      FastLogger.error("PreferencesStore.clearBlacklist failed", { guildId, userId, err });
    }
  }

  public static async clearTrusted(guildId: string, userId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.trusted.clear();
    this.setBounded(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $set: { trusted: [] } },
        { upsert: true }
      ).exec();
    } catch (err: unknown) {
      FastLogger.error("PreferencesStore.clearTrusted failed", { guildId, userId, err });
    }
  }

  public static async clearWhitelist(guildId: string, userId: string): Promise<void> {
    const prefs = await this.get(guildId, userId);
    prefs.whitelist.clear();
    this.setBounded(this.makeKey(guildId, userId), prefs);

    try {
      await UserPreferencesModel.updateOne(
        { guildId, userId },
        { $set: { whitelist: [] } },
        { upsert: true }
      ).exec();
    } catch (err: unknown) {
      FastLogger.error("PreferencesStore.clearWhitelist failed", { guildId, userId, err });
    }
  }
}
