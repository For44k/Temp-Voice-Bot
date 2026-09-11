import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../../shared/utils/member-parser";

export const cownerCommand: ICommand = {
  name: "cowner",
  prefixAliases: ["cowner", "coowner", "manager", "man"],
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
      await message.reply({
        ...(await Usages.impossible(guildId, "**__Channel is not managed :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const sub = args[0]?.toLowerCase();

    if (!sub) {
      await message.reply({
        ...(await Usages.whatDidYouMean(guildId, ".v man", "add | remove | list | clear")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (sub === "list") {
      if (session.coOwners.size === 0) {
        const embed = await Usages.executedAction(guildId, "Managers", "**__No managers assigned to this channel :__**");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      const list = Array.from(session.coOwners).map((id) => `<@${id}>`).join(" ");
      const embed = await Usages.executedAction(guildId, `Managers (${session.coOwners.size})`, `**__Managers :__** ${list}`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (!VoiceLifecycleService.isOwner(channel.id, member.id)) {
      await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    if (sub === "clear") {
      if (session.coOwners.size === 0) {
        const embed = await Usages.alreadyAction(guildId, "Your list is already clear");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      for (const coOwnerId of session.coOwners) {
        await channel.permissionOverwrites.delete(coOwnerId).catch(() => {});
      }
      session.coOwners.clear();
      VoiceMemoryStore.sync(channel.id);
      const embed = await Usages.executedAction(guildId, "Managers Cleared", "**__All managers have been cleared.__**");
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    const targets = await extractTargetMembers(message, args.slice(1), 1);
    if (targets.length === 0) {
      if (sub === "add") {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, ".v man add")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      if (sub === "remove" || sub === "del") {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, ".v man remove")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      await message.reply({
        ...(await Usages.whatDidYouMean(guildId, ".v man", "add | remove | list | clear")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const targetMember = targets[0];
    const targetId = targetMember.id;

    if (targetMember.user.bot) {
      await message.reply({
        ...(await Usages.impossible(guildId, "**__You cannot add a bot as a manager :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (sub === "add") {
      if (targetId === member.id) {
        await message.reply({
          ...(await Usages.stopDoingThat(guildId, "You Can't Add yourself as a Manager")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      if (session.coOwners.has(targetId)) {
        const embed = await Usages.stopDoingThat(guildId, "You Can't Add someone who is already a Manager");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      if (session.coOwners.size >= 3) {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Limit Reached. You can only have a maximum of 3 managers :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      session.coOwners.add(targetId);
      VoiceMemoryStore.sync(channel.id);
      const embed = await Usages.executedAction(guildId, "Manager Added", `**__Manager has been added :__** <@${targetId}>`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
    } else if (sub === "remove" || sub === "del") {
      if (!session.coOwners.has(targetId)) {
        const embed = await Usages.impossible(guildId, "**__This user is not a manager :__**");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      session.coOwners.delete(targetId);
      VoiceMemoryStore.sync(channel.id);
      const embed = await Usages.executedAction(guildId, "Manager Removed", `**__Manager has been removed :__** <@${targetId}>`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
    } else {
      await message.reply({
        ...(await Usages.whatDidYouMean(guildId, ".v man", "add | remove | list | clear")),
        allowedMentions: { parse: [] }
      });
    }
  }
};
