import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { Usages } from "../../../../shared/embeds/usages";

export const limitCommand: ICommand = {
  name: "limit",
  prefixAliases: ["limit"],
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

    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount < 0 || amount > 99) {
      await message.reply({
        ...(await Usages.invalidCommand(guildId, "`.v limit <0-99>`")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (channel.userLimit === amount) {
      const embed = await Usages.alreadyAction(guildId, `The channel limit is already set to \`${amount}\``);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    await channel.setUserLimit(amount);

    const embed = await Usages.executedAction(
      guildId,
      "Limit",
      `**__Channel Limit has been changed to__** **\`${amount}\`**`
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
