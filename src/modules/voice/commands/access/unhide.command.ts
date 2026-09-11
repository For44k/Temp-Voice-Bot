import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";

export const unhideCommand: ICommand = {
  name: "unhide",
  prefixAliases: ["unhide"],
  async executePrefix(message: Message): Promise<void> {
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

    const session = VoiceMemoryStore.get(channel.id);
    if (session && !session.isHidden) {
      const embed = await Usages.alreadyAction(guildId, "The channel is already visible");
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }
    if (session) {
      session.isHidden = false;
      VoiceMemoryStore.sync(channel.id);
    }

    await VoicePermissionsManager.setVisibility(channel, false);
    const embed = await Usages.executedAction(
      guildId,
      "Unhide",
      "**__Channel is now visible :__** The channel is now visible to members."
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
