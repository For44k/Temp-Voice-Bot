import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";

export const tunlockCommand: ICommand = {
  name: "tunlock",
  prefixAliases: ["tunlock"],
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
    if (session) {
      session.isTextLocked = false;
      VoiceMemoryStore.sync(channel.id);
    }

    await VoicePermissionsManager.setTextLock(channel, false);
    const embed = await Usages.executedAction(
      guildId,
      "Text Unlock",
      "**__Text chat has been unlocked :__** Everyone can send messages."
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
