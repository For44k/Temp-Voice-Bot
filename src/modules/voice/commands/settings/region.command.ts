import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceSettingsService } from "../../services/voice-settings.service";
import { Usages } from "../../../../shared/embeds/usages";

const REGION_OPTIONS = [
  "auto",
  "brazil",
  "rotterdam",
  "hongkong",
  "india",
  "japan",
  "russia",
  "singapore",
  "southafrica",
  "sydney",
  "us-central",
  "us-east",
  "us-south",
  "us-west"
];

export const regionCommand: ICommand = {
  name: "region",
  prefixAliases: ["region", "rtc", "serverregion"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    const input = args[0]?.toLowerCase().trim() || "";
    const result = await VoiceSettingsService.setRegion(channel, member, input);

    switch (result.status) {
      case "not_in_voice": {
        await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "not_manager": {
        await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "invalid_region": {
        const regionList = REGION_OPTIONS.map((r) => `\`${r}\``).join(", ");
        await message.reply({
          ...(await Usages.invalidCommand(
            guildId,
            "`.v region <location>`",
            `Available: ${regionList}`
          )),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "same_region": {
        const embed = await Usages.alreadyAction(guildId, `Voice channel region is already set to \`${result.region || "AUTOMATIC"}\``);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      case "failed": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Failed to update region on Discord :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "updated": {
        const display = result.region ? result.region.toUpperCase() : "AUTOMATIC";
        const embed = await Usages.executedAction(
          guildId,
          "Region",
          `**__Voice Region changed to__** **\`${display}\`**`
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
    }
  }
};
