import { BotDeveloperModel } from "../../../database/schemas/bot-developer.schema";
import { ENV } from "../../../core/config/env";
import { FastLogger } from "../../../core/logger/logger";

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
    } catch (err: unknown) {
      FastLogger.error("BotDeveloperStore.preload failed", err);
    }
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
    try {
      await BotDeveloperModel.updateOne(
        { userId },
        { userId, addedBy, addedAt: new Date() },
        { upsert: true }
      ).exec();
    } catch (err: unknown) {
      FastLogger.error("BotDeveloperStore.addDeveloper failed", { userId, addedBy, err });
    }
  }

  public static async removeDeveloper(userId: string): Promise<void> {
    this.developers.delete(userId);
    try {
      await BotDeveloperModel.deleteOne({ userId }).exec();
    } catch (err: unknown) {
      FastLogger.error("BotDeveloperStore.removeDeveloper failed", { userId, err });
    }
  }

  public static getDeveloperList(): string[] {
    return Array.from(this.developers);
  }
}
