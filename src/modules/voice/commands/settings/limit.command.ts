import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceSettingsService } from "../../services/voice-settings.service";
import { Usages } from "../../../../shared/embeds/usages";

export const limitCommand: ICommand = {
  name: "limit",
  prefixAliases: ["limit"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    const result = await VoiceSettingsService.setLimit(channel, member, args[0]);

    switch (result.status) {
      case "not_in_voice": {
        await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "not_manager": {
        await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "invalid_limit": {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, "`.v limit <0-99>`")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "same_limit": {
        const embed = await Usages.alreadyAction(guildId, `The channel limit is already set to \`${result.limit}\``);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      case "failed": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Failed to update user limit on Discord :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "updated": {
        const embed = await Usages.executedAction(
          guildId,
          "Limit",
          `Voice channel limit updated to : \`${result.limit}\``
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
    }
  }
};
