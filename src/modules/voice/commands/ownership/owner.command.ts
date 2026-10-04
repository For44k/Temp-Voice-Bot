import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../../shared/utils/member-parser";

export const ownerCommand: ICommand = {
  name: "owner",
  prefixAliases: ["owner", "transfer"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    if (!channel) {
      await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (!session) {
      await message.reply({ ...(await Usages.impossible(guildId, "**__Channel is not managed :__**")), allowedMentions: { parse: [] } });
      return;
    }

    if (!args[0]) {
      const embed = await Usages.executedAction(guildId, "Owner", `**__Current owner is__** <@${session.ownerId}>`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    const targets = await extractTargetMembers(message, args, 1);
    if (targets.length === 0) {
      await message.reply({ ...(await Usages.impossible(guildId, "**__User not found :__**")), allowedMentions: { parse: [] } });
      return;
    }

    const targetMember = targets[0];
    const result = await VoicePermissionsManager.executeTransferOwner(channel, member, targetMember);

    switch (result.status) {
      case "not_in_voice": {
        await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "not_owner": {
        await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "target_is_self": {
        const embed = await Usages.alreadyAction(guildId, "You are already the channel owner");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      case "target_is_bot": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__You cannot transfer ownership to a bot :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "target_not_in_channel": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Target user is not in the voice channel :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "failed": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Failed to transfer ownership on Discord :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "transferred": {
        const embed = await Usages.executedAction(
          guildId,
          "Transfer",
          `**__Ownership Transferred :__** Transferred channel ownership to <@${result.newOwner.id}>`
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
    }
  }
};
