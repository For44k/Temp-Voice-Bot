import { Client, VoiceChannel, GuildMember, PermissionFlagsBits, ActivityType, REST, Routes, GatewayIntentBits } from "discord.js";
import { ENV } from "../config/env";
import { FastLogger } from "../logger/logger";

export type WorkerOp =
  | { type: "PERMIT"; channelId: string; guildId: string; memberId: string }
  | { type: "REJECT"; channelId: string; guildId: string; memberId: string; disconnect: boolean }
  | { type: "MUTE_VC"; guildId: string; memberId: string; mute: boolean }
  | { type: "DEAFEN_VC"; guildId: string; memberId: string; deaf: boolean }
  | { type: "LOCK"; channelId: string; guildId: string; everyoneId: string; lock: boolean }
  | { type: "TEXT_LOCK"; channelId: string; guildId: string; everyoneId: string; lock: boolean }
  | { type: "HIDE"; channelId: string; guildId: string; everyoneId: string; hidden: boolean }
  | { type: "OVERWRITE_DELETE"; channelId: string; guildId: string; targetId: string }
  | { type: "OVERWRITE_EDIT"; channelId: string; guildId: string; targetId: string; allow: string; deny: string }
  | { type: "SEND_PANEL"; channelId: string; payload: any }
  | { type: "MOVE_MEMBER"; guildId: string; memberId: string; channelId: string }
  | { type: "APPLY_PERMISSIONS"; channelId: string; overwrites: Array<{ id: string; allow: string; deny: string; type: number }> }
  | { type: "SET_STATUS"; channelId: string; status: string }
  | { type: "SEND_LOG"; channelId: string; payload: any }
  | { type: "DELETE_CHANNEL"; channelId: string };

interface QueuedTask {
  op: WorkerOp;
  resolve: (value: boolean) => void;
  reject: (reason?: any) => void;
}

export class TaskWorkerQueue {
  private static workerClient: Client | null = null;
  private static workerRest: REST | null = null;
  private static queue: QueuedTask[] = [];
  private static readonly MAX_QUEUE_SIZE = 2000;
  private static readonly CONCURRENCY = 15;
  private static activeLocks: Set<string> = new Set();
  private static runningCount = 0;

  public static get hasWorker(): boolean {
    return this.workerClient !== null;
  }

  public static get client(): Client | null {
    return this.workerClient;
  }

  public static get rest(): REST | null {
    return this.workerRest;
  }

  public static async init(): Promise<void> {
    if (!ENV.WORKER_TOKEN) {
      FastLogger.info("No WORKER_TOKEN — running single-bot mode.");
      return;
    }

    try {
      this.workerClient = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildVoiceStates
        ]
      });
      await this.workerClient.login(ENV.WORKER_TOKEN);
      this.workerRest = new REST({ version: "10" }).setToken(ENV.WORKER_TOKEN);
      FastLogger.success(`Worker Bot online as ${this.workerClient.user?.tag}`);
      this.workerClient.user?.setPresence({
        status: "dnd",
        activities: [{ name: "helping", type: ActivityType.Custom }]
      });
    } catch {
      FastLogger.warn("Worker bot failed to login — falling back to main bot for all ops.");
      this.workerClient = null;
      this.workerRest = null;
    }
  }

  private static getOpKey(op: WorkerOp): string {
    if ("channelId" in op) {
      return op.channelId;
    }
    if ("guildId" in op && "memberId" in op) {
      return `${op.guildId}:${op.memberId}`;
    }
    return "global";
  }

  public static dispatch(op: WorkerOp): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.queue.length >= this.MAX_QUEUE_SIZE) {
        FastLogger.warn(`Worker queue overflow (${this.queue.length} items) — rejecting op ${op.type}`);
        resolve(false);
        return;
      }
      this.queue.push({ op, resolve, reject });
      this.drain();
    });
  }

  public static dispatchBatch(ops: WorkerOp[]): Promise<boolean[]> {
    if (ops.length === 0) return Promise.resolve([]);
    return Promise.all(ops.map((op) => this.dispatch(op)));
  }

  private static drain(): void {
    while (this.runningCount < this.CONCURRENCY && this.queue.length > 0) {
      const index = this.queue.findIndex((task) => !this.activeLocks.has(this.getOpKey(task.op)));
      if (index === -1) break;

      const [task] = this.queue.splice(index, 1);
      const key = this.getOpKey(task.op);

      this.activeLocks.add(key);
      this.runningCount++;

      void this.executeOp(task.op, this.workerRest)
        .then((success) => task.resolve(success))
        .catch((err) => task.reject(err))
        .finally(() => {
          this.activeLocks.delete(key);
          this.runningCount--;
          this.drain();
        });
    }
  }

  private static async executeOp(op: WorkerOp, rest: REST | null): Promise<boolean> {
    try {
      if (!rest) {
        FastLogger.warn(`No worker REST — skipping op ${op.type}`);
        return false;
      }

      if (op.type === "PERMIT") {
        await rest.put(Routes.channelPermission(op.channelId, op.memberId), {
          body: {
            allow: String(
              PermissionFlagsBits.Connect |
              PermissionFlagsBits.ViewChannel |
              PermissionFlagsBits.SendMessages |
              PermissionFlagsBits.Speak |
              PermissionFlagsBits.Stream
            ),
            deny: "0",
            type: 1
          }
        });
        return true;
      }

      if (op.type === "REJECT") {
        await rest.put(Routes.channelPermission(op.channelId, op.memberId), {
          body: {
            allow: String(PermissionFlagsBits.ViewChannel),
            deny: String(PermissionFlagsBits.Connect | PermissionFlagsBits.SendMessages),
            type: 1
          }
        });
        if (op.disconnect) {
          await rest.patch(Routes.guildMember(op.guildId, op.memberId), {
            body: { channel_id: null }
          }).catch(() => {});
        }
        return true;
      }

      if (op.type === "LOCK") {
        await rest.put(Routes.channelPermission(op.channelId, op.everyoneId), {
          body: {
            allow: "0",
            deny: op.lock
              ? String(PermissionFlagsBits.Connect | PermissionFlagsBits.SendMessages)
              : "0",
            type: 0
          }
        });
        return true;
      }

      if (op.type === "TEXT_LOCK") {
        await rest.put(Routes.channelPermission(op.channelId, op.everyoneId), {
          body: {
            allow: "0",
            deny: op.lock ? String(PermissionFlagsBits.SendMessages) : "0",
            type: 0
          }
        });
        return true;
      }

      if (op.type === "HIDE") {
        await rest.put(Routes.channelPermission(op.channelId, op.everyoneId), {
          body: {
            allow: "0",
            deny: op.hidden ? String(PermissionFlagsBits.ViewChannel) : "0",
            type: 0
          }
        });
        return true;
      }

      if (op.type === "OVERWRITE_DELETE") {
        await rest.delete(Routes.channelPermission(op.channelId, op.targetId));
        return true;
      }

      if (op.type === "OVERWRITE_EDIT") {
        await rest.put(Routes.channelPermission(op.channelId, op.targetId), {
          body: { allow: op.allow, deny: op.deny, type: 1 }
        });
        return true;
      }

      if (op.type === "MUTE_VC") {
        await rest.patch(Routes.guildMember(op.guildId, op.memberId), {
          body: { mute: op.mute }
        });
        return true;
      }

      if (op.type === "DEAFEN_VC") {
        await rest.patch(Routes.guildMember(op.guildId, op.memberId), {
          body: { deaf: op.deaf }
        });
        return true;
      }

      if (op.type === "MOVE_MEMBER") {
        await rest.patch(Routes.guildMember(op.guildId, op.memberId), {
          body: { channel_id: op.channelId }
        });
        return true;
      }

      if (op.type === "APPLY_PERMISSIONS") {
        await Promise.allSettled(
          op.overwrites.map((ow) =>
            rest.put(Routes.channelPermission(op.channelId, ow.id), {
              body: { allow: ow.allow, deny: ow.deny, type: ow.type }
            })
          )
        );
        return true;
      }

      if (op.type === "SET_STATUS") {
        await rest.put(`/channels/${op.channelId}/voice-status`, {
          body: { status: op.status }
        }).catch(() => {});
        return true;
      }

      if (op.type === "SEND_PANEL" || op.type === "SEND_LOG") {
        await rest.post(Routes.channelMessages(op.channelId), {
          body: op.payload
        });
        return true;
      }

      if (op.type === "DELETE_CHANNEL") {
        await rest.delete(Routes.channel(op.channelId));
        return true;
      }

      return true;
    } catch (err) {
      FastLogger.error(`Worker op failed [${op.type}]`, err);
      return false;
    }
  }
}
