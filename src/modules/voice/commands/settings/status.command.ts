import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceSettingsService } from "../../services/voice-settings.service";
import { Usages } from "../../../../shared/embeds/usages";

export const statusCommand: ICommand = {
  name: "status",
  prefixAliases: ["status", "vstatus", "setstatus"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const member = message.member;
    if (!member || !(member instanceof GuildMember)) return;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;
    if (!guildId) return;

    const newStatus = args.join(" ").trim();
    const result = await VoiceSettingsService.setStatus(channel, member, newStatus);

    switch (result.status) {
      case "not_in_voice": {
        await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "not_manager": {
        await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "invalid_status": {
        await message.reply({
          ...(await Usages.invalidInputWarning(guildId)),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "same_status": {
        const embed = await Usages.alreadyAction(guildId, `Voice status is already set to \`${result.textStatus}\``);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      case "cleared": {
        const embed = await Usages.executedAction(
          guildId,
          "Voice Status",
          "Voice channel status has been cleared."
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      case "failed": {
        const embed = await Usages.impossible(guildId, "**__Failed to update voice status on Discord :__**");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      case "updated": {
        const embed = await Usages.executedAction(
          guildId,
          "Voice Status",
          `Voice status updated to : \`${result.textStatus}\``
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
    }
  }
};
