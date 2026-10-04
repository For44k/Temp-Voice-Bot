import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceSettingsService } from "../../services/voice-settings.service";
import { Usages } from "../../../../shared/embeds/usages";

export const bitrateCommand: ICommand = {
  name: "bitrate",
  prefixAliases: ["bitrate", "quality", "br"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    const raw = args[0]?.toLowerCase().replace(/kbps|k/g, "").trim();
    const result = await VoiceSettingsService.setBitrate(channel, member, raw || "");

    switch (result.status) {
      case "not_in_voice": {
        await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "not_manager": {
        await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "invalid_bitrate": {
        await message.reply({
          ...(await Usages.invalidCommand(
            guildId,
            `\`.v bitrate <8-${result.maxAllowedKbps}>\``,
            "`.v bitrate 64` | `.v bitrate 128`"
          )),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "same_bitrate": {
        const embed = await Usages.alreadyAction(guildId, `Voice channel bitrate is already \`${result.bitrateKbps} kbps\``);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      case "failed": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Failed to update bitrate on Discord :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "updated": {
        const embed = await Usages.executedAction(
          guildId,
          "Bitrate",
          `**__Voice Channel Bitrate set to__** **\`${result.bitrateKbps} kbps\`**`
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
    }
  }
};
