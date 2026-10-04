import { VoiceChannel, GuildMember, PermissionFlagsBits } from "discord.js";
import { VoiceMemoryStore } from "../cache/voice.store";
import { VoiceAuthService } from "./voice-auth.service";

export class VoicePermissionsManager {
  public static async setConnectionLock(channel: VoiceChannel, lock: boolean): Promise<void> {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      Connect: lock ? false : null,
      SendMessages: lock ? false : null
    });
  }

  public static async setTextLock(channel: VoiceChannel, lock: boolean): Promise<void> {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      SendMessages: lock ? false : null
    });
  }

  public static async setVisibility(channel: VoiceChannel, hidden: boolean): Promise<void> {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      ViewChannel: hidden ? false : null
    });
  }

  public static async permitMember(channel: VoiceChannel, member: GuildMember): Promise<void> {
    await channel.permissionOverwrites.edit(member, {
      Connect: true,
      ViewChannel: true,
      SendMessages: true,
      Speak: true,
      Stream: true
    });
  }

  public static permitMemberSync(channel: VoiceChannel, member: GuildMember): void {
    void channel.permissionOverwrites.edit(member, {
      Connect: true,
      ViewChannel: true,
      SendMessages: true,
      Speak: true,
      Stream: true
    }).catch(() => {});
  }

  public static async rejectMember(channel: VoiceChannel, member: GuildMember): Promise<void> {
    const disconnect = member.voice.channelId === channel.id;
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
    await channel.permissionOverwrites.delete(member);
  }

  public static async muteUserText(channel: VoiceChannel, member: GuildMember, mute: boolean): Promise<void> {
    await channel.permissionOverwrites.edit(member, { SendMessages: mute ? false : null });
  }

  public static async muteVcMember(guildId: string, memberId: string, mute: boolean): Promise<void> {
    const { BotGateway } = await import("../../../core/gateway/bot.gateway");
    const guild = BotGateway.client?.guilds.cache.get(guildId);
    const member = guild?.members.cache.get(memberId);
    if (member?.voice) {
      await member.voice.setMute(mute).catch(() => {});
    }
  }

  public static async deafenVcMember(guildId: string, memberId: string, deaf: boolean): Promise<void> {
    const { BotGateway } = await import("../../../core/gateway/bot.gateway");
    const guild = BotGateway.client?.guilds.cache.get(guildId);
    const member = guild?.members.cache.get(memberId);
    if (member?.voice) {
      await member.voice.setDeaf(deaf).catch(() => {});
    }
  }

  public static async bulkPermit(channel: VoiceChannel, members: GuildMember[]): Promise<void> {
    if (members.length === 0) return;
    await Promise.all(
      members.map((m) =>
        channel.permissionOverwrites.edit(m, { Connect: true, ViewChannel: true, SendMessages: true, Speak: true, Stream: true })
      )
    );
  }

  public static async bulkReject(channel: VoiceChannel, members: GuildMember[]): Promise<void> {
    if (members.length === 0) return;
    await Promise.all(
      members.map(async (m) => {
        await channel.permissionOverwrites.edit(m, { Connect: false, ViewChannel: true, SendMessages: false });
        if (m.voice.channelId === channel.id) await m.voice.disconnect().catch(() => {});
      })
    );
  }

  public static async transferOwnership(channel: VoiceChannel, oldOwnerId: string, newOwner: GuildMember): Promise<void> {
    const { PreferencesStore } = await import("../../user/cache/preferences.store");
    const { VoiceMemoryStore } = await import("../cache/voice.store");

    const session = VoiceMemoryStore.get(channel.id);
    if (session) {
      for (const oldCoOwnerId of session.coOwners) {
        await channel.permissionOverwrites.delete(oldCoOwnerId).catch(() => {});
      }
      session.coOwners.clear();
      if (session.channelMutes) {
        for (const mutedId of session.channelMutes) {
          const m = channel.members.get(mutedId);
          if (m) await m.voice.setMute(false).catch(() => {});
        }
        session.channelMutes.clear();
      }
      if (session.channelDeafens) {
        for (const deafId of session.channelDeafens) {
          const m = channel.members.get(deafId);
          if (m) await m.voice.setDeaf(false).catch(() => {});
        }
        session.channelDeafens.clear();
      }
    }

    await channel.permissionOverwrites.delete(oldOwnerId).catch(() => {});

    await channel.permissionOverwrites.edit(newOwner.id, {
      Connect: true,
      Speak: true,
      Stream: true,
      ViewChannel: true,
      MoveMembers: true,
      SendMessages: true
    }).catch(() => {});

    const prefs = PreferencesStore.getSync(channel.guildId, newOwner.id);
    for (const blockedId of prefs.blacklist) {
      await channel.permissionOverwrites.edit(blockedId, {
        ViewChannel: true,
        Connect: false,
        SendMessages: false
      }).catch(() => {});
    }

    for (const trustedId of prefs.trusted) {
      await channel.permissionOverwrites.edit(trustedId, {
        Connect: true,
        Speak: true,
        Stream: true,
        ViewChannel: true,
        SendMessages: true
      }).catch(() => {});
      session?.coOwners.add(trustedId);
    }

    for (const wlId of prefs.whitelist) {
      await channel.permissionOverwrites.edit(wlId, {
        Connect: true,
        Speak: true,
        Stream: true,
        ViewChannel: true,
        SendMessages: true
      }).catch(() => {});
      session?.whitelist.add(wlId);
    }

    VoiceMemoryStore.reassignOwner(channel.id, newOwner.id);
    VoiceMemoryStore.sync(channel.id);
  }

  public static async executeLock(channel: VoiceChannel | null, member: GuildMember, lock: boolean): Promise<LockVoiceResult | UnlockVoiceResult> {
    if (!channel) {
      return { status: "not_in_voice" };
    }

    if (!VoiceAuthService.isManager(channel.id, member.id)) {
      return { status: "not_manager" };
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (lock) {
      if (session && session.isLocked) {
        return { status: "already_locked" };
      }
      try {
        await this.setConnectionLock(channel, true);
        if (session) {
          session.isLocked = true;
          VoiceMemoryStore.sync(channel.id);
        }
        return { status: "locked" };
      } catch (err: unknown) {
        return { status: "failed", error: err instanceof Error ? err.message : String(err) };
      }
    } else {
      if (session && !session.isLocked) {
        return { status: "already_unlocked" };
      }
      try {
        await this.setConnectionLock(channel, false);
        if (session) {
          session.isLocked = false;
          VoiceMemoryStore.sync(channel.id);
        }
        return { status: "unlocked" };
      } catch (err: unknown) {
        return { status: "failed", error: err instanceof Error ? err.message : String(err) };
      }
    }
  }

  public static async executeHide(channel: VoiceChannel | null, member: GuildMember, hide: boolean): Promise<HideVoiceResult | UnhideVoiceResult> {
    if (!channel) {
      return { status: "not_in_voice" };
    }

    if (!VoiceAuthService.isManager(channel.id, member.id)) {
      return { status: "not_manager" };
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (hide) {
      if (session && session.isHidden) {
        return { status: "already_hidden" };
      }
      try {
        await this.setVisibility(channel, true);
        if (session) {
          session.isHidden = true;
          VoiceMemoryStore.sync(channel.id);
        }
        return { status: "hidden" };
      } catch (err: unknown) {
        return { status: "failed", error: err instanceof Error ? err.message : String(err) };
      }
    } else {
      if (session && !session.isHidden) {
        return { status: "already_unhidden" };
      }
      try {
        await this.setVisibility(channel, false);
        if (session) {
          session.isHidden = false;
          VoiceMemoryStore.sync(channel.id);
        }
        return { status: "unhidden" };
      } catch (err: unknown) {
        return { status: "failed", error: err instanceof Error ? err.message : String(err) };
      }
    }
  }

  public static async executeTextLock(channel: VoiceChannel | null, member: GuildMember, lock: boolean): Promise<TextLockVoiceResult> {
    if (!channel) {
      return { status: "not_in_voice" };
    }

    if (!VoiceAuthService.isManager(channel.id, member.id)) {
      return { status: "not_manager" };
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (lock) {
      if (session && session.isTextLocked) {
        return { status: "already_locked" };
      }
      try {
        await this.setTextLock(channel, true);
        if (session) {
          session.isTextLocked = true;
          VoiceMemoryStore.sync(channel.id);
        }
        return { status: "locked" };
      } catch (err: unknown) {
        return { status: "failed", error: err instanceof Error ? err.message : String(err) };
      }
    } else {
      if (session && !session.isTextLocked) {
        return { status: "already_unlocked" };
      }
      try {
        await this.setTextLock(channel, false);
        if (session) {
          session.isTextLocked = false;
          VoiceMemoryStore.sync(channel.id);
        }
        return { status: "unlocked" };
      } catch (err: unknown) {
        return { status: "failed", error: err instanceof Error ? err.message : String(err) };
      }
    }
  }

  public static async executeTransferOwner(
    channel: VoiceChannel | null,
    actor: GuildMember,
    target: GuildMember
  ): Promise<TransferOwnerResult> {
    if (!channel) {
      return { status: "not_in_voice" };
    }

    if (!VoiceAuthService.isOwner(channel.id, actor.id)) {
      return { status: "not_owner" };
    }

    if (target.id === actor.id) {
      return { status: "target_is_self" };
    }

    if (target.user.bot) {
      return { status: "target_is_bot" };
    }

    if (!channel.members.has(target.id)) {
      return { status: "target_not_in_channel" };
    }

    try {
      await this.transferOwnership(channel, actor.id, target);
      return { status: "transferred", newOwner: target };
    } catch (err: unknown) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  }
}

export type LockVoiceResult =
  | { status: "locked" }
  | { status: "already_locked" }
  | { status: "not_in_voice" }
  | { status: "not_manager" }
  | { status: "failed"; error?: string };

export type UnlockVoiceResult =
  | { status: "unlocked" }
  | { status: "already_unlocked" }
  | { status: "not_in_voice" }
  | { status: "not_manager" }
  | { status: "failed"; error?: string };

export type HideVoiceResult =
  | { status: "hidden" }
  | { status: "already_hidden" }
  | { status: "not_in_voice" }
  | { status: "not_manager" }
  | { status: "failed"; error?: string };

export type UnhideVoiceResult =
  | { status: "unhidden" }
  | { status: "already_unhidden" }
  | { status: "not_in_voice" }
  | { status: "not_manager" }
  | { status: "failed"; error?: string };

export type TextLockVoiceResult =
  | { status: "locked" }
  | { status: "already_locked" }
  | { status: "unlocked" }
  | { status: "already_unlocked" }
  | { status: "not_in_voice" }
  | { status: "not_manager" }
  | { status: "failed"; error?: string };

export type TransferOwnerResult =
  | { status: "transferred"; newOwner: GuildMember }
  | { status: "not_in_voice" }
  | { status: "not_owner" }
  | { status: "target_not_in_channel" }
  | { status: "target_is_bot" }
  | { status: "target_is_self" }
  | { status: "failed"; error?: string };
