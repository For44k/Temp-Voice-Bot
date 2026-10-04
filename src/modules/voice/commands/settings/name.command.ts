import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceSettingsService } from "../../services/voice-settings.service";
import { Usages } from "../../../../shared/embeds/usages";

export const nameCommand: ICommand = {
  name: "name",
  prefixAliases: ["name"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    const rawName = args.join(" ");
    const result = await VoiceSettingsService.renameChannel(channel, member, rawName);

    switch (result.status) {
      case "not_in_voice": {
        await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "not_manager": {
        await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "empty_name": {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, "`.v name <newname>`")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "invalid_name": {
        await message.reply({
          ...(await Usages.invalidInputWarning(guildId)),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "same_name": {
        const embed = await Usages.alreadyAction(guildId, `The channel is already named \`${result.name}\``);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      case "cooldown": {
        await message.reply({
          ...(await Usages.renameCooldown(guildId, result.retryAfterSeconds)),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "failed": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Failed to update channel name on Discord :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "renamed": {
        const embed = await Usages.executedAction(
          guildId,
          "Name",
          `Voice channel name updated to : \`${result.name}\``
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
    }
  }
};

export const renameCommand = nameCommand;
