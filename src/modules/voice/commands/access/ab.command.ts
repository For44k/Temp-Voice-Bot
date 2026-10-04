import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceAuthService } from "../../services/voice-auth.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { Replies } from "../../../../shared/embeds/replies";

export const abCommand: ICommand = {
  name: "ab",
  prefixAliases: ["ab", "antiabuse"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    if (!channel) {
      await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    if (!VoiceAuthService.isOwner(channel.id, member.id)) {
      await message.reply({ ...(await Replies.notOwner(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (!session) {
      await message.reply({ ...(await Usages.impossible(guildId, "Channel is not a managed voice room")), allowedMentions: { parse: [] } });
      return;
    }

    const sub = args[0]?.toLowerCase();
    if (sub === "on") {
      session.antiAbuseEnabled = true;
    } else if (sub === "off") {
      session.antiAbuseEnabled = false;
    } else {
      session.antiAbuseEnabled = !(session.antiAbuseEnabled ?? true);
    }

    VoiceMemoryStore.sync(channel.id);

    const statusText = session.antiAbuseEnabled
      ? "__Anti Abuse System Has been Turned On__"
      : "__Anti Abuse System Has been Turned Off__";

    const embed = await Usages.executedAction(guildId, "Anti Abuse", statusText);
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
