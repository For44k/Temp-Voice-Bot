import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../../shared/utils/member-parser";

export const ownerCommand: ICommand = {
  name: "owner",
  prefixAliases: ["owner", "transfer"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
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

    if (!args[0]) {
      const embed = await Usages.executedAction(guildId, "Owner", `**__Current owner is__** <@${session.ownerId}>`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (!VoiceLifecycleService.isOwner(channel.id, member.id)) {
      await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    const targets = await extractTargetMembers(message, args, 1);
    if (targets.length === 0) {
      await message.reply({ ...(await Usages.impossible(guildId, "**__User not found :__**")), allowedMentions: { parse: [] } });
      return;
    }

    const targetMember = targets[0];
    if (targetMember.user.bot) {
      await message.reply({
        ...(await Usages.impossible(guildId, "**__You cannot transfer ownership to a bot :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (targetMember.id === member.id) {
      const embed = await Usages.alreadyAction(guildId, "You are already the channel owner");
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    for (const oldCoOwnerId of session.coOwners) {
      await channel.permissionOverwrites.delete(oldCoOwnerId).catch(() => {});
    }
    session.coOwners.clear();

    VoiceMemoryStore.reassignOwner(channel.id, targetMember.id);
    VoiceMemoryStore.sync(channel.id);
    const embed = await Usages.executedAction(
      guildId,
      "Transfer",
      `**__Ownership Transferred :__** Transferred channel ownership to <@${targetMember.id}>`
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
