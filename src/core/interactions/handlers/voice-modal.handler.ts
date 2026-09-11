import {
  ModalSubmitInteraction,
  VoiceChannel,
  GuildMember,
  MessageFlags
} from "discord.js";
import { VoiceLifecycleService } from "../../../modules/voice/services/voice-lifecycle.service";
import { VoicePermissionsManager } from "../../../modules/voice/services/voice-permission.service";
import { VoiceMemoryStore } from "../../../modules/voice/cache/voice.store";
import { Usages } from "../../../shared/embeds/usages";
import { ActionLogger } from "../../logger/action.logger";

export class VoiceModalHandler {
  public static async handle(interaction: ModalSubmitInteraction): Promise<void> {
    const member = interaction.member as GuildMember;
    const guildId = interaction.guildId!;
    const channel = member?.voice?.channel as VoiceChannel | null;

    if (!channel) {
      await interaction.deferUpdate().catch(() => {});
      return;
    }

    const customId = interaction.customId;
    const session = VoiceMemoryStore.get(channel.id);

    if (customId === "modal:transfer") {
      if (!VoiceLifecycleService.isOwner(channel.id, member.id)) {
        await interaction.deferUpdate().catch(() => {});
        return;
      }

      const targetMember = await this.extractTargetMember(interaction);
      if (!targetMember) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "**__User not found :__**")),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      if (session) {
        for (const oldCoOwnerId of session.coOwners) {
          await channel.permissionOverwrites.delete(oldCoOwnerId).catch(() => {});
        }
        session.coOwners.clear();
      }

      await channel.permissionOverwrites.edit(targetMember.id, {
        Connect: true,
        Speak: true,
        Stream: true,
        ViewChannel: true,
        MoveMembers: true,
        SendMessages: true
      }).catch(() => {});

      VoiceMemoryStore.reassignOwner(channel.id, targetMember.id);
      VoiceMemoryStore.sync(channel.id);

      ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Ownership Transferred",
        channelName: channel.name,
        targetId: targetMember.id
      }).catch(() => {});

      const embed = await Usages.executedAction(
        guildId,
        "Transfer",
        `**__Ownership Transferred :__** Transferred channel ownership to <@${targetMember.id}>`
      );
      await interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (!VoiceLifecycleService.isManager(channel.id, member.id)) {
      await interaction.deferUpdate().catch(() => {});
      return;
    }

    if (customId === "modal:rename") {
      const rawName = interaction.fields.getTextInputValue("channel_name");
      const sanitized = Usages.sanitize(rawName).slice(0, 100);

      if (!Usages.isValidChannelName(sanitized)) {
        await interaction.reply({
          ...(await Usages.invalidInputWarning(guildId)),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      if (channel.name === sanitized) {
        const embed = await Usages.alreadyAction(guildId, `The channel is already named \`${sanitized}\``);
        await interaction.reply({
          ...embed,
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      const rateCheck = VoiceLifecycleService.canRename(channel.id);
      if (!rateCheck.allowed) {
        await interaction.reply({
          ...(await Usages.renameCooldown(guildId, rateCheck.waitSeconds || 0)),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      await channel.setName(sanitized);

      ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Channel Renamed",
        channelName: sanitized,
        details: `\`${channel.name}\` -> \`${sanitized}\``
      }).catch(() => {});

      const embed = await Usages.executedAction(
        guildId,
        "Rename",
        `**__Channel Name has been changed to__** **\`${sanitized}\`**`
      );
      await interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId === "modal:limit") {
      const rawLimit = interaction.fields.getTextInputValue("room_limit");
      const amount = parseInt(rawLimit, 10);

      if (isNaN(amount) || amount < 0 || amount > 99) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "**__Please provide a valid limit between 0 and 99 :__**")),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      if (channel.userLimit === amount) {
        const embed = await Usages.alreadyAction(guildId, `The channel limit is already set to \`${amount}\``);
        await interaction.reply({
          ...embed,
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      await channel.setUserLimit(amount);

      ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Channel Limit Changed",
        channelName: channel.name,
        details: `Limit set to \`${amount}\``
      }).catch(() => {});

      const embed = await Usages.executedAction(
        guildId,
        "Limit",
        `**__Channel Limit has been changed to__** **\`${amount}\`**`
      );
      await interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    const targetMember = await this.extractTargetMember(interaction);
    if (!targetMember) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "**__User not found :__**")),
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
      });
      return;
    }

    if (targetMember.id === member.id) {
      if (customId === "modal:reject" || customId === "modal:temp_reject") {
        await interaction.reply({
          ...(await Usages.selfReject(guildId)),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }
      if (customId === "modal:permit") {
        await interaction.reply({
          ...(await Usages.stopDoingThat(guildId, "You Can't Permit yourself")),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }
    }

    if (!VoiceLifecycleService.canManageTarget(channel.id, member.id, targetMember.id)) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "**__Cannot manage the owner or fellow trusted managers :__**")),
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
      });
      return;
    }

    if (customId === "modal:reject") {
      const overwrite = channel.permissionOverwrites.cache.get(targetMember.id);
      if (overwrite && overwrite.deny.has("Connect")) {
        const embed = await Usages.stopDoingThat(guildId, "You Can't Reject someone he is already Rejected");
        await interaction.reply({
          ...embed,
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      await VoicePermissionsManager.rejectMember(channel, targetMember);
      if (session) {
        session.whitelist.delete(targetMember.id);
        VoiceMemoryStore.sync(channel.id);
      }
      ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Member Rejected",
        channelName: channel.name,
        targetId: targetMember.id
      }).catch(() => {});
      const embed = await Usages.executedAction(
        guildId,
        "Reject",
        Usages.formatUserTarget("rejected", [targetMember.id])
      );
      await interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId === "modal:permit") {
      const overwrite = channel.permissionOverwrites.cache.get(targetMember.id);
      if (overwrite && overwrite.allow.has("Connect")) {
        const embed = await Usages.stopDoingThat(guildId, "You Can't Permit someone he is already Permitted");
        await interaction.reply({
          ...embed,
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      await VoicePermissionsManager.permitMember(channel, targetMember);
      if (session) {
        session.whitelist.add(targetMember.id);
        VoiceMemoryStore.sync(channel.id);
      }
      ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Member Permitted",
        channelName: channel.name,
        targetId: targetMember.id
      }).catch(() => {});
      const embed = await Usages.executedAction(
        guildId,
        "Permit",
        Usages.formatUserTarget("permitted", [targetMember.id])
      );
      await interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId === "modal:mute") {
      if (session) {
        if (!session.channelMutes) session.channelMutes = new Set();
        session.channelMutes.add(targetMember.id);
      }
      if (targetMember.voice.channelId === channel.id) {
        await targetMember.voice.setMute(true).catch(() => {});
      }
      ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Member Voice Muted",
        channelName: channel.name,
        targetId: targetMember.id
      }).catch(() => {});
      const embed = await Usages.executedAction(
        guildId,
        "Mute",
        `**__User has been server muted in voice :__** <@${targetMember.id}>`
      );
      await interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId === "modal:deafen") {
      if (session) {
        if (!session.channelDeafens) session.channelDeafens = new Set();
        session.channelDeafens.add(targetMember.id);
      }
      if (targetMember.voice.channelId === channel.id) {
        await targetMember.voice.setDeaf(true).catch(() => {});
      }
      ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Member Voice Deafened",
        channelName: channel.name,
        targetId: targetMember.id
      }).catch(() => {});
      const embed = await Usages.executedAction(
        guildId,
        "Deafen",
        `**__User has been server deafened in voice :__** <@${targetMember.id}>`
      );
      await interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId === "modal:temp_reject") {
      const durationStr = interaction.fields.getTextInputValue("duration").trim();
      const ms = this.parseDuration(durationStr);

      if (!ms || ms < 5000 || ms > 86400000) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "**__Invalid duration. Use format like 30s, 5m, 1h (min 5s, max 24h) :__**")),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      await VoicePermissionsManager.rejectMember(channel, targetMember);

      setTimeout(async () => {
        const stillChannel = interaction.guild?.channels.cache.get(channel.id) as VoiceChannel | undefined;
        if (stillChannel) {
          await Promise.resolve(VoicePermissionsManager.resetMember(stillChannel, targetMember)).catch(() => {});
        }
      }, ms);

      ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Member Temp Rejected",
        channelName: channel.name,
        targetId: targetMember.id,
        details: `Duration: \`${durationStr}\``
      }).catch(() => {});

      const embed = await Usages.executedAction(
        guildId,
        "Temp Reject",
        `**__User temporarily rejected for \`${durationStr}\` :__** <@${targetMember.id}>`
      );
      await interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        allowedMentions: { parse: [] }
      });
    }
  }

  private static async extractTargetMember(interaction: ModalSubmitInteraction): Promise<GuildMember | null> {
    try {
      const users = (interaction.fields as any).getSelectedUsers?.("target_user_select") || (interaction.fields as any).getSelectedUsers?.("target_user");
      if (users && users.size > 0) {
        const user = users.first();
        const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
        if (member) return member;
      }
    } catch {}

    try {
      const selectValues = (interaction.fields as any).getStringSelectValues?.("target_user_select") || (interaction.fields as any).getStringSelectValues?.("target_user");
      if (selectValues && selectValues.length > 0 && selectValues[0]) {
        const member = await interaction.guild?.members.fetch(selectValues[0]).catch(() => null);
        if (member) return member;
      }
    } catch {}

    try {
      const raw = interaction.fields.getTextInputValue("target_user")?.trim();
      if (!raw) return null;
      const rawId = raw.replace(/[<@!>]/g, "");
      if (/^\d{17,20}$/.test(rawId)) {
        const member = await interaction.guild?.members.fetch(rawId).catch(() => null);
        if (member) return member;
      }
      const search = raw.toLowerCase().replace(/^@/, "");
      const found = interaction.guild?.members.cache.find(
        (m) =>
          m.user.username.toLowerCase() === search ||
          m.user.globalName?.toLowerCase() === search ||
          m.displayName.toLowerCase() === search
      );
      if (found) return found;
    } catch {}

    return null;
  }

  private static parseDuration(input: string): number | null {
    const match = input.match(/^(\d+)\s*(s|sec|seconds?|m|min|minutes?|h|hours?)$/i);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    if (unit.startsWith("s")) return value * 1000;
    if (unit.startsWith("m")) return value * 60 * 1000;
    if (unit.startsWith("h")) return value * 60 * 60 * 1000;
    return null;
  }
}
