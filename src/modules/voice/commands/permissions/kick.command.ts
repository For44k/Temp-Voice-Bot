import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../../shared/utils/member-parser";

export const kickCommand: ICommand = {
  name: "kick",
  prefixAliases: ["kick", "kkick", "dc", "disconnect"],
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

    const extracted = await extractTargetMembers(message, args);
    const targets = extracted.filter(
      (m) => m.voice.channelId === channel.id && VoiceLifecycleService.canManageTarget(channel.id, member.id, m.id)
    );

    if (targets.length === 0) {
      await message.reply({
        ...(await Usages.invalidCommand(guildId, "`.v kick`")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    await Promise.all(targets.map((m) => VoicePermissionsManager.kickMember(channel, m)));

    const ids = targets.map((m) => m.id);
    const embed = await Usages.executedAction(guildId, "Kick", Usages.formatUserTarget("kicked", ids));
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
