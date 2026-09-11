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
  private static readonly MAX_QUEUE_SIZE = 5000;
  private static readonly BATCH_SIZE = 50;

  public static dispatch(task: PersistenceTask): void {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      FastLogger.warn(`Persistence queue overflow (${this.queue.length}) — dropping oldest item`);
      this.queue.shift();
    }
    this.queue.push(task);
    if (!this.isFlushing) {
      queueMicrotask(() => void this.flush());
    }
  }

  public static async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.BATCH_SIZE);
        await Promise.allSettled(
          batch.map(async (task) => {
            try {
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
                  { upsert: true }
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
            } catch (err) {
              FastLogger.error(`Persistence task failed: ${task.type}`, err);
            }
          })
        );
      }
    } finally {
      this.isFlushing = false;
      if (this.queue.length > 0) {
        queueMicrotask(() => void this.flush());
      }
    }
  }
}
