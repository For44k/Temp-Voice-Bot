import { ActiveVoiceModel, IActiveVoice } from "../../database/schemas/active-voice.schema";
import { UserProfileModel } from "../../database/schemas/user-profile.schema";
import { FastLogger } from "../logger/logger";

export type PersistenceTask =
  | { type: "CREATE_ROOM"; data: IActiveVoice }
  | { type: "UPDATE_ROOM"; channelId: string; update: Partial<IActiveVoice> }
  | { type: "DELETE_ROOM"; channelId: string }
  | { type: "INCREMENT_CHANNELS_CREATED"; userId: string; guildId: string };

export class PersistenceWorkerQueue {
  private static queue: PersistenceTask[] = [];
  private static isFlushing = false;
  private static readonly MAX_QUEUE_SIZE = 10000;
  private static readonly CONCURRENCY = 20;
  private static activeKeys: Set<string> = new Set();
  private static runningCount = 0;

  private static getTaskKey(task: PersistenceTask): string {
    if (task.type === "CREATE_ROOM") return `room:${task.data.channelId}`;
    if (task.type === "UPDATE_ROOM") return `room:${task.channelId}`;
    if (task.type === "DELETE_ROOM") return `room:${task.channelId}`;
    if (task.type === "INCREMENT_CHANNELS_CREATED") return `user:${task.guildId}:${task.userId}`;
    return "global";
  }

  public static dispatch(task: PersistenceTask): void {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      FastLogger.warn(`Persistence queue near max capacity (${this.queue.length})`);
    }
    this.queue.push(task);
    if (!this.isFlushing) {
      queueMicrotask(() => void this.flush());
    }
  }

  public static async flush(): Promise<void> {
    while (this.queue.length > 0 || this.runningCount > 0) {
      this.drain();
      await new Promise((res) => setTimeout(res, 50));
    }
  }

  private static drain(): void {
    if (this.runningCount >= this.CONCURRENCY || this.queue.length === 0) return;

    for (let i = 0; i < this.queue.length; i++) {
      if (this.runningCount >= this.CONCURRENCY) break;

      const task = this.queue[i];
      const key = this.getTaskKey(task);

      if (this.activeKeys.has(key)) {
        continue;
      }

      this.queue.splice(i, 1);
      i--;

      this.activeKeys.add(key);
      this.runningCount++;

      void this.executeTask(task)
        .catch((err) => {
          FastLogger.error(`Persistence task failed [${task.type}]`, err);
        })
        .finally(() => {
          this.activeKeys.delete(key);
          this.runningCount--;
          if (this.queue.length > 0) {
            queueMicrotask(() => this.drain());
          }
        });
    }
  }

  private static async executeTask(task: PersistenceTask): Promise<void> {
    if (task.type === "CREATE_ROOM") {
      await ActiveVoiceModel.updateOne(
        { channelId: task.data.channelId },
        { $set: task.data },
        { upsert: true }
      ).exec();
      return;
    }

    if (task.type === "UPDATE_ROOM") {
      await ActiveVoiceModel.updateOne(
        { channelId: task.channelId },
        { $set: task.update },
        { upsert: false }
      ).exec();
      return;
    }

    if (task.type === "DELETE_ROOM") {
      await ActiveVoiceModel.deleteOne({ channelId: task.channelId }).exec();
      return;
    }

    if (task.type === "INCREMENT_CHANNELS_CREATED") {
      await UserProfileModel.updateOne(
        { userId: task.userId, guildId: task.guildId },
        { $inc: { channelsCreated: 1 } },
        { upsert: true }
      ).exec();
      return;
    }
  }
}
