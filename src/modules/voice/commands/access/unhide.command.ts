import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { Usages } from "../../../../shared/embeds/usages";

export const unhideCommand: ICommand = {
  name: "unhide",
  prefixAliases: ["unhide"],
  async executePrefix(message: Message): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    const result = await VoicePermissionsManager.executeHide(channel, member, false);

    switch (result.status) {
      case "not_in_voice": {
        await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "not_manager": {
        await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "already_unhidden": {
        const embed = await Usages.alreadyAction(guildId, "The channel is already visible");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      case "failed": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Failed to unhide channel on Discord :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "unhidden": {
        const embed = await Usages.executedAction(
          guildId,
          "Unhide",
          "**__Channel is now visible :__** The channel is now visible to members."
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
    }
  }
};
