import {
  ButtonInteraction,
  VoiceChannel,
  GuildMember,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  MessageFlags,
  resolveColor,
  UserSelectMenuBuilder
} from "discord.js";
import { VoiceAuthService } from "../../../modules/voice/services/voice-auth.service";
import { VoicePermissionsManager } from "../../../modules/voice/services/voice-permission.service";
import { VoiceMemoryStore } from "../../../modules/voice/cache/voice.store";
import { GuildMemoryStore } from "../../../modules/voice/cache/guild.store";
import { Usages } from "../../../shared/embeds/usages";
import { Replies } from "../../../shared/embeds/replies";
import { PanelBuilder } from "../panel.builder";
import { buildChannelInfoPayload } from "../../../modules/voice/commands/settings/stats.command";
import { ThemeManager } from "../../config/theme";
import { ActionLogger } from "../../logger/action.logger";
import { NeedHelpService } from "../../../modules/voice/commands/management/needhelp.command";

function textInputRow(customId: string, label: string, placeholder: string, value?: string, maxLength = 100): ActionRowBuilder<TextInputBuilder> {
  const input = new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder(placeholder);

  if (value) input.setValue(value);
  if (maxLength) input.setMaxLength(maxLength);

  return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
}

export class VoiceButtonHandler {
  public static async handle(interaction: ButtonInteraction): Promise<void> {
    const member = interaction.member;
    if (!member || !(member instanceof GuildMember)) return;
    const guildId = interaction.guildId;
    if (!guildId) return;
    const customId = interaction.customId;

    if (customId === "btn:need_help") {
      const result = await NeedHelpService.execute(member, guildId);
      await interaction.reply({
        ...result.payload,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId === "btn:ticket") {
      const config = GuildMemoryStore.resolve(guildId) ?? await GuildMemoryStore.resolveAsync(guildId);
      if (config?.ticketTextChannelId) {
        await interaction.reply({
          ...(await Usages.executedAction(guildId, "Ticket", `Please open a ticket in <#${config.ticketTextChannelId}>`)),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
      } else {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "Ticket channel has not been configured yet")),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
      }
      return;
    }

    if (customId.startsWith("btn_see_members:")) {
      const channelId = customId.split(":")[1];
      const targetChannel = (channelId ? interaction.guild?.channels.cache.get(channelId) : null) ?? member.voice.channel;

      if (!targetChannel || !(targetChannel instanceof VoiceChannel)) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "Voice channel not found")),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      const color = await ThemeManager.getColor(guildId);
      const accentColor = color ? resolveColor(color) : null;

      const membersList = targetChannel.members.size > 0
        ? Array.from(targetChannel.members.values())
          .map((m) => `> ### - <@${m.id}> / \`${m.id}\``)
          .join("\n")
        : "> ### - *No users currently in channel*";

      const container = new ContainerBuilder();
      if (accentColor) container.setAccentColor(accentColor);

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# <a:cutehello:1546983161764773939> __All Users In Channel__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(membersList)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container],
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId.startsWith("antiabuse_permit:") || customId.startsWith("antiabuse_deny:")) {
      const parts = customId.split(":");
      const action = parts[0];
      const targetChannelId = parts[1];
      const targetUserId = parts[2];
      if (!targetChannelId || !targetUserId) return;

      const session = VoiceMemoryStore.get(targetChannelId);
      if (!session) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "Voice channel no longer active")),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      if (interaction.user.id !== session.ownerId && !VoiceAuthService.isManager(targetChannelId, interaction.user.id)) {
        await interaction.reply({
          ...(await Usages.notManagerOrOwner(guildId)),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      const targetChannel = interaction.guild?.channels.cache.get(targetChannelId);
      const voiceTargetChannel = targetChannel instanceof VoiceChannel ? targetChannel : null;

      if (!VoiceAuthService.canManageTarget(targetChannelId, interaction.user.id, targetUserId, interaction.guild)) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "Cannot manage administrators or server managers")),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      if (action === "antiabuse_permit") {
        session.whitelist.add(targetUserId);
        VoiceMemoryStore.sync(targetChannelId);

        if (session.antiAbuseAttempts?.has(targetUserId)) {
          session.antiAbuseAttempts.delete(targetUserId);
        }

        const targetMember = interaction.guild?.members.cache.get(targetUserId);
        if (voiceTargetChannel && targetMember) {
          await VoicePermissionsManager.permitMember(voiceTargetChannel, targetMember);
        } else if (voiceTargetChannel) {
          await voiceTargetChannel.permissionOverwrites.edit(targetUserId, {
            Connect: true,
            ViewChannel: true,
            SendMessages: true,
            Speak: true,
            Stream: true
          }).catch(() => { });
        }

        const updatedNotice = await Usages.antiAbuseActionCompleted(guildId, "Permit", session.ownerId, targetUserId);
        await interaction.update(updatedNotice).catch(async () => {
          await interaction.message.edit(updatedNotice).catch(() => { });
        });
        return;
      } else {
        session.whitelist.delete(targetUserId);
        VoiceMemoryStore.sync(targetChannelId);

        const targetMember = interaction.guild?.members.cache.get(targetUserId);
        if (voiceTargetChannel && targetMember) {
          await VoicePermissionsManager.rejectMember(voiceTargetChannel, targetMember);
        } else if (voiceTargetChannel) {
          await voiceTargetChannel.permissionOverwrites.edit(targetUserId, {
            Connect: false,
            ViewChannel: true,
            SendMessages: false
          }).catch(() => { });
        }

        if (targetMember && targetMember.voice.channelId === targetChannelId) {
          await targetMember.voice.disconnect().catch(() => { });
        }

        const updatedNotice = await Usages.antiAbuseActionCompleted(guildId, "Deny", session.ownerId, targetUserId);
        await interaction.update(updatedNotice).catch(async () => {
          await interaction.message.edit(updatedNotice).catch(() => { });
        });
        return;
      }
    }

    let channel = member.voice.channel as VoiceChannel | null;
    if (!channel && interaction.channel && interaction.channel.isVoiceBased()) {
      channel = interaction.channel as VoiceChannel;
    }

    if (!channel) {
      await interaction.reply({
        ...(await Usages.notInVoice(guildId)),
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      }).catch(() => { });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (!session) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "This is not a managed temporary voice channel")),
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      }).catch(() => { });
      return;
    }

    if (customId === "btn:claim") {
      if (!channel.members.has(member.id)) {
        await interaction.reply({
          ...(await Usages.notInVoice(guildId)),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      if (session.ownerId === member.id) {
        await interaction.reply({
          ...(await Usages.stopDoingThat(guildId, "You are already the owner of this channel")),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      const ownerInChannel = channel.members.has(session.ownerId);
      if (ownerInChannel) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "The owner is still inside the voice channel")),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      const oldOwnerId = session.ownerId;
      await VoicePermissionsManager.transferOwnership(channel, oldOwnerId, member);

      const claimedPayload = await Usages.claimedChannel(guildId, member.id);
      if (session.claimPromptMessageId) {
        const promptMsgId = session.claimPromptMessageId;
        session.claimPromptMessageId = undefined;
        await interaction.update(claimedPayload).catch(async () => {
          if (!channel) return;
          const msg = await channel.messages.fetch(promptMsgId).catch(() => null);
          if (msg) await msg.edit(claimedPayload).catch(() => { });
        });
      } else {
        await interaction.update(claimedPayload).catch(async () => {
          await interaction.message.edit(claimedPayload).catch(() => { });
        });
      }

      ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Channel Claimed",
        channelName: channel.name
      }).catch(() => { });
      return;
    }

    if (customId === "modal_open:transfer") {
      if (!VoiceAuthService.isOwner(channel.id, member.id)) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "Only the channel owner can transfer ownership")),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      await this.showUserSelectionModal(
        interaction,
        "modal:transfer",
        "Transfer Ownership",
        "Select New Owner",
        "Choose a member from your channel or type username/ID"
      );
      return;
    }

    if (customId === "btn:extra") {
      if (!VoiceAuthService.isManager(channel.id, member.id)) {
        await interaction.reply({
          ...(await Usages.notManagerOrOwner(guildId)),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      const extraPanelPayload = await PanelBuilder.createExtraPanel(guildId);
      await interaction.reply({
        ...extraPanelPayload,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
      return;
    }

    if (customId === "btn:antiabuse") {
      if (!VoiceAuthService.isOwner(channel.id, member.id)) {
        await interaction.reply({
          ...(await Replies.notOwner(guildId)),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      const currentState = session.antiAbuseEnabled ?? true; 
      session.antiAbuseEnabled = !currentState;
      VoiceMemoryStore.sync(channel.id);

      const statusText = session.antiAbuseEnabled
        ? "__Anti Abuse System Has been Turned On__"
        : "__Anti Abuse System Has been Turned Off__";

      const replyPayload = await Usages.executedAction(guildId, "Anti Abuse", statusText);
      await interaction.reply({
        ...replyPayload,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId === "btn:owner") {
      const embed = await Usages.executedAction(guildId, "Owner", `**__Channel Owner :__** <@${session.ownerId}>`);
      await interaction.reply({
        ...embed,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId === "btn:info") {
      const payload = await buildChannelInfoPayload(channel, guildId);
      await interaction.reply({
        ...payload,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (!VoiceAuthService.isManager(channel.id, member.id)) {
      await interaction.reply({
        ...(await Usages.notManagerOrOwner(guildId)),
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      }).catch(() => { });
      return;
    }

    if (customId === "btn:reset") {
      const current = channel.rtcRegion;
      const next = current === "rotterdam" ? "frankfurt" : (current ? null : "rotterdam");
      await channel.setRTCRegion(next).catch(() => { });
      ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Channel Reset",
        channelName: channel.name
      }).catch(() => { });
      const embed = await Usages.executedAction(guildId, "Reset", "**__Voice channel settings & region have been refreshed.__**");
      await interaction.reply({
        ...embed,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId === "modal_open:reject") {
      await this.showUserSelectionModal(
        interaction,
        "modal:reject",
        "Reject Member",
        "Select Member to Reject",
        "Choose a member or enter username/ID to reject from voice"
      );
      return;
    }

    if (customId === "modal_open:permit") {
      await this.showUserSelectionModal(
        interaction,
        "modal:permit",
        "Permit Member",
        "Select Member to Permit",
        "Choose a member or enter username/ID to permit into voice"
      );
      return;
    }

    if (customId === "modal_open:mute") {
      await this.showUserSelectionModal(
        interaction,
        "modal:mute",
        "Mute Member In VC",
        "Select Member to Mute",
        "Choose a member or enter username/ID to server mute"
      );
      return;
    }

    if (customId === "modal_open:deafen") {
      await this.showUserSelectionModal(
        interaction,
        "modal:deafen",
        "Deafen Member In VC",
        "Select Member to Deafen",
        "Choose a member or enter username/ID to server deafen"
      );
      return;
    }

    if (customId === "modal_open:temp_reject") {
      const modal = new ModalBuilder()
        .setCustomId("modal:temp_reject")
        .setTitle("Temp Reject Member")
        .addComponents(
          textInputRow("target_user", "Member to Temp Reject (@user or ID)", "@user"),
          textInputRow("duration", "Duration (e.g. 30s, 5m, 1h)", "10m")
        );
      await interaction.showModal(modal);
      return;
    }

    if (customId === "modal_open:rename") {
      const modal = new ModalBuilder()
        .setCustomId("modal:rename")
        .setTitle("Rename Voice Channel")
        .addComponents(
          textInputRow("channel_name", "New Channel Name", "My Voice Channel", channel.name, 100)
        );
      await interaction.showModal(modal);
      return;
    }

    if (customId === "modal_open:limit") {
      const modal = new ModalBuilder()
        .setCustomId("modal:limit")
        .setTitle("Set User Limit")
        .addComponents(
          textInputRow("room_limit", "User Limit (0-99)", "0", channel.userLimit ? channel.userLimit.toString() : "0", 2)
        );
      await interaction.showModal(modal);
      return;
    }

    if (customId === "btn:lock") {
      if (session.isLocked) {
        await interaction.reply({
          ...await Usages.alreadyAction(guildId, "The channel is already locked"),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }
      session.isLocked = true;
      VoiceMemoryStore.sync(channel.id);

      const embedPromise = Usages.executedAction(guildId, "Lock", "**__Channel has been locked__**");
      const replyPromise = embedPromise.then((embed) => interaction.reply({
        ...embed,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      }));

      void VoicePermissionsManager.setConnectionLock(channel, true);
      void ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Channel Locked",
        channelName: channel.name
      });

      await replyPromise;
      return;
    }

    if (customId === "btn:unlock") {
      if (!session.isLocked) {
        await interaction.reply({
          ...await Usages.alreadyAction(guildId, "The channel is already unlocked"),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }
      session.isLocked = false;
      VoiceMemoryStore.sync(channel.id);

      const embedPromise = Usages.executedAction(guildId, "Unlock", "**__Channel has been unlocked__**");
      const replyPromise = embedPromise.then((embed) => interaction.reply({
        ...embed,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      }));

      void VoicePermissionsManager.setConnectionLock(channel, false);
      void ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Channel Unlocked",
        channelName: channel.name
      });

      await replyPromise;
      return;
    }

    if (customId === "btn:hide") {
      if (session.isHidden) {
        await interaction.reply({
          ...await Usages.alreadyAction(guildId, "The channel is already hidden"),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }
      session.isHidden = true;
      VoiceMemoryStore.sync(channel.id);

      const embedPromise = Usages.executedAction(guildId, "Hide", "**__Channel has been hidden :__** The channel is now invisible to members.");
      const replyPromise = embedPromise.then((embed) => interaction.reply({
        ...embed,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      }));

      void VoicePermissionsManager.setVisibility(channel, true);
      void ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Channel Hidden",
        channelName: channel.name
      });

      await replyPromise;
      return;
    }

    if (customId === "btn:unhide") {
      if (!session.isHidden) {
        await interaction.reply({
          ...await Usages.alreadyAction(guildId, "The channel is already visible"),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }
      session.isHidden = false;
      VoiceMemoryStore.sync(channel.id);

      const embedPromise = Usages.executedAction(guildId, "Unhide", "**__Channel is now visible :__** The channel is now visible to members.");
      const replyPromise = embedPromise.then((embed) => interaction.reply({
        ...embed,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      }));

      void VoicePermissionsManager.setVisibility(channel, false);
      void ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Channel Unhidden",
        channelName: channel.name
      });

      await replyPromise;
      return;
    }

    if (customId === "btn:random_reject") {
      const candidates = Array.from(channel.members.values()).filter(
        (m) => m.id !== member.id && m.id !== session.ownerId
      );

      if (candidates.length === 0) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "No other eligible members in voice to reject")),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      const randomTarget = candidates[Math.floor(Math.random() * candidates.length)];
      if (!randomTarget) return;

      if (session.coOwners.has(randomTarget.id)) {
        void VoicePermissionsManager.kickMember(channel, randomTarget);
        void ActionLogger.logAction({
          guildId,
          executorId: member.id,
          action: "Random Kick",
          channelName: channel.name,
          targetId: randomTarget.id
        });
        const embed = await Usages.executedAction(guildId, "Random Kick", Usages.formatUserTarget("kicked", [randomTarget.id]));
        await interaction.reply({
          ...embed,
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] }
        });
        return;
      }

      void VoicePermissionsManager.rejectMember(channel, randomTarget);
      void ActionLogger.logAction({
        guildId,
        executorId: member.id,
        action: "Random Reject",
        channelName: channel.name,
        targetId: randomTarget.id
      });
      const embed = await Usages.executedAction(guildId, "Random Reject", Usages.formatUserTarget("rejected", [randomTarget.id]));
      await interaction.reply({
        ...embed,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      });
    }
  }

  private static async showUserSelectionModal(
    interaction: ButtonInteraction,
    customId: string,
    title: string,
    selectLabel: string,
    selectDesc: string
  ): Promise<void> {
    const modal = new ModalBuilder()
      .setCustomId(customId)
      .setTitle(title)
      .addComponents(
        textInputRow("target_user", "Member (@user, username, or ID)", "@user")
      );
    await interaction.showModal(modal);
  }
}
