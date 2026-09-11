import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../../shared/utils/member-parser";

export const undeafenCommand: ICommand = {
  name: "undeafen",
  prefixAliases: ["undeafen", "undeaf"],
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
        ...(await Usages.invalidCommand(guildId, "`.v undeafen`")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (session?.channelDeafens) {
      for (const t of targets) {
        session.channelDeafens.delete(t.id);
      }
    }

    await Promise.all(
      targets.map((t) => {
        if (t.voice.channelId === channel.id) {
          return t.voice.setDeaf(false).catch(() => {});
        }
        return Promise.resolve();
      })
    );

    const embed = await Usages.executedAction(
      guildId,
      "Undeafen",
      Usages.formatUserTarget("server undeafened in voice", targets.map((t) => t.id))
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
