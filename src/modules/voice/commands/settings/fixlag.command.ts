import { GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { Replies } from "../../../../shared/embeds/replies";

export const fixlagCommand: ICommand = {
  name: "fixlag",
  prefixAliases: ["fixlag"],
  async executePrefix(message: any): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    if (!channel) {
      await message.reply({ embeds: [await Replies.notInVoice(guildId)] });
      return;
    }

    if (!VoiceLifecycleService.isManager(channel.id, member.id)) {
      await message.reply({ embeds: [await Replies.notAuthorized(guildId)] });
      return;
    }

    const current = channel.rtcRegion;
    const next = current === "rotterdam" ? "frankfurt" : "rotterdam";

    await channel.setRTCRegion(next);
    await channel.setRTCRegion(null);

    await message.reply({
      embeds: [await Replies.success(guildId, "Lag Resolved", "Voice region reset to Discord Automatic Optimization.")]
    });
  }
};
