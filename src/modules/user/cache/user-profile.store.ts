import { UserProfileModel, IUserProfile } from "../../../database/schemas/user-profile.schema";

export interface CachedUserProfile {
  channelsCreated: number;
  hasBannerAccess: boolean;
  equippedBannerUrl?: string;
}

export class UserProfileStore {
  private static cache: Map<string, CachedUserProfile> = new Map();
  private static readonly MAX_ENTRIES = 5000;

  private static makeKey(userId: string, guildId: string): string {
    return `${guildId}:${userId}`;
  }

  public static async preload(): Promise<void> {
    try {
      const records = await UserProfileModel.find({ equippedBannerUrl: { $exists: true, $ne: "" } }).lean();
      for (const r of records) {
        this.cache.set(this.makeKey(r.userId, r.guildId), {
          channelsCreated: r.channelsCreated || 0,
          hasBannerAccess: Boolean(r.hasBannerAccess),
          equippedBannerUrl: r.equippedBannerUrl
        });
      }
    } catch {}
  }

  public static getSync(userId: string, guildId: string): CachedUserProfile | undefined {
    return this.cache.get(this.makeKey(userId, guildId));
  }

  public static async get(userId: string, guildId: string): Promise<CachedUserProfile | null> {
    const key = this.makeKey(userId, guildId);
    const existing = this.cache.get(key);
    if (existing) return existing;

    try {
      const doc = await UserProfileModel.findOne({ userId, guildId }).lean();
      if (doc) {
        const item: CachedUserProfile = {
          channelsCreated: doc.channelsCreated || 0,
          hasBannerAccess: Boolean(doc.hasBannerAccess),
          equippedBannerUrl: doc.equippedBannerUrl
        };
        if (this.cache.size >= this.MAX_ENTRIES) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey) this.cache.delete(firstKey);
        }
        this.cache.set(key, item);
        return item;
      }
    } catch {}
    return null;
  }

  public static set(userId: string, guildId: string, profile: CachedUserProfile): void {
    const key = this.makeKey(userId, guildId);
    if (this.cache.size >= this.MAX_ENTRIES && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, profile);
  }

  public static updateBanner(userId: string, guildId: string, bannerUrl: string | undefined): void {
    const key = this.makeKey(userId, guildId);
    const existing = this.cache.get(key) || { channelsCreated: 0, hasBannerAccess: true };
    existing.equippedBannerUrl = bannerUrl;
    this.cache.set(key, existing);
  }
}
