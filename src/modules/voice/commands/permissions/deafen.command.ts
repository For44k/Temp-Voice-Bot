import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../../shared/utils/member-parser";

export const deafenCommand: ICommand = {
  name: "deafen",
  prefixAliases: ["deafen", "deaf"],
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
    const validTargets = targets.filter((t) => VoiceLifecycleService.canManageTarget(channel.id, member.id, t.id));

    if (validTargets.length === 0) {
      await message.reply({
        ...(await Usages.invalidCommand(guildId, "`.v deafen`")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (session) {
      if (!session.channelDeafens) session.channelDeafens = new Set();
      for (const t of validTargets) {
        session.channelDeafens.add(t.id);
      }
    }

    await Promise.all(
      validTargets.map((t) => {
        if (t.voice.channelId === channel.id) {
          return t.voice.setDeaf(true).catch(() => {});
        }
        return Promise.resolve();
      })
    );

    const embed = await Usages.executedAction(
      guildId,
      "Deafen",
      Usages.formatUserTarget("server deafened in voice", validTargets.map((t) => t.id))
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
