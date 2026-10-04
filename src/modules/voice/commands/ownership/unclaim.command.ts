import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceAuthService } from "../../services/voice-auth.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";

export const unclaimCommand: ICommand = {
  name: "unclaim",
  prefixAliases: ["unclaim"],
  async executePrefix(message: Message): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    if (!channel) {
      await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (!session) {
      await message.reply({ ...(await Usages.impossible(guildId, "**__Channel is not managed :__**")), allowedMentions: { parse: [] } });
      return;
    }

    if (!VoiceAuthService.isOwner(channel.id, member.id)) {
      await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    await channel.permissionOverwrites.delete(member.id).catch(() => {});
    VoiceMemoryStore.reassignOwner(channel.id, session.originalOwnerId);
    VoiceMemoryStore.sync(channel.id);
    await channel.permissionOverwrites.edit(session.originalOwnerId, {
      Connect: true,
      ViewChannel: true,
      SendMessages: true,
      Speak: true,
      Stream: true,
      MoveMembers: true
    }).catch(() => {});
    const embed = await Usages.executedAction(
      guildId,
      "Unclaim",
      `**__Ownership Restored :__** Ownership returned to <@${session.originalOwnerId}>.`
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
