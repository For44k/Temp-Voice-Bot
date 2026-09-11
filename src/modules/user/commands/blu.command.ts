import { Message } from "discord.js";
import { ICommand } from "../../../shared/types/command.types";
import { GlobalBlacklistStore } from "../cache/global-blacklist.store";
import { BotDeveloperStore } from "../cache/bot-developer.store";
import { Usages } from "../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../shared/utils/member-parser";

export const bluCommand: ICommand = {
  name: "blu",
  prefixAliases: ["blu"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!BotDeveloperStore.isDeveloper(message.author.id)) return;

    const action = args[0]?.toLowerCase();
    const guildId = message.guildId;

    if (action === "list") {
      const list = GlobalBlacklistStore.getUserBlacklist();
      if (list.length === 0) {
        const embed = await Usages.executedAction(guildId, "Global Blacklist Users", "No users are globally blacklisted.");
        await message.reply({ ...embed });
        return;
      }
      const formatted = list.map((id) => `• <@${id}> (\`${id}\`)`).join("\n");
      const embed = await Usages.executedAction(guildId, `Global Blacklist Users (${list.length})`, formatted);
      await message.reply({ ...embed });
      return;
    }

    if (action === "add") {
      const targets = await extractTargetMembers(message, args.slice(1), 1);
      let targetId = targets[0]?.id;

      if (!targetId && args[1] && /^\d{17,20}$/.test(args[1])) {
        targetId = args[1];
      }

      if (!targetId) {
        const embed = await Usages.invalidCommand(guildId, "`.v blu add <@user | username | id>`");
        await message.reply({ ...embed });
        return;
      }

      if (targetId === message.author.id) {
        const embed = await Usages.impossible(guildId, "**__You cannot blacklist yourself :__**");
        await message.reply({ ...embed });
        return;
      }

      if (GlobalBlacklistStore.isUserBlacklisted(targetId)) {
        const embed = await Usages.alreadyAction(guildId, "This user is already globally blacklisted");
        await message.reply({ ...embed });
        return;
      }

      await GlobalBlacklistStore.addUser(targetId);
      const embed = await Usages.executedAction(
        guildId,
        "Global User Blacklist",
        `**__User has been globally blacklisted from the bot :__** <@${targetId}> (\`${targetId}\`)`
      );
      await message.reply({ ...embed });
      return;
    }

    if (action === "remove") {
      const targets = await extractTargetMembers(message, args.slice(1), 1);
      let targetId = targets[0]?.id;

      if (!targetId && args[1] && /^\d{17,20}$/.test(args[1])) {
        targetId = args[1];
      }

      if (!targetId) {
        const embed = await Usages.invalidCommand(guildId, "`.v blu remove <@user | username | id>`");
        await message.reply({ ...embed });
        return;
      }

      if (!GlobalBlacklistStore.isUserBlacklisted(targetId)) {
        const embed = await Usages.impossible(guildId, "**__This user is not globally blacklisted :__**");
        await message.reply({ ...embed });
        return;
      }

      await GlobalBlacklistStore.removeUser(targetId);
      const embed = await Usages.executedAction(
        guildId,
        "Global User Blacklist",
        `**__User has been removed from the global bot blacklist :__** <@${targetId}> (\`${targetId}\`)`
      );
      await message.reply({ ...embed });
      return;
    }

    const embed = await Usages.invalidCommand(guildId, "`.v blu <add | remove | list>`");
    await message.reply({ ...embed });
  }
};
