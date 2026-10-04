import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { Usages } from "../../../../shared/embeds/usages";

export const tunlockCommand: ICommand = {
  name: "tunlock",
  prefixAliases: ["tunlock"],
  async executePrefix(message: Message): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    const result = await VoicePermissionsManager.executeTextLock(channel, member, false);

    switch (result.status) {
      case "not_in_voice": {
        await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "not_manager": {
        await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "already_unlocked": {
        const embed = await Usages.alreadyAction(guildId, "Text chat is already unlocked");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      case "failed": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Failed to unlock text chat on Discord :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "unlocked": {
        const embed = await Usages.executedAction(
          guildId,
          "Text Unlock",
          "**__Text chat has been unlocked :__** Everyone can send messages."
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
