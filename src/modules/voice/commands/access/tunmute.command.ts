import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceAuthService } from "../../services/voice-auth.service";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../../shared/utils/member-parser";

export const tunmuteCommand: ICommand = {
  name: "tunmute",
  prefixAliases: ["tunmute", "textunmute"],
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
          "`.v tunmute`",
          "@user | username | `ID`"
        )),
        allowedMentions: { parse: [] }
      });
      return;
    }

    await Promise.all(targets.map((t) => VoicePermissionsManager.muteUserText(channel, t, false)));

    const embed = await Usages.executedAction(
      guildId,
      "Text Unmute",
      Usages.formatUserTarget("unmuted in chat", targets.map((t) => t.id))
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
