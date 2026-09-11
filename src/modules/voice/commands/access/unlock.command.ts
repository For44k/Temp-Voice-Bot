import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";

export const unlockCommand: ICommand = {
  name: "unlock",
  prefixAliases: ["unlock"],
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
    if (session && !session.isLocked) {
      const embed = await Usages.alreadyAction(guildId, "You have been already unlocked the channel");
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }
    if (session) {
      session.isLocked = false;
      VoiceMemoryStore.sync(channel.id);
    }

    await VoicePermissionsManager.setConnectionLock(channel, false);
    const embed = await Usages.executedAction(
      guildId,
      "Unlock",
      "**__Channel has been unlocked__**"
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
