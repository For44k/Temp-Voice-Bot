import { GlobalBlacklistModel } from "../../../database/schemas/global-blacklist.schema";

export class GlobalBlacklistStore {
  private static userBlacklist: Set<string> = new Set();
  private static serverBlacklist: Set<string> = new Set();
  private static loaded = false;

  public static async preload(): Promise<void> {
    if (this.loaded) return;
    try {
      const records = await GlobalBlacklistModel.find().lean();
      for (const item of records) {
        if (item.type === "user") {
          this.userBlacklist.add(item.targetId);
        } else if (item.type === "server") {
          this.serverBlacklist.add(item.targetId);
        }
      }
      this.loaded = true;
    } catch {}
  }

  public static isUserBlacklisted(userId: string): boolean {
    return this.userBlacklist.has(userId);
  }

  public static isServerBlacklisted(serverId: string): boolean {
    return this.serverBlacklist.has(serverId);
  }

  public static async addUser(userId: string, reason?: string): Promise<void> {
    this.userBlacklist.add(userId);
    await GlobalBlacklistModel.updateOne(
      { targetId: userId },
      { targetId: userId, type: "user", reason, addedAt: new Date() },
      { upsert: true }
    ).exec();
  }

  public static async removeUser(userId: string): Promise<void> {
    this.userBlacklist.delete(userId);
    await GlobalBlacklistModel.deleteOne({ targetId: userId, type: "user" }).exec();
  }

  public static getUserBlacklist(): string[] {
    return Array.from(this.userBlacklist);
  }

  public static async addServer(serverId: string, reason?: string): Promise<void> {
    this.serverBlacklist.add(serverId);
    await GlobalBlacklistModel.updateOne(
      { targetId: serverId },
      { targetId: serverId, type: "server", reason, addedAt: new Date() },
      { upsert: true }
    ).exec();
  }

  public static async removeServer(serverId: string): Promise<void> {
    this.serverBlacklist.delete(serverId);
    await GlobalBlacklistModel.deleteOne({ targetId: serverId, type: "server" }).exec();
  }

  public static getServerBlacklist(): string[] {
    return Array.from(this.serverBlacklist);
  }
}
