import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { Usages } from "../../../../shared/embeds/usages";

export const tlockCommand: ICommand = {
  name: "tlock",
  prefixAliases: ["tlock"],
  async executePrefix(message: Message): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    const result = await VoicePermissionsManager.executeTextLock(channel, member, true);

    switch (result.status) {
      case "not_in_voice": {
        await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "not_manager": {
        await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "already_locked": {
        const embed = await Usages.alreadyAction(guildId, "Text chat is already locked");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      case "failed": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Failed to lock text chat on Discord :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "locked": {
        const embed = await Usages.executedAction(
          guildId,
          "Text Lock",
          "**__Text chat has been locked :__** Only Managers and Permitted users can send messages."
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      default: {
        return;
      }
    }
  }
};
