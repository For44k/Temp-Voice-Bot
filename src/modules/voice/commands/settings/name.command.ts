import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { Usages } from "../../../../shared/embeds/usages";

export const nameCommand: ICommand = {
  name: "name",
  prefixAliases: ["name"],
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

    const rawName = args.join(" ").trim();
    if (!rawName) {
      await message.reply({
        ...(await Usages.invalidCommand(guildId, "`.v name <newname>`")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const sanitized = Usages.sanitize(rawName).slice(0, 100);
    if (!Usages.isValidChannelName(sanitized)) {
      await message.reply({
        ...(await Usages.invalidInputWarning(guildId)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (channel.name === sanitized) {
      const embed = await Usages.alreadyAction(guildId, `The channel is already named \`${sanitized}\``);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    const rateCheck = VoiceLifecycleService.canRename(channel.id);
    if (!rateCheck.allowed) {
      await message.reply({
        ...(await Usages.renameCooldown(guildId, rateCheck.waitSeconds || 0)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    await channel.setName(sanitized);

    const embed = await Usages.executedAction(
      guildId,
      "Name",
      `**__Voice channel name updated to :__ **\`${sanitized}\`**`
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};

export const renameCommand = nameCommand;
