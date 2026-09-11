import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { BotDeveloperStore } from "../../../user/cache/bot-developer.store";

export const vcCommand: ICommand = {
  name: "vc",
  prefixAliases: ["vc", "forceclaim", "fclaim"],
  async executePrefix(message: Message): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    if (!channel) {
      await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (!session) {
      await message.reply({
        ...(await Usages.impossible(guildId, "**__Channel is not a managed temporary voice room :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const isDev = BotDeveloperStore.isDeveloper(member.id);
    const isAdmin = member.permissions.has("Administrator");
    if (!isDev && !isAdmin) {
      return;
    }

    if (session.ownerId === member.id) {
      await message.reply({
        ...(await Usages.stopDoingThat(guildId, "You are already the owner of this channel")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    for (const oldCoOwnerId of session.coOwners) {
      await channel.permissionOverwrites.delete(oldCoOwnerId).catch(() => {});
    }

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

    session.coOwners.clear();

    if (session.claimPromptMessageId) {
      const promptMsgId = session.claimPromptMessageId;
      session.claimPromptMessageId = undefined;
      channel.messages.fetch(promptMsgId).then(async (msg) => {
        const claimedPayload = await Usages.claimedChannel(guildId, member.id);
        await msg.edit(claimedPayload).catch(() => {});
      }).catch(() => {});
    }

    VoiceMemoryStore.reassignOwner(channel.id, member.id);
    VoiceMemoryStore.sync(channel.id);

    const embed = await Usages.executedAction(
      guildId,
      "Claim",
      `**__Channel Claimed :__** <@${member.id}> is now the owner of the channel!`
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
