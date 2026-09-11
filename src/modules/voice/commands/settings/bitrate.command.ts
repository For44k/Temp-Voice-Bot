import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { Usages } from "../../../../shared/embeds/usages";
import { ActionLogger } from "../../../../core/logger/action.logger";

export const bitrateCommand: ICommand = {
  name: "bitrate",
  prefixAliases: ["bitrate", "quality", "br"],
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

    const raw = args[0]?.toLowerCase().replace(/kbps|k/g, "").trim();
    const kbps = parseInt(raw || "", 10);

    if (isNaN(kbps) || kbps < 8 || kbps > 384) {
      await message.reply({
        ...(await Usages.invalidCommand(guildId, "`.v bitrate <8-384>`", "`.v bitrate 64` | `.v bitrate 128`")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const maxBitrate = channel.guild.maximumBitrate;
    const targetBps = kbps * 1000;

    if (targetBps > maxBitrate) {
      const maxKbps = Math.floor(maxBitrate / 1000);
      await message.reply({
        ...(await Usages.impossible(guildId, `**__Server tier limit reached. Max bitrate for this server is \`${maxKbps} kbps\` :__**`)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    await channel.setBitrate(targetBps);

    ActionLogger.logAction({
      guildId: guildId!,
      executorId: member.id,
      action: "Bitrate Changed",
      channelName: channel.name,
      details: `Bitrate set to \`${kbps} kbps\``
    }).catch(() => {});

    const embed = await Usages.executedAction(
      guildId,
      "Bitrate",
      `**__Voice Channel Bitrate set to__** **\`${kbps} kbps\`**`
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
