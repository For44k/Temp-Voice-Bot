import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";

export const tlockCommand: ICommand = {
  name: "tlock",
  prefixAliases: ["tlock"],
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
      session.isTextLocked = true;
      VoiceMemoryStore.sync(channel.id);

      // Explicitly allow Owner to send messages
      await channel.permissionOverwrites.edit(session.ownerId, {
        SendMessages: true,
        ViewChannel: true
      }).catch(() => {});

      // Explicitly allow all Managers (co-owners) to send messages
      if (session.coOwners && session.coOwners.size > 0) {
        for (const coOwnerId of session.coOwners) {
          await channel.permissionOverwrites.edit(coOwnerId, {
            SendMessages: true,
            ViewChannel: true
          }).catch(() => {});
        }
      }
    }

    // Permitted users & roles already have SendMessages: true from permit
    // Lock text chat for @everyone
    await VoicePermissionsManager.setTextLock(channel, true);

    const embed = await Usages.executedAction(
      guildId,
      "Text Lock",
      "**__Text chat has been locked :__** Only Managers and Permitted users can send messages."
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
