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
  Routes
} from "discord.js";
import { VoiceLifecycleService } from "../../../modules/voice/services/voice-lifecycle.service";
import { VoicePermissionsManager } from "../../../modules/voice/services/voice-permission.service";
import { VoiceMemoryStore } from "../../../modules/voice/cache/voice.store";
import { PreferencesStore } from "../../../modules/user/cache/preferences.store";
import { Usages } from "../../../shared/embeds/usages";
import { Replies } from "../../../shared/embeds/replies";
import { PanelBuilder } from "../panel.builder";
import { buildChannelInfoPayload } from "../../../modules/voice/commands/settings/stats.command";
import { ThemeManager } from "../../config/theme";
import { ActionLogger } from "../../logger/action.logger";

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
    const member = interaction.member as GuildMember;
    const guildId = interaction.guildId!;
    const customId = interaction.customId;

    if (customId.startsWith("btn_see_members:")) {
      const channelId = customId.split(":")[1];
      const targetChannel = (interaction.guild?.channels.cache.get(channelId) || member?.voice?.channel) as VoiceChannel | null;

      if (!targetChannel || !targetChannel.isVoiceBased()) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "**__Voice channel not found :__**")),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
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
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        components: [container] as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId.startsWith("antiabuse_permit:") || customId.startsWith("antiabuse_deny:")) {
      const parts = customId.split(":");
      const action = parts[0];
      const targetChannelId = parts[1];
      const targetUserId = parts[2];

      const session = VoiceMemoryStore.get(targetChannelId);
      if (!session) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "Voice channel no longer active")),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      if (interaction.user.id !== session.ownerId && !VoiceLifecycleService.isManager(targetChannelId, interaction.user.id)) {
        await interaction.reply({
          ...(await Usages.notManagerOrOwner(guildId)),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      const targetChannel = interaction.guild?.channels.cache.get(targetChannelId) as VoiceChannel | null;

      if (action === "antiabuse_permit") {
        session.whitelist.add(targetUserId);
        VoiceMemoryStore.sync(targetChannelId);

        if (session.antiAbuseAttempts?.has(targetUserId)) {
          session.antiAbuseAttempts.delete(targetUserId);
        }

        const targetMember = interaction.guild?.members.cache.get(targetUserId);
        if (targetChannel && targetMember) {
          await VoicePermissionsManager.permitMember(targetChannel, targetMember);
        } else if (targetChannel) {
          await targetChannel.permissionOverwrites.edit(targetUserId, {
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
        if (targetChannel && targetMember) {
          await VoicePermissionsManager.rejectMember(targetChannel, targetMember);
        } else if (targetChannel) {
          await targetChannel.permissionOverwrites.edit(targetUserId, {
            Connect: false,
            ViewChannel: true,
            SendMessages: false
          }).catch(() => { });
        }

        if (targetMember && targetMember.voice?.channelId === targetChannelId) {
          await targetMember.voice.disconnect().catch(() => { });
        }

        const updatedNotice = await Usages.antiAbuseActionCompleted(guildId, "Deny", session.ownerId, targetUserId);
        await interaction.update(updatedNotice).catch(async () => {
          await interaction.message.edit(updatedNotice).catch(() => { });
        });
        return;
      }
    }

    let channel = member?.voice?.channel as VoiceChannel | null;
    if (!channel && interaction.channel && interaction.channel.isVoiceBased()) {
      channel = interaction.channel as VoiceChannel;
    }

    if (!channel) {
      await interaction.reply({
        ...(await Usages.notInVoice(guildId)),
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
      }).catch(() => { });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (!session) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "**__This is not a managed temporary voice channel :__**")),
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
      }).catch(() => { });
      return;
    }

    if (customId === "btn:claim") {
      
      if (!channel.members.has(member.id)) {
        await interaction.reply({
          ...(await Usages.notInVoice(guildId)),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      if (session.ownerId === member.id) {
        await interaction.reply({
          ...(await Usages.stopDoingThat(guildId, "You are already the owner of this channel")),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      const ownerInChannel = channel.members.has(session.ownerId);
      if (ownerInChannel) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "**__The owner is still inside the voice channel :__**")),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      for (const oldCoOwnerId of session.coOwners) {
        await channel.permissionOverwrites.delete(oldCoOwnerId).catch(() => { });
      }

      if (session.channelMutes) {
        for (const mutedId of session.channelMutes) {
          const m = channel.members.get(mutedId);
          if (m) await m.voice.setMute(false).catch(() => { });
        }
        session.channelMutes.clear();
      }
      if (session.channelDeafens) {
        for (const deafId of session.channelDeafens) {
          const m = channel.members.get(deafId);
          if (m) await m.voice.setDeaf(false).catch(() => { });
        }
        session.channelDeafens.clear();
      }

      session.coOwners.clear();

      VoiceMemoryStore.reassignOwner(channel.id, member.id);
      VoiceMemoryStore.sync(channel.id);

      const claimedPayload = await Usages.claimedChannel(guildId, member.id);
      if (session.claimPromptMessageId) {
        const promptMsgId = session.claimPromptMessageId;
        session.claimPromptMessageId = undefined;
        await interaction.update(claimedPayload).catch(async () => {
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
      if (!VoiceLifecycleService.isOwner(channel.id, member.id)) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "**__Only the channel owner can transfer ownership :__**")),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
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
      if (!VoiceLifecycleService.isManager(channel.id, member.id)) {
        await interaction.reply({
          ...(await Usages.notManagerOrOwner(guildId)),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      const extraPanelPayload = await PanelBuilder.createExtraPanel(guildId);
      await interaction.reply({
        ...extraPanelPayload,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
      });
      return;
    }

    if (customId === "btn:antiabuse") {
      if (!VoiceLifecycleService.isOwner(channel.id, member.id)) {
        await interaction.reply({
          ...(await Replies.notOwner(guildId)),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
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
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId === "btn:owner") {
      const embed = await Usages.executedAction(guildId, "Owner", `**__Channel Owner :__** <@${session.ownerId}>`);
      await interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (customId === "btn:info") {
      const payload = await buildChannelInfoPayload(channel, guildId);
      await interaction.reply({
        ...payload,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (!VoiceLifecycleService.isManager(channel.id, member.id)) {
      await interaction.reply({
        ...(await Usages.notManagerOrOwner(guildId)),
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
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
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
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
      try {
        await (interaction as any).showModal({
          title: "Temp Reject Member",
          custom_id: "modal:temp_reject",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 5,
                  custom_id: "target_user_select",
                  placeholder: "Select member to temporarily reject...",
                  min_values: 0,
                  max_values: 1
                }
              ]
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "target_user",
                  label: "Or Enter Username / @mention / ID",
                  style: 1,
                  placeholder: "@user | username | ID",
                  required: false
                }
              ]
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "duration",
                  label: "Duration (e.g. 30s, 5m, 1h)",
                  style: 1,
                  placeholder: "10m",
                  required: true,
                  value: "10m"
                }
              ]
            }
          ]
        });
        return;
      } catch {
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
          ...await Usages.alreadyAction(guildId, "You have been already locked the channel"),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }
      session.isLocked = true;
      VoiceMemoryStore.sync(channel.id);

      const embedPromise = Usages.executedAction(guildId, "Lock", "**__Channel has been locked__**");
      const replyPromise = embedPromise.then((embed) => interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
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
          ...await Usages.alreadyAction(guildId, "You have been already unlocked the channel"),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }
      session.isLocked = false;
      VoiceMemoryStore.sync(channel.id);

      const embedPromise = Usages.executedAction(guildId, "Unlock", "**__Channel has been unlocked__**");
      const replyPromise = embedPromise.then((embed) => interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
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
          ...await Usages.alreadyAction(guildId, "You have been already hidden the channel"),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }
      session.isHidden = true;
      VoiceMemoryStore.sync(channel.id);

      const embedPromise = Usages.executedAction(guildId, "Hide", "**__Channel has been hidden :__** The channel is now invisible to members.");
      const replyPromise = embedPromise.then((embed) => interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
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
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }
      session.isHidden = false;
      VoiceMemoryStore.sync(channel.id);

      const embedPromise = Usages.executedAction(guildId, "Unhide", "**__Channel is now visible :__** The channel is now visible to members.");
      const replyPromise = embedPromise.then((embed) => interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
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
          ...await Usages.impossible(guildId, "**__No other eligible members in voice to reject :__**"),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      const randomTarget = candidates[Math.floor(Math.random() * candidates.length)];

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
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
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
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
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
    try {
      await (interaction as any).showModal({
        title,
        custom_id: customId,
        components: [
          {
            type: 1,
            components: [
              {
                type: 5,
                custom_id: "target_user_select",
                placeholder: `${selectLabel}...`,
                min_values: 0,
                max_values: 1
              }
            ]
          },
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: "target_user",
                label: "Or Enter Username / @mention / ID",
                style: 1,
                placeholder: "@user | username | ID",
                required: false
              }
            ]
          }
        ]
      });
    } catch (err: any) {
      console.error("[Modal User Select Error]:", err?.rawError || err?.message || err);
      const modal = new ModalBuilder()
        .setCustomId(customId)
        .setTitle(title)
        .addComponents(
          textInputRow("target_user", "Member (@user, username, or ID)", "@user")
        );
      await interaction.showModal(modal);
    }
  }
}
