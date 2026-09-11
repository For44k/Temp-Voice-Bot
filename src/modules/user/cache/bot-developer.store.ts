import { BotDeveloperModel } from "../../../database/schemas/bot-developer.schema";
import { ENV } from "../../../core/config/env";

export class BotDeveloperStore {
  private static developers: Set<string> = new Set();
  private static loaded = false;

  public static async preload(): Promise<void> {
    if (this.loaded) return;
    try {
      const records = await BotDeveloperModel.find().lean();
      for (const item of records) {
        this.developers.add(item.userId);
      }
      this.loaded = true;
    } catch {}
  }

  public static isDeveloper(userId: string): boolean {
    if (ENV.DEVID && userId === ENV.DEVID) return true;
    return this.developers.has(userId);
  }

  public static isMainDev(userId: string): boolean {
    return Boolean(ENV.DEVID && userId === ENV.DEVID);
  }

  public static async addDeveloper(userId: string, addedBy: string): Promise<void> {
    this.developers.add(userId);
    await BotDeveloperModel.updateOne(
      { userId },
      { userId, addedBy, addedAt: new Date() },
      { upsert: true }
    ).exec();
  }

  public static async removeDeveloper(userId: string): Promise<void> {
    this.developers.delete(userId);
    await BotDeveloperModel.deleteOne({ userId }).exec();
  }

  public static getDeveloperList(): string[] {
    return Array.from(this.developers);
  }
}
