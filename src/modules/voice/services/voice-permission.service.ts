import { VoiceChannel, GuildMember, PermissionFlagsBits } from "discord.js";
import { TaskWorkerQueue } from "../../../core/workers/task-worker.queue";

export class VoicePermissionsManager {

  private static useWorker(): boolean {
    return TaskWorkerQueue.hasWorker;
  }

  public static async setConnectionLock(channel: VoiceChannel, lock: boolean): Promise<void> {
    const everyoneId = channel.guild.roles.everyone.id;
    if (this.useWorker()) {
      await TaskWorkerQueue.dispatch({ type: "LOCK", channelId: channel.id, guildId: channel.guildId, everyoneId, lock });
    } else {
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        Connect: lock ? false : null,
        SendMessages: lock ? false : null
      });
    }
  }

  public static async setTextLock(channel: VoiceChannel, lock: boolean): Promise<void> {
    const everyoneId = channel.guild.roles.everyone.id;
    if (this.useWorker()) {
      await TaskWorkerQueue.dispatch({ type: "TEXT_LOCK", channelId: channel.id, guildId: channel.guildId, everyoneId, lock });
    } else {
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        SendMessages: lock ? false : null
      });
    }
  }

  public static async setVisibility(channel: VoiceChannel, hidden: boolean): Promise<void> {
    const everyoneId = channel.guild.roles.everyone.id;
    if (this.useWorker()) {
      await TaskWorkerQueue.dispatch({ type: "HIDE", channelId: channel.id, guildId: channel.guildId, everyoneId, hidden });
    } else {
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        ViewChannel: hidden ? false : null
      });
    }
  }

  public static async permitMember(channel: VoiceChannel, member: GuildMember): Promise<void> {
    if (this.useWorker()) {
      await TaskWorkerQueue.dispatch({ type: "PERMIT", channelId: channel.id, guildId: channel.guildId, memberId: member.id });
      return;
    }
    await channel.permissionOverwrites.edit(member, {
      Connect: true,
      ViewChannel: true,
      SendMessages: true,
      Speak: true,
      Stream: true
    });
  }

  public static permitMemberSync(channel: VoiceChannel, member: GuildMember): void {
    void TaskWorkerQueue.dispatch({ type: "PERMIT", channelId: channel.id, guildId: channel.guildId, memberId: member.id });
  }

  public static async rejectMember(channel: VoiceChannel, member: GuildMember): Promise<void> {
    const disconnect = member.voice.channelId === channel.id;
    if (this.useWorker()) {
      await TaskWorkerQueue.dispatch({ type: "REJECT", channelId: channel.id, guildId: channel.guildId, memberId: member.id, disconnect });
      return;
    }
    await channel.permissionOverwrites.edit(member, {
      Connect: false,
      ViewChannel: true,
      SendMessages: false
    });
    if (disconnect) await member.voice.disconnect().catch(() => {});
  }

  public static async kickMember(_channel: VoiceChannel, member: GuildMember): Promise<void> {
    if (member.voice.channelId) {
      await member.voice.disconnect().catch(() => {});
    }
  }

  public static async resetMember(channel: VoiceChannel, member: GuildMember): Promise<void> {
    if (this.useWorker()) {
      await TaskWorkerQueue.dispatch({ type: "OVERWRITE_DELETE", channelId: channel.id, guildId: channel.guildId, targetId: member.id });
      return;
    }
    await channel.permissionOverwrites.delete(member);
  }

  public static async muteUserText(channel: VoiceChannel, member: GuildMember, mute: boolean): Promise<void> {
    await channel.permissionOverwrites.edit(member, { SendMessages: mute ? false : null });
  }

  public static async muteVcMember(guildId: string, memberId: string, mute: boolean): Promise<void> {
    if (this.useWorker()) {
      await TaskWorkerQueue.dispatch({ type: "MUTE_VC", guildId, memberId, mute });
    }
  }

  public static async deafenVcMember(guildId: string, memberId: string, deaf: boolean): Promise<void> {
    if (this.useWorker()) {
      await TaskWorkerQueue.dispatch({ type: "DEAFEN_VC", guildId, memberId, deaf });
    }
  }

  public static async bulkPermit(channel: VoiceChannel, members: GuildMember[]): Promise<void> {
    if (members.length === 0) return;
    if (this.useWorker()) {
      const mid = Math.ceil(members.length / 2);
      const workerBatch = members.slice(0, mid);
      const mainBatch = members.slice(mid);

      await Promise.all([
        TaskWorkerQueue.dispatchBatch(
          workerBatch.map((m) => ({ type: "PERMIT" as const, channelId: channel.id, guildId: channel.guildId, memberId: m.id }))
        ),
        Promise.all(
          mainBatch.map((m) =>
            channel.permissionOverwrites.edit(m, { Connect: true, ViewChannel: true, SendMessages: true, Speak: true, Stream: true })
          )
        )
      ]);
    } else {
      await Promise.all(
        members.map((m) =>
          channel.permissionOverwrites.edit(m, { Connect: true, ViewChannel: true, SendMessages: true, Speak: true, Stream: true })
        )
      );
    }
  }

  public static async bulkReject(channel: VoiceChannel, members: GuildMember[]): Promise<void> {
    if (members.length === 0) return;
    if (this.useWorker()) {
      const mid = Math.ceil(members.length / 2);
      const workerBatch = members.slice(0, mid);
      const mainBatch = members.slice(mid);

      await Promise.all([
        TaskWorkerQueue.dispatchBatch(
          workerBatch.map((m) => ({
            type: "REJECT" as const,
            channelId: channel.id,
            guildId: channel.guildId,
            memberId: m.id,
            disconnect: m.voice.channelId === channel.id
          }))
        ),
        Promise.all(
          mainBatch.map(async (m) => {
            await channel.permissionOverwrites.edit(m, { Connect: false, ViewChannel: true, SendMessages: false }).catch(() => {});
            if (m.voice.channelId === channel.id) await m.voice.disconnect().catch(() => {});
          })
        )
      ]);
    } else {
      await Promise.all(
        members.map(async (m) => {
          await channel.permissionOverwrites.edit(m, { Connect: false, ViewChannel: true, SendMessages: false });
          if (m.voice.channelId === channel.id) await m.voice.disconnect().catch(() => {});
        })
      );
    }
  }
}
