import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceAuthService } from "../../services/voice-auth.service";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../../shared/utils/member-parser";

export const tmuteCommand: ICommand = {
  name: "tmute",
  prefixAliases: ["tmute", "textmute"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    if (!channel) {
      await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    if (!VoiceAuthService.isManager(channel.id, member.id)) {
      await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    const targets = await extractTargetMembers(message, args);
    if (targets.length === 0) {
      await message.reply({
        ...(await Usages.invalidCommand(
          guildId,
          "`.v tmute`",
          "@user | username | `ID`"
        )),
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (targets.some((t) => t.id === member.id)) {
      await message.reply({
        ...(await Usages.stopDoingThat(guildId, "You Can't Mute yourself in chat")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const validTargets = targets.filter((t) => {
      return VoiceAuthService.canManageTarget(channel.id, member.id, t.id, message.guild);
    });

    if (validTargets.length === 0) {
      await message.reply({
        ...(await Usages.impossible(guildId, "You cannot mute room managers or owners")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    await Promise.all(validTargets.map((t) => VoicePermissionsManager.muteUserText(channel, t, true)));

    const embed = await Usages.executedAction(
      guildId,
      "Text Mute",
      Usages.formatUserTarget("muted in chat", validTargets.map((t) => t.id))
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
