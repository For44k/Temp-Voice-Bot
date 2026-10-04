import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceAuthService } from "../../services/voice-auth.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../../shared/utils/member-parser";

export const muteCommand: ICommand = {
  name: "mute",
  prefixAliases: ["mute", "vmute"],
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
    const validTargets = targets.filter((t) => VoiceAuthService.canManageTarget(channel.id, member.id, t.id, message.guild));

    if (validTargets.length === 0) {
      await message.reply({
        ...(await Usages.invalidCommand(guildId, "`.v mute`")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (session) {
      if (!session.channelMutes) session.channelMutes = new Set();
      for (const t of validTargets) {
        session.channelMutes.add(t.id);
      }
    }

    await Promise.all(
      validTargets.map((t) => {
        if (t.voice.channelId === channel.id) {
          return t.voice.setMute(true).catch(() => {});
        }
        return Promise.resolve();
      })
    );

    const embed = await Usages.executedAction(
      guildId,
      "Mute",
      Usages.formatUserTarget("server muted in voice", validTargets.map((t) => t.id))
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
