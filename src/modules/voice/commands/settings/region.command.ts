import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { Usages } from "../../../../shared/embeds/usages";
import { ActionLogger } from "../../../../core/logger/action.logger";

const VALID_REGIONS = [
  "auto",
  "brazil",
  "rotterdam",
  "frankfurt",
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

    if (!channel) {
      await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    if (!VoiceLifecycleService.isManager(channel.id, member.id)) {
      await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    const input = args[0]?.toLowerCase().trim();

    if (!input || !VALID_REGIONS.includes(input)) {
      const regionList = VALID_REGIONS.map((r) => `\`${r}\``).join(", ");
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

    const rtcVal = input === "auto" ? null : input;
    await channel.setRTCRegion(rtcVal);

    ActionLogger.logAction({
      guildId: guildId!,
      executorId: member.id,
      action: "Voice Region Changed",
      channelName: channel.name,
      details: `RTC Region set to \`${input}\``
    }).catch(() => {});

    const embed = await Usages.executedAction(
      guildId,
      "Region",
      `**__Voice Region changed to__** **\`${input.toUpperCase()}\`**`
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
