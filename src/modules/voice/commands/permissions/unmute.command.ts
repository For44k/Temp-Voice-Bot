import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../../shared/utils/member-parser";

export const unmuteCommand: ICommand = {
  name: "unmute",
  prefixAliases: ["unmute", "vunmute"],
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

    const targets = await extractTargetMembers(message, args);
    if (targets.length === 0) {
      await message.reply({
        ...(await Usages.invalidCommand(guildId, "`.v unmute`")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (session?.channelMutes) {
      for (const t of targets) {
        session.channelMutes.delete(t.id);
      }
    }

    await Promise.all(
      targets.map((t) => {
        if (t.voice.channelId === channel.id) {
          return t.voice.setMute(false).catch(() => {});
        }
        return Promise.resolve();
      })
    );

    const embed = await Usages.executedAction(
      guildId,
      "Unmute",
      Usages.formatUserTarget("server unmuted in voice", targets.map((t) => t.id))
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
