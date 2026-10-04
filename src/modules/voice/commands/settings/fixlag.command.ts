import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceAuthService } from "../../services/voice-auth.service";
import { Replies } from "../../../../shared/embeds/replies";
import { Usages } from "../../../../shared/embeds/usages";

export const fixlagCommand: ICommand = {
  name: "fixlag",
  prefixAliases: ["fixlag"],
  async executePrefix(message: Message): Promise<void> {
    const member = message.member;
    const channel = member instanceof GuildMember ? (member.voice.channel as VoiceChannel | null) : null;
    const guildId = message.guildId;
    if (!guildId) return;

    if (!channel) {
      await message.reply({
        ...(await Replies.notInVoice(guildId)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (!VoiceAuthService.isManager(channel.id, member?.id ?? "")) {
      await message.reply({
        ...(await Replies.notAuthorized(guildId)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const current = channel.rtcRegion;
    const next = current === "rotterdam" ? "frankfurt" : "rotterdam";

    await channel.setRTCRegion(next);
    await channel.setRTCRegion(null);

    const embed = await Usages.executedAction(
      guildId,
      "Lag Resolved",
      "**__Voice region reset to Discord Automatic Optimization.__**"
    );
    await message.reply({
      ...embed,
      allowedMentions: { parse: [] }
    });
  }
};
